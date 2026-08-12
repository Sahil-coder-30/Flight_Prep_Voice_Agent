# 🧩 Core Backend Service — ATC Voice Simulator

> Product logic layer: scenario templates, session lifecycle, cadet evaluation scoring, and progress analytics.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-Production--Ready-brightgreen)
![Runtime](https://img.shields.io/badge/runtime-Node%2020%20ESM-informational)

---

## 📖 Table of Contents
- [Overview & The "Why"](#-overview--the-why)
- [Built Features & Current State](#-built-features--current-state)
- [Architecture & Design Patterns](#-architecture--design-patterns)
- [Usage & Setup](#-usage--setup)
- [Communication & Contracts](#-communication--contracts)
- [Production Readiness](#-production-readiness)

---

## 🎯 Overview & The "Why"

### What this service does
The Core Backend Service manages scenario templates, session lifecycles, progress tracking, daily streaks, rolling scores, and cadet weak-area analytics for the ATC Voice Simulator.

---

## 🚧 Built Features & Current State

### Features built (working today)
- `GET /api/backend/scenarios` — Lists active ATC training scenario templates — ✅ done
- `GET /api/backend/scenarios/:id` — Fetches detailed scenario information & aircraft profiles — ✅ done
- `POST /api/backend/sessions` — Initializes a new ATC simulation training session & dynamic slots — ✅ done
- `GET /api/backend/sessions/:id` — Returns current session state & conversation progress — ✅ done
- `POST /api/backend/sessions/:id/complete` — Finalizes training session, records `SessionAnalytics`, updates streaks & scores — ✅ done
- `GET /api/backend/users/stats` — Returns cadet total flight hours, completed sessions, daily streak, and average score — ✅ done
- `GET /api/backend/users/progress` — Returns detailed cadet progress metrics & favorite scenario engagement — ✅ done
- `GET /api/backend/users/weak-areas` — Identifies weak phraseology categories requiring extra practice — ✅ done
- `GET /api/backend/users/template-scores` — Fetches RAG-aggregated template scores & AI improvement suggestions — ✅ done
- `npm run seed` — Populates 5 pre-built aviation scenario templates (`KBOS`, `KJFK`, `KLAX`, `KORD`, `KSFO`) — ✅ done

---

## 🏗️ Architecture & Design Patterns

```
Backend/
├── server.js           ← HTTP listener entry point
├── app/
│   └── app.js          ← Express app factory
├── config/             ← DB & Redis configuration
├── controllers/        ← Handlers for scenarios, sessions, and user progress
├── middleware/         ← JWKS auth verification (identifyUser)
├── models/             ← Scenario, Session, UserProgress, SessionAnalytics
├── routes/             ← scenario.routes.js, session.routes.js, progress.routes.js
└── scripts/            ← seedScenarios.js
```

---

## ⚙️ Usage & Setup

```bash
# 1. Install dependencies
npm install

# 2. Seed 5 aviation scenario templates
npm run seed

# 3. Start Backend service
npm run dev
```

---

## 🛡️ Production Readiness

- **Liveness:** `GET /healthz` — returns 200 OK
- **Readiness:** `GET /readyz` — returns 200 OK
- **AuthN/AuthZ:** Local RS256 JWKS access token verification (`identifyUser`)

---

## 🤝 Ownership
- **Maintainer(s):** ATC Core Backend Team
