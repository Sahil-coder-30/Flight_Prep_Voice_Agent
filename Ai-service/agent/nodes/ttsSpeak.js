import { speak } from "../../services/tts.service.js";

export async function ttsSpeak(state) {
    if (!state.currentLine) {
        return {
            audioBase64: null,
        };
    }

    console.log("[Agent] Generating TTS...");

    const audioBase64 = await speak(state.currentLine);

    return {
        audioBase64,
    };
}