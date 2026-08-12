import { Annotation } from '@langchain/langgraph';

const AgentState = Annotation.Root({
    // ── Session Identity ───────────────────────────────────────────────────────
    sessionId:         Annotation(),
    userId:            Annotation(),

    // ── Scenario Steps ─────────────────────────────────────────────────────────
    steps:             Annotation(),
    stepIndex:         Annotation({ default: () => 0, reducer: (_, n) => n }),
    currentStep:       Annotation(),   // full step object (populated by loadStep)
    resolvedSlots:     Annotation(),   // { callsign: 'N172SP', runway: '22L', ... }

    // ── Controller Output ──────────────────────────────────────────────────────
    currentLine:       Annotation(),   // rendered controller speech text
    audioBase64:       Annotation(),   // Rime TTS output

    // ── Pilot Input ────────────────────────────────────────────────────────────
    pilotTranscript:   Annotation(),
    extracted:         Annotation(),   // { callsign: 'N172SP', runway: '22L' } from LLM
    slotReport:        Annotation(),   // { callsign: true, runway: true, windDir: false }

    // ── Grounding from Qdrant ──────────────────────────────────────────────────
    grounding:         Annotation({ default: () => [], reducer: (_, v) => v }),

    // ── Flow Control ───────────────────────────────────────────────────────────
    retries:           Annotation({ default: () => 0, reducer: (_, n) => n }),
    finished:          Annotation({ default: () => false, reducer: (_, v) => v }),

    // ── Transcript Log ─────────────────────────────────────────────────────────
    transcript: Annotation({
        default:  () => [],
        reducer:  (curr, add) => curr.concat(Array.isArray(add) ? add : [add]),
    }),

    // ── Telemetry ──────────────────────────────────────────────────────────────
    turnStartMs:       Annotation(),   // performance.now() at turn entry
    stepResults:       Annotation({    // array of per-step scores for debrief
        default:  () => [],
        reducer:  (curr, add) => curr.concat(Array.isArray(add) ? add : [add]),
    }),
});

export { AgentState };