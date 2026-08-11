# 🧩 AI Service — ATC Voice Simulator

> Voice AI inference engine: LangGraph state machine, Qdrant RAG, Mistral LLM, STT & TTS.

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
The AI Service handles all real-time voice processing, speech recognition (STT), speech synthesis (TTS), RAG phraseology retrieval via Qdrant, and conditional conversation flow via LangGraph for the ATC Voice Simulator.

### Why this is its own microservice
- **Bounded context:** Owns LangGraph agent checkpoints, RAG grounding retrieval, and transcript audio references exclusively.
- **Independent scaling need:** Heavy GPU/CPU and AI API workloads require horizontal scaling separate from lightweight CRUD services.
- **Independent deployability:** Allows prompt tuning, model upgrades, and STT/TTS voice changes without redeploying platform CRUD services.
- **Failure isolation:** External AI provider downtime won't prevent users from browsing scenarios or managing accounts.
- **Data isolation strategy:** Dedicated MongoDB database (`atc-ai-service`) storing checkpoints and transcript messages.

### The "User" of this service
| Caller | Call type | Why it calls this service |
|---|---|---|
| Core Backend Service | Internal HTTP REST | Advances agent turns & fetches conversation transcripts |

---

## 🚧 Built Features & Current State

# ATC AI Service

AI-powered backend service for the **ATC Pilot Training / Flight Prep Voice Agent**.

The service provides a stateful conversational ATC training environment where the system issues ATC clearances, generates spoken responses, waits for pilot readbacks, validates them, provides corrections when necessary, and advances through training scenarios.

---

## Overview

The AI Service is built around **LangGraph** and follows a stateful agent workflow.

The main pipeline is:

```text
Client / Frontend
       │
       ▼
AI Service API
       │
       ▼
JWT Authentication
       │
       ▼
AI Session Controller
       │
       ▼
LangGraph Agent
       │
       ├── Load Scenario Step
       │
       ├── Retrieve ATC Knowledge
       │        │
       │        ├── Mistral Embeddings
       │        └── Qdrant
       │
       ├── Compose ATC Clearance
       │
       ├── Generate TTS
       │
       ├── Wait for Pilot Readback
       │
       ├── Validate Readback
       │
       ├── Correct / Retry
       │
       └── Advance Scenario
```

The important design principle is that the LLM is **grounded using ATC knowledge retrieved from Qdrant**, rather than relying entirely on generated knowledge.

---

# Architecture

## Main Components

| Component     | Responsibility                                    |
| ------------- | ------------------------------------------------- |
| Express       | HTTP API server                                   |
| JWT           | Request authentication                            |
| LangGraph     | Agent orchestration and state management          |
| MongoDB       | Chat/session transcript persistence               |
| Qdrant        | Vector search / ATC knowledge retrieval           |
| Mistral       | Embeddings, extraction and AI processing          |
| TTS service   | Converts ATC text into speech                     |
| Scenario data | Defines training exercises and expected responses |
| MemorySaver   | Maintains LangGraph session state                 |

---

# LangGraph Workflow

The main graph is defined in:

```text
agent/graph.js
```

The workflow is:

```text
START
  │
  ▼
loadStep
  │
  ▼
qdrantRetrieve
  │
  ▼
composeLine
  │
  ▼
ttsSpeak
  │
  ▼
awaitReadback
  │
  ▼
validateReadback
  │
  ├────────────── Correct ──────────────┐
  │                                    │
  │                                    ▼
  │                              advanceStep
  │                                    │
  │                           ┌────────┴────────┐
  │                           │                 │
  │                        finished           next
  │                           │                 │
  │                           ▼                 ▼
  │                        debrief          loadStep
  │
  ├──────────── Incorrect ──────► issueCorrection
  │                                  │
  │                                  ▼
  │                            awaitReadback
  │
  └──────────── Retry limit ─────► clarify
                                     │
                                     ▼
                               awaitReadback
```

This allows the agent to behave like an actual interactive training session instead of a simple request/response chatbot.

---

# Agent State

The shared state is defined in:

```text
agent/state.js
```

