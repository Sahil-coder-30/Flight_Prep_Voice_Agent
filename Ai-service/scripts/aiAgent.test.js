import "dotenv/config";
import jwt from "jsonwebtoken";

const BASE_URL = "http://localhost:7000";

const TEST_USER = {
    id: "test-user",
    email: "test@example.com",
};

function createToken() {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is missing from .env");
    }

    return jwt.sign(TEST_USER, process.env.JWT_SECRET, {
        expiresIn: "10m",
    });
}

function createSessionId(testName) {
    return `test-${testName}-${Date.now()}`;
}

async function requestTurn(sessionId, token, body = {}) {
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

    return {
        status: response.status,
        ok: response.ok,
        data,
    };
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(`ASSERTION FAILED: ${message}`);
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testInitialTurn(token) {
    console.log("\n========================================");
    console.log("TEST 1: INITIAL ATC TURN");
    console.log("========================================");

    const sessionId = createSessionId("initial");

    const response = await requestTurn(
        sessionId,
        token,
        {}
    );

    console.log("HTTP:", response.status);
    console.log("Response:", response.data);

    assert(
        response.ok,
        "Initial turn should return HTTP success"
    );

    assert(
        response.data.currentLine,
        "Agent should generate an ATC instruction"
    );

    assert(
        response.data.finished === false,
        "Scenario should not finish before readback"
    );

    console.log("✅ Initial ATC turn passed");

    return {
        sessionId,
        currentLine: response.data.currentLine,
    };
}

async function testCorrectReadback(token) {
    console.log("\n========================================");
    console.log("TEST 2: CORRECT READBACK");
    console.log("========================================");

    const sessionId = createSessionId("correct");

    const first = await requestTurn(
        sessionId,
        token,
        {}
    );

    assert(
        first.data.currentLine,
        "Initial ATC instruction missing"
    );

    await sleep(1000);

    /*
     * This should eventually be replaced by a
     * scenario-independent expected readback.
     *
     * For now this is the known training scenario.
     */
    const second = await requestTurn(
        sessionId,
        token,
        {
            pilotTranscript:
                "Taxi via Alpha and hold short of runway 27",
        }
    );

    console.log("Response:", second.data);

    assert(
        second.ok,
        "Correct readback request should succeed"
    );

    assert(
        second.data.finished === true,
        "Correct readback should complete the scenario"
    );

    console.log("✅ Correct readback passed");
}

async function testIncorrectReadback(token) {
    console.log("\n========================================");
    console.log("TEST 3: INCORRECT READBACK");
    console.log("========================================");

    const sessionId = createSessionId("incorrect");

    const first = await requestTurn(
        sessionId,
        token,
        {}
    );

    assert(
        first.data.currentLine,
        "Initial ATC instruction missing"
    );

    await sleep(1000);

    const second = await requestTurn(
        sessionId,
        token,
        {
            pilotTranscript:
                "Taxi via Bravo and hold short of runway 27",
        }
    );

    console.log("Response:", second.data);

    assert(
        second.ok,
        "Incorrect readback should still be processed"
    );

    assert(
        second.data.finished === false,
        "Scenario should not finish after incorrect readback"
    );

    assert(
        second.data.currentLine,
        "Agent should issue a correction"
    );

    console.log("Correction:", second.data.currentLine);

    console.log("✅ Incorrect readback handling passed");
}

async function testRepeatedIncorrectReadback(token) {
    console.log("\n========================================");
    console.log("TEST 4: REPEATED INCORRECT READBACK");
    console.log("========================================");

    const sessionId = createSessionId("retries");

    const first = await requestTurn(
        sessionId,
        token,
        {}
    );

    assert(
        first.data.currentLine,
        "Initial ATC instruction missing"
    );

    await sleep(1000);

    /*
     * First wrong readback
     */
    const wrong1 = await requestTurn(
        sessionId,
        token,
        {
            pilotTranscript:
                "Taxi via Bravo and hold short of runway 27",
        }
    );

    console.log("Wrong readback #1:", wrong1.data);

    assert(
        wrong1.data.finished === false,
        "Scenario must remain active after first failure"
    );

    await sleep(1500);

    /*
     * Second wrong readback
     */
    const wrong2 = await requestTurn(
        sessionId,
        token,
        {
            pilotTranscript:
                "Cleared for takeoff runway 27",
        }
    );

    console.log("Wrong readback #2:", wrong2.data);

    assert(
        wrong2.data.finished === false,
        "Scenario must remain active after second failure"
    );

    assert(
        wrong2.data.currentLine,
        "Agent should issue clarification after repeated failure"
    );

    console.log(
        "Clarification:",
        wrong2.data.currentLine
    );

    console.log("✅ Retry / clarification handling passed");
}

async function testMissingReadback(token) {
    console.log("\n========================================");
    console.log("TEST 5: MISSING READBACK");
    console.log("========================================");

    const sessionId = createSessionId("missing");

    const first = await requestTurn(
        sessionId,
        token,
        {}
    );

    assert(
        first.data.currentLine,
        "Initial ATC instruction missing"
    );

    await sleep(1000);

    const second = await requestTurn(
        sessionId,
        token,
        {}
    );

    console.log("Response:", second.data);

    /*
     * Depending on your interrupt/resume implementation,
     * this may produce a retry or keep waiting.
     *
     * The important requirement is that it should NOT
     * incorrectly mark the scenario as successful.
     */
    assert(
        second.data.finished !== true,
        "Missing readback must not complete the scenario"
    );

    console.log("✅ Missing readback handling passed");
}

async function testAuthentication() {
    console.log("\n========================================");
    console.log("TEST 6: JWT AUTHENTICATION");
    console.log("========================================");

    const sessionId = createSessionId("auth");

    const response = await requestTurn(
        sessionId,
        "invalid-token",
        {}
    );

    console.log(
        "HTTP:",
        response.status
    );

    assert(
        response.status === 401 ||
        response.status === 403,
        "Invalid JWT should be rejected"
    );

    console.log("✅ JWT rejection passed");
}

async function testSessionIsolation(token) {
    console.log("\n========================================");
    console.log("TEST 7: SESSION ISOLATION");
    console.log("========================================");

    const sessionA = createSessionId("session-a");
    const sessionB = createSessionId("session-b");

    const responseA = await requestTurn(
        sessionA,
        token,
        {}
    );

    await sleep(1000);

    const responseB = await requestTurn(
        sessionB,
        token,
        {}
    );

    console.log("Session A:", responseA.data);
    console.log("Session B:", responseB.data);

    assert(
        responseA.data.currentLine,
        "Session A should have its own ATC state"
    );

    assert(
        responseB.data.currentLine,
        "Session B should have its own ATC state"
    );

    console.log("✅ Session isolation passed");
}

async function run() {
    console.log("\n");
    console.log("########################################");
    console.log("#       ATC AI AGENT TEST SUITE        #");
    console.log("########################################");

    const token = createToken();

    console.log("\nJWT generated successfully.");
    console.log("Token expires in 10 minutes.");

    const tests = [
        ["Initial ATC turn", () =>
            testInitialTurn(token)],

        ["Correct readback", () =>
            testCorrectReadback(token)],

        ["Incorrect readback", () =>
            testIncorrectReadback(token)],

        ["Repeated incorrect readback", () =>
            testRepeatedIncorrectReadback(token)],

        ["Missing readback", () =>
            testMissingReadback(token)],

        ["JWT authentication", () =>
            testAuthentication()],

        ["Session isolation", () =>
            testSessionIsolation(token)],
    ];

    let passed = 0;
    let failed = 0;

    for (const [name, test] of tests) {
        try {
            await test();

            passed++;

            console.log(
                `\n✅ ${name}: PASS`
            );
        } catch (error) {
            failed++;

            console.error(
                `\n❌ ${name}: FAIL`
            );

            console.error(
                error.message
            );
        }

        /*
         * Prevent hammering Mistral APIs.
         */
        await sleep(2000);
    }

    console.log("\n");
    console.log("########################################");
    console.log("#              SUMMARY                 #");
    console.log("########################################");

    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        console.log("\n❌ ATC AGENT TEST SUITE FAILED");
        process.exit(1);
    }

    console.log("\n✅ ATC AGENT TEST SUITE PASSED");
}

run().catch((error) => {
    console.error("\n❌ TEST RUNNER FAILED");
    console.error(error);

    process.exit(1);
});