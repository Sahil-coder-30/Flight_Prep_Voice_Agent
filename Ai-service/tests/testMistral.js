import "dotenv/config";
import {
    composeLine,
    extractReadback,
} from "../services/mistral.service.js";

async function testComposeLine() {
    console.log("\n--- Testing composeLine ---");

    const response = await composeLine({
        grounding: [
            "Taxi via Alpha and hold short of runway 27.",
            "Read back runway assignment and taxi instructions.",
        ],
        slots: {
            runway: "27",
            taxiway: "Alpha",
        },
        instruction: "Generate the ATC taxi instruction.",
    });

    console.log("Mistral response:");
    console.log(response);
}

async function testExtractReadback() {
    console.log("\n--- Testing extractReadback ---");

    const result = await extractReadback(
        "Taxi via Alpha, hold short runway 27.",
        {
            taxiway: null,
            runway: null,
            hold_short: null,
        }
    );

    console.log("Extracted readback:");
    console.dir(result, { depth: null });
}

async function main() {
    await testComposeLine();
    await testExtractReadback();
}

main().catch((error) => {
    console.error("Mistral test failed:");
    console.error(error);
});