# ATC AI Service

AI-powered backend service for realistic pilot–ATC voice training.

The service manages an ATC training session as a stateful LangGraph workflow. It retrieves grounded ATC knowledge from Qdrant, generates controller transmissions using Mistral, converts them to speech using Rime TTS, waits for pilot readback, validates the readback, and advances through the scenario.

---

## Current Status

**Core AI session workflow: working.**

The current integration has successfully passed the available scenario tests, including:

* Departure clearance
* Landing clearance
* Frequency change
* Pilot readback validation
* Scenario step advancement
* Session completion

Recent successful test result:

```text
=================================
ALL SCENARIOS PASSED
=================================
```

The service is currently using:

* **Mistral Large Latest** — ATC line generation
* **Mistral Embed** — semantic query embeddings
* **Qdrant** — ATC knowledge retrieval
* **Rime TTS** — controller voice generation
* **LangGraph** — session workflow/state machine
* **MongoDB** — transcript persistence
* **Express** — HTTP API
* **Socket.IO** — realtime session infrastructure

---

## Architecture

```text
                    ┌──────────────────────┐
                    │       Client         │
                    │ Pilot / Training UI  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    Express API       │
                    │ aiSession controller │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │     LangGraph        │
                    │   Session Workflow   │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        ┌───────────┐    ┌───────────┐    ┌───────────┐
        │  Mistral  │    │  Qdrant   │    │   Rime    │
        │ Embeddings │    │ Retrieval │    │    TTS    │
        └───────────┘    └───────────┘    └───────────┘
              │                │                │
              └────────────────┴────────────────┘
                               │
                               ▼
                         Pilot Readback
                               │
                               ▼
                     Local Readback Validator
```

---

## Workflow

Every scenario is processed as a sequence of steps.

The current LangGraph is:

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
  ├── valid ───────────────► advanceStep
  │                              │
  │                              ├── next step ──► loadStep
  │                              │
  │                              └── finished ──► debrief
  │
  └── invalid
         │
         ├── retries < 2 ──► issueCorrection ──► ttsSpeak
         │
         └── retries >= 2 ─► clarify ──► ttsSpeak

debrief
  │
  ▼
 END
```

---

## Request Processing

### 1. Session initialization

The client sends:

```http
POST /sessions/:id/turn
```

with:

```json
{
  "scenarioId": "departure-clearance"
}
```

The controller loads the scenario and initializes the LangGraph state.

---

### 2. Load Step

`loadStep` loads the current scenario step.

Example:

```text
Step: departure-1
Query: Issue an IFR departure clearance to the aircraft.
Procedure: departure
Phase: clearance
```

No external API call is made here.

---

### 3. Qdrant Retrieval

The `qdrantRetrieve` node performs two external operations.

#### A. Mistral Embeddings

The step query is sent to:

```text
POST https://api.mistral.ai/v1/embeddings
```

using:

```text
model: mistral-embed
```

The resulting vector is currently 1024 dimensions.

#### B. Qdrant Search

The vector is then sent to the configured Qdrant collection:

```text
roger_atc_knowledge
```

The search also applies metadata filters:

```text
procedure_type
phase
```

The top matching knowledge entries are returned as grounding.

Example:

```text
Qdrant results: 3
```

---

## 4. ATC Line Composition

The retrieved grounding, scenario slots, and step instruction are passed to Mistral.

Endpoint:

```text
POST https://api.mistral.ai/v1/chat/completions
```

Current model:

```text
mistral-large-latest
```

The model is instructed to:

* behave as an ATC controller
* use retrieved grounding as the authoritative source
* use scenario slots
* avoid inventing unsupported operational details
* return only the controller transmission
* keep the transmission concise

Example output:

```text
VTX123 cleared to Nagpur via standard instrument departure,
runway 27, climb to initial altitude 5000 feet,
departure frequency 121.2, squawk 4521.
```

---

## 5. Text-to-Speech

The generated ATC line is sent to Rime TTS.

Example:

```text
VTX123 cleared to Nagpur via standard instrument departure...
```

Rime returns the generated audio.

The audio is returned to the client through the session API.

---

## 6. Pilot Readback

The graph then reaches:

```text
awaitReadback
```

The workflow pauses until the pilot submits their response.

The next request uses:

```json
{
  "pilotTranscript": "VTX123 cleared for departure via Nagpur runway 27 squawk 4521"
}
```

The LangGraph session resumes using its `thread_id`.

---

## 7. Readback Validation

The current implementation validates the pilot response locally.

It uses:

```text
parseReadback()
validateAgainstExpected()
```

No Mistral request is required for this stage.

For example:

```text
Expected:

