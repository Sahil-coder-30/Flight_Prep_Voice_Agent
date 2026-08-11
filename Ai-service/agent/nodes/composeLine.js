import { composeLine as generateATCLine } from "../../services/mistral.service.js";

export async function composeLine(state) {
    const grounding =
        state.grounding ?? [];

    if (!grounding.length) {
        throw new Error(
            "No grounding available for composeLine"
        );
    }

    const step =
        state.currentStep ??
        state.steps?.[state.stepIndex];

    if (!step) {
        throw new Error(
            "No current step available for composeLine"
        );
    }

    const line =
        await generateATCLine({
            grounding,

            slots:
                step.expected ?? {},

            instruction:
                step.query,
        });

    console.log(
        "[Agent] Composed ATC line:",
        line
    );

    return {
        currentLine: line,

        transcript: [
            {
                role: "assistant",

                content: line,

                stepId:
                    state.stepIndex,

                timestamp:
                    new Date(),
            },
        ],
    };
}