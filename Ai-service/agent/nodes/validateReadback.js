import {
    parseReadback,
    validateAgainstExpected,
} from "../../services/readbackValidator.service.js";

import { startTimer } from "../../services/latency.service.js";

export async function validateReadback(state) {
    const transcript = state.pilotTranscript;

    if (!transcript) {
        return {
            extracted: {
                valid: false,
                confidence: "unknown",
            },
            retries: (state.retries ?? 0) + 1,
        };
    }

    const step =
        state.currentStep ??
        state.steps?.[state.stepIndex];

    const expected = step?.expected ?? {};

    console.log(
        "[Agent] Validating readback:",
        transcript
    );

    const timer = startTimer(
        "Readback validation"
    );

    const extracted = parseReadback(
        transcript,
        expected
    );

    const valid = validateAgainstExpected(
        extracted,
        expected
    );

    timer.end();

    console.log(
        "[Agent] Pilot transcript:",
        transcript
    );

    console.log(
        "[Agent] Extracted:",
        extracted
    );

    console.log(
        "[Agent] Expected:",
        expected
    );

    console.log(
        "[Agent] Readback valid:",
        valid
    );

    return {
        extracted: {
            ...extracted,
            valid,
        },

        retries: valid
            ? 0
            : (state.retries ?? 0) + 1,

        pilotTranscript: transcript,
    };
}