callsign: VTX123
runway: 27
departure: NAGPUR
squawk: 4521
```

Pilot:

```text
VTX123 cleared for departure via Nagpur runway 27 squawk 4521
```

Extracted:

```text
callsign: VTX123
runway: 27
departure: NAGPUR
squawk: 4521
confidence: high
```

Result:

```text
Readback valid: true
```

---

## 8. Incorrect Readback

If validation fails and retry count is below the limit:

```text
validateReadback
        │
        ▼
issueCorrection
        │
        ▼
ttsSpeak
        │
        ▼
awaitReadback
```

The correction is generated locally.

Example:

```text
Negative readback. VTX123, cleared to NAGPUR,
runway 27, squawk 4521.
```

No Mistral call is required.

---

## 9. Clarification

After too many failed readbacks, the graph enters:

```text
clarify
```

Example:

```text
Let's try that again. VTX123, cleared to NAGPUR,
runway 27, squawk 4521. Please read that back.
```

This is also generated locally.

The clarification is then sent through Rime TTS.

---

# Mistral Rate Limiting

Mistral is currently used by two different services:

```text
                 scheduleMistralRequest()
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
       Mistral Embed          Mistral Chat
       /embeddings             /chat/completions
```

The shared scheduler currently enforces:

```text
MIN_INTERVAL_MS = 1200
```

This prevents embedding and chat-completion requests from being fired immediately one after another.

The scheduler uses a promise queue so requests are serialized.

```text
Request A
   │
   ▼
Mistral
   │
   │ minimum interval
   ▼
Request B
   │
   ▼
Mistral
   │
   │ minimum interval
   ▼
Request C
```

The Mistral chat service additionally supports retries for transient failures:

```text
429
500
502
503
504
```

and request timeouts.

Current chat timeout:

```text
35000 ms
```

Maximum retry count:

```text
2
```

Therefore a request can make up to:

```text
3 attempts
```

---

# Current Mistral Behavior

Mistral response latency has been observed to vary significantly.

Successful requests have ranged from approximately:

```text
~1 second
```

to:

```text
~14 seconds
```

and occasionally close to the configured timeout.

Because of this, the service currently:

* uses a 35-second timeout
* retries transient failures
* serializes Mistral requests
* separates embedding and chat requests through the shared scheduler

The current architecture prioritizes reliability over minimum latency.

---

# API Endpoints

## Start Session / Generate ATC Instruction

```http
POST /sessions/:id/turn
```

Body:

```json
{
  "scenarioId": "departure-clearance"
}
```

Response:

```json
{
  "audioBase64": "...",
  "finished": false,
  "currentLine": "VTX123 cleared to Nagpur..."
}
```

---

## Submit Pilot Readback

```http
POST /sessions/:id/turn
```

Body:

```json
{
  "pilotTranscript": "VTX123 cleared for departure..."
}
```

Response:

```json
{
  "audioBase64": null,
  "finished": true,
  "currentLine": null
}
```

---

## Get Transcript

```http
GET /sessions/:id/transcript
```

Returns the persisted session transcript from MongoDB.

---

# State Management

The session is maintained using LangGraph with:

```text
MemorySaver
```

Each session uses:

```text
thread_id = sessionId
```

This allows subsequent HTTP requests to resume the same graph execution state.

Important state fields include:

```text
sessionId
scenarioId
steps
stepIndex
currentStep
grounding
currentLine
audioBase64
pilotTranscript
extracted
retries
finished
transcript
```

---

# Scenario Structure

Scenarios contain ordered steps.

A step generally contains:

```text
id
query
procedureType
phase
expected
```

Example:

```json
{
  "id": "landing-1",
  "query": "Issue a landing clearance to the aircraft.",
  "procedureType": "landing",
  "phase": "tower",
  "expected": {
    "callsign": "VTX123",
    "runway": "27"
  }
}
```

The `expected` object is used for readback validation and correction generation.

---

# Data Persistence

MongoDB stores the conversation transcript.

Each message contains information such as:

```text
sessionId
role
content
stepId
timestamp
```

The current controller implementation replaces the stored transcript for the session with the latest graph transcript.

---

# Project Components

The current AI service is organized approximately as:

```text
ai-service/
│
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
│
├── controllers/
│   └── aiSession.controller.js
│
├── routes/
│   └── aiSession.routes.js
│
├── services/
│   ├── mistral.service.js
│   ├── mistralRateLimiter.js
│   ├── qdrant.service.js
│   ├── readbackValidator.service.js
│   ├── latency.service.js
│   └── ...
│
├── config/
│   ├── db.js
│   └── qdrant.js
│
├── models/
│   └── chatMessage.model.js
│
├── data/
│   └── scenarios.js
│
├── sockets/
│   └── aiSession.socket.js
│
└── scripts/
    ├── aiSession.test.js
    └── ...
