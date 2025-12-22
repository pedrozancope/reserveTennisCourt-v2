# 🎾 Tennis Scheduler

> Sistema de reservas automáticas de quadras de tênis

Um aplicativo web moderno para gerenciar reservas recorrentes de quadras de tênis, com integração AWS EventBridge para disparar reservas automaticamente 10 dias antes da data desejada (quando as vagas abrem!).

## ✨ Funcionalidades

- 📅 **Agendamentos** - Crie triggers para reservas recorrentes
- ⏰ **Disparo automático** - Reserva às 00:01, 10 dias antes
- 📊 **Dashboard** - Visão geral de próximas reservas e status
- 📋 **Logs** - Histórico de todas as execuções
- 🔑 **Tokens** - Gerencie refresh tokens do sistema Speed
- 📧 **Notificações** - Receba e-mail de sucesso/falha

## 🚀 Quick Start

```bash
# Instalar dependências
npm install

# Iniciar em desenvolvimento
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173) 🎾

## 🛠️ Tech Stack

| Ferramenta            | Propósito               |
| --------------------- | ----------------------- |
| ⚛️ React + TypeScript | UI Framework            |
| 🎨 Tailwind CSS       | Estilização             |
| 🧩 shadcn/ui          | Componentes             |
| ⚡ Vite               | Build Tool              |
| 🗄️ Supabase           | Database & Auth         |
| 🔄 TanStack Query     | Data Fetching           |
| ☁️ AWS EventBridge    | Triggers/Schedules      |
| 🔐 AWS SSM            | Gerenciamento de Tokens |

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

### Variáveis de Ambiente

Crie um arquivo `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase

Configure as tabelas no Supabase conforme o schema em `supabase/migrations/`.

## 📝 TODO

- [ ] Integração completa com Supabase
- [ ] Edge Functions para AWS EventBridge
- [ ] Edge Functions para AWS SSM
- [ ] Autenticação com Google
- [ ] Envio de e-mails via Resend

---

<p align="center">
  Desenvolvido com 🎾 por <a href="https://github.com/pedrozancope">@pedrozancope</a>
</p>
