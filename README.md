# 🎾 Tennis Scheduler

> Sistema de reservas automáticas de quadras de tênis

Um aplicativo web moderno para gerenciar reservas recorrentes de quadras de tênis, com **pg_cron + Supabase Edge Functions** para disparar reservas automaticamente 10 dias antes da data desejada (quando as vagas abrem!).

## ✨ Funcionalidades

- 📅 **Agendamentos** - Crie triggers para reservas recorrentes
- ⏰ **Disparo automático** - Reserva às 00:01, 10 dias antes
- 📊 **Dashboard** - Visão geral de próximas reservas e status
- 📋 **Logs** - Histórico de todas as execuções
- 🔑 **Tokens** - Gerencie tokens do sistema Speed (criptografados)
- 📧 **Notificações** - Receba notificações de sucesso/falha

## 🚀 Quick Start

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais Supabase

# Iniciar em desenvolvimento
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173) 🎾

## 🛠️ Tech Stack

| Ferramenta            | Propósito                   |
| --------------------- | --------------------------- |
| ⚛️ React + TypeScript | UI Framework                |
| 🎨 Tailwind CSS       | Estilização                 |
| 🧩 shadcn/ui          | Componentes                 |
| ⚡ Vite               | Build Tool                  |
| 🗄️ Supabase           | Database & Auth             |
| 🔄 TanStack Query     | Data Fetching               |
| ⏰ pg_cron            | Scheduling (PostgreSQL)     |
| 🔐 pgcrypto           | Criptografia de Tokens      |
| 🌐 Edge Functions     | Serverless Functions (Deno) |

## 📁 Estrutura

```
src/
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── layout/       # Header, MobileNav, AppLayout
│   └── dashboard/    # Cards, listas
├── pages/
│   ├── Dashboard     # Visão geral
│   ├── Schedules     # Lista de agendamentos
│   ├── NewSchedule   # Criar/editar agendamento
│   ├── Logs          # Histórico de execuções
│   └── Settings      # Tokens e notificações
├── lib/
│   ├── utils.ts      # Utilidades (cn, formatDate)
│   ├── cron.ts       # Lógica de cron/datas
│   └── constants.ts  # Time slots, config
└── types/
    └── index.ts      # TypeScript types
```

## ⏰ Lógica de Agendamento

As reservas abrem **10 dias antes** às **00:00**. O sistema dispara às **00:01** para garantir a vaga:

| Dia da Reserva | Dia do Disparo |
| -------------- | -------------- |
| Domingo        | Quinta         |
| Segunda        | Sexta          |
| Terça          | Sábado         |
| Quarta         | Domingo        |
| Quinta         | Segunda        |
| Sexta          | Terça          |
| Sábado         | Quarta         |

## 🗓️ Horários Disponíveis

| Horário | ID Sistema |
| ------- | ---------- |
| 06:00   | 455        |
| 07:00   | 440        |
| 08:00   | 441        |
| 09:00   | 442        |
| 10:00   | 443        |
| 11:00   | 444        |
| 12:00   | 445        |
| 13:00   | 446        |
| 14:00   | 447        |
| 15:00   | 448        |
| 16:00   | 449        |
| 17:00   | 450        |
| 18:00   | 451        |
| 19:00   | 452        |
| 20:00   | 453        |
| 21:00   | 454        |

## 📜 Scripts

| Comando           | Descrição                   |
| ----------------- | --------------------------- |
| `npm run dev`     | Servidor de desenvolvimento |
| `npm run build`   | Build para produção         |
| `npm run preview` | Preview do build            |
| `npm run lint`    | Verificar código            |

## 🔧 Configuração

### 1. Frontend - Variáveis de Ambiente

Crie um arquivo `.env` na raiz:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SPEED_API_URL=https://speed.example.com/api
```

### 2. Supabase Database

Aplique as migrations:

```bash
# Via Supabase CLI
supabase db push

# Ou no Supabase Dashboard > SQL Editor, execute:
# - 001_initial_schema.sql
# - 002_add_pg_cron_and_functions.sql
# - 003_add_encryption_support.sql
```

### 3. Edge Functions

Deploy das functions:

```bash
supabase functions deploy create-schedule
supabase functions deploy execute-reservation
```

Configure secrets:

```bash
supabase secrets set SPEED_API_URL=https://speed.example.com/api
supabase secrets set SPEED_USER_ID=seu-user-id
```

### 4. Encryption Key

No Supabase Dashboard:

- Settings → Database → Custom Postgres Config
- Adicionar: `app.encryption_key = sua-chave-super-secreta-aqui`

### 5. Token Speed

Via SQL Editor no Supabase:

```sql
SELECT upsert_encrypted_config(
  'speed_auth_token',
  'seu-token-do-speed-aqui',
  true  -- encrypt
);

SELECT upsert_encrypted_config(
  'speed_token_expiry',
  '2025-12-31 23:59:59',
  false
);
```

## 📖 Documentação Técnica

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura do sistema
- [CLEANUP_SYSTEM.md](./CLEANUP_SYSTEM.md) - Sistema de limpeza automática

## 🧹 Sistema de Limpeza Automática

O sistema inclui limpeza automática para manter o banco leve:

- **Logs**: Remove logs com mais de 30 dias
- **Agendamentos**: Remove schedules inativos por mais de 30 dias
- **Reservas**: Remove reservations com mais de 90 dias
- **Frequência**: Todo domingo às 3h da manhã
- **Monitoramento**: Histórico de limpezas em `cleanup_history`

```sql
-- Executar limpeza manual
SELECT * FROM run_automatic_cleanup();

-- Ver histórico
SELECT * FROM cleanup_history ORDER BY executed_at DESC LIMIT 10;
```

Para mais detalhes, veja [CLEANUP_SYSTEM.md](./CLEANUP_SYSTEM.md)

## 📝 TODO

- [x] ~~Integração completa com Supabase~~
- [x] ~~Edge Functions com pg_cron~~
- [x] ~~Criptografia de tokens com pgcrypto~~
- [x] ~~Sistema de limpeza automática~~
- [ ] Sistema de notificações
- [ ] Autenticação com Google
- [ ] Testes automatizados

---

<p align="center">
  Desenvolvido com 🎾 por <a href="https://github.com/pedrozancope">@pedrozancope</a>
</p>
