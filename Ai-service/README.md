# 🧩 AI Service — ATC Voice Simulator Platform

> **Voice AI Inference & Real-Time Turn Execution Engine**: Sub-300ms speech-to-speech simulation engine powered by a **LangGraph State Graph**, a **7-Layer Redis Caching Architecture**, a **1,912 Chunk Qdrant RAG Vector Store**, Deepgram STT, Rime TTS, and real-time WebSockets.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-Production--Ready-brightgreen.svg)
![Runtime](https://img.shields.io/badge/runtime-Node%2020%20ESM-informational.svg)
![Orchestration](https://img.shields.io/badge/orchestration-LangGraph%200.2-orange.svg)
![Vector DB](https://img.shields.io/badge/vector--db-Qdrant%201.12-purple.svg)
![Cache](https://img.shields.io/badge/cache-7--Layer%20Redis-red.svg)

---

## 📖 Table of Contents
- [Overview & Bounded Context](#-overview--bounded-context)
- [The 7-Layer Redis Architecture](#-the-7-layer-redis-architecture)
- [LangGraph 9-Node State Machine](#-langgraph-9-node-state-machine)
- [Architecture & Directory Map](#-architecture--directory-map)
- [Built Features & API Endpoints](#-built-features--api-endpoints)
- [WebSocket & 3D MetallicOrb Streaming](#-websocket--3d-metallicorb-streaming)
- [Qdrant RAG Vector Ingestion & Verification](#-qdrant-rag-vector-ingestion--verification)
- [Environment Variables](#-environment-variables)
- [Local Development & Commands](#-local-development--commands)
- [Production Readiness & K8s](#-production-readiness--k8s)
- [Ownership & Maintenance](#-ownership--maintenance)

---

## 🎯 Overview & Bounded Context

### What this service does
The **AI Service** is the intelligence core of the ATC Voice Simulator platform. It handles real-time voice speech-to-text (STT) transcription, FAA JO 7110.65 and ICAO Doc 4444 phraseology grounding retrieval via Qdrant, turn-by-turn state machine progression via LangGraph, text-to-speech (TTS) audio synthesis, and real-time audio reactivity streaming over WebSockets to the 3D visualizer frontend.

### Why this is an isolated microservice
- **Compute & Latency Profile**: Heavy AI inference (LLM prompt composition, vector similarity search, TTS audio synthesis) requires independent horizontal pod autoscaling (HPA) separate from traditional CRUD backend API servers.
- **State Checkpointing**: Manages stateful session checkpoints (`AgentState`) independently in Redis and MongoDB (`atc-ai`).
- **Sub-300ms SLA**: Uses a custom **7-Layer Redis Architecture** to short-circuit vector DB lookups and LLM generation for pre-templated ATC phraseology turns.

---

## 🚀 The 7-Layer Redis Architecture

To guarantee real-time response times required for air traffic control radio simulations, the AI Service implements a 7-Layer Redis caching engine:

> 📄 *Full technical architecture documentation available in [`docs/redis_7_layer_architecture.md`](../docs/redis_7_layer_architecture.md) & Business Model in [`docs/business_architecture.md`](../docs/business_architecture.md)*

| Layer | Key Pattern | TTL | Latency | Function |
|---|---|---|---|---|
| **L1** | `emb:tmpl:{templateId}` | 30 Days | `~2ms` | Caches pre-computed 1024-dim `mistral-embed` vectors for scenario step templates. |
| **L2** | `gnd:tmpl:{templateId}` | 7 Days | `~3ms` | Caches top-k retrieved phraseology rules from FAA JO 7110.65 / ICAO Doc 4444. |
| **L3** | `sess:cp:{sessionId}` | 24 Hours | `~4ms` | Stores active LangGraph `AgentState` checkpoint for sub-5ms Push-To-Talk resume. |
| **L4** | `sess:slots:{sessionId}` | 24 Hours | `~2ms` | Holds session-randomized variables (e.g., wind `270@14`, altimeter `29.92`, squawk `4521`). |
| **L5** | `auth:jwks:cache` | 24 Hours | `~1ms` | Caches Auth service RSA public keys for zero-latency local JWT verification. |
| **L6** | `rl:ip:{ipAddress}` | 15 Mins | `~1ms` | Sliding window rate-limiting counter protecting AI inference endpoints from abuse. |
| **L7** | `tts:{sha256(text)}` | 7 Days | `~5ms` | Caches SHA-256 hashed base64 MP3 audio for static controller lines (bypasses 650ms TTS synthesis). |

---

## 🤖 LangGraph 9-Node State Machine

Every simulation turn executes through a state machine built with `@langchain/langgraph`:

```
                       ┌──────────────┐
                       │   loadStep   │
                       └──────┬───────┘
                              │
                       ┌──────▼───────┐
                       │qdrantRetrieve│
                       └──────┬───────┘
                              │
                       ┌──────▼───────┐
                       │ composeLine  │
                       └──────┬───────┘
                              │
                       ┌──────▼───────┐
                       │   ttsSpeak   │
                       └──────┬───────┘
                              │
                       ┌──────▼───────┐
                       │awaitReadback │ <--- (Cadet Audio / Text Input)
                       └──────┬───────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
           [ Readback Valid ]   [ Out-of-Bounds ]
                    │                   │
         ┌──────────▼──────────┐ ┌──────▼────────┐
         │  validateReadback   │ │ generalAnswer │
         └──────────┬──────────┘ └──────┬────────┘
                    │                   │
          ┌─────────┴────────┐          │
          ▼                  ▼          │
     [ Passed ]         [ Failed ]      │
          │                  │          │
   ┌──────▼───────┐ ┌────────▼────────┐ │
   │ advanceStep  │ │ issueCorrection │ │
   └──────┬───────┘ └────────┬────────┘ │
          │                  └──────────┤
          │                             │
          └──────────┬──────────────────┘
                     ▼
              ┌──────────────┐
              │   debrief    │
              └──────────────┘
```

### Node Execution Descriptions
1. **`loadStep`**: Fetches active scenario step configuration and merges session slot variables (callsign, runway, wind).
2. **`qdrantRetrieve`**: Performs cosine vector search in Qdrant (1,912 FAA/ICAO chunks) using `mistral-embed`.
3. **`composeLine`**: Generates exact ATC controller phraseology using Mistral LLM grounded by retrieved rules.
4. **`ttsSpeak`**: Synthesizes MP3 audio using Rime TTS (or returns cached L7 Redis audio).
5. **`awaitReadback`**: Receives cadet audio transmission, converting speech to text via Deepgram STT.
6. **`validateReadback`**: Evaluates cadet readback against mandatory aviation elements (callsign, altitude, runway, squawk code).
7. **`generalAnswer`**: Provides clarifying guidance if the cadet asks a general phraseology question.
8. **`issueCorrection`**: Formulates corrective ATC instructions highlighting specific readback errors.
9. **`advanceStep`**: Increments scenario step index and updates session state checkpoint.
10. **`debrief`**: Computes final session score metrics and saves transcript logs upon scenario completion.

---

## 🏗️ Architecture & Directory Map

```
Ai-service/
├── server.js                 ← HTTP & WebSocket server listener entry point
├── app/
│   └── app.js                ← Express app factory, CORS, error handlers
├── agent/
│   ├── graph.js              ← LangGraph 9-node state graph definition
│   ├── state.js              ← AgentState schema definition
│   ├── nodes/                ← Individual LangGraph node handlers
│   │   ├── loadStep.js
│   │   ├── qdrantRetrieve.js
│   │   ├── composeLine.js
│   │   ├── ttsSpeak.js
│   │   ├── awaitReadback.js
│   │   ├── validateReadback.js
│   │   ├── generalAnswer.js
│   │   ├── issueCorrection.js
│   │   ├── advanceStep.js
│   │   └── debrief.js
│   └── utils/
│       ├── slotResolver.js   ← Dynamic variable slot interpolator
│       └── fuzzyMatch.js     ← Phonetic & phraseology readback comparator
├── config/
│   ├── db.js                 ← MongoDB connection
│   ├── qdrant.js             ← Qdrant client connection
│   ├── redis.js              ← Redis client connection
│   └── ws.js                 ← WebSocket server instance & event dispatcher
├── controllers/
│   └── aiSession.controller.js ← Express route controllers
├── middleware/
│   ├── identifyUser.middleware.js ← RS256 JWKS JWT verification
│   └── rate-limit.middleware.js ← Redis sliding-window rate limiter
├── models/
│   ├── ChatMessage.js        ← Session transcript message schema
│   ├── TokenUsageLog.js      ← LLM token consumption logger schema
│   ├── SessionCheckpoint.js  ← LangGraph state checkpoint schema
│   └── RetrievalLog.js       ← RAG vector retrieval audit log
├── routes/
│   └── aiSession.routes.js   ← API route definitions
├── scripts/
│   ├── ingestRagDocs.js      ← Vector ingestion script (1,912 FAA/ICAO PDF chunks)
│   ├── verifyRagCollection.js ← Qdrant collection status & query auditor
│   └── warmTemplateEmbeddings.js ← Redis L1 cache pre-warmer
└── services/
    ├── stt.service.js        ← Deepgram Speech-to-Text client
    ├── tts.service.js        ← Rime Text-to-Speech client
    ├── mistral.service.js    ← Mistral AI LLM & Embedding client
    └── qdrant.service.js     ← Qdrant vector retrieval service
```

---

## 🚧 Built Features & API Endpoints

### HTTP Route Specifications

| Method | Path | Auth Required | Description | Response / Status |
|---|---|---|---|---|
| `POST` | `/api/ai/sessions/:id/turn` | 🔑 Bearer JWT | Executes a single simulation turn with audio/text | `200 OK` `{ turnResult, audioBase64 }` |
| `GET` | `/api/ai/sessions/:id/transcript` | 🔑 Bearer JWT | Retrieves complete session transcript & audio links | `200 OK` `{ transcript: [] }` |
| `GET` | `/api/ai/sessions/:id/tokens` | 🔑 Bearer JWT | Returns token & latency breakdown per operation | `200 OK` `{ tokenLogs: [] }` |
| `GET` | `/api/ai/users/:userId/chat` | 🔑 Bearer JWT | Retrieves historical user chat messages | `200 OK` `{ messages: [] }` |
| `GET` | `/api/ai/users/:userId/responses` | 🔑 Bearer JWT | Retrieves cadet readback evaluations across sessions | `200 OK` `{ responses: [] }` |
| `GET` | `/api/ai/users/:userId/template-scores` | 🔑 Bearer JWT | Aggregates template-level score metrics | `200 OK` `{ templateScores: [] }` |
| `GET` | `/healthz` | ❌ Public | Liveness probe for Kubernetes | `200 OK` `{ status: "ok" }` |
| `GET` | `/readyz` | ❌ Public | Readiness probe for DB, Redis, and Qdrant connections | `200 OK` `{ status: "ready" }` |

---

## 📡 WebSocket & 3D MetallicOrb Streaming

The AI Service exposes a real-time WebSocket interface at `/ws/simulator` to stream audio amplitude reactivity data to the frontend React Three Fiber 3D MetallicOrb.

### WebSocket Event Protocol

```json
// Client Connection
WS /ws/simulator?token=<RS256_JWT_ACCESS_TOKEN>

// Server Broadcast — Audio Amplitude Chunk (for 3D Orb Pulsing)
{
  "event": "audio_amplitude",
  "sessionId": "65e8a1f...",
  "amplitude": 0.84,
  "frequencyPeak": 440
}

// Server Broadcast — State Machine Status Update
{
  "event": "state_change",
  "sessionId": "65e8a1f...",
  "currentNode": "validateReadback",
  "status": "evaluating"
}
```

---

## 📚 Qdrant RAG Vector Ingestion & Verification

The service features a standalone ingestion pipeline for grounding ATC turns in official FAA JO 7110.65 and ICAO Doc 4444 regulations.

```bash
# 1. Ingest PDF phraseology manuals into 1,912 vectors in Qdrant
npm run ingest-rag

# 2. Verify live Qdrant collection status & run test semantic search
npm run verify-rag
```

---

## ⚙️ Environment Variables

| Variable | Required | Default | Description | Example |
|---|---|---|---|---|
| `PORT` | ✅ | `3002` | HTTP & WebSocket server listener port | `3002` |
| `NODE_ENV` | ✅ | `development` | Runtime environment mode | `development` / `production` |
| `MONGO_URI` | ✅ | — | MongoDB connection string | `mongodb://localhost:27017/atc-ai` |
| `REDIS_URI` | ✅ | — | Redis connection string for 7-Layer Cache | `redis://localhost:6379` |
| `MISTRAL_API_KEY` | ✅ | — | API Key for Mistral AI (Embeddings & LLM) | `mistral_api_key_here` |
| `DEEPGRAM_API_KEY` | ✅ | — | API Key for Deepgram STT transcription | `deepgram_api_key_here` |
| `RIME_API_KEY` | ✅ | — | API Key for Rime TTS audio synthesis | `rime_api_key_here` |
| `QDRANT_URL` | ✅ | — | Qdrant Vector Database REST Endpoint | `http://localhost:6333` |
| `QDRANT_API_KEY` | ❌ | — | Optional API key for managed Qdrant Cloud | `qdrant_cloud_api_key` |
| `AUTH_JWKS_URI` | ✅ | `http://localhost:3000/.well-known/jwks.json` | Auth service public JWKS endpoint | `http://auth:3000/.well-known/jwks.json` |

---

## ⚙️ Local Development & Commands

```bash
# Navigate to AI Service directory
cd Ai-service

# 1. Install dependencies
npm install

# 2. Ingest 1,912 RAG phraseology chunks into Qdrant
npm run ingest-rag

# 3. Verify Qdrant collection vector status
npm run verify-rag

# 4. Start service in development mode (hot-reload)
npm run dev

# 5. Start in production mode
npm start
```

---

## 🛡️ Production Readiness & K8s

- **Kubernetes Deployment**: Defined in [`k8s/ai.deployment.yml`](file:///Users/home/Desktop/ATC/k8s/ai.deployment.yml).
- **Kubernetes Service**: Defined in [`k8s/ai.service.yml`](file:///Users/home/Desktop/ATC/k8s/ai.service.yml).
- **Health Probes**:
  - `GET /healthz`: Responds `200 OK` for Kubernetes liveness.
  - `GET /readyz`: Responds `200 OK` when MongoDB, Redis, and Qdrant clients are ready.
- **Skaffold Integration**: Configured in [`skaffold.yml`](file:///Users/home/Desktop/ATC/skaffold.yml) under artifact `ai-service`.

---

## 🤝 Ownership & Maintenance
- **Domain**: Voice AI Pipeline, RAG Vector Search, LangGraph Orchestration, Real-Time WebSockets.
- **Maintainers**: ATC AI & Speech Engineering Team.
