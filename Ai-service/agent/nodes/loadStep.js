export async function loadStep(state) {
    const step = state.steps?.[state.stepIndex];

    if (!step) {
        console.log("[Agent] Scenario completed.");

        return {
            finished: true,
            currentStep: null,
        };
    }

    console.log(`[Agent] Loading step: ${step.id}`);

    return {
        finished: false,
        currentStep: step,
        currentLine: null,
        grounding: [],
        extracted: null,
    };
}