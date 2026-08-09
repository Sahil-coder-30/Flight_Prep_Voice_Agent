# 🧩 Core Backend Service — ATC Voice Simulator

> Product logic layer: scenario templates, session state machine, and progress tracking.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-Development-brightgreen)
![Runtime](https://img.shields.io/badge/runtime-Node%2020%20ESM-informational)

---

## 📖 Table of Contents
- [Overview & The "Why"](#-overview--the-why)
- [Built Features & Current State](#-built-features--current-state)
- [Architecture & Design Patterns](#-architecture--design-patterns)
- [Usage & Setup](#-usage--setup)
- [Communication & Contracts](#-communication--contracts)
- [Production Readiness](#-production-readiness)
- [Changelog & Migration State](#-changelog--migration-state)

---

## 🎯 Overview & The "Why"

### What this service does
The Core Backend Service manages scenarios, session lifecycles, progress tracking, and student scoring for the ATC Voice Simulator. It acts as the API gateway between the frontend SPA and the AI Service.

### Why this is its own microservice
- **Bounded context:** Owns scenario definitions and student progress history exclusively.
- **Independent scaling need:** Handles lightweight CRUD operations independently of the heavy AI inference engine.
- **Independent deployability:** Allows scenario content and curriculum updates without redeploying AI or Auth logic.
- **Failure isolation:** Prevents session management failures from crashing identity or AI services.
- **Data isolation strategy:** Dedicated MongoDB database (`atc-backend`).

### The "User" of this service
| Caller | Call type | Why it calls this service |
|---|---|---|
| Frontend SPA | Direct HTTP | Start sessions, browse scenarios, fetch progress |

---

## 🚧 Built Features & Current State

### Current state
| Field | Value |
|---|---|
| **Status** | 🟢 Active Development |
| **Version** | v1.0.0 |
| **Last updated** | 2026-08-09 |
| **Owner(s)** | Core Backend Team |
| **Known technical debt** | Redis session caching & analytics aggregation pending |

### Features built (working today)
- `GET /api/backend/scenarios` — Lists active ATC training scenarios — ✅ done
- `GET /api/backend/scenarios/:id` — Fetches detailed scenario information & aircraft profiles — ✅ done
- `POST /api/backend/sessions` — Initializes a new ATC simulation training session — ✅ done
- `GET /api/backend/sessions/:id` — Returns current session state & conversation progress — ✅ done
- `POST /api/backend/sessions/:id/complete` — Finalizes training session & calculates evaluation scores — ✅ done
- `identifyUser` Middleware — Statelessly verifies RS256 JWT access tokens via JWKS caching (24h TTL + `kid` lookup) — ✅ done

### How it was built
- **Language/runtime:** Node.js 20 (ES Modules)
- **Framework:** Express 5
- **Design patterns used:** Controller-Service-Model architecture, JWKS local token verification
- **Key libraries:** Mongoose, node-fetch, express-rate-limit

---

## 🏗️ Architecture & Design Patterns

```
Backend/
├── server.js           ← Entry point only
├── app/
│   └── app.js          ← Express app factory
├── config/             ← DB & Redis configs
├── controllers/        ← Handlers for scenarios & sessions
├── middleware/         ← JWKS auth verification
├── models/             ← Scenario & Session Mongoose schemas
├── routes/             ← Express routers
└── services/           ← AI Service HTTP adapter & session logic
```

---

## ⚙️ Usage & Setup

### Environment variables

| Key | Required | Description | Example (fake) |
|---|---|---|---|
| `PORT` | ✅ | Port the service listens on | `5000` |
| `NODE_ENV` | ✅ | Node environment | `development` |
| `MONGO_URI` | ✅ | MongoDB connection string | `mongodb://localhost:27017/atc-backend` |
| `REDIS_URL` | ✅ | Redis connection string | `redis://localhost:6379` |
| `AUTH_JWKS_URI` | ✅ | Auth service JWKS endpoint | `http://localhost/api/auth/.well-known/jwks.json` |
| `JWT_ISSUER` | ✅ | Expected JWT issuer | `auth.atcvoicesimulator.in` |
| `JWT_AUDIENCE` | ✅ | Expected JWT audience | `atcvoicesimulator-services` |
| `AI_SERVICE_URL` | ✅ | Base URL for internal AI Service | `http://localhost:7000` |

### Run locally
```bash
# 1. Install dependencies
npm install

# 2. Start in dev mode
npm run dev

# 3. Run production mode
npm start
```

---

## 🔌 Communication & Contracts

### Synchronous (REST/gRPC)
| Direction | Protocol | Endpoint / method | Counterpart |
|---|---|---|---|
| Outbound | HTTP REST | `POST /api/ai/sessions/:id/turn` | AI Service |
| Outbound | HTTP REST | `GET /api/ai/sessions/:id/transcript` | AI Service |

---

## 🛡️ Production Readiness

### Health & observability
- **Liveness:** `GET /healthz` — returns 200 OK
- **Readiness:** `GET /ready` — returns 200 OK
- **Structured logging:** Morgan HTTP logger

### Security & compliance
- **AuthN/AuthZ:** Local RS256 JWKS access token verification
- **Rate limiting:** Express rate limiter on API endpoints

---

## 📝 Changelog & Migration State

| Version | Date | Change | Migration notes |
|---|---|---|---|
| `v1.0.0` | 2026-08-09 | Initial Core Backend service scaffold | None |

---

## 🤝 Ownership
- **Maintainer(s):** ATC Platform Team
