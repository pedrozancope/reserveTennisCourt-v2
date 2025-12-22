-- Tennis Scheduler Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. Time Slots (Horários disponíveis)
-- ============================================
CREATE TABLE IF NOT EXISTS time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hour INTEGER NOT NULL UNIQUE CHECK (hour >= 6 AND hour <= 21),
  external_id VARCHAR(10) NOT NULL UNIQUE,
  display_name VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir horários
INSERT INTO time_slots (hour, external_id, display_name) VALUES
  (6, '455', '06:00'),
  (7, '440', '07:00'),
  (8, '441', '08:00'),
  (9, '442', '09:00'),
  (10, '443', '10:00'),
  (11, '444', '11:00'),
  (12, '445', '12:00'),
  (13, '446', '13:00'),
  (14, '447', '14:00'),
  (15, '448', '15:00'),
  (16, '449', '16:00'),
  (17, '450', '17:00'),
  (18, '451', '18:00'),
  (19, '452', '19:00'),
  (20, '453', '20:00'),
  (21, '454', '21:00')
ON CONFLICT (hour) DO NOTHING;

-- ============================================
-- 2. Schedules (Agendamentos/Triggers)
-- ============================================
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  time_slot_id UUID REFERENCES time_slots(id) NOT NULL,
  
  -- Dia/hora que o usuário QUER a reserva
  reservation_day_of_week INTEGER NOT NULL CHECK (reservation_day_of_week >= 0 AND reservation_day_of_week <= 6),
  
  -- Dia/hora que o sistema VAI DISPARAR (calculado)
  trigger_day_of_week INTEGER NOT NULL CHECK (trigger_day_of_week >= 0 AND trigger_day_of_week <= 6),
  trigger_time TIME DEFAULT '00:01:00',
  
  cron_expression VARCHAR(100) NOT NULL,
  aws_rule_arn VARCHAR(500),
  aws_rule_name VARCHAR(255),
  
  frequency VARCHAR(20) DEFAULT 'weekly' CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  
  notify_on_success BOOLEAN DEFAULT true,
  notify_on_failure BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para buscar schedules do usuário
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_active ON schedules(is_active);

-- ============================================
-- 3. Execution Logs (Histórico de Execuções)
-- ============================================
CREATE TABLE IF NOT EXISTS execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error', 'pending')),
  message TEXT,
  request_payload JSONB,
  response_payload JSONB,
  reservation_date DATE,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_ms INTEGER
);

-- Index para buscar logs
CREATE INDEX IF NOT EXISTS idx_execution_logs_schedule ON execution_logs(schedule_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_status ON execution_logs(status);
CREATE INDEX IF NOT EXISTS idx_execution_logs_date ON execution_logs(executed_at DESC);

-- ============================================
-- 4. Reservations (Reservas Realizadas)
-- ============================================
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
  execution_log_id UUID REFERENCES execution_logs(id),
  time_slot_id UUID REFERENCES time_slots(id),
  reservation_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'failed')),
  external_id VARCHAR(255), -- ID do sistema Speed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para buscar reservas
CREATE INDEX IF NOT EXISTS idx_reservations_schedule ON reservations(schedule_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);

-- ============================================
-- 5. App Config (Configuração de Tokens)
-- ============================================
CREATE TABLE IF NOT EXISTS app_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  key VARCHAR(100) NOT NULL,
  value TEXT, -- valor mascarado ou referência
  ssm_parameter_name VARCHAR(255),
  last_synced_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, key)
);

-- Index para buscar config do usuário
CREATE INDEX IF NOT EXISTS idx_app_config_user ON app_config(user_id);

-- ============================================
-- 6. Notifications (Notificações enviadas)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'push')),
  subject VARCHAR(255),
  body TEXT,
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  related_log_id UUID REFERENCES execution_logs(id),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. Row Level Security (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies para schedules
CREATE POLICY "Users can view their own schedules"
  ON schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedules"
  ON schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules"
  ON schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules"
  ON schedules FOR DELETE
  USING (auth.uid() = user_id);

-- Policies para execution_logs
CREATE POLICY "Users can view logs from their schedules"
  ON execution_logs FOR SELECT
  USING (
    schedule_id IN (
      SELECT id FROM schedules WHERE user_id = auth.uid()
    )
  );

-- Policies para reservations
CREATE POLICY "Users can view reservations from their schedules"
  ON reservations FOR SELECT
  USING (
    schedule_id IN (
      SELECT id FROM schedules WHERE user_id = auth.uid()
    )
  );

-- Policies para app_config
CREATE POLICY "Users can manage their own config"
  ON app_config FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies para notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- 8. Functions & Triggers
-- ============================================

-- Function para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para schedules
CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para app_config
CREATE TRIGGER update_app_config_updated_at
  BEFORE UPDATE ON app_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. Helpful Views
-- ============================================

-- View para próximas reservas
CREATE OR REPLACE VIEW upcoming_reservations AS
SELECT 
  s.id as schedule_id,
  s.name as schedule_name,
  s.user_id,
  s.reservation_day_of_week,
  ts.display_name as time_display,
  ts.external_id,
  s.is_active,
  s.cron_expression
FROM schedules s
JOIN time_slots ts ON s.time_slot_id = ts.id
WHERE s.is_active = true
ORDER BY s.reservation_day_of_week, ts.hour;

-- View para estatísticas do usuário
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  s.user_id,
  COUNT(DISTINCT s.id) as active_schedules,
  COUNT(el.id) as total_executions,
  COUNT(CASE WHEN el.status = 'success' THEN 1 END) as successful_executions,
  COUNT(CASE WHEN el.status = 'error' THEN 1 END) as failed_executions,
  ROUND(
    CASE 
      WHEN COUNT(el.id) > 0 
      THEN (COUNT(CASE WHEN el.status = 'success' THEN 1 END)::DECIMAL / COUNT(el.id) * 100)
      ELSE 0 
    END, 
    2
  ) as success_rate
FROM schedules s
LEFT JOIN execution_logs el ON s.id = el.schedule_id
WHERE s.is_active = true
GROUP BY s.user_id;

-- ============================================
-- Concluído! ✅
-- ============================================
-- Próximos passos:
-- 1. Configure Google OAuth no Supabase Dashboard
-- 2. Crie as Edge Functions
-- 3. Configure as variáveis de ambiente
