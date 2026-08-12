# 🧩 AI Service — ATC Voice Simulator

> Voice AI inference & turn execution engine: LangGraph state graph, **7-Layer Redis Caching Architecture**, 1,912 Chunk Qdrant RAG, WebSockets, Deepgram STT, and Rime TTS.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-Production--Ready-brightgreen)
![Runtime](https://img.shields.io/badge/runtime-Node%2020%20ESM-informational)
![MVP Feature](https://img.shields.io/badge/MVP-7--Layer%20Redis%20Engine-red)

---

## 📖 Table of Contents
- [Overview & The "Why"](#-overview--the-why)
- [The 7-Layer Redis Architecture (MVP)](#-the-7-layer-redis-architecture-mvp)
- [Built Features & Current State](#-built-features--current-state)
- [Architecture & Design Patterns](#-architecture--design-patterns)
- [Usage & Setup](#-usage--setup)
- [Communication & Contracts](#-communication--contracts)
- [Production Readiness](#-production-readiness)

---

## 🎯 Overview & The "Why"

### What this service does
The AI Service owns the real-time voice conversation loop, speech recognition (STT), speech synthesis (TTS), RAG phraseology retrieval via Qdrant (1,912 chunks), WebSockets streaming, and stateful turn evaluation via LangGraph for the ATC Voice Simulator.

### Why this is its own microservice
- **Bounded context:** Owns LangGraph agent checkpoints, RAG grounding retrieval, and transcript audio references exclusively.
- **Independent scaling need:** Heavy AI inference workloads require horizontal scaling separate from CRUD services.
- **Sub-300ms Performance:** Implements the platform's **7-Layer Redis Architecture** to bypass LLM & Vector DB latency on pre-templated phraseology turns.

---

## 🚀 The 7-Layer Redis Architecture (MVP)

> 📄 *Technical details in [`docs/redis_7_layer_architecture.md`](file:///Users/home/Desktop/ATC/docs/redis_7_layer_architecture.md)*

| Layer | Key Pattern | TTL | Latency | Function |
|---|---|---|---|---|
| **L1** | `emb:tmpl:{templateId}` | 30 Days | `~2ms` | Caches pre-computed 1024-dim `mistral-embed` vectors per step template. |
| **L2** | `gnd:tmpl:{templateId}` | 7 Days | `~3ms` | Caches top-k retrieved phraseology rules from ICAO Doc 4444 / FAA JO 7110.65. |
| **L3** | `sess:cp:{sessionId}` | 24 Hours | `~4ms` | Stores LangGraph `AgentState` for instant PTT resume (<5ms). |
| **L4** | `sess:slots:{sessionId}` | 24 Hours | `~2ms` | Holds session-randomized variables (wind `270@14`, altimeter `29.92`, squawk `4521`). |
| **L5** | `auth:jwks:cache` | 24 Hours | `~1ms` | Caches Auth service RSA public keys for zero-latency local JWT verification. |
| **L6** | `rl:ip:{ipAddress}` | 15 Mins | `~1ms` | Sliding window rate-limiting counter protecting against API flooding. |
| **L7** | `tts:{sha256(text)}` | 7 Days | `~5ms` | Caches SHA-256 hashed base64 MP3 audio for static controller lines (650ms → 5ms). |

---

## 🚧 Built Features & Current State

### Features built (working today)
- `POST /api/ai/sessions/:id/turn` — Advances LangGraph state graph with student audio/text — ✅ done
- `GET /api/ai/sessions/:id/transcript` — Retrieves session transcript messages & audio — ✅ done
- `GET /api/ai/sessions/:id/tokens` — Returns token usage breakdown per operation — ✅ done
- `GET /ws/simulator` — WebSocket connection broadcasting real-time 3D MetallicOrb reactivity events — ✅ done
- `npm run ingest-rag` — Embeds & ingests 1,912 chunks from FAA JO 7110.65 & ICAO Doc 4444 into Qdrant — ✅ done
- `npm run verify-rag` — Verifies live Qdrant collection status, vector count, and semantic search hits — ✅ done

---

## 🏗️ Architecture & Design Patterns

```
Ai-service/
├── server.js           ← HTTP & WebSocket server listener
├── app/
│   └── app.js          ← Express app factory
├── agent/
│   ├── graph.js        ← LangGraph state graph (9 nodes)
│   ├── state.js        ← AgentState definition
│   ├── utils/          ← slotResolver.js, fuzzyMatch.js
│   └── nodes/          ← loadStep, qdrantRetrieve, composeLine, ttsSpeak, awaitReadback, validateReadback, generalAnswer, issueCorrection, advanceStep, debrief
├── config/             ← db.js, qdrant.js, redis.js, ws.js
├── controllers/        ← aiSession.controller.js
├── middleware/         ← identifyUser.middleware.js, rate-limit.middleware.js
├── models/             ← ChatMessage.js, TokenUsageLog.js, SessionCheckpoint.js, RetrievalLog.js
├── routes/             ← aiSession.routes.js
├── scripts/            ← warmTemplateEmbeddings.js, ingestRagDocs.js, verifyRagCollection.js
└── services/           ← stt.service.js, tts.service.js, mistral.service.js, qdrant.service.js
```

---

## ⚙️ Usage & Setup

### Ingest & Verify RAG Manuals

```bash
# 1. Install dependencies
npm install

# 2. Ingest 1,912 PDF Phraseology Chunks into Qdrant
npm run ingest-rag

# 3. Verify Qdrant Vector Collection (1,912 chunks)
npm run verify-rag

# 4. Start AI Service & WebSocket server
npm run dev
```

---

## 🛡️ Production Readiness

- **Liveness:** `GET /healthz` — returns 200 OK
- **Readiness:** `GET /readyz` — returns 200 OK
- **AuthN/AuthZ:** Local RS256 JWKS access token verification (`identifyUser`)
- **Rate limiting:** Redis sliding window rate-limiter on AI endpoints (`rateLimiter`)

---

## 🤝 Ownership
- **Maintainer(s):** ATC AI & Speech Engineering Team
