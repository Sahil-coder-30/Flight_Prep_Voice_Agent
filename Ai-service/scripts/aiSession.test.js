import "dotenv/config";
import jwt from "jsonwebtoken";

const BASE_URL = "http://localhost:7000";

const sessionId = `test-${Date.now()}`;

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from .env");
}

const token = jwt.sign(
    {
        id: "test-user",
        email: "test@example.com",
    },
    process.env.JWT_SECRET,
    {
        expiresIn: "1h",
    }
);

async function requestTurn(body) {
    const response = await fetch(
        `${BASE_URL}/sessions/${sessionId}/turn`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        }
    );

    const text = await response.text();

    let data;

    try {
        data = JSON.parse(text);
    } catch {
        data = text;
    }

    console.log("\nHTTP:", response.status);
    console.log(JSON.stringify(data, null, 2));

    return data;
}

async function run() {
    console.log("\n=================================");
    console.log("ATC AI SERVICE TEST");
    console.log("=================================");
    console.log("Session:", sessionId);

    console.log("\n[1] Starting scenario...");

    const firstResponse = await requestTurn({});

    if (!firstResponse?.currentLine) {
        console.log("❌ ATC clearance was not generated.");
        return;
    }

    console.log("✅ ATC clearance generated.");
    console.log("   ", firstResponse.currentLine);

    console.log("\n[2] Sending correct pilot readback...");

    const secondResponse = await requestTurn({
        pilotTranscript:
            "Taxi via Alpha and hold short of runway 27",
    });

    if (secondResponse?.finished === true) {
        console.log("\n✅ PASS: Scenario completed successfully.");
    } else {
        console.log("\n❌ FAIL: Scenario did not complete.");
    }

    console.log("\n=================================");
    console.log("TEST COMPLETE");
    console.log("=================================\n");
}

run().catch((error) => {
    console.error("\n❌ TEST FAILED");
    console.error(error);
    process.exit(1);
});