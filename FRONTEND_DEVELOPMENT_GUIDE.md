# 🎨 Frontend Development & Architectural Guide — ATC Voice Simulator

> **Welcome to the ATC Voice Simulator Frontend Team!**  
> This guide is your master blueprint for building, extending, and maintaining the React 18 Single Page Application (SPA). Our goal is to craft a visually stunning, responsive, and robust user interface with seamless Web Audio API interaction and zero-latency state management.

---

## 📖 Table of Contents
1. [Tech Stack & Architecture Overview](#1-tech-stack--architecture-overview)
2. [Directory Structure & Domain Isolation](#2-directory-structure--domain-isolation)
3. [The 4-Layer Frontend Architecture](#3-the-4-layer-frontend-architecture)
4. [Authentication & Silent 401 Token Refresh](#4-authentication--silent-401-token-refresh)
5. [Dual-Token SCSS Design System & Theme Engine](#5-dual-token-scss-design-system--theme-engine)
6. [Web Audio API & Voice Interaction Pipeline](#6-web-audio-api--voice-interaction-pipeline)
7. [Offline Caching & IndexedDB Persistence](#7-offline-caching--indexeddb-persistence)
8. [Step-by-Step: Adding a New Feature Domain](#8-step-by-step-adding-a-new-feature-domain)
9. [Pre-PR Quality Control Checklist](#9-pre-pr-quality-control-checklist)

---

## 1. Tech Stack & Architecture Overview

The frontend is a modern React 18 SPA bundled with Vite 5.

```
                      +-----------------------------+
                      |         App.jsx             |
                      |  (Root Orchestrator & Theme)|
                      +--------------+--------------+
                                     |
         +---------------------------+---------------------------+
         |                           |                           |
         v                           v                           v
+-----------------+         +-----------------+         +-----------------+
|  auth Feature   |         | simulator Feature|        |scenarios Feature|
| (Login & OAuth) |         | (Audio & Visual)|         | (Catalog & Maps)|
+-----------------+         +-----------------+         +-----------------+
```

### Core Technologies
- **UI Library & Bundler:** React 18 & Vite 5.
- **State Management:** Centralized Redux Toolkit (`store.js`) for synchronous state.
- **Networking:** Axios client with custom 401 response queue interceptor.
- **Styling Engine:** Dual-token SCSS design system (`index.scss` & `tokens.scss`), CSS Custom Properties, flex/grid layouts.
- **Offline Storage:** Dexie.js (IndexedDB wrapper) for client-side scenario & session caching.
- **Icons & UI:** Lucide React icons.

---

## 2. Directory Structure & Domain Isolation

We strictly enforce **Feature-Based Domain Isolation**. Every major application domain (e.g., `auth`, `dashboard`, `simulator`, `scenarios`) lives self-contained inside `src/features/`.

```
Frontend/src/
├── components/                 # Shared global UI components (BrandLogo, Layout, LoadingSpinner)
├── features/                   # Feature domain modules
│   └── [feature_name]/         # e.g., auth, simulator, scenarios, dashboard
│       ├── components/         # React UI components & co-located SCSS
│       │   ├── [Component].jsx
│       │   └── [Component].scss
│       ├── Hooks/              # Custom React hooks encapsulating business logic
│       │   └── [feature_name].hooks.js
│       ├── service/            # Raw Axios HTTP API functions
│       │   └── [feature_name].api.js
│       └── slice/              # Redux Toolkit synchronous state slice (NO async thunks)
│           └── [feature_name].slice.js
├── services/                   # Shared services (apiClient.js, socket.js, indexedDB.js)
├── styles/                     # Core Design System
│   ├── index.scss              # CSS custom properties, theme definitions, resets
│   └── tokens.scss             # SCSS token mappings, mixins, spacing scale
├── App.jsx                     # Root application component & theme boot
├── main.jsx                    # Application entry point
└── store.js                    # Centralized Redux Store configuration
```

---

## 3. The 4-Layer Frontend Architecture

To keep components pure and prevent tangled business logic, every feature is split into **4 execution layers**:

```
┌─────────────────────────────────────────────────────────┐
│                   1. Components Layer                   │
│      (Pure JSX Rendering, Event Triggers, UI State)     │
└───────────────────────────┬─────────────────────────────┘
                            │ Calls custom hooks
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    2. Custom Hooks Layer                │
│ (Business Logic, IndexedDB Cache, Async Flow Control)   │
└─────────────┬─────────────────────────────┬─────────────┘
              │ Calls API Service           │ Dispatches Redux actions
              ▼                             ▼
┌───────────────────────────┐   ┌─────────────────────────┐
│     3. Service Layer      │   │   4. Redux Slice Layer  │
│  (Axios / HTTP API Calls) │   │  (Sync Redux Mutators)  │
└───────────────────────────┘   └─────────────────────────┘
```

---

### Layer 1: Service Layer (`service/[feature].api.js`)
- **Responsibility:** Executes HTTP requests using the shared Axios client (`apiClient.js`).
- **Rules:** Pure `async` functions returning `response.data`. **Zero Redux or React dependencies.**

```javascript
// Example: src/features/scenarios/service/scenarios.api.js
import apiClient from '../../../services/apiClient';

export const fetchScenariosAPI = async () => {
    const response = await apiClient.get('/api/backend/scenarios');
    return response.data;
};

export const fetchScenarioByIdAPI = async (scenarioId) => {
    const response = await apiClient.get(`/api/backend/scenarios/${scenarioId}`);
    return response.data;
};
```

---

### Layer 2: Redux Slice Layer (`slice/[feature].slice.js`)
- **Responsibility:** Manages synchronous state updates in the Redux store.
- **Rules:** Pure synchronous reducers ONLY. **NO `createAsyncThunk`**.

```javascript
// Example: src/features/scenarios/slice/scenarios.slice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    list: [],
    selectedScenario: null,
    loading: false,
    error: null,
};

const scenariosSlice = createSlice({
    name: 'scenarios',
    initialState,
    reducers: {
        setScenariosList(state, action) {
            state.list = action.payload;
            state.loading = false;
        },
        setSelectedScenario(state, action) {
            state.selectedScenario = action.payload;
        },
        setScenariosLoading(state, action) {
            state.loading = action.payload;
        },
        setScenariosError(state, action) {
            state.error = action.payload;
            state.loading = false;
        },
    },
});

export const {
    setScenariosList,
    setSelectedScenario,
    setScenariosLoading,
    setScenariosError,
} = scenariosSlice.actions;

export default scenariosSlice.reducer;
```

---

### Layer 3: Custom Hooks Layer (`Hooks/[feature].hooks.js`)
- **Responsibility:** Orchestrates business logic, calls API services, handles IndexedDB caching, manages loading states, and dispatches Redux actions.

```javascript
// Example: src/features/scenarios/Hooks/scenarios.hooks.js
import { useDispatch, useSelector } from 'react-redux';
import { fetchScenariosAPI } from '../service/scenarios.api';
import {
    setScenariosList,
    setScenariosLoading,
    setScenariosError,
} from '../slice/scenarios.slice';

export const useScenarios = () => {
    const dispatch = useDispatch();
    const { list, selectedScenario, loading, error } = useSelector((state) => state.scenarios);

    const loadScenarios = async () => {
        dispatch(setScenariosLoading(true));
        try {
            const data = await fetchScenariosAPI();
            dispatch(setScenariosList(data.scenarios || data.data));
        } catch (err) {
            dispatch(setScenariosError(err.message || 'Failed to load scenarios'));
        }
    };

    return {
        scenarios: list,
        selectedScenario,
        loading,
        error,
        loadScenarios,
    };
};
```

---

### Layer 4: Components Layer (`components/[Component].jsx`)
- **Responsibility:** Pure UI rendering and handling DOM events.
- **Rules:** Components **NEVER** call `axios` or `fetch` directly. They consume state and functions exclusively through custom hooks.

```javascript
// Example: src/features/scenarios/components/ScenarioList.jsx
import React, { useEffect } from 'react';
import { useScenarios } from '../Hooks/scenarios.hooks';
import './ScenarioList.scss';

export const ScenarioList = () => {
    const { scenarios, loading, error, loadScenarios } = useScenarios();

    useEffect(() => {
        loadScenarios();
    }, []);

    if (loading) return <div className="scenario-loading">Loading scenarios...</div>;
    if (error) return <div className="scenario-error">Error: {error}</div>;

    return (
        <div className="scenario-grid">
            {scenarios.map((sc) => (
                <div key={sc.id} className="scenario-card">
                    <h3>{sc.title}</h3>
                    <p>{sc.description}</p>
                </div>
            ))}
        </div>
    );
};
```

---

## 4. Authentication & Silent 401 Token Refresh

To protect against XSS, access tokens are **never** saved in `localStorage` or `cookies`. They reside strictly in JavaScript closure memory.

```
Request Fails (HTTP 401)
         │
         ▼
Axios Interceptor Pauses Requests & Queues Them
         │
         ▼
Calls POST /api/auth/refresh (Browser sends HttpOnly cookie automatically)
         │
         ├──────────────────────────────────────┐
         ▼ (Success)                            ▼ (Failure)
Update Memory Access Token               Clear Auth State
& Retry Queued Requests                  Redirect to Google OAuth Login
```

### Access Token Memory Manager (`src/services/apiClient.js`)
```javascript
let _accessToken = null;

export const setAccessToken = (token) => {
    _accessToken = token;
};

export const getAccessToken = () => _accessToken;
```

When an API request returns HTTP 401, `apiClient.js` automatically queues subsequent requests, initiates a silent token refresh via `POST /api/auth/refresh`, updates `_accessToken`, and replays all failed requests seamlessly.

---

## 5. Dual-Token SCSS Design System & Theme Engine

Our styling strategy relies on a 3-tier token architecture:
1. **Primitive Tokens:** Raw color hexes, font scales, and spacing values (`--color-blue-500: #3b82f6`).
2. **Semantic Tokens:** Contextual variables (`--bg-primary`, `--text-main`, `--border-subtle`).
3. **Component Tokens:** Component-specific variables (`--button-bg-hover`).

### Theme Switcher
Themes are applied globally via `data-theme` attribute on the `<html>` root element:
```scss
// src/styles/index.scss
[data-theme="dark"] {
    --bg-primary: #0f172a;
    --text-primary: #f8fafc;
    --card-bg: #1e293b;
}

[data-theme="light"] {
    --bg-primary: #ffffff;
    --text-primary: #0f172a;
    --card-bg: #f1f5f9;
}
```

### Component Styling Rules
- Every component has a co-located `.scss` file (e.g., `SimulatorView.jsx` & `SimulatorView.scss`).
- Always use CSS variables (`var(--bg-primary)`) instead of hardcoded hex values (`#0f172a`).

---

## 6. Web Audio API & Voice Interaction Pipeline

The simulator uses the browser Web Audio API to process student speech:

1. **Microphone Capture:** Request audio stream via `navigator.mediaDevices.getUserMedia({ audio: true })`.
2. **Audio Buffer Conversion:** Convert stream into standard WAV/PCM blob format.
3. **Transmission to AI Service:** Dispatch audio payloads via `useSimulator` hook to `POST /api/ai/sessions/:id/turn`.
4. **Playback & Static Animation:** Play incoming TTS audio response using HTML5 `Audio` context while driving audio frequency visualizers.

---

## 7. Offline Caching & IndexedDB Persistence

Client-side offline caching is powered by **Dexie.js** (`src/services/indexedDB.js`):
- Active scenarios and transcript history are automatically mirrored in local IndexedDB.
- Allows students to review previous training sessions even when network connection drops.

---

## 8. Step-by-Step: Adding a New Feature Domain

To add a new domain (e.g., `analytics`):

1. **Create Feature Folder:** `src/features/analytics/` with `components/`, `Hooks/`, `service/`, `slice/`.
2. **Create Service (`service/analytics.api.js`):** Export raw Axios API functions.
3. **Create Slice (`slice/analytics.slice.js`):** Define synchronous reducers and export actions.
4. **Register Slice in `store.js`:** Add `analytics: analyticsReducer` to Redux store.
5. **Create Custom Hook (`Hooks/analytics.hooks.js`):** Connect API service and Redux dispatchers.
6. **Build React Component (`components/AnalyticsView.jsx`):** Consume `useAnalytics` hook.

---

## 9. Pre-PR Quality Control Checklist

Before opening a Pull Request:

- [ ] Feature files strictly follow the 4-layer architecture (`components`, `Hooks`, `service`, `slice`).
- [ ] No `axios` or `fetch` calls exist inside React JSX components.
- [ ] Redux slices contain **NO** async thunks (`createAsyncThunk`).
- [ ] SCSS components use CSS variables (`var(--...)`) — zero hardcoded hex colors.
- [ ] App builds cleanly without warnings (`npm run build`).

---

**Happy Coding! If you have any questions, reach out to the Frontend Lead.**
