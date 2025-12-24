-- ============================================
-- Fix: Executar agendamentos no minuto exato (nunca antes)
-- ============================================
-- Problema: A função check_and_execute_schedules() tinha uma janela de 5 minutos
-- que poderia disparar ANTES do horário programado se houvesse drift.
-- 
-- Solução: 
-- - Nunca executar ANTES do horário programado
-- - Janela de 10 minutos APÓS o horário para recuperação de falhas
-- - Preflight também usa minuto exato (já corrigido na Edge Function)
-- ============================================

CREATE OR REPLACE FUNCTION check_and_execute_schedules()
RETURNS jsonb AS $$
DECLARE
  v_schedule RECORD;
  v_request_id BIGINT;
  v_results jsonb := '[]'::jsonb;
  v_service_key TEXT;
  v_supabase_url TEXT;
  v_now TIMESTAMPTZ := NOW();
  v_now_time TIME := v_now::time;
  v_count INT := 0;
BEGIN
  -- Obter configurações da tabela system_config
  SELECT value INTO v_supabase_url FROM system_config WHERE key = 'supabase_url';
  SELECT value INTO v_service_key FROM system_config WHERE key = 'service_role_key';
  
  -- Verificar se as configurações existem
  IF v_service_key IS NULL OR v_service_key = '' OR v_service_key = 'CONFIGURE_SUA_SERVICE_ROLE_KEY_AQUI' THEN
    RETURN jsonb_build_object('error', 'service_role_key não configurada', 'checked_at', v_now);
  END IF;
  
  IF v_supabase_url IS NULL OR v_supabase_url = '' THEN
    RETURN jsonb_build_object('error', 'supabase_url não configurada', 'checked_at', v_now);
  END IF;

  -- ============================================
  -- LIMPEZA: Desativar schedules 'once' que já passaram da janela
  -- (trigger_datetime passou há mais de 15 minutos e ainda está ativo)
  -- ============================================
  UPDATE schedules
  SET is_active = FALSE,
      updated_at = v_now
  WHERE is_active = TRUE
    AND frequency = 'once'
    AND trigger_mode = 'trigger_date'
    AND trigger_datetime IS NOT NULL
    AND trigger_datetime < v_now - INTERVAL '15 minutes';

  -- ============================================
  -- Buscar schedules que devem executar AGORA
  -- REGRA: Nunca executar ANTES do horário, janela de 10min APÓS
  -- ============================================
  FOR v_schedule IN
    SELECT 
      s.id, 
      s.name, 
      s.trigger_mode,
      s.trigger_datetime,
      s.trigger_day_of_week,
      s.trigger_time,
      s.frequency,
      s.last_executed_at
    FROM schedules s
    WHERE s.is_active = TRUE
      -- Não executar se já foi executado nos últimos 15 minutos
      AND (s.last_executed_at IS NULL OR s.last_executed_at < v_now - INTERVAL '15 minutes')
      AND (
        -- Modo 1: trigger_date - executa em data/hora específica
        -- NUNCA antes, até 10 minutos depois
        (
          s.trigger_mode = 'trigger_date'
          AND s.trigger_datetime IS NOT NULL
          AND v_now >= s.trigger_datetime  -- Nunca antes
          AND v_now < s.trigger_datetime + INTERVAL '10 minutes'  -- Até 10min depois
        )
        OR
        -- Modo 2: reservation_date - executa baseado em dia da semana e hora
        -- NUNCA antes, até 10 minutos depois
        (
          s.trigger_mode = 'reservation_date'
          AND EXTRACT(DOW FROM v_now) = s.trigger_day_of_week
          AND s.trigger_time IS NOT NULL
          AND v_now_time >= s.trigger_time  -- Nunca antes
          AND v_now_time < s.trigger_time + INTERVAL '10 minutes'  -- Até 10min depois
        )
      )
  LOOP
    BEGIN
      v_count := v_count + 1;
      
      RAISE NOTICE 'Executando schedule: % (ID: %) - Horário atual: %, Trigger time: %', 
        v_schedule.name, v_schedule.id, v_now, COALESCE(v_schedule.trigger_datetime::text, v_schedule.trigger_time::text);
      
      -- IMPORTANTE: Marcar como executado ANTES de chamar a Edge Function
      -- Isso evita que seja executado novamente no próximo minuto
      UPDATE schedules 
      SET last_executed_at = v_now,
          updated_at = v_now
      WHERE id = v_schedule.id;
      
      -- Chamar Edge Function via pg_net (assíncrono)
      SELECT net.http_post(
        url := v_supabase_url || '/functions/v1/execute-reservation',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_service_key
        ),
        body := jsonb_build_object('scheduleId', v_schedule.id::text)
      ) INTO v_request_id;
      
      -- Registrar resultado
      v_results := v_results || jsonb_build_object(
        'schedule_id', v_schedule.id,
        'schedule_name', v_schedule.name,
        'request_id', v_request_id,
        'executed_at', v_now,
        'trigger_time', COALESCE(v_schedule.trigger_datetime::text, v_schedule.trigger_time::text)
      );
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Erro ao executar schedule %: %', v_schedule.id, SQLERRM;
      v_results := v_results || jsonb_build_object(
        'schedule_id', v_schedule.id,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  -- Retornar resumo
  RETURN jsonb_build_object(
    'checked_at', v_now,
    'current_time', v_now_time,
    'schedules_found', v_count,
    'results', v_results
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário atualizado
COMMENT ON FUNCTION check_and_execute_schedules() IS 
  'Verifica e executa schedules pendentes. NUNCA executa antes do horário programado. Janela de 10 minutos após para recuperação.';
