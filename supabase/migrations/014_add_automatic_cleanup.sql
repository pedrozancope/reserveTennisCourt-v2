-- ============================================
-- Automatic Cleanup System
-- Remove logs antigos e schedules inativos
-- ============================================

-- 1. Função para limpar logs antigos (> 30 dias)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS TABLE(deleted_count INTEGER) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count_deleted INTEGER;
BEGIN
  -- Remove logs com mais de 30 dias
  DELETE FROM execution_logs
  WHERE executed_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS count_deleted = ROW_COUNT;
  
  -- Log da limpeza
  RAISE NOTICE 'Cleanup: % logs antigos removidos', count_deleted;
  
  RETURN QUERY SELECT count_deleted;
END;
$$;

-- 2. Função para limpar schedules inativos antigos (> 30 dias)
CREATE OR REPLACE FUNCTION cleanup_inactive_schedules()
RETURNS TABLE(deleted_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count_deleted INTEGER;
BEGIN
  -- Remove schedules inativos por mais de 30 dias
  DELETE FROM schedules
  WHERE is_active = false
    AND updated_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS count_deleted = ROW_COUNT;
  
  -- Log da limpeza
  RAISE NOTICE 'Cleanup: % schedules inativos removidos', count_deleted;
  
  RETURN QUERY SELECT count_deleted;
END;
$$;

-- 3. Função para limpar reservations antigas (> 90 dias)
-- Mantém por mais tempo para histórico
CREATE OR REPLACE FUNCTION cleanup_old_reservations()
RETURNS TABLE(deleted_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count_deleted INTEGER;
BEGIN
  -- Remove reservations com mais de 90 dias
  DELETE FROM reservations
  WHERE reservation_date < CURRENT_DATE - INTERVAL '90 days';
  
  GET DIAGNOSTICS count_deleted = ROW_COUNT;
  
  -- Log da limpeza
  RAISE NOTICE 'Cleanup: % reservations antigas removidas', count_deleted;
  
  RETURN QUERY SELECT count_deleted;
END;
$$;

-- 4. Função principal que executa toda a limpeza
CREATE OR REPLACE FUNCTION run_automatic_cleanup()
RETURNS TABLE(
  logs_deleted INTEGER,
  schedules_deleted INTEGER,
  reservations_deleted INTEGER,
  cleanup_timestamp TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  logs_count INTEGER;
  schedules_count INTEGER;
  reservations_count INTEGER;
BEGIN
  -- Executa todas as limpezas
  SELECT deleted_count INTO logs_count FROM cleanup_old_logs();
  SELECT deleted_count INTO schedules_count FROM cleanup_inactive_schedules();
  SELECT deleted_count INTO reservations_count FROM cleanup_old_reservations();
  
  -- Retorna o resultado
  RETURN QUERY SELECT 
    logs_count,
    schedules_count,
    reservations_count,
    NOW();
END;
$$;

-- 5. Agenda a limpeza automática para rodar toda semana (domingo às 3h da manhã)
SELECT cron.schedule(
  'automatic-cleanup',           -- nome único do job
  '0 3 * * 0',                   -- todo domingo às 3h (formato cron)
  $$SELECT run_automatic_cleanup();$$
);

-- 6. Cria tabela para log das limpezas (opcional, mas útil)
CREATE TABLE IF NOT EXISTS cleanup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logs_deleted INTEGER DEFAULT 0,
  schedules_deleted INTEGER DEFAULT 0,
  reservations_deleted INTEGER DEFAULT 0,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Atualiza a função para registrar no histórico
CREATE OR REPLACE FUNCTION run_automatic_cleanup()
RETURNS TABLE(
  logs_deleted INTEGER,
  schedules_deleted INTEGER,
  reservations_deleted INTEGER,
  cleanup_timestamp TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  logs_count INTEGER;
  schedules_count INTEGER;
  reservations_count INTEGER;
BEGIN
  -- Executa todas as limpezas
  SELECT deleted_count INTO logs_count FROM cleanup_old_logs();
  SELECT deleted_count INTO schedules_count FROM cleanup_inactive_schedules();
  SELECT deleted_count INTO reservations_count FROM cleanup_old_reservations();
  
  -- Registra no histórico
  INSERT INTO cleanup_history (logs_deleted, schedules_deleted, reservations_deleted)
  VALUES (logs_count, schedules_count, reservations_count);
  
  -- Retorna o resultado
  RETURN QUERY SELECT 
    logs_count,
    schedules_count,
    reservations_count,
    NOW();
END;
$$;

-- ============================================
-- Comentários e Documentação
-- ============================================

COMMENT ON FUNCTION cleanup_old_logs IS 'Remove logs de execução com mais de 30 dias';
COMMENT ON FUNCTION cleanup_inactive_schedules IS 'Remove schedules inativos por mais de 30 dias';
COMMENT ON FUNCTION cleanup_old_reservations IS 'Remove reservations com mais de 90 dias';
COMMENT ON FUNCTION run_automatic_cleanup IS 'Executa todas as rotinas de limpeza automática';
COMMENT ON TABLE cleanup_history IS 'Histórico das execuções de limpeza automática';

-- ============================================
-- Para testar manualmente:
-- ============================================
-- SELECT * FROM run_automatic_cleanup();
-- SELECT * FROM cleanup_history ORDER BY executed_at DESC LIMIT 10;
-- SELECT * FROM cron.job WHERE jobname = 'automatic-cleanup';
