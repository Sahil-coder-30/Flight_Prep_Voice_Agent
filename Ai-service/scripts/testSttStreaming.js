import "dotenv/config";
import fs from "fs";
import { createStreamingTranscriber } from "../services/stt.service.js";

const FILE = "test-stream.wav";

async function main() {
    const wav = fs.readFileSync(FILE);

    // WAV header is normally 44 bytes for this simple PCM WAV.
    const pcm = wav.subarray(44);

    console.log("WAV size:", wav.length);
    console.log("PCM size:", pcm.length);

    const transcriber = createStreamingTranscriber({
        vocabHints: [
            "taxi",
            "Alpha",
            "runway",
            "hold short",
        ],

        onTranscript: ({ transcript, isFinal, speechFinal }) => {
            if (speechFinal) {
                console.log(`\nFINAL: ${transcript}`);
            } else if (isFinal) {
                console.log(`FINAL SEGMENT: ${transcript}`);
            } else {
                console.log(`INTERIM: ${transcript}`);
            }
        },

        onError: (error) => {
            console.error("Streaming error:", error);
        },

        onClose: () => {
            console.log("Deepgram connection closed");
        },
    });

    // Wait for the WebSocket connection to open.
    await new Promise((resolve) => {
        const check = setInterval(() => {
            if (transcriber.isOpen?.()) {
                clearInterval(check);
                resolve();
            }
        }, 50);
    });

    const CHUNK_SIZE = 3200;

    for (let i = 0; i < pcm.length; i += CHUNK_SIZE) {
        const chunk = pcm.subarray(
            i,
            Math.min(i + CHUNK_SIZE, pcm.length)
        );

        transcriber.sendAudio(chunk);

        // Simulate real-time playback.
        const durationMs =
            (chunk.length / (16000 * 1 * 2)) * 1000;

        await new Promise((resolve) =>
            setTimeout(resolve, durationMs)
        );
    }

    console.log("\nAudio finished. Finalizing...");

    transcriber.finalize();

    await new Promise((resolve) => setTimeout(resolve, 2000));

    transcriber.close();
}

main().catch((error) => {
    console.error("Streaming STT test failed:");
    console.error(error);
});