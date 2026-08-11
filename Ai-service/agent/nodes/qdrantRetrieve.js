import { retrieve } from "../../services/qdrant.service.js";
import { startTimer } from "../../services/latency.service.js";

export async function qdrantRetrieve(state) {
    const step =
        state.currentStep ??
        state.steps?.[state.stepIndex];

    if (!step) {
        return {
            grounding: [],
        };
    }

    console.log(
        "\n[Agent] ==============================="
    );

    console.log(
        "[Agent] QDRANT RETRIEVAL"
    );

    console.log(
        "[Agent] Step:",
        step.id
    );

    console.log(
        "[Agent] Query:",
        step.query
    );

    console.log(
        "[Agent] Procedure:",
        step.procedureType
    );

    console.log(
        "[Agent] Phase:",
        step.phase
    );

    console.log(
        "[Agent] ==============================="
    );

    const timer =
        startTimer(
            "Qdrant retrieval"
        );

    try {
        const results =
            await retrieve(
                step.query,
                step.procedureType,
                step.phase
            );

        timer.end(
            ` (${results.length} results)`
        );

        if (!results.length) {
            throw new Error(
                `No ATC knowledge found for procedure '${step.procedureType}' ` +
                `and phase '${step.phase}'`
            );
        }

        return {
            grounding: results,
        };

    } catch (error) {
        timer.end(" FAILED");

        console.error(
            "[Agent] Qdrant retrieval failed:",
            error
        );

        throw error;
    }
}