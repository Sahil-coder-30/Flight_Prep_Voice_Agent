import { composeLine as generateATCLine } from "../../services/mistral.service.js";
import { speak } from "../../services/tts.service.js";

export async function issueCorrection(state) {
    const step = state.steps?.[state.stepIndex];

    const correction = await generateATCLine({
        grounding: state.grounding ?? [],
        slots: state.extracted ?? {},
        instruction: `
The pilot's readback was incorrect.

Pilot said:
${state.pilotTranscript ?? ""}

Expected:
${JSON.stringify(step?.expected ?? {})}

Issue a short ATC correction.
Do not invent phraseology.
`,
    });

    const audioBase64 = await speak(correction);

    return {
        currentLine: correction,
        audioBase64,
        retries: (state.retries ?? 0) + 1,
    };
}