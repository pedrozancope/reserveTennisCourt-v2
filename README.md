# 🎾 Reserve Tennis Court

> _"A quadra das 7h é minha!"_ — Você, finalmente descansado

Sistema automatizado de reservas de quadras de tênis que trabalha enquanto você dorme! 😴

![Tennis](https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif)

## ✨ What is this?

Reserve Tennis Court é um **robô incansável** que garante sua quadra:

- ⏰ **Dispara** exatamente às 00:01 (quando as reservas abrem)
- 🔐 **Autentica** automaticamente na API do Speed
- 📅 **Calcula** a data correta (sempre 10 dias à frente)
- ✅ **Reserva** antes de qualquer humano conseguir
- 📧 **Notifica** você do sucesso (ou falha)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the app
npm run dev
```

That's it! Open [http://localhost:5173](http://localhost:5173) and never lose a court again! 🏆

## 🛠️ Tech Stack

| Tool              | Purpose                     |
| ----------------- | --------------------------- |
| ⚛️ React          | UI Framework                |
| 🎨 Tailwind CSS   | Styling                     |
| 🧩 shadcn/ui      | Components                  |
| ⚡ Vite           | Build Tool                  |
| 🗄️ Supabase       | Database & Auth             |
| 🔄 TanStack Query | Data Fetching               |
| ⏰ pg_cron        | Scheduling (PostgreSQL)     |
| 🔐 pgcrypto       | Token Encryption            |
| 🌐 Edge Functions | Serverless Functions (Deno) |

## 📁 Project Structure

```
src/
├── components/   # UI components (cards, buttons, etc.)
├── pages/        # App pages (Dashboard, Schedules, etc.)
├── hooks/        # Custom React hooks
├── types/        # TypeScript definitions
├── lib/          # Utilities & helpers
└── services/     # API clients
supabase/
├── functions/    # Edge Functions (Deno)
└── migrations/   # Database migrations
```

## 🎯 Features

- 🔐 **Authentication** — Secure login with Supabase
- 📊 **Dashboard** — Overview of schedules and stats
- 📅 **Schedules** — Create and manage recurring reservations
- 📋 **Logs** — Execution history with step-by-step details
- ✈️ **Pre-flight** — Test authentication before the real deal
- 🧪 **E2E Test** — Validate the entire flow manually
- ⚙️ **Settings** — Manage tokens and configurations

## 🤔 Why this exists?

Because the Speed Tennis app releases courts **10 days in advance**, and the good slots (7h, 8h) disappear in **seconds**. Who wants to wake up at midnight just to tap a button? 🙄

## 🧠 The 10-Day Rule

Speed Tennis releases reservations **10 days before** the desired date:

| You want to play | Must reserve on | Day calculation |
| ---------------- | --------------- | --------------- |
| Sunday, 29th     | Thursday, 19th  | Thu → Sun       |
| Monday, 30th     | Friday, 20th    | Fri → Mon       |
| Tuesday, 31st    | Saturday, 21st  | Sat → Tue       |

> **Pro tip:** Trigger day = Reservation day - 3 (because 10 mod 7 = 3 🧮)

## 🔄 Frequency vs Trigger Mode

Two **independent concepts** — understand the difference!

### 📊 Frequency

How often the reservation repeats:

| Frequency    | Behavior                      |
| ------------ | ----------------------------- |
| **Once**     | Runs once, then stops         |
| **Weekly**   | Every week, same day          |
| **Biweekly** | Every 2 weeks                 |
| **Monthly**  | Every month, same day of week |

### 🎮 Trigger Mode

How to calculate **when** to fire:

| Mode                 | How it works                           |
| -------------------- | -------------------------------------- |
| **Reservation Date** | "I want Sundays" → System picks Thursday 00:01 |
| **Specific Date**    | "Fire on Dec 25th" → Reserves Jan 4th  |

```
┌─────────────────────────────────────────────────────────────┐
│              RESERVATION DATE MODE                          │
│   "I want Sundays" → System calculates Thursday             │
│                                                             │
│   Thu 19 ──[10 days]──→ Sun 29 (reservation)               │
│   Thu 26 ──[10 days]──→ Sun 05 (next one)                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              SPECIFIC DATE MODE                             │
│   "Fire on Dec 25th" → System obeys                        │
│                                                             │
│   Dec 25 ──[10 days]──→ Jan 04 (reservation)               │
│   Jan 01 ──[10 days]──→ Jan 11 (if weekly)                 │
└─────────────────────────────────────────────────────────────┘
```

## ✈️ Pre-flight Test

Imagine: your schedule runs at 00:01, but the token expired! Result: **no court** 😭

Pre-flight solves this! It runs **before** the real execution:

```
┌─────────────────────────────────────────────────────────────┐
│                    TIMELINE                                  │
│                                                             │
│   20:01              00:01                                  │
│     ↓                  ↓                                    │
│   [PRE-FLIGHT]       [REAL RESERVATION]                     │
│     │                  │                                    │
│     ├─ Authenticate    ├─ Authenticate                      │
│     ├─ Validate        ├─ Validate                          │
│     └─ Notify          ├─ Reserve                           │
│       (on error)       └─ Notify                            │
└─────────────────────────────────────────────────────────────┘
```

**What it tests:**

- ✅ Authentication token is valid
- ✅ API connection works
- ✅ Credentials are correct
- ✅ Schedule is properly configured

| Option               | Description              | Default |
| -------------------- | ------------------------ | ------- |
| Enable Pre-flight    | Toggle the test          | Off     |
| Hours before         | When to run before trigger | 4h      |
| Notify on success    | Alert if all good        | No      |
| Notify on failure    | Alert if something's wrong | Yes ✅  |

## 🧪 E2E Test

Want to test without waiting for cron? Use the **E2E Test**!

1. Pick a time slot (6h-21h)
2. Click "Run Test"
3. Watch each step execute in real-time
4. Get visual feedback for success/error

**Execution flow:**

```
1. 📄 Parse Payload       6. 🔄 Update Token      11. 🔔 Send Notification
2. 🎮 Test Mode           7. 📅 Make Reservation  12. 🎉 Success!
3. 🔍 Get Schedule        8. 💾 Process Response
4. 🔑 Get Token           9. 📝 Save Log
5. 🛡️ Authenticate       10. ✅ Save Reservation
```

| Aspect             | E2E Test         | Real Execution    |
| ------------------ | ---------------- | ----------------- |
| Reservation date   | Today            | 10 days ahead     |
| Needs schedule     | No               | Yes               |
| Saves to database  | Yes (marked test)| Yes               |

> ⚠️ **Warning:** E2E test makes a **real reservation** for today! Use wisely.

## 📜 Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start development server |
| `npm run build`   | Build for production     |
| `npm run preview` | Preview production build |
| `npm run lint`    | Check code quality       |

## 🎾 Pro Tips

1. **Enable Pre-flight** to catch auth issues before they matter
2. **Use Reservation Date mode** for regular weekly games
3. **Use Specific Date mode** for holidays or special occasions
4. **Set notifications** to know immediately if something fails
5. **Check logs** regularly to ensure everything runs smoothly

---

<p align="center">
  <i>Made with 💚 by someone tired of waking up at midnight</i>
</p>

<p align="center">
  <b>"Booking a court shouldn't be harder than playing tennis"</b>
</p>