Important fields include:

```text
sessionId
steps
stepIndex
currentLine
audioBase64
pilotTranscript
extracted
retries
grounding
transcript
finished
```

Each LangGraph node reads the relevant information from this state and returns updates to it.

---

# Scenario System

Training scenarios are data-driven.

Scenario definitions are stored in:

```text
data/scenarios.js
```

Example:

```js
export const scenarios = {
    "taxi-basic": {
        id: "taxi-basic",

        steps: [
            {
                id: "taxi-1",

                query: "Issue a taxi clearance to runway 27.",

                procedureType: "taxi",

                phase: "ground",

                expected: {
                    taxiway: "Alpha",
                    runway: "27",
                    hold_short: "runway 27",
                },
            },
        ],
    },
};
```

This separates **training content** from **agent logic**.

Adding another scenario should generally require adding scenario data rather than rewriting the LangGraph workflow.

---

# Qdrant Grounding

Qdrant provides the ATC knowledge used to ground the agent's responses.

The retrieval process is:

```text
Scenario Query
      │
      ▼
Mistral Embedding API
      │
      ▼
1024-dimensional vector
      │
      ▼
Qdrant Vector Search
      │
      ▼
Relevant ATC Knowledge
      │
      ▼
LangGraph State
```

For example:

```text
Query:
Issue a taxi clearance to runway 27.

Retrieved knowledge:
Taxi via Alpha and hold short of runway 27.
```

The retrieved result becomes part of:

```text
state.grounding
```

This grounding is then used when composing the ATC line.

---

# Readback Validation

The pilot's response is not validated using simple string comparison.

Instead, Mistral extracts structured information from the transcript.

Example pilot response:

```text
Taxi via Alpha and hold short of runway 27.
```

Extracted data:

```js
{
    taxiway: "Alpha",
    runway: "27",
    hold_short: "runway 27"
}
```

The extracted fields are compared against the scenario's expected values:

```js
expected: {
    taxiway: "Alpha",
    runway: "27",
    hold_short: "runway 27",
}
```

This allows semantic/field-based validation instead of requiring an exact sentence match.

---

# LangGraph Interrupt / Resume

One of the key parts of the system is the readback waiting mechanism.

The `awaitReadback` node uses:

```js
interrupt({
    type: "await_readback",
    sessionId: state.sessionId,
    stepIndex: state.stepIndex,
    currentLine: state.currentLine,
});
```

This pauses the graph while waiting for the pilot.

The flow becomes:

```text
ATC generates clearance
        │
        ▼
TTS generated
        │
        ▼
LangGraph interrupt()
        │
        ▼
Pilot provides speech/text
        │
        ▼
Controller receives transcript
        │
        ▼
Command({ resume: pilotTranscript })
        │
        ▼
LangGraph continues
        │
        ▼
Validate readback
```

The graph therefore maintains the conversational state across requests.

---

# Session Persistence

LangGraph uses a checkpointer:

```js
const checkpointer = new MemorySaver();

const compiledGraph = workflow.compile({
    checkpointer,
});
```

The controller supplies a thread ID:

```js
const config = {
    configurable: {
        thread_id: id,
    },
};
```

This allows multiple requests belonging to the same session to continue the same LangGraph execution.

---

# Authentication

The AI service uses JWT authentication.

Requests contain:

```text
Authorization: Bearer <JWT>
```

The middleware verifies the token using:

```js
jwt.verify(
    token,
    process.env.JWT_SECRET
);
```

The secret is stored in `.env`:

```env
JWT_SECRET=<secret>
```

The AI service should never hardcode the JWT secret in application code.

---

# API

The primary training endpoint is:

```http
POST /sessions/:id/turn
```

### Starting a session

Send an empty body:

```json
{}
```

The agent starts the scenario and returns an ATC response.

Example:

```json
{
    "audioBase64": "...",
    "finished": false,
    "currentLine": "Taxi via Alpha and hold short of runway 27."
}
```

### Resuming with a pilot readback

Send:

```json
{
    "pilotTranscript": "Taxi via Alpha and hold short of runway 27"
}
```

