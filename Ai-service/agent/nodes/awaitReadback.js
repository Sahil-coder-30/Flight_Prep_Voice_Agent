import { interrupt } from "@langchain/langgraph";

export async function awaitReadback(state) {
    console.log("[Agent] Waiting for pilot readback...");

    const pilotTranscript = interrupt({
        type: "await_readback",
        sessionId: state.sessionId,
        stepIndex: state.stepIndex,
        currentLine: state.currentLine,
    });

    console.log("[Agent] Received pilot readback:", pilotTranscript);

    return {
        pilotTranscript,
    };
}