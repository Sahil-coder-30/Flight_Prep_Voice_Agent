export async function advanceStep(state) {
    const nextIndex =
        state.stepIndex + 1;

    const finished =
        nextIndex >=
        (state.steps?.length ?? 0);

    return {
        stepIndex: nextIndex,

        currentStep: null,

        currentLine: null,

        audioBase64: null,

        grounding: [],

        extracted: null,

        pilotTranscript: null,

        retries: 0,

        finished,
    };
}