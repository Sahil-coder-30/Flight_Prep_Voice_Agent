# 🛠️ Backend Development & Architectural Guide — ATC Voice Simulator

> **Welcome to the ATC Voice Simulator Backend Team!**  
> This guide is your definitive handbook for building, extending, and maintaining microservices in this codebase. As developers on this project, your goal is to write clean, secure, and predictable code. Follow the rules and patterns documented here so that all services remain consistent, scalable, and easy to maintain.

---

## 📋 Table of Contents
1. [Tech Stack & Architecture Overview](#1-tech-stack--architecture-overview)
2. [Monorepo Structure & Service Boundaries](#2-monorepo-structure--service-boundaries)
3. [The `server.js` vs `app/app.js` Pattern](#3-the-serverjs-vs-appappjs-pattern)
4. [Standard Microservice Directory Layout](#4-standard-microservice-directory-layout)
5. [Authentication & Security Architecture](#5-authentication--security-architecture)
6. [API Design Standards & HTTP Contracts](#6-api-design-standards--http-contracts)
7. [AI Engine Architecture (LangGraph & RAG)](#7-ai-engine-architecture-langgraph--rag)
8. [Docker, Kubernetes & Skaffold Integration](#8-docker-kubernetes--skaffold-integration)
9. [Step-by-Step: Adding a New Endpoint or Service](#9-step-by-step-adding-a-new-endpoint-or-service)
10. [Quality Control & Verification Checklist](#10-quality-control--verification-checklist)

---

## 1. Tech Stack & Architecture Overview

Our backend is built as a **Distributed Microservice System** using Node.js 20 (ES Modules).

```
                      +-----------------------------+
                      |   NGINX Ingress Controller  |
                      +--------------+--------------+
                                     |
         +---------------------------+---------------------------+
         |                           |                           |
         v                           v                           v
+-----------------+         +-----------------+         +-----------------+
|   Auth Service  |         |   Core Backend  |         |    AI Service   |
|   (Port 3000)   |         |   (Port 5000)   |         |   (Port 7000)   |
+--------+--------+         +--------+--------+         +--------+--------+
         |                           |                           |
         v                           v                           v
   MongoDB (atc-auth)       MongoDB (atc-backend)      MongoDB (atc-ai-service)
                                                                 |
                                                         +-------+-------+
                                                         |  Redis & Qdrant|
                                                         +---------------+
```

### Core Technologies
- **Runtime:** Node.js 20 (ES Modules: `"type": "module"` in `package.json`).
- **Web Framework:** Express 5.
- **Database & Modeling:** MongoDB via Mongoose.
- **Authentication:** Passport.js (Google OAuth2), RSA-4096 asymmetric JWT signing (RS256), HttpOnly Refresh Token Cookies.
- **AI Orchestration & RAG:** LangGraph JS (`@langchain/langgraph`), Qdrant Vector Search (`@qdrant/js-client-rest`), Mistral LLM API (`@mistralai/mistralai`).
- **Speech Processing:** Rime STT API, Rime TTS API.
- **Containerization & Deployment:** Docker (`node:20-alpine`), Kubernetes (`k8s/*.yml`), Skaffold (`skaffold dev`).

---

## 2. Monorepo Structure & Service Boundaries

The backend consists of three distinct microservices. Each service is **fully self-contained** with its own `package.json`, `.env`, `dockerfile`, and database.

| Service | Directory | Port | Database | Primary Responsibility |
|---|---|---|---|---|
| **Auth** | [`/Auth`](file:///Users/home/Desktop/ATC/Auth) | `3000` | `atc-auth` | User identity, Google OAuth2 login, RSA key management, RS256 token signing, HttpOnly refresh cookie rotation, JWKS endpoint (`/.well-known/jwks.json`). |
| **Backend** | [`/Backend`](file:///Users/home/Desktop/ATC/Backend) | `5000` | `atc-backend` | Product business logic: scenario catalog, active simulation session state, student progress tracking, session completion evaluation. |
| **AI Service** | [`/Ai-service`](file:///Users/home/Desktop/ATC/Ai-service) | `7000` | `atc-ai-service` | Real-time speech processing, LangGraph turn state graph execution, Qdrant vector phraseology RAG grounding, Mistral LLM inference. |

### 🚨 Strict Bounded Context Rules
1. **Database Isolation:** Microservices **NEVER** query another service's MongoDB database directly.
2. **Synchronous Inter-Service Communication:** Services communicate with each other exclusively via HTTP REST API calls using Bearer access tokens.
3. **Identity Verification:** Downstream services (`Backend`, `Ai-service`) verify access tokens locally using JWKS without sending HTTP verification requests to `Auth` per request.

---

## 3. The `server.js` vs `app/app.js` Pattern

Every microservice strictly separates process bootstrap from Express application initialization.

```
<ServiceFolder>/
├── server.js      ← Process entry point ONLY (app.listen, DB connection, dotenv)
└── app/
    └── app.js     ← Express app factory (middleware, routes, health probes, error handlers)
```

### Rule 1: `server.js` Responsibility
`server.js` is the entry point listed in `package.json` (`"main": "server.js"`). It must ONLY handle loading environment variables, connecting to MongoDB, and launching `app.listen()`.

```javascript
// server.js Example (Mandatory Pattern)
import dotenv from 'dotenv';
import app from './app/app.js';
import { connectToDb } from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    await connectToDb();
    console.log(`Server running on port ${PORT}`);
});
```

❌ **NEVER put route definitions, middleware, or business logic inside `server.js`.**

---

### Rule 2: `app/app.js` Responsibility
`app/app.js` creates and exports the Express application instance. It mounts middleware, attaches route handlers, registers `/healthz` and `/readyz` probes, and configures 404 and global error handlers.

```javascript
// app/app.js Example (Mandatory Pattern)
import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import sessionRouter from '../routes/session.routes.js';

const app = express();

// ── Core Middleware ────────────────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/backend/sessions', sessionRouter);

// ── Health Probes ─────────────────────────────────────────────────────────────
app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'backend', message: 'Backend is healthy' });
});

app.get('/readyz', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'backend', message: 'Backend is ready' });
});

// ── 404 & Global Error Handling ───────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ status: 'error', message: 'Route not found' });
});

app.use((err, _req, res, _next) => {
    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

export default app;
```

❌ **NEVER call `app.listen()` inside `app/app.js`.**

---

## 4. Standard Microservice Directory Layout

Every backend microservice follows this exact directory structure:

```
<ServiceName>/
├── server.js               ← Entry point (HTTP listener & DB connect)
├── app/
│   └── app.js              ← Express app factory & middleware pipeline
├── config/                 ← DB connection, Passport, Redis & external SDK configs
│   ├── db.js
│   └── redis.js
├── controllers/            ← HTTP request handlers (req, res, next)
│   └── session.controller.js
├── middleware/             ← Express middleware (identifyUser, validators)
│   └── identifyUser.middleware.js
├── models/                 ← Mongoose schemas & data models
│   └── session.model.js
├── routes/                 ← Express route definitions
│   └── session.routes.js
├── services/               ← Business logic & HTTP API adapters to other services
│   └── aiService.adapter.js
├── dockerfile              ← Docker build instructions (always lowercase)
├── .env                    ← Local environment configuration
├── .gitignore              ← Git exclusions
├── .dockerignore           ← Docker build exclusions
└── package.json            ← Dependencies & npm scripts
```

---

## 5. Authentication & Security Architecture

Our system uses **RS256 Access Tokens** paired with **Opaque Rotating Refresh Token Families**.

```
Client (SPA)                 Auth Service                 Downstream Service (Backend/AI)
    |                             |                                     |
    |---- 1. OAuth / Google ----->|                                     |
    |<--- 2. Access JWT (15m) ----|                                     |
    |     & HttpOnly Cookie (30d)-|                                     |
    |                             |                                     |
    |---- 3. Request API (Bearer Access JWT) -------------------------->|
    |                             |                                     | 4. Verify signature locally
    |                             |<--- 5. GET /.well-known/jwks.json --|    using cached JWKS public key
    |                             |        (Only on cold boot / key miss)|
```

### 1. Access Tokens (RS256 JWT)
- **Lifetime:** 15 minutes.
- **Storage:** Frontend JavaScript module memory ONLY. Never in `localStorage` or cookies.
- **Signing Key:** Signed by `Auth` service using its private key (`Auth/keys/private.pem`).
- **Verification:** Verified locally by `Backend` and `Ai-service` using public RSA keys fetched from `Auth`'s JWKS endpoint (`/.well-known/jwks.json`).

### 2. JWKS Middleware Pattern (`identifyUser.middleware.js`)
Downstream services verify tokens statelessly using the `identifyUser` middleware:
- Maintains an in-memory JWKS cache with a 24-hour TTL (`CACHE_TTL_MS`).
- Resolves the public key using the token's `kid` (Key ID) header claim.
- If a unknown `kid` is encountered, it force-refetches the JWKS array from `AUTH_JWKS_URI` once to support zero-downtime key rotation.
- Attaches `req.user = { id, email, name, role }` and `req.authToken` to the request object.

### 3. Refresh Tokens (Opaque Hex String)
- **Lifetime:** 30 days.
- **Storage:** `HttpOnly`, `SameSite=Lax` cookie scoped strictly to `path: '/api/auth/refresh'`.
- **Database Storage:** Only the **SHA-256 hash** is saved in `atc-auth` MongoDB alongside a `familyId`.
- **Replay Protection:** If an old or rotated refresh token is submitted, the system revokes the entire `familyId`, logging out all sessions associated with that token family.

---

## 6. API Design Standards & HTTP Contracts

### URL Naming Conventions
- Base prefix: `/api/<service>/<resource>`
- Use lower-case, plural nouns for resource routes:
  - `GET /api/backend/scenarios` — List scenarios
  - `GET /api/backend/scenarios/:id` — Get scenario details
  - `POST /api/backend/sessions` — Create a new session
  - `GET /api/backend/sessions/:id` — Get session state
  - `POST /api/backend/sessions/:id/complete` — Complete session
  - `POST /api/ai/sessions/:id/turn` — Process conversation turn

### JSON Response Format
All API responses must follow a standard JSON envelope:

#### Success Response (HTTP 200 / 201)
```json
{
  "status": "success",
  "data": {
    "sessionId": "64f1a2b3c4d5e6f7a8b9c0d1",
    "scenarioId": "twr-01",
    "state": "ACTIVE"
  }
}
```

#### Error Response (HTTP 4xx / 5xx)
```json
{
  "status": "error",
  "message": "Unauthorized: Access token expired. Please refresh.",
  "expired": true
}
```

### Standard HTTP Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Input validation failure or missing required body parameters.
- `401 Unauthorized`: Missing, invalid, or expired JWT access token.
- `403 Forbidden`: Authenticated user lacks permission for the requested action.
- `404 Not Found`: Requested endpoint or database entity does not exist.
- `500 Internal Server Error`: Unhandled server exception.

---

## 7. AI Engine Architecture (LangGraph & RAG)

The `Ai-service` handles conversational AI turns:

1. **State Machine (`services/langgraph.service.js`):** Uses LangGraph JS to manage agent state, aircraft position parameters (altitude, heading, speed), and controller radio turn interrupts.
2. **Vector RAG Grounding (`services/qdrant.service.js`):** Queries Qdrant vector database (`atc_phraseology` collection) to inject standard ICAO/FAA phraseology rules into prompt context.
3. **LLM Inference (`services/mistral.service.js`):** Evaluates prompt context using Mistral AI to produce realistic controller transmissions.
4. **Speech Conversion (`services/stt.service.js` & `services/tts.service.js`):** Rime STT converts student radio transmissions into text; Rime TTS generates synthesized voice responses with radio static effects.

---

## 8. Docker, Kubernetes & Skaffold Integration

### Dockerfile Rule
Every service directory must contain a **lowercase** `dockerfile` with this exact template:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]
```

### Kubernetes Manifests (`k8s/`)
All Kubernetes manifests live flat inside the `/k8s` root folder:
- `<service>.deployment.yml` — Deployment spec with liveness and readiness probes pointing to `/healthz` and `/readyz`.
- `<service>.service.yml` — ClusterIP service exposing port 80.
- `ingress.yml` — NGINX Ingress rules routing `/api/auth`, `/api/backend`, and `/api/ai`.
- `secrets.yml` — Encoded Kubernetes secrets (gitignored; use `secrets.yml.example` as a template).

### Skaffold Live Sync (`skaffold.yml`)
Run `skaffold dev` from the repository root. Skaffold will build Docker images and automatically hot-reload code changes without rebuilding container images whenever files inside `app/`, `controllers/`, `routes/`, or `services/` are edited.

---

## 9. Step-by-Step: Adding a New Endpoint or Service

### How to Add a New Endpoint to an Existing Service
1. **Create Mongoose Model (if new entity):** Define schema in `models/<resource>.model.js`.
2. **Write Controller Handler:** Create async request handler in `controllers/<resource>.controller.js`. Wrap logic in try/catch and pass errors to `next(err)`.
3. **Define Express Route:** Add route definition in `routes/<resource>.routes.js`. Attach `identifyUser` middleware for protected routes.
4. **Mount Route in `app/app.js`:** Import router and call `app.use('/api/<service>/<resource>', router)`.
5. **Update Service README:** Add endpoint details to the service's `README.md`.

---

## 10. Quality Control & Verification Checklist

Before submitting a Pull Request or pushing code:

- [ ] `server.js` contains **ONLY** `dotenv.config()`, DB connect, and `app.listen()`.
- [ ] `app/app.js` contains Express configuration, middleware, routes, `/healthz`, `/readyz`, and error handlers.
- [ ] Protected endpoints use `identifyUser` middleware.
- [ ] Sensitive keys are loaded from `process.env` and **NEVER** hardcoded.
- [ ] `/healthz` and `/readyz` return HTTP 200 OK.
- [ ] Run the README validator:
  ```bash
  node .agents/microservice-readme-architect/scripts/validate_readme.js Auth/README.md Backend/README.md Ai-service/README.md
  ```
- [ ] Run `skaffold diagnose` to ensure Kubernetes manifests parse cleanly.

---

**Happy Coding! If you have any questions, reach out to the Platform & Backend Leads.**
