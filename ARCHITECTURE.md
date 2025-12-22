# Arquitetura Simplificada - Supabase Only

## 🎯 Visão Geral

Sistema de reservas automatizadas de quadras de tênis usando **100% Supabase**, sem dependências externas AWS.

## 📊 Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                   │
│  - Gerenciamento de schedules                                │
│  - Dashboard e configurações                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Database                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Tables: schedules, time_slots, execution_logs,       │ │
│  │          reservations, app_config                      │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Extensions: pg_cron, pgcrypto, pg_net                │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Functions: create_schedule_cron_job(),                │ │
│  │             encrypt_value(), decrypt_value()           │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase Edge Functions (Deno)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  create-schedule                                      │   │
│  │  - Cria pg_cron job quando schedule é criado         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  execute-reservation                                  │   │
│  │  - Chamada pelo pg_cron                              │   │
│  │  - Faz request para Speed API                        │   │
│  │  - Registra logs e reservas                          │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Speed Tennis API                          │
│  - Autenticação                                              │
│  - Criação de reservas                                       │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Fluxo de Execução

### 1. Criação de Schedule

```
Usuário cria schedule →
  Frontend salva no Supabase →
  Frontend chama Edge Function create-schedule →
  Function cria pg_cron job →
  pg_cron_job_id salvo no schedule
```

### 2. Execução Automática (Cron)

```
pg_cron trigger (ex: toda quinta 00:01 BRT) →
  pg_cron chama Edge Function execute-reservation →
  Function busca token do app_config (descriptografado) →
  Function calcula data da reserva (hoje + 10 dias) →
  Function faz POST para Speed API →
  Function registra execution_log →
  Function cria reservation record (se sucesso) →
  Function envia notificação (se configurado)
```

### 3. Desativação/Exclusão

```
Usuário desativa schedule →
  Trigger SQL deleta pg_cron job automaticamente →
  pg_cron_job_id vira NULL
```

## 🗄️ Detalhes Técnicos

### pg_cron

- **Extensão PostgreSQL nativa** para agendar jobs
- Roda dentro do próprio banco Supabase
- Suporta cron expressions padrão
- Exemplo: `0 3 * * THU` = Toda quinta às 03:00 UTC (00:00 BRT)

### pg_net

- **HTTP client do PostgreSQL**
- Permite o pg_cron fazer requests HTTP
- Usado para chamar Edge Functions

### pgcrypto

- **Criptografia nativa PostgreSQL**
- Encrypt/decrypt de tokens sensíveis
- Usa chave configurada em `app.encryption_key`

### Edge Functions

- **Runtime Deno** (TypeScript nativo)
- Deploy serverless no Supabase
- Auto-scaling e zero config
- URL: `https://<project>.supabase.co/functions/v1/<function-name>`

## 🔐 Segurança

### Tokens Criptografados

```sql
-- Salvar token criptografado
SELECT upsert_encrypted_config(
  'speed_auth_token',
  'seu-token-aqui',
  true  -- encrypt
);

-- Buscar token descriptografado
SELECT get_decrypted_config('speed_auth_token');
```

### Row Level Security (RLS)

- `schedules`: Usuário só vê seus próprios schedules
- `app_config`: Dados criptografados ocultos para authenticated users
- Service role tem acesso total (usado pelas Edge Functions)

## 🚀 Deploy

### 1. Aplicar Migrations

```bash
supabase db push
```

### 2. Deploy Edge Functions

```bash
supabase functions deploy create-schedule
supabase functions deploy execute-reservation
```

### 3. Configurar Secrets

```bash
supabase secrets set SPEED_API_URL=https://speed.example.com/api
supabase secrets set SPEED_USER_ID=seu-user-id
```

### 4. Configurar Encryption Key

No Supabase Dashboard:

- Settings → Database → Custom Config
- Adicionar: `app.encryption_key = 'sua-chave-super-secreta'`

### 5. Salvar Token Speed (via SQL Editor)

```sql
SELECT upsert_encrypted_config(
  'speed_auth_token',
  'seu-token-speed',
  true
);

SELECT upsert_encrypted_config(
  'speed_token_expiry',
  '2025-12-31 23:59:59',
  false
);
```

## 🧪 Testar Manualmente

### Testar Edge Function

```bash
curl -X POST https://<project>.supabase.co/functions/v1/execute-reservation \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"scheduleId": "uuid-aqui"}'
```

### Verificar pg_cron Jobs

```sql
SELECT * FROM cron.job;
```

### Testar Cron Job Manualmente

```sql
-- Forçar execução imediata
SELECT net.http_post(
  url:='https://<project>.supabase.co/functions/v1/execute-reservation',
  headers:='{"Content-Type": "application/json", "Authorization": "Bearer <service-role-key>"}'::jsonb,
  body:='{"scheduleId": "uuid-aqui"}'::jsonb
);
```

## 📝 Variáveis de Ambiente

### Frontend (.env)

```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_SPEED_API_URL=https://speed.example.com/api
```

### Supabase Secrets (Edge Functions)

```bash
SUPABASE_URL              # Auto-injetado
SUPABASE_SERVICE_ROLE_KEY # Auto-injetado
SPEED_API_URL             # Manual
SPEED_USER_ID             # Manual
```

## ✅ Vantagens vs AWS

| AWS EventBridge + Lambda | Supabase pg_cron + Edge Functions |
| ------------------------ | --------------------------------- |
| ❌ Múltiplos serviços    | ✅ Tudo em um lugar               |
| ❌ SDK pesado (~100mb)   | ✅ HTTP nativo                    |
| ❌ IAM + Policies        | ✅ Service role key               |
| ❌ Custo variável        | ✅ Incluído no Supabase           |
| ❌ Deploy complexo       | ✅ `supabase functions deploy`    |
| ❌ CloudWatch logs       | ✅ Logs no Supabase Dashboard     |

## 🐛 Troubleshooting

### Cron job não executa

```sql
-- Verificar se o job existe
SELECT * FROM cron.job WHERE jobname LIKE 'schedule_%';

-- Ver logs de execução
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

### Token inválido

```sql
-- Verificar validade do token
SELECT is_speed_token_valid();

-- Atualizar token
SELECT upsert_encrypted_config('speed_auth_token', 'novo-token', true);
SELECT upsert_encrypted_config('speed_token_expiry', '2026-01-01', false);
```

### Edge Function erro

- Ver logs: Supabase Dashboard → Edge Functions → Logs
- Testar localmente: `supabase functions serve`

## 📚 Referências

- [Supabase pg_cron](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [pgcrypto Extension](https://www.postgresql.org/docs/current/pgcrypto.html)
- [pg_net Extension](https://github.com/supabase/pg_net)
