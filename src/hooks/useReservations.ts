import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/services/supabase"
import type { Database } from "@/types/supabase"
import type { Reservation, Schedule } from "@/types"

type ReservationRow = Database["public"]["Tables"]["reservations"]["Row"]
type ScheduleRow = Database["public"]["Tables"]["schedules"]["Row"]
type TimeSlotRow = Database["public"]["Tables"]["time_slots"]["Row"]

// Converter do formato do banco para o formato da aplicação
function mapReservationFromDB(
  row: ReservationRow & {
    schedule: ScheduleRow | null
    time_slot: TimeSlotRow | null
  }
): Reservation {
  return {
    id: row.id,
    scheduleId: row.schedule_id || undefined,
    schedule: row.schedule
      ? ({
          id: row.schedule.id,
          name: row.schedule.name,
          timeSlotId: row.schedule.time_slot_id,
          reservationDayOfWeek: row.schedule.reservation_day_of_week,
          triggerDayOfWeek: row.schedule.trigger_day_of_week,
          triggerTime: row.schedule.trigger_time,
          cronExpression: row.schedule.cron_expression,
          frequency: row.schedule.frequency,
          isActive: row.schedule.is_active,
          notifyOnSuccess: row.schedule.notify_on_success,
          notifyOnFailure: row.schedule.notify_on_failure,
          createdAt: row.schedule.created_at,
          updatedAt: row.schedule.updated_at,
        } as Schedule)
      : undefined,
    executionLogId: row.execution_log_id || undefined,
    timeSlotId: row.time_slot_id || undefined,
    timeSlot: row.time_slot
      ? {
          id: row.time_slot.id,
          hour: row.time_slot.hour,
          externalId: row.time_slot.external_id,
          displayName: row.time_slot.display_name,
          createdAt: row.time_slot.created_at,
        }
      : undefined,
    reservationDate: row.reservation_date,
    status: row.status,
    externalId: row.external_id || undefined,
    createdAt: row.created_at,
  }
}

// Hook para listar todas as reservas do usuário
export function useReservations(filters?: {
  status?: "confirmed" | "cancelled" | "failed"
  scheduleId?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
}) {
  return useQuery({
    queryKey: ["reservations", filters],
    queryFn: async () => {
      let query = supabase
        .from("reservations")
        .select(
          `
          *,
          schedule:schedules(*),
          time_slot:time_slots(*)
        `
        )
        .order("reservation_date", { ascending: false })

      // Aplicar filtros
      if (filters?.status) {
        query = query.eq("status", filters.status)
      }

      if (filters?.scheduleId) {
        query = query.eq("schedule_id", filters.scheduleId)
      }

      if (filters?.dateFrom) {
        query = query.gte("reservation_date", filters.dateFrom)
      }

      if (filters?.dateTo) {
        query = query.lte("reservation_date", filters.dateTo)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) throw error

      return (
        data as unknown as (ReservationRow & {
          schedule: ScheduleRow | null
          time_slot: TimeSlotRow | null
        })[]
      ).map(mapReservationFromDB)
    },
  })
}

// Hook para próximas reservas (upcoming)
export function useUpcomingReservations(limit: number = 5) {
  const today = new Date().toISOString().split("T")[0]

  return useReservations({
    status: "confirmed",
    dateFrom: today,
    limit,
  })
}

// Hook para buscar uma reserva específica
export function useReservation(id: string | undefined) {
  return useQuery({
    queryKey: ["reservations", id],
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase
        .from("reservations")
        .select(
          `
          *,
          schedule:schedules(*),
          time_slot:time_slots(*)
        `
        )
        .eq("id", id)
        .single()

      if (error) throw error

      return mapReservationFromDB(
        data as unknown as ReservationRow & {
          schedule: ScheduleRow | null
          time_slot: TimeSlotRow | null
        }
      )
    },
    enabled: !!id,
  })
}

// Hook para reservas de um agendamento específico
export function useScheduleReservations(scheduleId: string | undefined) {
  return useReservations({
    scheduleId,
  })
}