The graph resumes from the readback interrupt and validates the response.

A successful final response looks like:

```json
{
    "audioBase64": "...",
    "finished": true,
    "currentLine": "Taxi via Alpha and hold short of runway 27."
}
```

---

# Transcript API

The service also exposes the session transcript.

```http
GET /sessions/:id/transcript
```

The controller retrieves messages from MongoDB and returns them ordered by timestamp.

---

# Testing

Manual `curl` testing was initially used during development, but the project now includes an automated test script.

Example location:

```text
scripts/
└── aiSession.test.js
```

Run the AI service first:

```bash
npm start
```

Then, in another terminal:

```bash
node ./scripts/aiSession.test.js
```

The test automatically:

1. Generates a fresh JWT using `JWT_SECRET`.
2. Creates a unique session ID.
3. Starts the training scenario.
4. Verifies that an ATC clearance is generated.
5. Sends a correct pilot readback.
6. Verifies that the scenario finishes successfully.

This avoids manually generating JWTs or constructing PowerShell `curl` commands.

---

# Environment Variables

The service requires environment variables for authentication and external services.

Example:

```env
PORT=7000

JWT_SECRET=<jwt-secret>

MONGODB_URI=<mongodb-connection-string>

QDRANT_URL=<qdrant-url>
QDRANT_API_KEY=<qdrant-api-key>
QDRANT_COLLECTION=roger_atc_knowledge

MISTRAL_API_KEY=<mistral-api-key>
```

Additional variables may be required depending on the configured TTS provider.

Never commit `.env` or API keys to Git.

---

# Project Structure

Current high-level structure:

```text
ai-service/
│
├── agent/
│   ├── graph.js
│   ├── state.js
│   │
│   └── nodes/
│       ├── loadStep.js
│       ├── qdrantRetrieve.js
│       ├── composeLine.js
│       ├── ttsSpeak.js
│       ├── awaitReadback.js
│       ├── validateReadback.js
│       ├── issueCorrection.js
│       ├── clarify.js
│       ├── advanceStep.js
│       └── debrief.js
│
├── config/
│   └── qdrant.js
│
├── controllers/
│   └── aiSession.controller.js
│
├── data/
│   └── scenarios.js
│
├── middleware/
│   ├── identifyUser.middleware.js
│   └── rate-limit.middleware.js
│
├── models/
│   └── chatMessage.model.js
│
├── routes/
│   └── aiSession.routes.js
│
├── services/
│   ├── qdrant.service.js
│   └── mistral.service.js
│
├── sockets/
│   └── aiSession.socket.js
│
├── scripts/
│   └── aiSession.test.js
│
├── server.js
├── package.json
└── .env
```

---

# Current Working Flow

The current working happy path is:

```text
Client
  │
  │ POST /sessions/:id/turn
  ▼
JWT authentication
  │
  ▼
Controller
  │
  ▼
LangGraph
  │
  ▼
Load taxi-1
  │
  ▼
Qdrant retrieval
  │
  ▼
Grounding:
"Taxi via Alpha and hold short of runway 27."
  │
  ▼
Compose ATC line
  │
  ▼
TTS
  │
  ▼
interrupt()
  │
  │ Pilot readback
  ▼
Mistral extraction
  │
  ▼
Compare with expected fields
  │
  ▼
Valid
  │
  ▼
Advance step
  │
  ▼
finished = true
```

---

# Current Development Status

### Working

* Express AI service
* MongoDB connection
* JWT authentication
* Rate limiting
* LangGraph workflow
* Scenario loading
* Qdrant retrieval
* Mistral embeddings
* ATC grounding
* ATC line composition
* TTS generation
* LangGraph interrupt/resume
* Pilot transcript handling
* Structured readback extraction
* Readback validation
* Scenario completion
* Automated happy-path test

### Next Important Areas

The next development focus should be:

1. **Incorrect readback handling**
2. **Correction generation**
3. **Retry limits**
4. **Clarification behavior**
5. **Multiple scenario steps**
6. **Debrief generation**
7. **Real speech-to-text integration**
8. **Socket-based real-time communication**
9. **Frontend integration**
10. **Production-grade LangGraph persistence**

