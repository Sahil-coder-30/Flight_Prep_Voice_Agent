import { Annotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
    sessionId: Annotation({
        reducer: (_, value) => value,
        default: () => null,
    }),

    steps: Annotation({
        reducer: (_, value) => value,
        default: () => [],
    }),

    stepIndex: Annotation({
        reducer: (_, value) => value,
        default: () => 0,
    }),

    currentLine: Annotation({
        reducer: (_, value) => value,
        default: () => null,
    }),

    audioBase64: Annotation({
        reducer: (_, value) => value,
        default: () => null,
    }),

    pilotTranscript: Annotation({
        reducer: (_, value) => value,
        default: () => null,
    }),

    extracted: Annotation({
        reducer: (_, value) => value,
        default: () => null,
    }),

    retries: Annotation({
        reducer: (_, value) => value,
        default: () => 0,
    }),

    grounding: Annotation({
        reducer: (_, value) => value,
        default: () => [],
    }),

    transcript: Annotation({
        reducer: (current, added) => current.concat(added),
        default: () => [],
    }),

    finished: Annotation({
        reducer: (_, value) => value,
        default: () => false,
    }),
});