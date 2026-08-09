# 🎙️ ATC Voice Simulator — Platform Monorepo

> Enterprise-grade microservice architecture for real-time Air Traffic Control (ATC) radio phraseology training & AI voice simulation.

![Microservices](https://img.shields.io/badge/architecture-Microservices-blue)
![Runtime](https://img.shields.io/badge/runtime-Node%2020%20%7C%20React%2018-informational)
![Orchestration](https://img.shields.io/badge/orchestration-Kubernetes%20%2B%20Skaffold-brightgreen)
![Security](https://img.shields.io/badge/security-RS256%20JWKS%20%2B%20OAuth2-success)
![AI Engine](https://img.shields.io/badge/AI-LangGraph%20%2B%20Qdrant%20RAG-purple)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📖 Table of Contents
- [Overview & Vision](#-overview--vision)
- [System Architecture & Data Flow](#-system-architecture--data-flow)
- [Microservices Inventory & Status](#-microservices-inventory--status)
- [Security & Authentication Architecture](#-security--authentication-architecture)
- [AI Voice Agent Pipeline](#-ai-voice-agent-pipeline)
- [Monorepo Layout](#-monorepo-layout)
- [Local Development & Quickstart](#-local-development--quickstart)
- [Global API Reference](#-global-api-reference)
- [Developer Guidelines & Architecture Standards](#-developer-guidelines--architecture-standards)
- [Verification & Documentation Quality](#-verification--documentation-quality)

---

## 🎯 Overview & Vision

The **ATC Voice Simulator** is an interactive, voice-driven AI training platform designed for aviation students, pilot trainees, and Air Traffic Control cadets. The platform simulates real-world radio interactions between pilot aircraft and ATC controllers (Tower, Ground, Approach, Departure, and En Route Control).

### Key Features
- 🎙️ **Real-Time Voice Simulation:** High-fidelity speech-to-text (STT) and text-to-speech (TTS) synthesis reproducing aviation VHF radio noise and controller cadence.
- 🧠 **LangGraph State Machine Agent:** Stateful conversational engine enforcing ICAO/FAA aviation phraseology rules, context persistence, and turn interrupt handling.
- 🔍 **Retrieval-Augmented Generation (RAG):** Qdrant vector database grounding AI responses in official pilot/controller phraseology manuals and airfield procedures.
- 🛡️ **Zero-Trust Security Infrastructure:** Asymmetric RS256 JWT access tokens validated locally via JWKS key caching and opaque rotating refresh token families.
- ☸️ **Kubernetes-Native Deployment:** Containerized microservice deployment orchestrated via Kubernetes manifests, NGINX Ingress Controller, and Skaffold hot-reloading.

---

## 🏗️ System Architecture & Data Flow

```mermaid
flowchart TB
    subgraph Client ["Client Layer"]
        SPA["React 18 SPA\n(Port 5173)\n[Vite + Redux Toolkit + SCSS]"]
    end

    subgraph Gateway ["Ingress Layer"]
        Ingress["NGINX Ingress Controller\n(Rules: /api/auth, /api/ai, /api/backend)"]
    end

    subgraph Microservices ["Microservices Layer"]
        AuthSvc["Auth Service\n(Port 3000)\n[Google OAuth2, RS256 Signing, JWKS]"]
        BackendSvc["Core Backend Service\n(Port 5000)\n[Scenarios, Sessions, Progress Scoring]"]
        AISvc["AI Service\n(Port 7000)\n[LangGraph, STT/TTS, Qdrant RAG]"]
    end

    subgraph DataStores ["Data & AI Infrastructure Layer"]
        AuthDB[("MongoDB\natc-auth")]
        BackendDB[("MongoDB\natc-backend")]
        AIDB[("MongoDB\natc-ai-service")]
        RedisStore[("Redis\nSession & Cache")]
        QdrantDB[("Qdrant Vector DB\nPhraseology Embeddings")]
        LLM["Mistral AI / LLM Engine"]
    end

    SPA -->|"HTTP / REST Requests"| Ingress
    Ingress -->|"/api/auth/*"| AuthSvc
    Ingress -->|"/api/backend/*"| BackendSvc
    Ingress -->|"/api/ai/*"| AISvc

    AuthSvc --> AuthDB
    BackendSvc --> BackendDB
    AISvc --> AIDB
    AISvc --> RedisStore
    AISvc --> QdrantDB
    AISvc --> LLM

    BackendSvc -->|"HTTP internal turn/transcript calls"| AISvc
    BackendSvc & AISvc -->|"Fetch & cache public RSA keys\nGET /.well-known/jwks.json"| AuthSvc
```

---

## 🧩 Microservices Inventory & Status

Each microservice is self-contained with its own `package.json`, `.env`, `dockerfile`, database, and independent scaling profile.

| Service | Directory | Port | Primary Responsibilities | Health Endpoints | Current Status |
|---|---|---|---|---|---|
| 🔑 **Auth Service** | [`/Auth`](file:///Users/home/Desktop/ATC/Auth/README.md) | `3000` | Google OAuth2, RS256 JWT issuance, opaque refresh token family rotation, JWKS publication | `/healthz`, `/readyz` | 🟢 Active Development (v1.0.0) |
| ⚙️ **Core Backend Service** | [`/Backend`](file:///Users/home/Desktop/ATC/Backend/README.md) | `5000` | Training scenarios, session lifecycle, student evaluation scoring, progress analytics | `/healthz`, `/readyz` | 🟢 Active Development (v1.0.0) |
| 🧠 **AI Service** | [`/Ai-service`](file:///Users/home/Desktop/ATC/Ai-service/README.md) | `7000` | LangGraph turn state machine, Qdrant RAG retrieval, Mistral LLM inference, STT & TTS pipelines | `/healthz`, `/readyz` | 🟢 Active Development (v1.0.0) |
| 🎨 **Frontend Service** | [`/Frontend`](file:///Users/home/Desktop/ATC/Frontend/README.md) | `5173` | React 18 SPA, Web Audio API recording/playback, Redux Toolkit, silent 401 token refresh queue | `/healthz`, `/ready` | 🟢 Active Development (v1.0.0) |

> 📁 For service-specific setup, environment variables, internal code architecture, and API details, view each service's dedicated `README.md` linked above.

---

## 🛡️ Security & Authentication Architecture

The platform uses an enterprise **RS256 Access Token + Rotating Refresh Token** security model.

```
       +------------------+                    +------------------+
       |   Auth Service   |                    | Microservices    |
       |  (RSA-4096 Key)  |                    | (Backend, AI)    |
       +--------+---------+                    +--------+---------+
                |                                       |
1. Sign Access  |                                       | 2. Fetch & Cache
   Token (RS256)|                                       |    JWKS Public Keys
   (15m TTL)    |                                       |    (24h TTL)
                v                                       v
       +------------------+   Authorization: Bearer   +------------------+
       |   Frontend SPA   |-------------------------->| Local JWKS Token |
       | (Module Memory)  |                           | Signature Match  |
       +------------------+                           +------------------+
```

### Core Security Principles
1. **Stateless Local Verification:** Downstream microservices (`Backend`, `Ai-service`) verify access tokens locally using JWKS without querying the database or sending network requests to the Auth service on every API call.
2. **XSS Mitigation:** Access tokens are stored strictly in JavaScript module closure memory (`_accessToken`), never in `localStorage` or `sessionStorage`.
3. **CSRF & Theft Defense:** Opaque 128-hex character refresh tokens are stored in `HttpOnly`, `SameSite=Lax` cookies scoped strictly to `path: '/api/auth/refresh'`.
4. **Automatic Replay Revocation:** Attempting to reuse an old refresh token immediately invalidates its entire `familyId`, logging out all compromised sessions.
5. **Zero-Downtime Key Rotation:** Downstream services cache the full JWKS key array (`kid` resolution) and force-refetch from the Auth service on unknown key IDs.

---

## 🎙️ AI Voice Agent Pipeline

The AI Voice Agent processes audio and text inputs through an integrated multi-tier pipeline:

1. **Speech-to-Text (STT):** Audio streams captured via Web Audio API are transcribed using Rime STT model adapters.
2. **RAG Phraseology Retrieval:** Transcribed text triggers a semantic search against the Qdrant vector database (`atc_phraseology` collection) to retrieve relevant ICAO standard phraseology rules.
3. **LangGraph State Graph:** Evaluates current session state, aircraft altitude/heading/speed parameters, and controller radio state.
4. **Mistral LLM Inference:** Generates grammatically correct, realistic ATC transmission responses.
5. **Text-to-Speech (TTS):** Transforms text responses into audio output via Rime TTS adapters with radio noise filters.

---

## 📁 Monorepo Layout

```
ATC/
├── Auth/                               ← Auth & Identity Microservice (Port 3000)
│   ├── server.js                       ← HTTP listener entry point
│   ├── app/app.js                      ← Express app factory
│   ├── keys/                           ← RSA key PEM files
│   └── README.md                       ← Auth service documentation
├── Backend/                            ← Core Scenario & Session Service (Port 5000)
│   ├── server.js                       ← HTTP listener entry point
│   ├── app/app.js                      ← Express app factory
│   └── README.md                       ← Core Backend documentation
├── Ai-service/                         ← AI Inference & Voice Agent Service (Port 7000)
│   ├── server.js                       ← HTTP listener entry point
│   ├── app/app.js                      ← Express app factory
│   └── README.md                       ← AI Service documentation
├── Frontend/                           ← React 18 Single Page Application (Port 5173)
│   ├── src/                            ← Feature-based 4-layer architecture
│   └── README.md                       ← Frontend documentation
├── k8s/                                ← Kubernetes Deployment Manifests
│   ├── auth.deployment.yml             ← Auth service deployment
│   ├── ai.deployment.yml               ← AI service deployment
│   ├── backend.deployment.yml          ← Core Backend deployment
│   ├── ingress.yml                     ← NGINX ingress routing
│   └── secrets.yml                     ← Base64 encoded Kubernetes secrets
├── helpers/                            ← System Architecture & Guide Documents
│   ├── auth_security_architecture_plan.md
│   ├── backend-service-structure.md
│   ├── frontend_architecture_skill.md
│   └── k8s-skaffold-yaml-guide.md
├── .agents/                            ← Agent Skills & Validation Tools
│   └── microservice-readme-architect/  ← README quality validator script & templates
├── skaffold.yml                        ← Skaffold live reload configuration
├── .gitignore                          ← Monorepo git exclusion rules
└── README.md                           ← Main repository documentation (this file)
```

---

## ⚙️ Local Development & Quickstart

### Prerequisites
- **Node.js:** v20.x or higher
- **Docker Desktop:** Running local container engine
- **Kubernetes / Minikube:** Local cluster enabled
- **Skaffold CLI:** Installed (`brew install skaffold` or equivalent)

### 1. Rapid Development with Skaffold (Recommended)
Skaffold automatically builds container images, applies Kubernetes manifests, and sets up file-sync hot-reloading across all microservices:

```bash
# Clone the repository
git clone https://github.com/your-org/atc-voice-simulator.git
cd atc-voice-simulator

# Generate RSA public/private keys for Auth Service
cd Auth && npm run generate-keys && cd ..

# Launch live Kubernetes development environment
skaffold dev
```

### 2. Manual Development Mode (Per Service)
If running services individually without Kubernetes:

```bash
# In Terminal 1 — Auth Service (Port 3000)
cd Auth && npm install && npm run dev

# In Terminal 2 — Core Backend Service (Port 5000)
cd Backend && npm install && npm run dev

# In Terminal 3 — AI Service (Port 7000)
cd Ai-service && npm install && npm run dev

# In Terminal 4 — Frontend SPA (Port 5173)
cd Frontend && npm install && npm run dev
```

---

## 🔌 Global API Reference

### Auth Service (`/api/auth`)
- `GET /.well-known/jwks.json` — Serves RSA public keys for JWKS token validation
- `GET /api/auth/google` — Initiates Google OAuth2 authentication flow
- `GET /api/auth/google/callback` — OAuth callback endpoint issuing access token & refresh cookie
- `POST /api/auth/refresh` — Rotates refresh token and returns fresh RS256 access token
- `GET /api/auth/getMe` — Returns authenticated user profile (`id`, `email`, `name`, `role`)
- `POST /api/auth/logout` — Revokes refresh token family and clears session cookies

### Core Backend Service (`/api/backend`)
- `GET /api/backend/scenarios` — Returns active ATC training scenarios
- `GET /api/backend/scenarios/:id` — Fetches scenario details & initial aircraft parameters
- `POST /api/backend/sessions` — Initializes a new ATC simulation session
- `GET /api/backend/sessions/:id` — Fetches current session status & progress
- `POST /api/backend/sessions/:id/complete` — Concludes training session & returns score report

### AI Service (`/api/ai`)
- `POST /api/ai/sessions/:id/turn` — Advances LangGraph agent turn with student audio/text input
- `GET /api/ai/sessions/:id/transcript` — Retrieves full conversation transcripts & audio clips

---

## 📐 Developer Guidelines & Architecture Standards

To maintain structural consistency across all microservices, follow these rules:

1. **Service Root Separation:** `server.js` handles HTTP server startup and database connections. Express application initialization, middleware routing, and health probes belong strictly in `app/app.js`.
2. **JWKS Token Validation:** Downstream microservices must use the shared `identifyUser` middleware pattern to verify RS256 JWT tokens via JWKS caching.
3. **No Direct Inter-Database Access:** Each microservice strictly owns its dedicated MongoDB instance (`atc-auth`, `atc-backend`, `atc-ai-service`). Cross-service data is exchanged via authenticated HTTP API contracts.
4. **Environment Secrets:** Secrets must never be committed to source control. Refer to `k8s/secrets.yml.example` and service `.env` templates.

---

## 🧪 Verification & Documentation Quality

This monorepo includes an automated documentation validator tool located in `.agents/microservice-readme-architect/scripts/validate_readme.js`.

To verify documentation completeness across all microservices:

```bash
node .agents/microservice-readme-architect/scripts/validate_readme.js Auth/README.md Backend/README.md Ai-service/README.md Frontend/README.md
```

All microservice `README.md` files are validated to ensure:
- 100% section compliance (Bounded Context, Features, Architecture, Usage, Security, Health)
- Zero committed secret values or leftover `[Insert ...]` placeholders
- Valid SemVer versions and documented `/healthz` / `/readyz` probes

---

## 🤝 Maintainers & Support
- **Architecture & Security:** ATC Platform Team
- **AI & Speech Ingestion:** AI Engineering Team
- **Frontend & UI/UX:** Web Development Team
