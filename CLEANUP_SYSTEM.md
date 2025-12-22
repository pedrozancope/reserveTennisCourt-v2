# Sistema de Limpeza Automática

## 📋 Visão Geral

Sistema automático para manter o banco de dados leve, removendo dados antigos e desnecessários.

## 🎯 O que é limpo?

### 1. **Logs de Execução** (`execution_logs`)

- **Período**: Remove logs com mais de **30 dias**
- **Motivo**: Logs antigos raramente são consultados
- **Impacto**: Mantém apenas histórico recente

### 2. **Agendamentos Inativos** (`schedules`)

- **Período**: Remove schedules inativos por mais de **30 dias**
- **Motivo**: Agendamentos desativados há muito tempo não serão reativados
- **Impacto**: Remove apenas schedules com `is_active = false` e `updated_at < 30 dias`

### 3. **Reservas Antigas** (`reservations`)

- **Período**: Remove reservas com mais de **90 dias**
- **Motivo**: Mantém histórico por mais tempo, mas remove dados muito antigos
- **Impacto**: Preserva histórico de 3 meses

## ⚙️ Como Funciona

### Limpeza Automática

- **Quando**: Todo domingo às 3h da manhã
- **Cron**: `0 3 * * 0`
- **Job**: `automatic-cleanup` (pg_cron)

### Funções SQL

```sql
-- Limpa logs antigos
SELECT * FROM cleanup_old_logs();

-- Limpa schedules inativos
SELECT * FROM cleanup_inactive_schedules();

-- Limpa reservations antigas
SELECT * FROM cleanup_old_reservations();

-- Executa todas as limpezas
SELECT * FROM run_automatic_cleanup();
```

## 📊 Monitoramento

### Histórico de Limpezas

```sql
-- Ver últimas limpezas
SELECT * FROM cleanup_history
ORDER BY executed_at DESC
LIMIT 10;

-- Ver quantos registros foram removidos no total
SELECT
  SUM(logs_deleted) as total_logs,
  SUM(schedules_deleted) as total_schedules,
  SUM(reservations_deleted) as total_reservations
FROM cleanup_history;
```

### Verificar Job Agendado

```sql
-- Ver informações do job de limpeza
SELECT * FROM cron.job
WHERE jobname = 'automatic-cleanup';

-- Ver execuções recentes
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'automatic-cleanup')
ORDER BY start_time DESC
LIMIT 10;
```

## 🔧 Limpeza Manual

### Via SQL

```sql
-- Executar limpeza manualmente
SELECT * FROM run_automatic_cleanup();
```

### Via Edge Function

```bash
# Chamar a função de limpeza
curl -X POST 'https://your-project.supabase.co/functions/v1/run-cleanup' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json'
```

### Resposta Esperada

```json
{
  "success": true,
  "message": "Limpeza executada com sucesso",
  "result": {
    "logsDeleted": 150,
    "schedulesDeleted": 5,
    "reservationsDeleted": 200,
    "timestamp": "2025-12-22T03:00:00.000Z"
  }
}
```

## 📝 Configuração Personalizada

### Alterar Período de Retenção

Para modificar os períodos, edite as funções no banco:

```sql
-- Exemplo: Manter logs por 60 dias em vez de 30
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS TABLE(deleted_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count_deleted INTEGER;
BEGIN
  DELETE FROM execution_logs
  WHERE executed_at < NOW() - INTERVAL '60 days';  -- Alterado aqui

  GET DIAGNOSTICS count_deleted = ROW_COUNT;
  RAISE NOTICE 'Cleanup: % logs antigos removidos', count_deleted;
  RETURN QUERY SELECT count_deleted;
END;
$$;
```

### Alterar Frequência do Cron

```sql
-- Desagendar job atual
SELECT cron.unschedule('automatic-cleanup');

-- Reagendar com nova frequência (ex: diariamente às 2h)
SELECT cron.schedule(
  'automatic-cleanup',
  '0 2 * * *',  -- Todos os dias às 2h
  $$SELECT run_automatic_cleanup();$$
);
```

## 🚨 Considerações Importantes

### ⚠️ Dados Deletados São Permanentes

- Não há backup automático antes da limpeza
- Certifique-se de que os períodos estão corretos antes de aplicar

### 💡 Recomendações

- **Desenvolvimento**: Considere períodos mais curtos (ex: 7 dias)
- **Produção**: Use os períodos padrão (30/90 dias)
- **Backup**: Faça backups regulares antes de limpezas manuais

### 🔒 Segurança

- Funções usam `SECURITY DEFINER` para garantir permissões adequadas
- Edge Function requer autenticação do usuário
- Apenas usuários autenticados podem executar limpeza manual

## 📈 Benefícios

1. **Performance**: Banco mais leve = queries mais rápidas
2. **Custos**: Menos dados = menos armazenamento
3. **Manutenção**: Automático, sem intervenção manual
4. **Auditoria**: Histórico de limpezas registrado

## 🔄 Deployment

### Aplicar Migração

```bash
# Aplicar a nova migração
supabase db push

# Ou via migration
supabase migration up
```

### Deploy da Edge Function

```bash
# Deploy da função de limpeza manual
supabase functions deploy run-cleanup
```

## 📋 Checklist de Implementação

- [x] Criar funções de limpeza SQL
- [x] Agendar job no pg_cron
- [x] Criar tabela de histórico
- [x] Criar Edge Function para limpeza manual
- [ ] Aplicar migração no banco
- [ ] Fazer deploy da Edge Function
- [ ] Testar limpeza manual
- [ ] Verificar execução automática após 1 semana

## 🧪 Testes

### Teste Manual

```sql
-- 1. Inserir dados de teste antigos
INSERT INTO execution_logs (schedule_id, status, message, executed_at)
VALUES (NULL, 'success', 'Teste', NOW() - INTERVAL '35 days');

-- 2. Executar limpeza
SELECT * FROM run_automatic_cleanup();

-- 3. Verificar resultado
SELECT * FROM cleanup_history ORDER BY executed_at DESC LIMIT 1;

-- 4. Confirmar que dados antigos foram removidos
SELECT COUNT(*) FROM execution_logs
WHERE executed_at < NOW() - INTERVAL '30 days';
```

## 📞 Suporte

Em caso de problemas:

1. Verificar logs do pg_cron
2. Verificar histórico de limpezas
3. Testar funções individualmente
4. Verificar permissões do banco

---

**Última atualização**: 22 de dezembro de 2025
