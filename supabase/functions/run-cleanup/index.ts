// Edge Function: Run Cleanup
// Executa limpeza manual do banco de dados

import { createClient } from "supabase"
import { corsHeaders } from "../_shared/cors.ts"

interface CleanupResult {
  logs_deleted: number
  schedules_deleted: number
  reservations_deleted: number
  cleanup_timestamp: string
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Cria cliente Supabase com service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verifica autenticação do usuário
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Valida o token
    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    console.log(
      `[Cleanup] Iniciando limpeza manual solicitada por usuário ${user.id}`
    )

    // Executa a função de limpeza
    const { data, error } = await supabase.rpc("run_automatic_cleanup")

    if (error) {
      console.error("[Cleanup] Erro ao executar limpeza:", error)
      return new Response(
        JSON.stringify({
          error: "Erro ao executar limpeza",
          details: error.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const result: CleanupResult = data[0]

    console.log("[Cleanup] Limpeza concluída:", result)

    return new Response(
      JSON.stringify({
        success: true,
        message: "Limpeza executada com sucesso",
        result: {
          logsDeleted: result.logs_deleted,
          schedulesDeleted: result.schedules_deleted,
          reservationsDeleted: result.reservations_deleted,
          timestamp: result.cleanup_timestamp,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("[Cleanup] Erro inesperado:", error)
    return new Response(
      JSON.stringify({
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
