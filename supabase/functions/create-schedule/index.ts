import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

interface CreateSchedulePayload {
  scheduleId: string
  cronExpression: string
  scheduleName: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const payload: CreateSchedulePayload = await req.json()
    const { scheduleId, cronExpression, scheduleName } = payload

    console.log(
      `Creating cron job for schedule: ${scheduleName} (${scheduleId})`
    )

    // Get the Edge Function URL for execute-reservation
    const executeReservationUrl = `${Deno.env.get(
      "SUPABASE_URL"
    )}/functions/v1/execute-reservation`

    // Call the database function to create pg_cron job
    const { data, error } = await supabaseClient.rpc(
      "create_schedule_cron_job",
      {
        p_schedule_id: scheduleId,
        p_cron_expression: cronExpression,
        p_edge_function_url: executeReservationUrl,
      }
    )

    if (error) {
      console.error("Error creating cron job:", error)
      throw error
    }

    console.log(`Cron job created successfully with ID: ${data}`)

    return new Response(
      JSON.stringify({
        success: true,
        jobId: data,
        message: `Cron job created for schedule ${scheduleName}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error in create-schedule:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    )
  }
})
