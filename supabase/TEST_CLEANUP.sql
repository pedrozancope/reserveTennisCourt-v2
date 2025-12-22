-- ============================================
-- Script de Teste - Sistema de Limpeza Automática
-- Execute este script no SQL Editor do Supabase
-- ============================================
-- 1. Verificar se as funções foram criadas
SELECT
  routine_name,
  routine_type
FROM
  information_schema.routines
WHERE
  routine_schema = 'public'
  AND routine_name LIKE 'cleanup%';

-- Resultado esperado:
-- cleanup_old_logs | FUNCTION
-- cleanup_inactive_schedules | FUNCTION
-- cleanup_old_reservations | FUNCTION
-- run_automatic_cleanup | FUNCTION
-- 2. Verificar se a tabela de histórico existe
SELECT
  table_name
FROM
  information_schema.tables
WHERE
  table_schema = 'public'
  AND table_name = 'cleanup_history';

-- Resultado esperado: cleanup_history
-- 3. Verificar se o job do cron foi criado
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM
  cron.job
WHERE
  jobname = 'automatic-cleanup';

-- Resultado esperado:
-- jobname: automatic-cleanup
-- schedule: 0 3 * * 0 (todo domingo às 3h)
-- active: true
-- 4. Inserir dados de teste antigos para simular limpeza
-- ATENÇÃO: Use apenas em ambiente de desenvolvimento!
-- 4.1 Logs antigos (35 dias atrás)
INSERT INTO
  execution_logs (schedule_id, status, message, executed_at)
VALUES
  (
    NULL,
    'success',
    'Teste log antigo 1',
    NOW () - INTERVAL '35 days'
  ),
  (
    NULL,
    'success',
    'Teste log antigo 2',
    NOW () - INTERVAL '40 days'
  ),
  (
    NULL,
    'error',
    'Teste log antigo 3',
    NOW () - INTERVAL '50 days'
  );

-- 4.2 Verificar logs inseridos
SELECT
  COUNT(*) as logs_antigos
FROM
  execution_logs
WHERE
  executed_at < NOW () - INTERVAL '30 days';

-- 5. Executar limpeza manual
SELECT
  *
FROM
  run_automatic_cleanup ();

-- Resultado esperado:
-- logs_deleted: 3 (ou mais, se já tiver logs antigos)
-- schedules_deleted: 0 (ou mais)
-- reservations_deleted: 0 (ou mais)
-- cleanup_timestamp: timestamp atual
-- 6. Verificar histórico de limpezas
SELECT
  *
FROM
  cleanup_history
ORDER BY
  executed_at DESC
LIMIT
  5;

-- 7. Verificar se os logs antigos foram removidos
SELECT
  COUNT(*) as logs_antigos_restantes
FROM
  execution_logs
WHERE
  executed_at < NOW () - INTERVAL '30 days';

-- Resultado esperado: 0
-- 8. Estatísticas do banco antes e depois
SELECT
  'execution_logs' as tabela,
  COUNT(*) as total_registros,
  pg_size_pretty (pg_total_relation_size ('execution_logs')) as tamanho
FROM
  execution_logs
UNION ALL
SELECT
  'schedules',
  COUNT(*),
  pg_size_pretty (pg_total_relation_size ('schedules'))
FROM
  schedules
UNION ALL
SELECT
  'reservations',
  COUNT(*),
  pg_size_pretty (pg_total_relation_size ('reservations'))
FROM
  reservations;

-- 9. Ver próxima execução do job
SELECT
  jobname,
  schedule,
  active,
  -- Calcular próxima execução (aproximado)
  CASE
    WHEN schedule = '0 3 * * 0' THEN 'Próximo domingo às 3h'
    ELSE schedule
  END as proxima_execucao
FROM
  cron.job
WHERE
  jobname = 'automatic-cleanup';

-- 10. Ver histórico de execuções do cron job
SELECT
  job.jobname,
  run.runid,
  run.start_time,
  run.end_time,
  run.status,
  run.return_message
FROM
  cron.job_run_details run
  JOIN cron.job job ON run.jobid = job.jobid
WHERE
  job.jobname = 'automatic-cleanup'
ORDER BY
  run.start_time DESC
LIMIT
  10;

-- ============================================
-- Comandos Úteis para Manutenção
-- ============================================
-- Desabilitar temporariamente a limpeza automática
-- UPDATE cron.job SET active = false WHERE jobname = 'automatic-cleanup';
-- Reabilitar limpeza automática
-- UPDATE cron.job SET active = true WHERE jobname = 'automatic-cleanup';
-- Alterar horário de execução (ex: diariamente às 2h)
-- SELECT cron.unschedule('automatic-cleanup');
-- SELECT cron.schedule(
--   'automatic-cleanup',
--   '0 2 * * *',
--   $$SELECT run_automatic_cleanup();$$
-- );
-- Ver total removido em todas as limpezas
-- SELECT 
--   SUM(logs_deleted) as total_logs_removidos,
--   SUM(schedules_deleted) as total_schedules_removidos,
--   SUM(reservations_deleted) as total_reservations_removidas,
--   COUNT(*) as total_execucoes
-- FROM cleanup_history;