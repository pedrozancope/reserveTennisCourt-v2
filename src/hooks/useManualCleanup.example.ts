// Exemplo de hook para executar limpeza manual
// Use este código no frontend quando necessário

import { supabase } from "@/services/supabase"
import { useState } from "react"

interface CleanupResult {
  logsDeleted: number
  schedulesDeleted: number
  reservationsDeleted: number
  timestamp: string
}

export function useManualCleanup() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CleanupResult | null>(null)

  const runCleanup = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error(
          "Você precisa estar autenticado para executar a limpeza"
        )
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-cleanup`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao executar limpeza")
      }

      const data = await response.json()
      setResult(data.result)

      return data.result
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const getCleanupHistory = async (limit = 10) => {
    try {
      const { data, error } = await supabase
        .from("cleanup_history")
        .select("*")
        .order("executed_at", { ascending: false })
        .limit(limit)

      if (error) throw error
      return data
    } catch (err) {
      console.error("Erro ao buscar histórico de limpeza:", err)
      throw err
    }
  }

  return {
    runCleanup,
    getCleanupHistory,
    isLoading,
    error,
    result,
  }
}

// Exemplo de uso:
/*
function CleanupButton() {
  const { runCleanup, isLoading, error, result } = useManualCleanup()

  const handleCleanup = async () => {
    try {
      const result = await runCleanup()
      console.log('Limpeza concluída:', result)
      toast.success(`Limpeza concluída! ${result.logsDeleted} logs removidos`)
    } catch (err) {
      console.error('Erro na limpeza:', err)
      toast.error('Erro ao executar limpeza')
    }
  }

  return (
    <button onClick={handleCleanup} disabled={isLoading}>
      {isLoading ? 'Limpando...' : 'Executar Limpeza'}
    </button>
  )
}
*/
