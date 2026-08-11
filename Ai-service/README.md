# 🧩 AI Service — ATC Voice Simulator

> Voice AI inference engine: LangGraph state machine, Qdrant RAG, Mistral LLM, STT & TTS.

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
The AI Service handles all real-time voice processing, speech recognition (STT), speech synthesis (TTS), RAG phraseology retrieval via Qdrant, and conditional conversation flow via LangGraph for the ATC Voice Simulator.

### Why this is its own microservice
- **Bounded context:** Owns LangGraph agent checkpoints, RAG grounding retrieval, and transcript audio references exclusively.
- **Independent scaling need:** Heavy GPU/CPU and AI API workloads require horizontal scaling separate from lightweight CRUD services.
- **Independent deployability:** Allows prompt tuning, model upgrades, and STT/TTS voice changes without redeploying platform CRUD services.
- **Failure isolation:** External AI provider downtime won't prevent users from browsing scenarios or managing accounts.
- **Data isolation strategy:** Dedicated MongoDB database (`atc-ai-service`) storing checkpoints and transcript messages.

### The "User" of this service
| Caller | Call type | Why it calls this service |
|---|---|---|
| Core Backend Service | Internal HTTP REST | Advances agent turns & fetches conversation transcripts |

---

## 🚧 Built Features & Current State

### Current state
| Field | Value |
|---|---|
| **Status** | 🟢 Active Development |
| **Version** | v1.0.0 |
| **Last updated** | 2026-08-09 |
| **Owner(s)** | AI & Speech Team |
| **Known technical debt** | WebSocket streaming STT/TTS pipeline to complement REST turn endpoint |

### Features built (working today)
- `POST /api/ai/sessions/:id/turn` — Processes conversational turns via LangGraph state machine & Qdrant RAG — ✅ done
- `GET /api/ai/sessions/:id/transcript` — Retrieves full conversation transcripts & audio references — ✅ done
- `identifyUser` Middleware — Statelessly verifies RS256 JWT access tokens via JWKS caching (24h TTL + `kid` lookup) — ✅ done

### How it was built
- **Language/runtime:** Node.js 20 (ES Modules)
- **Framework:** Express 5 & LangGraph JS
- **Design patterns used:** LangGraph Interrupt/Checkpoint state machine, Retrieval-Augmented Generation (RAG)
- **Key libraries:** `@langchain/langgraph`, `@qdrant/js-client-rest`, `@mistralai/mistralai`

---

## 🏗️ Architecture & Design Patterns

```
Ai-service/
├── server.js           ← Entry point only
├── app/
│   └── app.js          ← Express app factory
├── config/             ← DB, Qdrant & Redis configs
├── controllers/        ← AI session handlers
├── middleware/         ← JWKS auth verification
├── models/             ← ChatMessage, SessionCheckpoint, RetrievalLog
├── routes/             ← Express routers
└── services/           ← LangGraph, Qdrant, Mistral, STT, TTS adapters
```

---

## ⚙️ Usage & Setup

### Environment variables

| Key | Required | Description | Example (fake) |
|---|---|---|---|
| `PORT` | ✅ | Port the service listens on | `7000` |
| `NODE_ENV` | ✅ | Node environment | `development` |
| `MONGO_URI` | ✅ | MongoDB connection string | `mongodb://localhost:27017/atc-ai-service` |
| `REDIS_URL` | ✅ | Redis connection string | `redis://localhost:6379` |
| `AUTH_JWKS_URI` | ✅ | Auth JWKS endpoint | `http://localhost/api/auth/.well-known/jwks.json` |
| `QDRANT_URL` | ✅ | Qdrant vector database URL | `http://localhost:6333` |
| `MISTRAL_API_KEY` | ✅ | Mistral LLM API key | `mistral-fake-key-123` |
| `RIME_API_KEY` | ✅ | Rime STT & TTS API key | `rime-fake-key-789` |

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
| Inbound | HTTP REST | `POST /api/ai/sessions/:id/turn` | Core Backend Service |
| Inbound | HTTP REST | `GET /api/ai/sessions/:id/transcript` | Core Backend Service |
| Outbound | HTTP REST | Qdrant Search API | Qdrant |
| Outbound | HTTP REST | Mistral Chat Completion API | Mistral AI |

---

## 🛡️ Production Readiness

### Health & observability
- **Liveness:** `GET /healthz` — returns 200 OK
- **Readiness:** `GET /ready` — returns 200 OK
- **Structured logging:** Morgan HTTP logger

### Security & compliance
- **AuthN/AuthZ:** Local RS256 JWKS access token verification
- **Rate limiting:** Express rate limiter on AI endpoints

---

## 📝 Changelog & Migration State

| Version | Date | Change | Migration notes |
|---|---|---|---|
| `v1.0.0` | 2026-08-09 | Initial AI Service scaffold & LangGraph agent setup | None |

---

## 🤝 Ownership
- **Maintainer(s):** ATC Platform Team
