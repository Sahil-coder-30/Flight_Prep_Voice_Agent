import "dotenv/config";
import jwt from "jsonwebtoken";

const BASE_URL = "http://localhost:7000";

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

async function requestTurn(sessionId, body) {
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

    if (!response.ok) {
        throw new Error(
            data?.message ??
            data?.error ??
            `HTTP ${response.status}`
        );
    }

    return data;
}

async function main() {
    const sessionId =
        `test-clarify-${Date.now()}`;

    console.log("\n=================================");
    console.log("ATC CLARIFICATION TEST");
    console.log("=================================");

    // ─────────────────────────────
    // 1. START
    // ─────────────────────────────

    console.log("\n[1] Starting scenario...");

    const first = await requestTurn(
        sessionId,
        {
            scenarioId:
                "departure-clearance",
        }
    );

    if (!first.currentLine) {
        throw new Error(
            "Initial ATC instruction missing"
        );
    }

    console.log(
        "\n✅ Initial ATC:",
        first.currentLine
    );

    // ─────────────────────────────
    // 2. WRONG READBACK #1
    // ─────────────────────────────

    console.log("\n[2] Wrong readback #1");

    const wrong1 = await requestTurn(
        sessionId,
        {
            pilotTranscript:
                "VTX123 cleared to Delhi runway 18 squawk 1111",
        }
    );

    if (wrong1.finished) {
        throw new Error(
            "Scenario finished after wrong readback #1"
        );
    }

    console.log(
        "✅ Correction #1 received:",
        wrong1.currentLine
    );

    // ─────────────────────────────
    // 3. WRONG READBACK #2
    // ─────────────────────────────

    console.log("\n[3] Wrong readback #2");

    const wrong2 = await requestTurn(
        sessionId,
        {
            pilotTranscript:
                "VTX123 cleared to Mumbai runway 09 squawk 2222",
        }
    );

    if (wrong2.finished) {
        throw new Error(
            "Scenario finished after wrong readback #2"
        );
    }

    console.log(
        "✅ Correction #2 received:",
        wrong2.currentLine
    );

    // ─────────────────────────────
    // 4. WRONG READBACK #3
    // ─────────────────────────────

    console.log("\n[4] Wrong readback #3");

    const wrong3 = await requestTurn(
        sessionId,
        {
            pilotTranscript:
                "VTX123 cleared to Jaipur runway 14 squawk 3333",
        }
    );

    if (wrong3.finished) {
        throw new Error(
            "Scenario finished after wrong readback #3"
        );
    }

    if (!wrong3.currentLine) {
        throw new Error(
            "Clarification message missing"
        );
    }

    console.log(
        "✅ Clarification received:",
        wrong3.currentLine
    );

    // ─────────────────────────────
    // 5. CORRECT READBACK
    // ─────────────────────────────

    console.log("\n[5] Correct readback");

    const correct = await requestTurn(
        sessionId,
        {
            pilotTranscript:
                "VTX123 cleared for departure via Nagpur runway 27 squawk 4521",
        }
    );

    if (!correct.finished) {
        throw new Error(
            "Scenario did not finish after clarification"
        );
    }

    console.log(
        "\n================================="
    );

    console.log(
        "✅ CLARIFICATION TEST PASSED"
    );

    console.log(
        "=================================\n"
    );
}

main().catch((error) => {
    console.error(
        "\n❌ CLARIFICATION TEST FAILED"
    );

    console.error(
        error.message
    );

    process.exit(1);
});