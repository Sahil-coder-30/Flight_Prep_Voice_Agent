export async function composeLine(state) {
    const grounding = state.grounding ?? [];

    if (!grounding.length) {
        throw new Error("No grounding available for composeLine");
    }

    const bestResult = grounding[0];

    const line = bestResult.text;

    if (!line) {
        throw new Error("Grounding result does not contain text");
    }

    console.log("[Agent] Composed ATC line:", line);

    return {
        currentLine: line,
        transcript: [
            {
                role: "assistant",
                content: line,
                stepId: state.stepIndex,
                timestamp: new Date(),
            },
        ],
    };
}