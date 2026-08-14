# 🧩 Core Backend Service — ATC Voice Simulator Platform

> **Product Logic & Analytics Engine**: Core microservice managing aviation scenario templates, training session lifecycles, cadet evaluation scoring, rolling analytics, daily flight streaks, and weak-area phraseology diagnostics.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-Production--Ready-brightgreen.svg)
![Runtime](https://img.shields.io/badge/runtime-Node%2020%20ESM-informational.svg)
![Framework](https://img.shields.io/badge/framework-Express%205-lightgrey.svg)
![Database](https://img.shields.io/badge/database-MongoDB%208-green.svg)

---

## 📖 Table of Contents
- [Overview & Bounded Context](#-overview--bounded-context)
- [Architecture & Directory Map](#-architecture--directory-map)
- [Built Features & API Endpoints](#-built-features--api-endpoints)
- [Cadet Analytics & Scoring Engine](#-cadet-analytics--scoring-engine)
- [Pre-Built Airport Scenario Templates](#-pre-built-airport-scenario-templates)
- [Environment Variables](#-environment-variables)
- [Local Development & Seeding](#-local-development--seeding)
- [Communication & Counterparts](#-communication--counterparts)
- [Production Readiness & K8s](#-production-readiness--k8s)
- [Ownership & Maintenance](#-ownership--maintenance)

---

## 🎯 Overview & Bounded Context

### What this service does
The **Core Backend Service** is the central orchestrator of product workflows in the ATC Voice Simulator platform. It maintains the catalog of standardized airport scenarios, initializes dynamic session parameters, records turn-by-turn cadet performance, computes evaluation scores, tracks flight time streaks, and diagnoses phraseology categories needing remediation.

### Why this is an isolated microservice
- **Domain Separation**: Isolates CRUD state operations, user analytics, and scenario catalog configuration from compute-heavy real-time voice AI inference.
- **Data Boundary**: Exclusively owns the `atc-backend` MongoDB database storing scenarios, training sessions, user progress metrics, and performance analytics.
- **State Integrity**: Manages session state transitions (`created` → `active` → `completed` / `abandoned`) independently of AI state graph checkpoints.

---

## 🏗️ Architecture & Directory Map

```
Backend/
├── server.js                 ← HTTP listener entry point
├── app/
│   └── app.js                ← Express app factory, CORS, router mounts, error handlers
├── config/
│   ├── db.js                 ← MongoDB Mongoose connection client
│   └── redis.js              ← Redis cache connection
├── controllers/
│   ├── scenario.controller.js ← Airport scenario listing & detail handlers
│   ├── session.controller.js  ← Session CRUD & completion handlers
│   └── progress.controller.js ← Cadet stats, streaks, weak-area analytics handlers
├── middleware/
│   └── identifyUser.middleware.js ← RS256 JWKS JWT verification middleware
├── models/
│   ├── Scenario.js           ← Scenario template schema (airport, weather, step templates)
│   ├── Session.js            ← Training session state schema (cadet ID, airport, status)
│   ├── UserProgress.js       ← Cadet stats schema (total flight hours, streak, average score)
│   └── SessionAnalytics.js   ← Per-session performance & phraseology breakdown schema
├── routes/
│   ├── scenario.routes.js    ← `/api/backend/scenarios` router
│   ├── session.routes.js     ← `/api/backend/sessions` router
│   └── progress.routes.js    ← `/api/backend/users` router
└── scripts/
    └── seedScenarios.js      ← Seeds 5 real-world airport scenario templates
```

---

## 🚧 Built Features & API Endpoints

### HTTP Route Specifications

| Method | Path | Auth Required | Description | Response / Status |
|---|---|---|---|---|
| `GET` | `/api/backend/scenarios` | 🔑 Bearer JWT | Lists all active airport scenario training templates | `200 OK` `{ scenarios: [] }` |
| `GET` | `/api/backend/scenarios/:id` | 🔑 Bearer JWT | Fetches detailed scenario template & aircraft profiles | `200 OK` `{ scenario }` |
| `POST` | `/api/backend/sessions` | 🔑 Bearer JWT | Initializes a new training session with randomized variables | `200 OK` `{ session }` |
| `GET` | `/api/backend/sessions/my-sessions` | 🔑 Bearer JWT | Fetches training history for the authenticated cadet | `200 OK` `{ sessions: [] }` |
| `GET` | `/api/backend/sessions/:id` | 🔑 Bearer JWT | Returns current session status & conversation state | `200 OK` `{ session }` |
| `PUT` | `/api/backend/sessions/:id` | 🔑 Bearer JWT | Updates session parameters or step state | `200 OK` `{ session }` |
| `DELETE` | `/api/backend/sessions/:id` | 🔑 Bearer JWT | Cancels or soft-deletes a training session | `200 OK` `{ message }` |
| `POST` | `/api/backend/sessions/:id/complete` | 🔑 Bearer JWT | Finalizes session, calculates score, updates streaks | `200 OK` `{ analytics }` |
| `GET` | `/api/backend/users/stats` | 🔑 Bearer JWT | Returns cadet flight hours, completed sessions, daily streak | `200 OK` `{ stats }` |
| `GET` | `/api/backend/users/progress` | 🔑 Bearer JWT | Returns detailed progress timeline & score breakdown | `200 OK` `{ progress }` |
| `GET` | `/api/backend/users/weak-areas` | 🔑 Bearer JWT | Diagnoses phraseology categories requiring extra practice | `200 OK` `{ weakAreas: [] }` |
| `GET` | `/api/backend/users/template-scores` | 🔑 Bearer JWT | Returns aggregated scores across scenario templates | `200 OK` `{ templateScores: [] }` |
| `GET` | `/healthz` | ❌ Public | Liveness probe for Kubernetes | `200 OK` `{ status: "ok" }` |
| `GET` | `/readyz` | ❌ Public | Readiness probe confirming DB connection health | `200 OK` `{ status: "ready" }` |

---

## 📊 Cadet Analytics & Scoring Engine

When a session completes via `POST /api/backend/sessions/:id/complete`, the Core Backend executes the cadet analytics calculation pipeline:

```
[ Session Turn Evaluations ]
              │
              ▼
  ┌───────────────────────┐
  │  Calculate Metric     │ ---> Readback Accuracy Weight: 40%
  │      Breakdown        │ ---> Terminology Accuracy Weight: 40%
  └──────────┬────────────┘ ---> Response Latency Weight: 20%
             │
             ▼
  ┌───────────────────────┐
  │ Update UserProgress   │ ---> Flight Hours += Session Duration
  │  & Streak Tracking    │ ---> Daily Streak: Incremented if consecutive day
  └──────────┬────────────┘
             │
             ▼
  ┌───────────────────────┐
  │ Weak-Area Category    │ ---> Tag categories with accuracy < 75%
  │    Identification     │      (e.g., Altitude Readbacks, Squawk Codes)
  └───────────────────────┘
```

---

## 🛫 Pre-Built Airport Scenario Templates

The service includes five standardized aviation scenario templates populated via `npm run seed`:

| Code | Airport Name | Environment | Primary Focus |
|---|---|---|---|
| **KBOS** | Boston Logan International | Class B Tower & Ground | Complex taxiway routing & hold short instructions |
| **KJFK** | John F. Kennedy International | Class B Approach | High-density arrival vectoring & ILS readbacks |
| **KLAX** | Los Angeles International | Class B Tower | Parallel runway operations & line up and wait procedures |
| **KORD** | Chicago O'Hare International | Class B Ground | Multi-runway crossing & congested ground movement |
| **KSFO** | San Francisco International | Class B Tower | Visual separation & missed approach phraseology |

---

## ⚙️ Environment Variables

| Variable | Required | Default | Description | Example |
|---|---|---|---|---|
| `PORT` | ✅ | `3001` | HTTP server listener port | `3001` |
| `NODE_ENV` | ✅ | `development` | Runtime environment mode | `development` / `production` |
| `MONGO_URI` | ✅ | — | MongoDB connection string | `mongodb://localhost:27017/atc-backend` |
| `REDIS_URI` | ✅ | — | Redis connection string for caching | `redis://localhost:6379` |
| `AUTH_JWKS_URI` | ✅ | `http://localhost:3000/.well-known/jwks.json` | Auth service public JWKS endpoint | `http://auth:3000/.well-known/jwks.json` |

---

## ⚙️ Local Development & Seeding

```bash
# Navigate to Core Backend directory
cd Backend

# 1. Install dependencies
npm install

# 2. Seed the 5 pre-built airport scenario templates into MongoDB
npm run seed

# 3. Start in development mode with nodemon hot-reloading
npm run dev

# 4. Start in production mode
npm start
```

---

## 🔌 Communication & Counterparts

| Counterpart | Protocol | Path Consumed | Purpose |
|---|---|---|---|
| **Frontend SPA** | HTTP REST | `/api/backend/*` | Scenario catalog browsing, session initialization, cadet progress metrics |
| **Auth Service** | HTTP REST | `/.well-known/jwks.json` | Fetches RSA public keys for local RS256 JWT access token verification |
| **AI Service** | Session State | Shared MongoDB | Session checkpoint & transcript cross-referencing |

---

## 🛡️ Production Readiness & K8s

- **Kubernetes Deployment**: Configured in [`k8s/backend.deployment.yml`](file:///Users/home/Desktop/ATC/k8s/backend.deployment.yml).
- **Kubernetes Service**: Configured in [`k8s/backend.service.yml`](file:///Users/home/Desktop/ATC/k8s/backend.service.yml).
- **Health Probes**:
  - `GET /healthz`: Responds `200 OK` for Kubernetes liveness probe.
  - `GET /readyz`: Responds `200 OK` when MongoDB connection state is active.
- **Skaffold Integration**: Monitored in [`skaffold.yml`](file:///Users/home/Desktop/ATC/skaffold.yml) under artifact `backend`.

---

## 🤝 Ownership & Maintenance
- **Domain**: Business Logic, Scenario Management, Session Lifecycles, Progress Analytics.
- **Maintainers**: ATC Core Backend Platform Team.
