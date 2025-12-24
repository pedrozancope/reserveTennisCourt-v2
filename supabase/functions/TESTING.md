# 🧪 Guia de Testes - execute-reservation

## Teste Local

### 1. Preparar ambiente

```bash
cd /Users/pedro.zancope/Desktop/Zerve

# Criar .env.local para as functions
cat > supabase/.env.local << EOF
SPEED_API_URL=https://sua-api-speed.com/reservas
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
EOF
```

### 2. Iniciar Supabase local

```bash
supabase start
```

### 3. Popular banco de testes

```sql
-- Inserir time slot
INSERT INTO time_slots (id, hour, external_id, display_name)
VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 18, '455', '18:00');

-- Inserir schedule de teste
INSERT INTO schedules (
  id,
  user_id,
  name,
  time_slot_id,
  reservation_day_of_week,
  trigger_day_of_week,
  cron_expression,
  is_active
)
VALUES (
  'test-schedule-uuid',
  'user-uuid',
  'Teste Quinta 18h',
  '550e8400-e29b-41d4-a716-446655440000',
  4, -- Quinta
  1, -- Segunda (10 dias antes)
  'cron(1 3 ? * MON *)',
  true
);

-- Inserir token de teste (não criptografado para teste)
INSERT INTO app_config (key, value, is_encrypted)
VALUES ('speed_auth_token', 'seu-token-aqui', false);
```

### 4. Servir a function

```bash
supabase functions serve execute-reservation --env-file supabase/.env.local --debug
```

### 5. Testar via curl

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/execute-reservation' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  --header 'Content-Type: application/json' \
  --data '{
    "scheduleId": "test-schedule-uuid"
  }'
```

### 6. Verificar logs

Os logs aparecem no terminal onde você rodou `supabase functions serve`.

Procure por:

- ✅ `[SUCCESS] ✅ Reservation completed successfully!`
- ❌ `[ERROR] ❌ Reservation failed`

---

## Teste de Produção

### 1. Deploy

```bash
# Deploy da function
supabase functions deploy execute-reservation

# Configurar secrets
supabase secrets set SPEED_API_URL=https://api-prod.speed.com/reservas
```

### 2. Teste manual via Dashboard

1. Acesse: [Supabase Dashboard](https://app.supabase.com)
2. Vá em: **Edge Functions → execute-reservation**
3. Clique em "**Invoke function**"
4. Cole o payload:

```json
{
  "scheduleId": "uuid-do-schedule-real"
}
```

5. Clique em "**Run**"

### 3. Ver logs de produção

```bash
# Logs em tempo real
supabase functions logs execute-reservation --project-ref seu-projeto --follow

# Últimos 100 logs
supabase functions logs execute-reservation --project-ref seu-projeto --tail 100
```

---

## Teste via pg_cron

### 1. Criar schedule no frontend

Use a UI para criar um novo schedule.

### 2. Verificar se o cron foi criado

```sql
-- Ver todos os jobs
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname LIKE 'schedule_%';

-- Ver últimas execuções
SELECT
  jr.jobid,
  j.jobname,
  jr.start_time,
  jr.end_time,
  jr.status,
  jr.return_message
