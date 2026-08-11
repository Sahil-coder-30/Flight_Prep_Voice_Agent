import { speak } from "../../services/tts.service.js";
import { startTimer } from "../../services/latency.service.js";

export async function ttsSpeak(state) {
    if (!state.currentLine) {
        return {
            audioBase64: null,
        };
    }

    console.log("[Agent] Generating TTS...");

    const timer = startTimer("Rime TTS");

    const audioBase64 = await speak(state.currentLine);

    timer.end();

    return {
        audioBase64,
    };
}