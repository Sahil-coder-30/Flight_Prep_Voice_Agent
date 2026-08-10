import "dotenv/config";
import fs from "fs";
import { transcribe } from "../services/stt.service.js";

async function main() {
    const audioBuffer = fs.readFileSync("test-input.wav");

    const audioBase64 = audioBuffer.toString("base64");

    console.log("Audio size:", audioBuffer.length, "bytes");
    console.log("Transcribing...");

    const transcript = await transcribe(audioBase64, [
        "taxi",
        "Alpha",
        "runway",
        "hold short",
    ]);

    console.log("\nTranscript:");
    console.log(transcript);
}

main().catch((error) => {
    console.error("STT test failed:");
    console.error(error);
});