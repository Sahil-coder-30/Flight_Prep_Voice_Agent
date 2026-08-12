import {
    parseReadback,
    validateAgainstExpected,
} from "../../services/readbackValidator.service.js";

import {
    startTimer,
} from "../../services/latency.service.js";

export async function validateReadback(state) {
    const transcript =
        state.pilotTranscript;

    const currentRetries =
        state.retries ?? 0;

    if (!transcript) {
        return {
            extracted: {
                valid: false,
                confidence: "unknown",
            },

            retries:
                currentRetries + 1,
        };
    }

    const step =
        state.currentStep ??
        state.steps?.[state.stepIndex];

    const expected =
        step?.expected ?? {};

    console.log(
        "[Agent] Validating readback:",
        transcript
    );

    const timer =
        startTimer(
            "Readback validation"
        );

    const extracted =
        parseReadback(
            transcript,
            expected
        );

    const valid =
        validateAgainstExpected(
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

    const retries = valid
        ? 0
        : currentRetries + 1;

    console.log(
        "[Agent] Readback attempt:",
        retries,
        "/ 3"
    );

    return {
        extracted: {
            ...extracted,
            valid,
        },

        retries,

        pilotTranscript:
            transcript,
    };
}