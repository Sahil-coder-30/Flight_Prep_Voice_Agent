import "dotenv/config";
import fs from "fs";
import { speak } from "../services/tts.service.js";

async function main() {
    const text = "Taxi via Alpha, hold short of runway 27.";

    console.log("Generating audio...");

    const audioBase64 = await speak(text);

    console.log("Audio generated.");
    console.log("Base64 length:", audioBase64.length);

    const audioBuffer = Buffer.from(audioBase64, "base64");

    fs.writeFileSync("test-output.mp3", audioBuffer);

    console.log("Saved: test-output.mp3");
}

main().catch((error) => {
    console.error("TTS test failed:");
    console.error(error);
});