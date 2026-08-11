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

    if (
        expected.hold_short &&
        !expected.taxiway
    ) {
        parts.push(
            `hold short of ${expected.hold_short}`
        );
    }

    return parts.join(", ");
}

export async function issueCorrection(state) {
    const step =
        state.currentStep ??
        state.steps?.[state.stepIndex];

    const expected =
        step?.expected ?? {};

    const expectedReadback =
        buildExpectedReadback(expected);

    const correction =
        `Negative readback. ${expectedReadback}.`;

    console.log(
        "[Agent] Correction:",
        correction
    );

    return {
        currentLine: correction,

        audioBase64: null,

        transcript: [
            {
                role: "assistant",
                content: correction,
                stepId: state.stepIndex,
                timestamp: new Date(),
            },
        ],
    };
}