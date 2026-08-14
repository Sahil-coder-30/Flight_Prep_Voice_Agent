# 🧩 Frontend Service — ATC Voice Simulator Platform

> **Cadet-Facing Single Page Application (SPA)**: Production-grade React 18 + Vite SPA featuring a **4-Layer Feature Architecture**, **Redux Toolkit State Management**, **Axios 401 Token Refresh Queue**, **Dexie.js IndexedDB Caching**, **SCSS Design System**, and a real-time **WebGL 3D MetallicOrb Audio Visualizer**.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-Production--Ready-brightgreen.svg)
![Runtime](https://img.shields.io/badge/runtime-React%2018%20%2B%20Vite%205-informational.svg)
![3D Engine](https://img.shields.io/badge/3D%20Engine-React%20Three%20Fiber-purple.svg)
![State](https://img.shields.io/badge/state-Redux%20Toolkit-764ABC.svg)
![Styling](https://img.shields.io/badge/styling-SCSS%20%2B%20Tokens-pink.svg)

---

## 📖 Table of Contents
- [Overview & Bounded Context](#-overview--bounded-context)
- [4-Layer Feature Architecture](#-4-layer-feature-architecture)
- [Architecture & Directory Map](#-architecture--directory-map)
- [Redux Store & Network Interceptors](#-redux-store--network-interceptors)
- [Real-Time 3D MetallicOrb Visualizer](#-real-time-3d-metallicorb-visualizer)
- [SCSS Design System & Design Tokens](#-scss-design-system--design-tokens)
- [Client-Side Offline Caching (Dexie.js)](#-client-side-offline-caching-dexiejs)
- [Environment Variables](#-environment-variables)
- [Local Development & Build Scripts](#-local-development--build-scripts)
- [Production Deployment & Nginx](#-production-deployment--nginx)
- [Ownership & Maintenance](#-ownership--maintenance)

---

## 🎯 Overview & Bounded Context

### What this service does
The **Frontend Service** provides the interactive web user interface for cadets and instructors on the ATC Voice Simulator platform. It handles push-to-talk (PTT) Web Audio recording, real-time phraseology transcript visualization, 3D WebGL soundwave rendering, interactive airport scenario selection, cadet progress analytics dashboards, and Google OAuth2 authentication flows.

### Why this is an isolated service
- **User Interface Domain**: Encapsulates browser DOM state, Web Audio media API capture, client-side routing, and 3D WebGL canvas context.
- **Independent Asset Distribution**: Static bundles (`dist/`) deploy directly to CDN edge locations or lightweight static file web servers (Nginx/Vite).
- **Client Storage Isolation**: Manages client-side access tokens in memory and cached scenario metadata in IndexedDB (`Dexie.js`).

---

## 🏗️ 4-Layer Feature Architecture

The codebase enforces strict separation of concerns within each feature module (`features/[feature_name]/`):

```
       ┌──────────────────────────────────────────────┐
       │             1. Component Layer               │
       │    (React JSX UI Layout & Event Handlers)    │
       └──────────────────────┬───────────────────────┘
                              │
                              ▼
       ┌──────────────────────────────────────────────┐
       │              2. Custom Hook Layer            │
       │     (Business Logic, Effects, Local State)   │
       └──────────────────────┬───────────────────────┘
                              │
                              ▼
       ┌──────────────────────────────────────────────┐
       │              3. Service Layer                │
       │   (Axios HTTP Requests & API Data Parsing)   │
       └──────────────────────┬───────────────────────┘
                              │
                              ▼
       ┌──────────────────────────────────────────────┐
       │             4. Redux Slice Layer             │
       │    (Global State & Synchronous State Sync)   │
       └──────────────────────────────────────────────┘
```

---

## 📁 Architecture & Directory Map

```
Frontend/
├── index.html                ← Root HTML entry template
├── vite.config.js            ← Vite build configuration & server proxy rules
├── eslint.config.js          ← ESLint code quality configuration
├── package.json              ← Dependencies & build scripts
└── src/
    ├── main.jsx              ← React DOM application root mounting point
    ├── App.jsx               ← Top-level React Router layout & auth guard orchestrator
    ├── store.js              ← Centralized Redux Toolkit store initialization
    ├── components/           ← Shared UI components (Navbar, Modal, Button, Spinner)
    ├── features/             ← Feature-based domain modules
    │   ├── auth/             ← Google OAuth2 login & session state
    │   ├── dashboard/        ← Cadet stats, streaks & analytics charts
    │   ├── simulator/        ← Live voice simulation, PTT & 3D MetallicOrb
    │   ├── scenarios/        ← Scenario catalog browsing & detail view
    │   ├── history/          ← Completed session transcripts & review
    │   ├── settings/         ← Microphone & audio output configuration
    │   └── landing/          ← Platform landing page & feature showcase
    ├── services/             ← Global infrastructure services
    │   ├── apiClient.js      ← Axios client with automatic 401 token refresh queue
    │   └── db.js             ← Dexie.js IndexedDB client database wrapper
    └── styles/               ← SCSS Design System
        ├── index.scss        ← Global CSS reset & base styles
        └── tokens.scss       ← CSS custom properties & design tokens
```

---

## 🌐 Redux Store & Network Interceptors

### Centralized Redux Store (`store.js`)
State is partitioned into modular feature slices:
- `auth`: Stores active user profile, auth status, and token state.
- `simulator`: Stores active scenario session state, state machine turn node, and live transcript.
- `scenarios`: Manages scenario catalog listings, filters, and selected airport template.
- `dashboard`: Holds cadet flight statistics, weekly streaks, and weak-area categories.

### Automatic 401 Token Refresh Queue (`apiClient.js`)
The shared Axios client transparently handles token expiry:
1. Intercepts `401 Unauthorized` responses from API microservices.
2. Holds concurrent failed requests in an async queue.
3. Automatically triggers a single `POST /api/auth/refresh` request to rotate the HttpOnly refresh token.
4. Updates the in-memory access token and re-executes all queued HTTP requests seamlessly without disrupting the cadet's simulation session.

---

## 🔮 Real-Time 3D MetallicOrb Visualizer

Located in `features/simulator/components/MetallicOrb.jsx`, the visualizer renders an interactive 3D metallic sphere reacting to voice audio levels:

- **Technologies**: React Three Fiber (`@react-three/fiber`), Drei (`@react-three/drei`), and Three.js (`three`).
- **Shader Reactivity**: Subscribes to real-time WebSocket amplitude events from the AI Service (`ws://.../ws/simulator`).
- **Visual Feedback Modes**:
  - **Idle State**: Soft floating animation with subtle metallic specular reflections.
  - **Cadet Transmitting (PTT)**: Responds to Web Audio API microphone input levels.
  - **Controller Responding (TTS)**: Pulses dynamically in sync with Rime TTS audio playback frequency spectrum.

---

## 🎨 SCSS Design System & Design Tokens

Styles are built on a dual-token design system defined in `src/styles/tokens.scss`:

```scss
// Color Tokens & CSS Variables
:root {
  --color-bg-primary: #0a0e17;
  --color-bg-secondary: #121824;
  --color-accent-blue: #00d2ff;
  --color-accent-emerald: #10b981;
  --color-text-primary: #f8fafc;
  --color-glass-border: rgba(255, 255, 255, 0.1);
  --font-family-sans: 'Inter', sans-serif;
  --font-family-mono: 'JetBrains Mono', monospace;
}
```

---

## 💾 Client-Side Offline Caching (Dexie.js)

The application uses `Dexie.js` in `src/services/db.js` to provide offline resilience:
- **Cached Scenarios**: Stores downloaded airport scenario templates for instant UI rendering.
- **Session History**: Caches local audio recordings and transcripts so cadets can review completed training sessions without refetching from backend databases.

---

## ⚙️ Environment Variables

| Variable | Required | Default | Description | Example |
|---|---|---|---|---|
| `VITE_API_BASE_URL` | ❌ | `http://localhost:3000` | Gateway API base URL override | `http://localhost:3000` |
| `VITE_WS_BASE_URL` | ❌ | `ws://localhost:3002` | AI Service WebSocket base URL | `ws://localhost:3002` |

---

## ⚙️ Local Development & Build Scripts

```bash
# Navigate to Frontend directory
cd Frontend

# 1. Install dependencies
npm install

# 2. Start Vite development server (with HMR)
npm run dev

# 3. Build optimized production bundle
npm run build

# 4. Preview local production build
npm run preview

# 5. Run ESLint code quality checks
npm run lint
```

---

## 🛡️ Production Deployment & Nginx

In production environments, the built `dist/` directory is served via Nginx or a CDN with SPA fallback routing:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /healthz {
        return 200 '{"status":"ok","service":"frontend"}';
        add_header Content-Type application/json;
    }
}
```

---

## 🤝 Ownership & Maintenance
- **Domain**: Web UI, Push-To-Talk Audio Capture, 3D WebGL Shaders, Redux State, Client-Side Routing.
- **Maintainers**: ATC Frontend UI Engineering Team.
