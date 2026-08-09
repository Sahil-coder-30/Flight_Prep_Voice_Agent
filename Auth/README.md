# 🧩 Auth Service — ATC Voice Simulator

> User identity, Google OAuth2, RS256 JWT issuance, refresh token rotation, and JWKS publication.

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
The Auth Service is the single source of truth for user identity in the ATC Voice Simulator platform. It holds the RSA-4096 private key, authenticates users via Google OAuth2, issues RS256 JWT access tokens, and manages opaque refresh token rotation.

### Why this is its own microservice
- **Bounded context:** Owns user credentials, refresh token hashes, and RSA private keys exclusively.
- **Independent scaling need:** Auth traffic is spike-heavy during logins/refreshes, separate from compute-heavy AI inference workloads.
- **Independent deployability:** Security fixes and key rotation procedures can deploy without redeploying application services.
- **Failure isolation:** If application services go down, identity endpoints and session validation remain unaffected.
- **Data isolation strategy:** Dedicated MongoDB database (`atc-auth`) storing user profiles and token hashes.

### The "User" of this service
| Caller | Call type | Why it calls this service |
|---|---|---|
| Frontend SPA | Direct HTTP | Google OAuth login, token refresh, profile fetch |
| Backend & AI Service | HTTP GET | JWKS public key fetching for local RS256 JWT verification |

---

## 🚧 Built Features & Current State

### Current state
| Field | Value |
|---|---|
| **Status** | 🟢 Active Development |
| **Version** | v1.0.0 |
| **Last updated** | 2026-08-09 |
| **Owner(s)** | Auth & Security Team |
| **Known technical debt** | Redis token blacklist integration pending |

### Features built (working today)
- `GET /.well-known/jwks.json` & `GET /api/auth/.well-known/jwks.json` — Serves RSA-4096 public keys in JWK format — ✅ done
- `GET /api/auth/google` — Initiates Google OAuth2 consent flow — ✅ done
- `GET /api/auth/google/callback` — Handles Google OAuth callback & issues RS256 access token + refresh cookie — ✅ done
- `POST /api/auth/refresh` — Rotates opaque refresh token & issues new RS256 access token — ✅ done
- `GET /api/auth/getMe` — Returns authenticated user profile (`id`, `email`, `name`, `role`) — ✅ done
- `POST /api/auth/logout` — Revokes refresh token family & clears HTTP-only cookie — ✅ done

### How it was built
- **Language/runtime:** Node.js 20 (ES Modules)
- **Framework:** Express 5
- **Design patterns used:** RSA Asymmetric JWT signing, JWKS distribution, Refresh Token Family rotation
- **Key libraries:** Mongoose, Passport.js, jsonwebtoken, cookie-parser

---

## 🏗️ Architecture & Design Patterns

Follows the standard monorepo backend service structure:

```
Auth/
├── server.js           ← Entry point only
├── app/
│   └── app.js          ← Express app factory
├── config/             ← DB & Passport strategies
├── controllers/        ← HTTP request handlers
├── middleware/         ← JWKS verification
├── models/             ← User & RefreshToken schemas
├── routes/             ← Express router definitions
├── services/           ← Token management services
├── keys/               ← RSA-4096 private/public key PEMs
└── scripts/            ← Key generation script
```

---

## ⚙️ Usage & Setup

### Environment variables

| Key | Required | Description | Example (fake) |
|---|---|---|---|
| `PORT` | ✅ | Port the service listens on | `3000` |
| `NODE_ENV` | ✅ | Node environment | `development` |
| `MONGO_URI` | ✅ | MongoDB connection string | `mongodb://localhost:27017/atc-auth` |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth Client ID | `123456-example.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth Client Secret | `GOCSPX-fake-secret-key` |
| `GOOGLE_CALLBACK_URL` | ✅ | OAuth Callback URL | `http://localhost:3000/api/auth/google/callback` |
| `JWT_ISSUER` | ✅ | JWT issuer claim | `auth.atcvoicesimulator.in` |
| `JWT_AUDIENCE` | ✅ | JWT audience claim | `atcvoicesimulator-services` |
| `AUTH_JWKS_URI` | ✅ | Self JWKS URI | `http://localhost/api/auth/.well-known/jwks.json` |
| `CLIENT_URL` | ✅ | Frontend URL | `http://localhost:5173` |

### Run locally
```bash
# 1. Install dependencies
npm install

# 2. Generate RSA keys
npm run generate-keys

# 3. Start in dev mode
npm run dev

# 4. Run production mode
npm start
```

---

## 🔌 Communication & Contracts

### Synchronous (REST/gRPC)
| Direction | Protocol | Endpoint / method | Counterpart |
|---|---|---|---|
| Inbound | HTTP REST | `GET /.well-known/jwks.json` | Backend / AI-service |
| Inbound | HTTP REST | `POST /api/auth/refresh` | Frontend SPA |

---

## 🛡️ Production Readiness

### Health & observability
- **Liveness:** `GET /healthz` — returns 200 OK
- **Readiness:** `GET /ready` — returns 200 OK
- **Structured logging:** Morgan HTTP logger

### Security & compliance
- **AuthN/AuthZ:** RS256 JWT access tokens (15m), HttpOnly SameSite=Lax refresh cookies (30d)
- **Token reuse detection:** Replaying old refresh tokens revokes the entire `familyId`

---

## 📝 Changelog & Migration State

| Version | Date | Change | Migration notes |
|---|---|---|---|
| `v1.0.0` | 2026-08-09 | Initial Auth service scaffold & RS256 key setup | None |

---

## 🤝 Ownership
- **Maintainer(s):** ATC Platform Team