---

# Design Principle

The core architecture intentionally separates responsibilities:

```text
Scenario Data
    ↓
Defines what should happen

LangGraph
    ↓
Controls how the session progresses

Qdrant
    ↓
Provides factual ATC grounding

Mistral
    ↓
Performs embedding / extraction / AI reasoning

TTS
    ↓
Provides spoken ATC output

MongoDB
    ↓
Stores conversation history

JWT
    ↓
Protects the API
```

This separation makes the system easier to extend, test, and maintain as more ATC training scenarios are added.




# FIX 2:


## Current Status

- Express/API server: working
- MongoDB: working
- LangGraph workflow and interrupt/resume: working
- Qdrant retrieval and filtering: working
- ATC knowledge ingestion: working
- Mistral grounded ATC line composition: working
- Rime TTS: working
- Deterministic readback parsing/validation: working
- Transcript persistence: working
- End-to-end test suite: **PASS**

### Verified scenarios

```text
departure-clearance  PASS
landing-clearance    PASS
frequency-change     PASS

ALL SCENARIOS PASSED
```

## Architecture

```text
                    ┌──────────────────┐
                    │     Scenario     │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │     Qdrant       │
                    │ ATC Knowledge DB │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │     Mistral      │
                    │ ATC Line Compose │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │      Rime        │
                    │       TTS        │
                    └────────┬─────────┘
                             │
                             ▼
                           Pilot
                             │
                             ▼
                            STT
                             │
                             ▼
                    ┌──────────────────┐
                    │ Deterministic    │
                    │ Readback Parser  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │    LangGraph     │
                    │ Validation/Flow  │
                    └──────────────────┘
```

## Main Technologies

- Node.js
- Express
- LangGraph
- MongoDB / Mongoose
- Qdrant
- Mistral API
- Rime TTS
- dotenv

## Project Structure

```text
ai-service/
├── agent/
│   ├── graph.js
│   ├── state.js
│   └── nodes/
│       ├── loadStep.js
│       ├── qdrantRetrieve.js
│       ├── composeLine.js
│       ├── ttsSpeak.js
│       ├── awaitReadback.js
│       ├── validateReadback.js
│       ├── issueCorrection.js
│       ├── clarify.js
│       ├── advanceStep.js
│       └── debrief.js
├── controllers/
│   └── aiSession.controller.js
├── data/
│   └── scenarios.js
├── models/
│   └── chatMessage.model.js
├── routes/
│   └── aiSession.routes.js
├── services/
│   ├── mistral.service.js
│   ├── mistralRateLimiter.js
│   ├── qdrant.service.js
│   ├── readbackValidator.service.js
│   ├── tts.service.js
│   └── latency.service.js
├── scripts/
│   ├── aiSession.test.js
│   ├── testQdrant.js
│   └── ingestKnowledge.js
└── server.js
```

## ATC Knowledge Base

The current Qdrant collection is:

```text
roger_atc_knowledge
```

The development dataset currently covers:

- Departure clearances
- Departure clearance components
- Departure/takeoff distinction
- Landing clearances
- Landing readbacks
- Taxi instructions
- Taxiway/runway assignments
- Hold-short instructions
- Runway crossing
- Frequency transfers
- Departure frequency changes
- General readback guidance
- Line up and wait

Knowledge points include metadata such as procedure type, phase, category, jurisdiction, and source.

The dataset is intentionally still small. A substantially larger ATC knowledge base will be added later.

## Readback Validation

Readback validation is intentionally deterministic rather than using another LLM request.

The parser currently handles fields including:

- Callsign
- Runway
- Departure
- Squawk
- Frequency
- Taxiway
- Hold-short runway

Values are normalized before comparison with scenario expectations.

## Session Flow

A scenario starts through the AI session turn endpoint with a scenario ID.

The graph executes:

```text
loadStep
   ↓
qdrantRetrieve
   ↓
composeLine
   ↓
ttsSpeak
   ↓
awaitReadback
```

