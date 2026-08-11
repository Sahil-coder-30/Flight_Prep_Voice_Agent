import "dotenv/config";
import jwt from "jsonwebtoken";

const BASE_URL =
    "http://localhost:7000";

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

async function requestTurn(
    sessionId,
    body
) {
    const response =
        await fetch(
            `${BASE_URL}/sessions/${sessionId}/turn`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${token}`,
                },

                body:
                    JSON.stringify(body),
            }
        );

    const text =
        await response.text();

    let data;

    try {
        data =
            JSON.parse(text);
    } catch {
        data = text;
    }

    console.log(
        "\nHTTP:",
        response.status
    );

    console.log(
        JSON.stringify(
            data,
            null,
            2
        )
    );

    if (!response.ok) {
        throw new Error(
            data?.message ??
            data?.error ??
            `HTTP ${response.status}`
        );
    }

    return data;
}

async function testScenario(
    scenarioId,
    pilotTranscript
) {
    const sessionId =
        `test-${scenarioId}-${Date.now()}`;

    console.log(
        "\n================================="
    );

    console.log(
        `SCENARIO: ${scenarioId}`
    );

    console.log(
        "Session:",
        sessionId
    );

    console.log(
        "\n[1] Starting scenario..."
    );

    const first =
        await requestTurn(
            sessionId,
            {
                scenarioId,
            }
        );

    if (!first.currentLine) {
        throw new Error(
            `${scenarioId}: ATC instruction was not generated`
        );
    }

    console.log(
        "\n✅ ATC instruction generated:"
    );

    console.log(
        first.currentLine
    );

    if (!first.audioBase64) {
        throw new Error(
            `${scenarioId}: TTS audio was not generated`
        );
    }

    console.log(
        "✅ TTS audio generated"
    );

    console.log(
        "\n[2] Sending pilot readback..."
    );

    console.log(
        pilotTranscript
    );

    const second =
        await requestTurn(
            sessionId,
            {
                pilotTranscript,
            }
        );

    if (!second.finished) {
        throw new Error(
            `${scenarioId}: scenario did not finish`
        );
    }

    console.log(
        `\n✅ ${scenarioId}: PASS`
    );
}

async function main() {
    console.log(
        "\n================================="
    );

    console.log(
        "ATC AI SERVICE TEST"
    );

    console.log(
        "================================="
    );

    await testScenario(
        "departure-clearance",

        "VTX123 cleared for departure via Nagpur runway 27 squawk 4521"
    );

    await testScenario(
        "landing-clearance",

        "VTX123 cleared to land runway 27"
    );

    await testScenario(
        "frequency-change",

        "VTX123 contact departure on 124.7"
    );

    console.log(
        "\n================================="
    );

    console.log(
        "ALL SCENARIOS PASSED"
    );

    console.log(
        "=================================\n"
    );
}

main().catch((error) => {
    console.error(
        "\n❌ TEST SUITE FAILED"
    );

    console.error(error);

    process.exit(1);
});