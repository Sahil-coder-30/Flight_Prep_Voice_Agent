import { interrupt } from "@langchain/langgraph";
import { startTimer } from "../../services/latency.service.js";

export async function awaitReadback(state) {
    console.log("[Agent] Waiting for pilot readback...");

    const timer = startTimer("Pilot readback");

    const pilotTranscript = interrupt({
        type: "await_readback",
        sessionId: state.sessionId,
        stepIndex: state.stepIndex,
        currentLine: state.currentLine,
    });

    timer.end();

    return {
        pilotTranscript,
    };
}