The graph interrupts while waiting for the pilot.

The next request resumes the same LangGraph thread with the pilot transcript:

```text
pilot transcript
      ↓
validateReadback
      ↓
correct / clarify / advance
```

A valid readback advances to the next scenario step.

An invalid readback can trigger a correction, with retry handling performed by the graph.

## Environment Variables

Create a `.env` file with the required credentials/configuration:

```env
PORT=7000

MONGODB_URI=...

MISTRAL_API_KEY=...

QDRANT_URL=...
QDRANT_API_KEY=...

RIME_API_KEY=...
```

Never commit `.env` or API keys to GitHub.

## Running the Service

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The AI service currently runs on port `7000`.

## Knowledge Ingestion

Knowledge ingestion is separate from live conversational testing.

```bash
npm run qdrant:ingest
```

This generates embeddings and upserts knowledge points into:

```text
roger_atc_knowledge
```

High latency during bulk knowledge ingestion is acceptable.

## Qdrant Testing

```bash
node scripts/testQdrant.js
```

This verifies filtered retrieval for ATC procedures.

## End-to-End Testing

```bash
node scripts/aiSession.test.js
```

The current suite verifies departure clearance, landing clearance, and frequency change scenarios.

## Latency

The service is functionally working, but live response latency still needs improvement.

Recent measurements showed:

- Mistral line composition: generally around 1–2 seconds
- Rime TTS: several seconds
- Qdrant retrieval: variable, with artificial waiting currently visible when requests are queued through the Mistral rate limiter

The current Mistral rate limiter was introduced to control API request frequency during development and ingestion.

### Planned latency work

The architecture will **not** be rewritten.

The next optimization is to separate:

```text
bulk/data-ingestion request throttling
```

from:

```text
live conversational response latency
```

The goal is a short, natural pause after the pilot finishes speaking, rather than artificial waits of many seconds.

Rime TTS will then be benchmarked independently.

## Roadmap

### Phase 1 — Recovery

- [x] Restore server startup
- [x] Restore controller exports
- [x] Restore scenario loading
- [x] Restore Qdrant filtering
- [x] Restore knowledge ingestion
- [x] Restore graph execution
- [x] Restore transcript persistence

### Phase 2 — Functional Verification

- [x] Departure clearance
- [x] Landing clearance
- [x] Frequency change
- [x] Readback extraction
- [x] Readback validation
- [x] Correction path
- [x] Scenario completion

### Phase 3 — Runtime Latency

- [ ] Separate ingestion Mistral throttling from live runtime
- [ ] Measure embedding generation separately from Qdrant search
- [ ] Benchmark live Qdrant retrieval
- [ ] Benchmark Mistral response generation
- [ ] Benchmark Rime TTS
- [ ] Remove unnecessary waiting from the live turn path

### Phase 4 — ATC Knowledge Expansion

- [ ] Expand the ATC knowledge base substantially
- [ ] Add additional procedures and phases
- [ ] Add more realistic phraseology
- [ ] Add edge cases and safety-critical distinctions
- [ ] Add broader scenario coverage
- [ ] Stress-test retrieval across the expanded dataset

### Phase 5 — Training-Agent Behavior

- [ ] More realistic pilot mistakes
- [ ] Partial readbacks
- [ ] Incorrect runway/readback handling
- [ ] Incorrect squawk/frequency handling
- [ ] Clarification behavior
- [ ] Multi-step scenarios
- [ ] More realistic ATC sequencing
- [ ] Debrief/training feedback

## Design Goal

The primary goal is to build an AI agent that can realistically mimic the function of a pilot-facing ATC service for training.

Priorities:

1. Correct ATC behavior
2. Grounded phraseology
3. Reliable state management
4. Realistic pilot/ATC interaction
5. Safe handling of incorrect readbacks
6. Reasonable conversational latency
7. Expandable ATC knowledge

Ultra-low latency is not the primary objective. A short conversational pause is acceptable; long artificial waits are not.

The existing LangGraph + Qdrant + Mistral + TTS architecture is therefore being retained rather than replaced.
