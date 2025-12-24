-- ============================================
-- 020: Fix trigger_time Timezone (BRT → UTC)
-- ============================================
-- 
-- Problema: trigger_time e trigger_day_of_week estavam sendo salvos
-- em horário local (BRT), mas as comparações SQL e Edge Functions
-- usam UTC. Isso causava disparos 3 horas antes do esperado.
-- 
-- Solução: Converter todos os trigger_time existentes de BRT para UTC
-- e ajustar trigger_day_of_week quando a conversão cruza a meia-noite.
-- 
-- Exemplo:
--   00:01 BRT → 03:01 UTC (mesmo dia)
--   21:00 BRT → 00:00 UTC (dia seguinte)
-- ============================================

-- 1. Converter trigger_time de BRT para UTC
-- E ajustar trigger_day_of_week quando necessário
-- Também resetar last_preflight_at para permitir novo preflight
UPDATE schedules
SET 
  -- Converter hora: adiciona 3 horas (BRT → UTC)
  trigger_time = (
    trigger_time + INTERVAL '3 hours'
  )::time,
  -- Se a hora original + 3 >= 24, o dia muda para o próximo
  trigger_day_of_week = CASE 
    WHEN EXTRACT(HOUR FROM trigger_time) + 3 >= 24 
    THEN (trigger_day_of_week + 1) % 7
    ELSE trigger_day_of_week
  END,
  -- Resetar preflight para executar no novo horário correto
  last_preflight_at = NULL,
  updated_at = NOW()
WHERE trigger_mode = 'reservation_date'
  AND trigger_time IS NOT NULL;

-- 2. Registrar a migração nos logs
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM schedules
  WHERE trigger_mode = 'reservation_date'
    AND trigger_time IS NOT NULL;
  
  RAISE NOTICE 'Migração 020: Convertidos % schedules de BRT para UTC', v_count;
END $$;

-- 3. Comentário para documentação
COMMENT ON COLUMN schedules.trigger_time IS 
  'Hora do disparo em UTC. Convertido automaticamente de BRT no frontend.';

COMMENT ON COLUMN schedules.trigger_day_of_week IS 
  'Dia da semana do disparo em UTC (0=Dom, 6=Sáb). Pode diferir do dia local se horário BRT >= 21:00.';
