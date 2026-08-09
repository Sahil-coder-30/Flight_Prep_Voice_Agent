# 🧩 Frontend Service — ATC Voice Simulator

> React SPA for ATC radio phraseology training & voice simulation.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-Development-brightgreen)
![Runtime](https://img.shields.io/badge/runtime-React%2018%20%2B%20Vite-informational)

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
The Frontend Service is the student-facing Single Page Application (SPA). It provides interactive audio recording, phraseology transcript visualization, scenario browsing, and real-time audio playback.

### Why this is its own microservice
- **Bounded context:** Owns client-side UI rendering, DOM state, and browser Web Audio API interactions exclusively.
- **Independent scaling need:** Static asset distribution via CDN separate from backend application servers.
- **Data isolation strategy:** In-memory access token storage and client-side IndexedDB caching via Dexie.js.

### The "User" of this service
| Caller | Call type | Why it calls this service |
|---|---|---|
| End-user Student | Web Browser | Interactive simulation UI |

---

## 🚧 Built Features & Current State

### Current state
| Field | Value |
|---|---|
| **Status** | 🟢 Active Development |
| **Version** | v1.0.0 |
| **Last updated** | 2026-08-09 |
| **Owner(s)** | Frontend UI Team |
| **Known technical debt** | Web Audio API visualizer waveform components pending |

### Features built (working today)
- Feature-based 4-layer architecture scaffold (`auth`, `dashboard`, `simulator`, `scenarios`) — ✅ done
- Centralized Redux Store & Axios API client with automatic 401 token refresh queue — ✅ done
- Dual-token SCSS design system (`index.scss`, `tokens.scss`) with CSS custom properties — ✅ done
- Client-side offline caching & IndexedDB setup via Dexie.js — ✅ done

### How it was built
- **Language/runtime:** React 18, Vite 5, SCSS
- **Design patterns used:** 4-Layer Feature Architecture (Component -> Hook -> Service -> Redux Slice)
- **Key libraries:** Redux Toolkit, Axios, Dexie.js, Lucide React

---

## 🏗️ Architecture & Design Patterns

```
Frontend/src/
├── components/          ← Shared UI components
├── features/            ← Domain feature modules (auth, dashboard, simulator, scenarios)
│   └── [feature]/
│       ├── components/  ← Feature React UI & SCSS
│       ├── Hooks/       ← Business logic hooks
│       ├── service/     ← Axios API calls
│       └── slice/       ← Sync Redux slice
├── services/            ← Shared global services (apiClient.js)
├── styles/              ← SCSS design tokens & global CSS
├── App.jsx              ← Root App orchestrator
├── main.jsx             ← Entry point
└── store.js             ← Redux store
```

---

## ⚙️ Usage & Setup

### Environment variables

| Key | Required | Description | Example (fake) |
|---|---|---|---|
| `VITE_API_BASE_URL` | ❌ | Optional API base URL override | `http://localhost:5173` |

### Run locally
```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Build production bundle
npm run build
```

---

## 🔌 Communication & Contracts

### Synchronous (REST/gRPC)
| Direction | Protocol | Endpoint / method | Counterpart |
|---|---|---|---|
| Outbound | HTTP REST | `/api/auth/*` | Auth Service |
| Outbound | HTTP REST | `/api/backend/*` | Core Backend Service |

---

## 🛡️ Production Readiness

### Health & observability
- **Liveness:** `GET /healthz` — returns 200 OK (Nginx static asset probe)
- **Readiness:** `GET /ready` — returns 200 OK (Nginx static asset probe)
- **Monitoring:** Static asset serving via Vite / Nginx with console error boundary handlers

---

## 📝 Changelog & Migration State

| Version | Date | Change | Migration notes |
|---|---|---|---|
| `v1.0.0` | 2026-08-09 | Initial Frontend service scaffold | None |

---

## 🤝 Ownership
- **Maintainer(s):** ATC Platform Team
