function buildExpectedReadback(expected) {
    const parts = [];

    if (expected.callsign) {
        parts.push(expected.callsign);
    }

    if (expected.departure) {
        parts.push(
            `cleared to ${expected.departure}`
        );
    }

    if (expected.runway) {
        parts.push(
            `runway ${expected.runway}`
        );
    }

    if (expected.squawk) {
        parts.push(
            `squawk ${expected.squawk}`
        );
    }

    if (expected.frequency) {
        parts.push(
            `contact departure on ${expected.frequency}`
        );
    }

    if (
        expected.taxiway &&
        expected.runway
    ) {
        parts.push(
            `taxi via ${expected.taxiway}`
        );

        parts.push(
            `hold short of runway ${expected.runway}`
        );
    }

    return parts.join(", ");
}

export async function clarify(state) {
    const step =
        state.currentStep ??
        state.steps?.[state.stepIndex];

    const expected =
        step?.expected ?? {};

    const expectedReadback =
        buildExpectedReadback(expected);

    const clarification =
        `Let's try that again. ${expectedReadback}. Please read that back.`;

    console.log(
        "[Agent] Clarification:",
        clarification
    );

    return {
        currentLine: clarification,

        audioBase64: null,

        retries: 0,

        transcript: [
            {
                role: "assistant",
                content: clarification,
                stepId: state.stepIndex,
                timestamp: new Date(),
            },
        ],
    };
}