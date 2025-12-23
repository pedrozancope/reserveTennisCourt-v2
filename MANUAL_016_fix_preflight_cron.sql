-- ============================================
-- EXECUTAR MANUALMENTE: Fix Pre-flight Cron
-- ============================================
-- Atualiza o cron job de preflight para rodar a cada 5 minutos

-- 1. Remover o cron job existente (se houver)
DO $$
BEGIN
  PERFORM cron.unschedule('preflight-check');
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Job preflight-check não existe, continuando...';
END $$;

-- 2. Criar novo cron job que roda a cada 5 minutos
SELECT cron.schedule(
  'preflight-check',
  '*/5 * * * *', -- A cada 5 minutos
  $$
    SELECT net.http_post(
      url:='https://ifsgngdptmzovzuvudah.supabase.co/functions/v1/run-preflight',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.supabase_service_role_key') || '"}'::jsonb,
      body:='{}'::jsonb
    )
  $$
);

-- 3. Verificar se o cron job foi criado
SELECT jobid, schedule, command, active 
FROM cron.job 
WHERE jobname = 'preflight-check';