FROM cron.job_run_details jr
JOIN cron.job j ON j.jobid = jr.jobid
ORDER BY start_time DESC
LIMIT 10;
```

### 3. Forçar execução manual

```sql
-- Executar job específico manualmente
SELECT cron.unschedule(123); -- Desagendar temporariamente
CALL cron.run_job_asap(123); -- Executar agora
SELECT cron.schedule(...); -- Re-agendar
```

Ou invocar a Edge Function diretamente via SQL:

```sql
SELECT net.http_post(
  url:='https://seu-projeto.supabase.co/functions/v1/execute-reservation',
  headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('supabase.service_role_key', true) || '"}'::jsonb,
  body:='{"scheduleId": "uuid-aqui"}'::jsonb
);
```

---

## Cenários de Teste

### ✅ Teste 1: Sucesso completo

**Esperado:**

- Status 200
- `success: true`
- `reservationId` presente
- Log de execução criado
- Registro de reserva criado

**Verificar:**

```sql
SELECT * FROM execution_logs ORDER BY executed_at DESC LIMIT 1;
SELECT * FROM reservations ORDER BY created_at DESC LIMIT 1;
```

### ❌ Teste 2: Schedule inativo

**Setup:**

```sql
UPDATE schedules SET is_active = false WHERE id = 'test-uuid';
```

**Esperado:**

- Status 200
- `success: false`
- `message: "Schedule is inactive"`

### ❌ Teste 3: Token inválido

**Setup:**

```sql
UPDATE app_config SET value = 'token-invalido' WHERE key = 'speed_auth_token';
```

**Esperado:**

- Status 400
- `success: false`
- Log de erro criado com detalhes da API

### ❌ Teste 4: Schedule não encontrado

**Payload:**

```json
{
  "scheduleId": "uuid-inexistente"
}
```

**Esperado:**

- Status 500
- `error: "Schedule not found"`

### ⚠️ Teste 5: API Speed offline

**Esperado:**

- Status 400
- `success: false`
- `message: "Failed to connect to Speed API"`
- Log de erro criado

---

## Validação de Dados

### Verificar estrutura do log

```sql
SELECT
  id,
  schedule_id,
  status,
  message,
  request_payload,
  response_payload,
  reservation_date,
  duration_ms,
  executed_at
FROM execution_logs
WHERE schedule_id = 'test-uuid'
ORDER BY executed_at DESC
LIMIT 1;
```

**Esperado em `request_payload`:**

```json
{
  "idHorario": "455",
  "data": "2026-01-01",
  "timeSlotName": "18:00"
}
```

**Esperado em `response_payload` (sucesso):**

```json
{
  "success": true,
  "idReserva": "12345",
  "message": "Reserva criada com sucesso"
}
```

### Verificar reserva criada

```sql
SELECT
  r.id,
  r.schedule_id,
  r.external_id,
  r.reservation_date,
  r.status,
  s.name as schedule_name,
  ts.display_name as time_slot
FROM reservations r
JOIN schedules s ON s.id = r.schedule_id
JOIN time_slots ts ON ts.id = r.time_slot_id
WHERE r.schedule_id = 'test-uuid'
ORDER BY r.created_at DESC
LIMIT 1;
```

---

## Performance

### Benchmarks esperados

- **Latência total**: < 3 segundos
- **Chamada API Speed**: < 2 segundos
- **Operações DB**: < 500ms
- **Cold start**: < 5 segundos (primeira execução)

### Monitorar

```sql
SELECT
  AVG(duration_ms) as avg_duration,
  MIN(duration_ms) as min_duration,
  MAX(duration_ms) as max_duration,
  COUNT(*) as total_executions
FROM execution_logs
WHERE executed_at > NOW() - INTERVAL '7 days';
```

---

## Checklist Final

- [ ] Function faz deploy sem erros
- [ ] Secrets estão configurados
- [ ] Token está no banco (criptografado)
- [ ] Schedule de teste criado
- [ ] Execução manual funciona
- [ ] Logs aparecem no Dashboard
- [ ] Reserva é criada no banco
- [ ] pg_cron executa automaticamente
- [ ] Erros são tratados e logados
- [ ] Performance está aceitável (< 3s)

---

## 🆘 Suporte

Se algo não funcionar:

1. **Verificar logs**: `supabase functions logs execute-reservation --tail 100`
2. **Verificar secrets**: `supabase secrets list`
3. **Verificar token**: `SELECT * FROM app_config WHERE key = 'speed_auth_token'`
4. **Verificar schedule**: `SELECT * FROM schedules WHERE id = 'uuid'`
5. **Verificar time slot**: `SELECT * FROM time_slots`

**Dica**: Use `--debug` ao servir localmente para ver mais detalhes!

```bash
supabase functions serve execute-reservation --debug
```
