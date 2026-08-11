import { retrieve } from "../../services/qdrant.service.js";

export async function qdrantRetrieve(state) {
    const step = state.steps?.[state.stepIndex];

    if (!step) {
        return {
            grounding: [],
        };
    }

    console.log("[Agent] Qdrant query:", step.query);

    const results = await retrieve(
        step.query,
        step.procedureType,
        step.phase
    );

    console.log("[Qdrant] Number of results:", results.length);

    return {
        grounding: results,
    };
}