```

---

# External Services

| Service            | Purpose                              | Current usage          |
| ------------------ | ------------------------------------ | ---------------------- |
| Mistral Embeddings | Convert retrieval queries to vectors | `mistral-embed`        |
| Mistral Chat       | Generate ATC transmissions           | `mistral-large-latest` |
| Qdrant             | Retrieve grounded ATC knowledge      | `roger_atc_knowledge`  |
| Rime               | Generate controller speech           | TTS                    |
| MongoDB            | Persist transcripts                  | ChatMessage            |
| Socket.IO          | Realtime infrastructure              | AI session socket      |

---

# Testing

The primary integration test exercises complete scenarios through the HTTP API.

The current successful test output ends with:

```text
=================================
ALL SCENARIOS PASSED
=================================
```

A successful scenario demonstrates:

```text
Scenario start
    ↓
Qdrant retrieval
    ↓
Mistral ATC generation
    ↓
Rime TTS
    ↓
Pilot readback
    ↓
Readback validation
    ↓
Next scenario step
    ↓
...
    ↓
Session complete
```

---

# Current Performance Observations

Typical processing includes:

```text
Mistral Embedding
        +
Qdrant Retrieval
        +
Mistral Composition
        +
Rime TTS
```

Observed logs show that Qdrant retrieval commonly takes a few seconds because it includes the embedding request before the actual Qdrant search.

Rime TTS also contributes several seconds to the first response.

Mistral composition is currently the most variable component and can range from roughly one second to tens of seconds.

---

# Known Considerations

### 1. Mistral latency

Mistral latency is not deterministic. The same request can complete quickly or approach the timeout.

The service therefore uses:

* shared request scheduling
* retry handling
* timeout handling

### 2. Mistral rate limits

Embedding and chat completion use the same Mistral API key.

They therefore share the same scheduler.

### 3. Readback validation

The current validation path is deliberately local.

`extractReadback()` exists in the Mistral service but is not currently part of the active validation graph.

### 4. TTS latency

Rime TTS contributes a significant portion of end-to-end response latency.

### 5. Stateful execution

The client must preserve the same session ID because it maps to the LangGraph `thread_id`.

---

# Current Goal

The immediate objective is to build a reliable pilot–ATC training loop:

```text
Scenario
   ↓
Grounded ATC instruction
   ↓
Natural ATC voice
   ↓
Pilot response
   ↓
Readback validation
   ↓
Correction / advancement
   ↓
Next ATC interaction
```

The core workflow is currently operational and ready for the next development stage.
