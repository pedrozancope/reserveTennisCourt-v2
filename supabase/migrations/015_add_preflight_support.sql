-- ============================================
-- 015: Add Pre-flight (Teste de Voo) Support
-- ============================================
-- Adiciona suporte para validação prévia do token antes do disparo real

-- 1. Adicionar campos de preflight na tabela schedules
ALTER TABLE schedules
  ADD COLUMN IF NOT EXISTS preflight_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS preflight_hours_before INTEGER DEFAULT 4,
  ADD COLUMN IF NOT EXISTS preflight_notify_on_success BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS preflight_notify_on_failure BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_preflight_at TIMESTAMP WITH TIME ZONE;

-- 2. Adicionar campo para identificar tipo de execução nos logs
ALTER TABLE execution_logs
  ADD COLUMN IF NOT EXISTS execution_type VARCHAR(20) DEFAULT 'reservation' 
    CHECK (execution_type IN ('reservation', 'preflight', 'test'));

-- 3. Atualizar logs existentes de teste
UPDATE execution_logs
SET execution_type = 'test'
WHERE is_test = true AND execution_type = 'reservation';

-- 4. Criar índice para busca de schedules com preflight habilitado
CREATE INDEX IF NOT EXISTS idx_schedules_preflight_enabled 
  ON schedules(preflight_enabled) 
  WHERE preflight_enabled = true AND is_active = true;

-- 5. Criar índice para busca de logs por tipo
CREATE INDEX IF NOT EXISTS idx_execution_logs_type 
  ON execution_logs(execution_type);

-- 6. Função para verificar se um schedule precisa de preflight
-- Retorna TRUE se:
-- - preflight_enabled = true
-- - is_active = true
-- - Próximo disparo está dentro das próximas X horas
-- - Não executou preflight para este disparo (last_preflight_at < data do último disparo ou null)
CREATE OR REPLACE FUNCTION check_schedule_needs_preflight(
  p_schedule_id UUID,
  p_check_window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  p_check_window_end TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_schedule RECORD;
  v_next_trigger TIMESTAMP WITH TIME ZONE;
  v_preflight_deadline TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Buscar schedule
  SELECT * INTO v_schedule
  FROM schedules
  WHERE id = p_schedule_id
    AND is_active = true
    AND preflight_enabled = true;
    
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Se trigger_mode = 'trigger_date', usar trigger_datetime
  IF v_schedule.trigger_mode = 'trigger_date' AND v_schedule.trigger_datetime IS NOT NULL THEN
    v_next_trigger := v_schedule.trigger_datetime;
  ELSE
    -- Para trigger recorrente, calcular próximo disparo baseado no cron
    -- Simplificado: verificar se está dentro da janela de horas
    -- A lógica completa será feita na Edge Function
    RETURN true;
  END IF;
  
  -- Calcular deadline do preflight (X horas antes do disparo)
  v_preflight_deadline := v_next_trigger - (v_schedule.preflight_hours_before || ' hours')::INTERVAL;
  
  -- Se a janela de verificação não foi especificada, usar agora + 1 hora
  IF p_check_window_end IS NULL THEN
    p_check_window_end := p_check_window_start + INTERVAL '1 hour';
  END IF;
  
  -- Verificar se estamos na janela de preflight
  IF v_preflight_deadline >= p_check_window_start AND v_preflight_deadline <= p_check_window_end THEN
    -- Verificar se já executou preflight para este disparo
    IF v_schedule.last_preflight_at IS NULL OR v_schedule.last_preflight_at < v_preflight_deadline - INTERVAL '1 hour' THEN
      RETURN true;
    END IF;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. View para listar schedules que precisam de preflight
CREATE OR REPLACE VIEW schedules_needing_preflight AS
SELECT 
  s.*,
  ts.hour as time_slot_hour,
  ts.display_name as time_slot_display_name,
  CASE 
    WHEN s.trigger_mode = 'trigger_date' AND s.trigger_datetime IS NOT NULL 
    THEN s.trigger_datetime - (s.preflight_hours_before || ' hours')::INTERVAL
    ELSE NULL
  END as preflight_deadline
FROM schedules s
LEFT JOIN time_slots ts ON s.time_slot_id = ts.id
WHERE s.is_active = true
  AND s.preflight_enabled = true;

-- 8. Comentários para documentação
COMMENT ON COLUMN schedules.preflight_enabled IS 'Se habilitado, executa validação do token antes do disparo';
COMMENT ON COLUMN schedules.preflight_hours_before IS 'Quantas horas antes do disparo executar o preflight (padrão: 4)';
COMMENT ON COLUMN schedules.preflight_notify_on_success IS 'Enviar notificação quando preflight for bem sucedido';
COMMENT ON COLUMN schedules.preflight_notify_on_failure IS 'Enviar notificação quando preflight falhar';
COMMENT ON COLUMN schedules.last_preflight_at IS 'Data/hora da última execução do preflight';
COMMENT ON COLUMN execution_logs.execution_type IS 'Tipo de execução: reservation, preflight ou test';

-- 9. Criar job pg_cron para executar preflight a cada hora
-- O job verifica quais agendamentos precisam de preflight e executa
DO $$
DECLARE
  v_job_id BIGINT;
  v_supabase_url TEXT;
BEGIN
  -- Obter URL do Supabase das configurações
  v_supabase_url := current_setting('supabase.url', true);
  
  -- Se não conseguir a URL, tentar pegar de outra forma
  IF v_supabase_url IS NULL OR v_supabase_url = '' THEN
    -- Usar URL padrão ou configurada manualmente
    SELECT value INTO v_supabase_url 
    FROM app_config 
    WHERE key = 'supabase_url';
  END IF;
  
  -- Criar o job apenas se conseguirmos a URL
  IF v_supabase_url IS NOT NULL AND v_supabase_url != '' THEN
    -- Job que roda a cada hora (minuto 30)
    SELECT cron.schedule(
      'preflight-check',
      '30 * * * *', -- A cada hora, no minuto 30
      format(
        'SELECT net.http_post(
          url:=''%s/functions/v1/run-preflight'',
          headers:=''{"Content-Type": "application/json", "Authorization": "Bearer '' || current_setting(''supabase.service_role_key'', true) || ''"}''::jsonb,
          body:=''{}''::jsonb
        )',
        v_supabase_url
      )
    ) INTO v_job_id;
    
    RAISE NOTICE 'Created preflight cron job with id: %', v_job_id;
  ELSE
    RAISE NOTICE 'Skipping cron job creation - Supabase URL not configured';
  END IF;
END $$;
