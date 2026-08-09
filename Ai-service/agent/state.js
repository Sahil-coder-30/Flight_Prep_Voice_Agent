const { Annotation } = require('@langchain/langgraph');

const AgentState = Annotation.Root({
    sessionId: Annotation(),
    stepIndex: Annotation({ default: () => 0, reducer: (_, n) => n }),
    steps: Annotation(),
    currentLine: Annotation(),
    audioBase64: Annotation(),
    pilotTranscript: Annotation(),
    extracted: Annotation(),
    retries: Annotation({ default: () => 0, reducer: (_, n) => n }),
    grounding: Annotation(),
    transcript: Annotation({
        default: () => [],
        reducer: (curr, add) => curr.concat(add),
    }),
    finished: Annotation({ default: () => false, reducer: (_, v) => v }),
});

module.exports = { AgentState };