-- ============================================
-- Optimize Cron Schedule Frequency
-- ============================================
-- Altera a frequência dos cron jobs para economizar recursos
-- mantendo cobertura adequada para agendamentos críticos.
-- 
-- Jobs atualizados:
-- 1. check-and-execute-schedules: de todo minuto (*) para minutos específicos (0,1,2,3,5,15,30)
-- 2. preflight-check: de minuto 30 para minutos específicos (0,1,2,3,5,15,30)
--
-- Benefícios:
-- - Redução de ~88% nas execuções (de 60/hora para 7/hora)
-- - Mantém cobertura para agendamentos em 00:01, 00:02, etc.
-- - Economia significativa de recursos do Supabase
-- ============================================

-- 1. Atualizar job de verificação de schedules
DO $$
BEGIN
  -- Remover job antigo
  PERFORM cron.unschedule('check-and-execute-schedules');
EXCEPTION WHEN OTHERS THEN
  -- Ignorar se não existir
  NULL;
END $$;

-- Criar job atualizado - roda nos minutos 0, 1, 2, 3, 5, 15 e 30 de cada hora
DO $$
BEGIN
  PERFORM cron.schedule(
    'check-and-execute-schedules',
    '0,1,2,3,5,15,30 * * * *',  -- Minutos específicos: 0, 1, 2, 3, 5, 15, 30
    'SELECT check_and_execute_schedules();'
  );
  
  RAISE NOTICE 'Job check-and-execute-schedules atualizado: agora roda nos minutos 0, 1, 2, 3, 5, 15 e 30';
END $$;

-- 2. Atualizar job de preflight
DO $$
DECLARE
  v_job_id BIGINT;
  v_supabase_url TEXT;
BEGIN
  -- Remover job antigo de preflight
  BEGIN
    PERFORM cron.unschedule('preflight-check');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Obter URL do Supabase das configurações
  SELECT value INTO v_supabase_url 
  FROM system_config 
  WHERE key = 'supabase_url';
  
  -- Se não conseguiu pela system_config, tentar app_config
  IF v_supabase_url IS NULL OR v_supabase_url = '' THEN
    SELECT value INTO v_supabase_url 
    FROM app_config 
    WHERE key = 'supabase_url';
  END IF;
  
  -- Criar o job apenas se conseguirmos a URL
  IF v_supabase_url IS NOT NULL AND v_supabase_url != '' THEN
    -- Job que roda nos minutos 0, 1, 2, 3, 5, 15 e 30 de cada hora
    SELECT cron.schedule(
      'preflight-check',
      '0,1,2,3,5,15,30 * * * *', -- Mesmos minutos
      format(
        'SELECT net.http_post(
          url:=''%s/functions/v1/run-preflight'',
          headers:=''{"Content-Type": "application/json", "Authorization": "Bearer '' || current_setting(''supabase.service_role_key'', true) || ''"}''::jsonb,
          body:=''{}''::jsonb
        )',
        v_supabase_url
      )
    ) INTO v_job_id;
    
    RAISE NOTICE 'Job preflight-check atualizado: agora roda nos minutos 0, 1, 2, 3, 5, 15 e 30 (job id: %)', v_job_id;
  ELSE
    RAISE WARNING 'Não foi possível atualizar preflight-check - Supabase URL não configurada';
  END IF;
END $$;

-- 3. Comentários e documentação
COMMENT ON FUNCTION check_and_execute_schedules() IS 
  'Verifica e executa schedules pendentes. Chamada nos minutos 0, 1, 2, 3, 5, 15 e 30 de cada hora pelo pg_cron.';

-- ============================================
-- Para verificar os jobs atualizados:
-- ============================================
-- SELECT jobid, jobname, schedule, command 
-- FROM cron.job 
-- WHERE jobname IN ('check-and-execute-schedules', 'preflight-check');
--
-- Para ver histórico de execuções:
-- SELECT * FROM cron.job_run_details 
-- WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname IN ('check-and-execute-schedules', 'preflight-check'))
-- ORDER BY start_time DESC 
-- LIMIT 20;
