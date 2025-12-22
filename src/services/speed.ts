import type {
  SpeedAuthToken,
  SpeedReservationRequest,
  SpeedReservationResponse,
} from "../types"

const SPEED_API_BASE_URL =
  import.meta.env.VITE_SPEED_API_URL || "https://speed.example.com/api"

/**
 * Speed Tennis API Service
 * Gerencia autenticação e reservas no sistema Speed
 */

/**
 * Autentica no sistema Speed e retorna o token
 */
export async function authenticateSpeed(
  username: string,
  password: string
): Promise<SpeedAuthToken> {
  try {
    const response = await fetch(`${SPEED_API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    })

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      token: data.token,
      expiresAt: data.expiresAt,
      userId: data.userId,
    }
  } catch (error) {
    console.error("Error authenticating with Speed:", error)
    throw error
  }
}

/**
 * Valida se o token ainda é válido
 */
export function isTokenValid(token: SpeedAuthToken): boolean {
  const expiresAt = new Date(token.expiresAt)
  const now = new Date()

  // Considerar token inválido se faltar menos de 1 hora para expirar
  const oneHour = 60 * 60 * 1000
  return expiresAt.getTime() - now.getTime() > oneHour
}

/**
 * Obtém informações da conta do usuário
 */
export async function getAccountInfo(token: string): Promise<any> {
  try {
    const response = await fetch(`${SPEED_API_BASE_URL}/account/info`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get account info: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error getting account info:", error)
    throw error
  }
}

/**
 * Lista os horários disponíveis para uma data específica
 */
export async function getAvailableTimeSlots(
  token: string,
  date: string
): Promise<any[]> {
  try {
    const response = await fetch(
      `${SPEED_API_BASE_URL}/reservations/available?date=${date}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to get time slots: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error getting available time slots:", error)
    throw error
  }
}

/**
 * Cria uma reserva no sistema Speed
 */
export async function createReservation(
  request: SpeedReservationRequest
): Promise<SpeedReservationResponse> {
  const startTime = Date.now()

  try {
    const response = await fetch(`${SPEED_API_BASE_URL}/reservations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${request.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeSlotId: request.timeSlotId,
        date: request.date,
        userId: request.userId,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || response.statusText,
        message: `Failed to create reservation: ${
          data.message || response.statusText
        }`,
      }
    }

    const duration = Date.now() - startTime
    console.log(`Reservation created successfully in ${duration}ms`)

    return {
      success: true,
      reservationId: data.reservationId || data.id,
      message: "Reservation created successfully",
    }
  } catch (error) {
    console.error("Error creating reservation:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Failed to create reservation due to network error",
    }
  }
}

/**
 * Cancela uma reserva existente
 */
export async function cancelReservation(
  token: string,
  reservationId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(
      `${SPEED_API_BASE_URL}/reservations/${reservationId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      const data = await response.json()
      return {
        success: false,
        message: data.message || response.statusText,
      }
    }

    return {
      success: true,
      message: "Reservation cancelled successfully",
    }
  } catch (error) {
    console.error("Error cancelling reservation:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Lista as reservas do usuário
 */
export async function getUserReservations(
  token: string,
  filters?: {
    startDate?: string
    endDate?: string
    status?: string
  }
): Promise<any[]> {
  try {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append("startDate", filters.startDate)
    if (filters?.endDate) params.append("endDate", filters.endDate)
    if (filters?.status) params.append("status", filters.status)

    const url = `${SPEED_API_BASE_URL}/reservations?${params.toString()}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get reservations: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error getting user reservations:", error)
    throw error
  }
}

/**
 * Faz health check do serviço Speed
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${SPEED_API_BASE_URL}/health`, {
      method: "GET",
    })

    return response.ok
  } catch (error) {
    console.error("Speed API health check failed:", error)
    return false
  }
}
