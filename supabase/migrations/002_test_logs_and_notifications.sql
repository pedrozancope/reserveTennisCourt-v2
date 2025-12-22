-- Migration: Adicionar suporte a logs de teste e envio de e-mails
-- Executar no SQL Editor do Supabase
-- 1. Adicionar coluna is_test para identificar logs de teste
ALTER TABLE execution_logs
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;

-- 2. Adicionar user_id opcional para logs de teste (sem schedule)
ALTER TABLE execution_logs
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL;

-- 3. Adicionar coluna para armazenar o horário testado
ALTER TABLE execution_logs
ADD COLUMN IF NOT EXISTS test_hour INTEGER;

-- 4. Criar index para buscar logs por user_id
CREATE INDEX IF NOT EXISTS idx_execution_logs_user_id ON execution_logs (user_id);

-- 5. Criar index para buscar logs de teste
CREATE INDEX IF NOT EXISTS idx_execution_logs_is_test ON execution_logs (is_test);

-- 6. Remover policies antigas
DROP POLICY IF EXISTS "Users can view logs from their schedules" ON execution_logs;

DROP POLICY IF EXISTS "Users can view their own logs" ON execution_logs;

DROP POLICY IF EXISTS "Service role can insert logs" ON execution_logs;

DROP POLICY IF EXISTS "Allow authenticated users to view all logs" ON execution_logs;

-- 7. Criar policy simples que permite usuários autenticados verem todos os logs
-- (Ideal para aplicação single-tenant ou onde todos os logs são relevantes)
CREATE POLICY "Allow authenticated users to view all logs" ON execution_logs FOR
SELECT
  TO authenticated USING (true);

-- 8. Permitir inserção apenas via service role (Edge Functions)
-- Isso é feito automaticamente quando usamos service_role key
-- 9. Adicionar coluna description para configurações
ALTER TABLE app_config
ADD COLUMN IF NOT EXISTS description TEXT;

-- 10. Garantir que a tabela execution_logs tem RLS habilitada mas não bloqueando
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;

-- 11. Configurações de notificação (execute manualmente depois de inserir seu email):
-- INSERT INTO app_config (user_id, key, value, description) 
-- SELECT 
--   id,
--   'notification_email', 
--   'SEU_EMAIL@exemplo.com',
--   'E-mail para receber notificações de sucesso/falha'
-- FROM auth.users LIMIT 1
-- ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value;