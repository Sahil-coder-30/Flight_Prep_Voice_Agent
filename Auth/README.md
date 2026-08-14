# 🧩 Auth Service — ATC Voice Simulator Platform

> **Identity & Security Engine**: Production-grade microservice handling Google OAuth2 authentication, RSA-4096 asymmetric RS256 JWT access token issuance, opaque refresh token family rotation with reuse attack detection, and high-performance JWKS publication.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-Production--Ready-brightgreen.svg)
![Runtime](https://img.shields.io/badge/runtime-Node%2020%20ESM-informational.svg)
![Framework](https://img.shields.io/badge/framework-Express%205-lightgrey.svg)
![Security](https://img.shields.io/badge/security-RS256%20%7C%20JWKS%20%7C%20OAuth2-red.svg)

---

## 📖 Table of Contents
- [Overview & Bounded Context](#-overview--bounded-context)
- [Architecture & Design Patterns](#-architecture--design-patterns)
- [Built Features & Endpoints](#-built-features--endpoints)
- [Security Architecture Deep-Dive](#-security-architecture-deep-dive)
- [Environment Variables](#-environment-variables)
- [Local Development & Setup](#-local-development--setup)
- [Communication & Caller Matrix](#-communication--caller-matrix)
- [Production Readiness & K8s](#-production-readiness--k8s)
- [Ownership & Maintenance](#-ownership--maintenance)

---

## 🎯 Overview & Bounded Context

### What this service does
The **Auth Service** acts as the single source of truth for user identity across the ATC Voice Simulator platform. It encapsulates all credential management, OAuth2 integration with Google, asymmetric key generation, cryptographic JWT signing (RS256), refresh token database hashing, and zero-trust session revocation.

### Why this is an isolated microservice
- **Cryptographic Isolation**: Holds the RSA-4096 private key (`keys/private.pem`) exclusively. No downstream service ever accesses the private key.
- **Independent Scaling Profile**: Login and token refresh operations experience bursty traffic during peak cadet onboarding, independent of compute-intensive voice AI inference.
- **Security & Fault Domain**: Key rotation procedures or auth logic adjustments deploy cleanly without affecting running simulation sessions.
- **Storage Isolation**: Manages a dedicated MongoDB database (`atc-auth`) holding user profiles and salted refresh token hashes.

---

## 🏗️ Architecture & Design Patterns

### Service Directory Structure

```
Auth/
├── server.js                 ← HTTP server listener entry point
├── app/
│   └── app.js                ← Express app factory, CORS, cookie parser, error middleware
├── config/
│   ├── db.js                 ← Mongoose MongoDB connection initializer
│   └── passport.js           ← Google OAuth2 strategy configuration
├── controllers/
│   └── auth.controller.js    ← Request handlers for OAuth, JWKS, token refresh & profile
├── middleware/
│   └── identifyUser.middleware.js ← RS256 JWT validation & request context injector
├── models/
│   ├── user.model.js         ← User schema (email, name, picture, role, authProvider)
│   └── refreshToken.model.js ← Refresh token schema (familyId, hashedToken, expiresAt)
├── routes/
│   └── auth.routes.js        ← Router definitions & auth middleware bindings
├── services/
│   ├── auth.service.js       ← Business logic for user upsert, JWT signing, refresh family management
│   └── key.service.js        ← PEM key loader & JWKS JSON converter
├── keys/
│   ├── private.pem           ← RSA-4096 Private Key (signed with RS256)
│   └── public.pem            ← RSA-4096 Public Key (published via JWKS)
└── scripts/
    └── generate-keys.js      ← Automated RSA-4096 keypair generator
```

### Asymmetric JWT & JWKS Verification Flow

```
[ Frontend SPA ] -------- (1) Initiates Google OAuth2 -------> [ Auth Service ]
       |                                                            |
       | <---- (2) Returns RS256 Access Token + Refresh Cookie -----+
       |
       | --------- (3) Sends RS256 Bearer Token -------------------> [ AI / Core Backend ]
                                                                           |
                                                                           | (4) Fetches JWKS Public Key
                                                                           v
                                                                   [ GET /.well-known/jwks.json ]
```

---

## 🚧 Built Features & Endpoints

### Endpoint Specification Matrix

| Method | Path | Auth Required | Description | Response / Status |
|---|---|---|---|---|
| `GET` | `/.well-known/jwks.json` | ❌ Public | Serves RSA-4096 public key in RFC 7517 JWK set format | `200 OK` (JSON) |
| `GET` | `/api/auth/.well-known/jwks.json` | ❌ Public | Alias for public JWKS discovery | `200 OK` (JSON) |
| `GET` | `/api/auth/google` | ❌ Public | Triggers Google OAuth2 consent screen redirect | `302 Found` |
| `GET` | `/api/auth/google/callback` | ❌ Public | Handles OAuth callback, creates user, issues token + cookie | `302 Redirect` to `CLIENT_URL` |
| `POST` | `/api/auth/refresh` | 🍪 HttpOnly Cookie | Rotates opaque refresh token & issues new RS256 access token | `200 OK` `{ accessToken, user }` |
| `GET` | `/api/auth/getMe` | 🔑 Bearer JWT | Returns current authenticated cadet profile | `200 OK` `{ user }` |
| `POST` | `/api/auth/logout` | 🔑 Bearer JWT | Revokes active refresh token family & clears HttpOnly cookie | `200 OK` `{ message }` |
| `GET` | `/healthz` | ❌ Public | Liveness probe for Kubernetes / load balancers | `200 OK` `{ status: "ok" }` |
| `GET` | `/readyz` | ❌ Public | Readiness probe confirming DB connection health | `200 OK` `{ status: "ready" }` |

---

## 🛡️ Security Architecture Deep-Dive

### 1. RS256 Asymmetric Key Issuance
- **Algorithm**: RS256 (RSA Signature with SHA-256).
- **Key Length**: 4096-bit RSA PEM key pair.
- **Access Token TTL**: 15 minutes.
- **Token Claims**:
  - `sub`: User ID (`ObjectId`)
  - `email`: User email address
  - `role`: User authorization role (`cadet` | `instructor` | `admin`)
  - `iss`: Configured issuer (`JWT_ISSUER`)
  - `aud`: Configured audience (`JWT_AUDIENCE`)

### 2. Opaque Refresh Token Rotation & Reuse Attack Mitigation
- **Family Tracking**: Every refresh token belongs to a `familyId`.
- **Automatic Rotation**: When `/api/auth/refresh` is called, the current refresh token is invalidated and a new token in the same family is issued.
- **Replay Attack Detection**: If a previously revoked refresh token is presented, the Auth Service immediately revokes **all** tokens in that `familyId`, forcing all sessions associated with that family to log in again.
- **Cookie Security**: Delivered via `HttpOnly`, `SameSite=Lax`, `Path=/api/auth` cookies to block XSS credential exfiltration.

---

## ⚙️ Environment Variables

| Variable | Required | Default | Description | Example |
|---|---|---|---|---|
| `PORT` | ✅ | `3000` | Port HTTP server binds to | `3000` |
| `NODE_ENV` | ✅ | `development` | Runtime environment mode | `development` / `production` |
| `MONGO_URI` | ✅ | — | MongoDB connection string | `mongodb://localhost:27017/atc-auth` |
| `GOOGLE_CLIENT_ID` | ✅ | — | Google OAuth2 Application Client ID | `12345-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | ✅ | — | Google OAuth2 Application Client Secret | `GOCSPX-secretkey` |
| `GOOGLE_CALLBACK_URL` | ✅ | — | OAuth2 callback redirect URI | `http://localhost:3000/api/auth/google/callback` |
| `JWT_ISSUER` | ✅ | `auth.atcvoicesimulator.in` | Expected JWT issuer claim (`iss`) | `auth.atcvoicesimulator.in` |
| `JWT_AUDIENCE` | ✅ | `atcvoicesimulator-services` | Expected JWT audience claim (`aud`) | `atcvoicesimulator-services` |
| `AUTH_JWKS_URI` | ✅ | `http://localhost:3000/.well-known/jwks.json` | Public JWKS endpoint URL | `http://auth:3000/.well-known/jwks.json` |
| `CLIENT_URL` | ✅ | `http://localhost:5173` | Frontend SPA redirect destination | `http://localhost:5173` |

---

## ⚙️ Local Development & Setup

### 1. Installation
```bash
# Navigate to Auth service directory
cd Auth

# Install dependencies
npm install
```

### 2. RSA Key Generation
Before starting the service for the first time, generate the RSA-4096 keypair:
```bash
npm run generate-keys
```
*This outputs `keys/private.pem` and `keys/public.pem`.*

### 3. Running the Service
```bash
# Start in development mode (with nodemon hot-reload)
npm run dev

# Start in production mode
npm start
```

---

## 🔌 Communication & Caller Matrix

| Counterpart | Protocol | Endpoint Consumed | Purpose |
|---|---|---|---|
| **Frontend SPA** | HTTP GET/POST | `/api/auth/google`, `/api/auth/refresh`, `/api/auth/logout` | User login, automatic token rotation, session termination |
| **AI Service** | HTTP GET | `/.well-known/jwks.json` | Fetches public key to verify RS256 JWT access tokens locally |
| **Core Backend** | HTTP GET | `/.well-known/jwks.json` | Fetches public key to verify RS256 JWT access tokens locally |

---

## 🛡️ Production Readiness & K8s

- **Kubernetes Deployment**: Defined in [`k8s/auth.deployment.yml`](file:///Users/home/Desktop/ATC/k8s/auth.deployment.yml).
- **Kubernetes Service**: Defined in [`k8s/auth.service.yml`](file:///Users/home/Desktop/ATC/k8s/auth.service.yml).
- **Health Checks**:
  - `GET /healthz`: Responds `200 OK` for Kubernetes liveness probe.
  - `GET /readyz`: Responds `200 OK` when MongoDB database connection state is active.
- **Skaffold Hot-Reloading**: Configured in [`skaffold.yml`](file:///Users/home/Desktop/ATC/skaffold.yml) targeting image `auth`.

---

## 🤝 Ownership & Maintenance
- **Domain**: User Identity, Authentication & Authorization, Cryptographic Key Management.
- **Maintainers**: ATC Security & Platform Engineering Team.
