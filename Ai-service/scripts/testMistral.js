import "dotenv/config";
import {
    composeLine,
    extractReadback,
} from "../services/mistral.service.js";

const start = Date.now();

function elapsed() {
    return `${Date.now() - start}ms`;
}

async function runTest(name, fn) {
    console.log(`[${elapsed()}] ${name} queued`);

    try {
        const result = await fn();

        console.log(
            `[${elapsed()}] ${name} completed`
        );

        return {
            name,
            success: true,
            result,
        };
    } catch (error) {
        console.log(
            `[${elapsed()}] ${name} FAILED`
        );

        console.log(error.message);

        return {
            name,
            success: false,
            error,
        };
    }
}

async function main() {
    console.log("\n=================================");
    console.log("MISTRAL RATE LIMIT TEST");
    console.log("=================================\n");

    const requests = [
        runTest("compose-1", () =>
            composeLine({
                grounding: [
                    "Taxi via Alpha and hold short of runway 27.",
                ],
                slots: {
                    runway: "27",
                    taxiway: "Alpha",
                },
                instruction:
                    "Generate the ATC instruction.",
            })
        ),

        runTest("extract-1", () =>
            extractReadback(
                "Taxi via Alpha and hold short of runway 27.",
                {
                    taxiway: null,
                    runway: null,
                    hold_short: null,
                }
            )
        ),

        runTest("compose-2", () =>
            composeLine({
                grounding: [
                    "Taxi via Alpha and hold short of runway 27.",
                ],
                slots: {
                    runway: "27",
                    taxiway: "Alpha",
                },
                instruction:
                    "Generate the ATC instruction.",
            })
        ),

        runTest("extract-2", () =>
            extractReadback(
                "Taxi via Alpha and hold short of runway 27.",
                {
                    taxiway: null,
                    runway: null,
                    hold_short: null,
                }
            )
        ),

        runTest("compose-3", () =>
            composeLine({
                grounding: [
                    "Taxi via Alpha and hold short of runway 27.",
                ],
                slots: {
                    runway: "27",
                    taxiway: "Alpha",
                },
                instruction:
                    "Generate the ATC instruction.",
            })
        ),

        runTest("extract-3", () =>
            extractReadback(
                "Taxi via Alpha and hold short of runway 27.",
                {
                    taxiway: null,
                    runway: null,
                    hold_short: null,
                }
            )
        ),
    ];

    const results = await Promise.all(requests);

    console.log("\n=================================");
    console.log("RESULTS");
    console.log("=================================\n");

    let successful = 0;

    for (const result of results) {
        if (result.success) {
            successful++;
            console.log(`✅ ${result.name}`);
        } else {
            console.log(`❌ ${result.name}`);
        }
    }

    console.log(
        `\nSuccessful: ${successful}/${results.length}`
    );

    if (successful !== results.length) {
        process.exit(1);
    }

    console.log("\n✅ RATE LIMIT TEST PASSED\n");
}

main().catch((error) => {
    console.error("\n❌ TEST FAILED");
    console.error(error);
    process.exit(1);
});