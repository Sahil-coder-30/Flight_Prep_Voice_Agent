import { extractReadback } from "../../services/mistral.service.js";

export async function validateReadback(state) {
    const transcript = state.pilotTranscript;

    console.log("[Agent] Validating readback:", transcript);

    if (!transcript || typeof transcript !== "string") {
        console.log("[Agent] No valid pilot transcript received.");

        return {
            extracted: {
                valid: false,
            },
            retries: (state.retries ?? 0) + 1,
        };
    }

    const step = state.steps?.[state.stepIndex];

    const expectedShape = {
        taxiway: null,
        runway: null,
        hold_short: null,
    };

    const extracted = await extractReadback(
        transcript,
        expectedShape
    );

    const expected = step?.expected ?? {};

    let valid = true;

    for (const key of Object.keys(expected)) {
        if (extracted[key] !== expected[key]) {
            valid = false;
            break;
        }
    }

    console.log("[Agent] Pilot transcript:", transcript);
    console.log("[Agent] Extracted:", extracted);
    console.log("[Agent] Expected:", expected);
    console.log("[Agent] Readback valid:", valid);

    return {
        extracted: {
            ...extracted,
            valid,
        },

        retries: valid
            ? 0
            : (state.retries ?? 0) + 1,
    };
}