-- Verificar schedules ativos
SELECT 
  id,
  name,
  is_active,
  frequency,
  trigger_mode,
  trigger_datetime,
  trigger_day_of_week,
  trigger_time,
  reservation_day_of_week,
  created_at
FROM schedules
WHERE is_active = true
ORDER BY created_at DESC;
