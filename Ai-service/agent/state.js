import { Annotation } from '@langchain/langgraph';

const keep = (curr, next) => (next !== undefined ? next : curr);

const AgentState = Annotation.Root({
    // ── Session Identity ───────────────────────────────────────────────────────
    sessionId:         Annotation({ default: () => null, reducer: keep }),
    userId:            Annotation({ default: () => null, reducer: keep }),
    aircraftCallsign:  Annotation({ default: () => 'N172SP', reducer: keep }),
    airport:           Annotation({ default: () => 'KBOS', reducer: keep }),

    // ── Scenario Steps ─────────────────────────────────────────────────────────
    steps:             Annotation({ default: () => [], reducer: keep }),
    stepIndex:         Annotation({ default: () => 0, reducer: keep }),
    currentStep:       Annotation({ default: () => null, reducer: keep }),   // full step object (populated by loadStep)
    resolvedSlots:     Annotation({ default: () => ({}), reducer: keep }),   // { callsign: 'N172SP', runway: '22L', ... }

    // ── Controller Output ──────────────────────────────────────────────────────
    currentLine:       Annotation({ default: () => '', reducer: keep }),   // rendered controller speech text
    audioBase64:       Annotation({ default: () => null, reducer: keep }),   // Rime TTS output

    // ── Pilot Input ────────────────────────────────────────────────────────────
    pilotTranscript:   Annotation({ default: () => '', reducer: keep }),
    extracted:         Annotation({ default: () => ({}), reducer: keep }),   // { callsign: 'N172SP', runway: '22L' } from LLM
    slotReport:        Annotation({ default: () => ({}), reducer: keep }),   // { callsign: true, runway: true, windDir: false }

    // ── Grounding from Qdrant ──────────────────────────────────────────────────
    grounding:         Annotation({ default: () => [], reducer: (c, v) => (v !== undefined ? v : c) }),

    // ── Flow Control ───────────────────────────────────────────────────────────
    retries:           Annotation({ default: () => 0, reducer: keep }),
    finished:          Annotation({ default: () => false, reducer: keep }),
    isGeneralQuery:    Annotation({ default: () => false, reducer: keep }),
    allPassed:         Annotation({ default: () => false, reducer: keep }),

    // ── Transcript Log ─────────────────────────────────────────────────────────
    transcript: Annotation({
        default:  () => [],
        reducer:  (curr, add) => (add ? curr.concat(Array.isArray(add) ? add : [add]) : curr),
    }),

    // ── Telemetry ──────────────────────────────────────────────────────────────
    turnStartMs:       Annotation({ default: () => Date.now(), reducer: keep }),
    stepResults:       Annotation({    // array of per-step scores for debrief
        default:  () => [],
        reducer:  (curr, add) => (add ? curr.concat(Array.isArray(add) ? add : [add]) : curr),
    }),
});

export { AgentState };