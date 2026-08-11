import "dotenv/config";
import jwt from "jsonwebtoken";

const BASE_URL = "http://localhost:7000";

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from .env");
}

function createToken() {
    return jwt.sign(
        {
            id: "test-user",
            email: "test@example.com",
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1h",
        }
    );
}

const token = createToken();

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

    return {
        status: response.status,
        data,
    };
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(`ASSERTION FAILED: ${message}`);
    }
}

function printResult(label, result) {
    console.log(`\n${label}`);
    console.log("HTTP:", result.status);
    console.log(JSON.stringify(result.data, null, 2));
}

async function testCorrectReadback() {
    console.log("\n=================================");
    console.log("TEST 1: CORRECT READBACK");
    console.log("=================================");

    const sessionId = `correct-${Date.now()}`;

    const first = await requestTurn(sessionId, {});

    printResult("[1] Initial turn", first);

    assert(
        first.status === 200,
        "Initial request should return HTTP 200"
    );

    assert(
        first.data.currentLine,
        "ATC clearance should be generated"
    );

    assert(
        first.data.audioBase64,
        "TTS audio should be returned"
    );

    assert(
        first.data.finished === false,
        "Scenario should wait for readback"
    );

    const second = await requestTurn(sessionId, {
        pilotTranscript:
            "Taxi via Alpha and hold short of runway 27",
    });

    printResult("[2] Correct readback", second);

    assert(
        second.status === 200,
        "Correct readback should return HTTP 200"
    );

    assert(
        second.data.finished === true,
        "Correct readback should finish the scenario"
    );

    console.log("✅ TEST 1 PASSED");
}

async function testWrongReadback() {
    console.log("\n=================================");
    console.log("TEST 2: WRONG READBACK");
    console.log("=================================");

    const sessionId = `wrong-${Date.now()}`;

    const first = await requestTurn(sessionId, {});

    printResult("[1] Initial turn", first);

    assert(
        first.data.currentLine,
        "ATC clearance should be generated"
    );

    const second = await requestTurn(sessionId, {
        pilotTranscript:
            "Taxi via Bravo and hold short of runway 27",
    });

    printResult("[2] Wrong readback", second);

    assert(
        second.status === 200,
        "Wrong readback should return HTTP 200"
    );

    assert(
        second.data.finished === false,
        "Scenario must not finish after wrong readback"
    );

    assert(
        second.data.currentLine,
        "Correction should be generated"
    );

    console.log("✅ TEST 2 PASSED");
}

async function testSecondWrongReadback() {
    console.log("\n=================================");
    console.log("TEST 3: MULTIPLE WRONG READBACKS");
    console.log("=================================");

    const sessionId = `retry-${Date.now()}`;

    const first = await requestTurn(sessionId, {});

    printResult("[1] Initial turn", first);

    assert(
        first.data.currentLine,
        "ATC clearance should be generated"
    );

    const wrong1 = await requestTurn(sessionId, {
        pilotTranscript:
            "Taxi via Bravo and hold short of runway 27",
    });

    printResult("[2] First wrong readback", wrong1);

    assert(
        wrong1.data.finished === false,
        "Scenario should continue after first error"
    );

    const wrong2 = await requestTurn(sessionId, {
        pilotTranscript:
            "Cleared for takeoff runway 27",
    });

    printResult("[3] Second wrong readback", wrong2);

    assert(
        wrong2.data.finished === false,
        "Scenario should still be active"
    );

    assert(
        wrong2.data.currentLine,
        "Agent should provide another response"
    );

    console.log("✅ TEST 3 PASSED");
}

async function testEventuallyCorrectReadback() {
    console.log("\n=================================");
    console.log("TEST 4: WRONG → CORRECT");
    console.log("=================================");

    const sessionId = `recovery-${Date.now()}`;

    const first = await requestTurn(sessionId, {});

    printResult("[1] Initial turn", first);

    const wrong = await requestTurn(sessionId, {
        pilotTranscript:
            "Taxi via Bravo and hold short of runway 27",
    });

    printResult("[2] Wrong readback", wrong);

    assert(
        wrong.data.finished === false,
        "Wrong readback must not finish scenario"
    );

    const correct = await requestTurn(sessionId, {
        pilotTranscript:
            "Taxi via Alpha and hold short of runway 27",
    });

    printResult("[3] Corrected readback", correct);

    assert(
        correct.data.finished === true,
        "Correct readback after correction should finish scenario"
    );

    console.log("✅ TEST 4 PASSED");
}

async function testEmptyReadback() {
    console.log("\n=================================");
    console.log("TEST 5: EMPTY READBACK");
    console.log("=================================");

    const sessionId = `empty-${Date.now()}`;

    const first = await requestTurn(sessionId, {});

    printResult("[1] Initial turn", first);

    const second = await requestTurn(sessionId, {
        pilotTranscript: "",
    });

    printResult("[2] Empty readback", second);

    assert(
        second.status === 200,
        "Empty readback should not crash the service"
    );

    assert(
        second.data.finished === false,
        "Empty readback should not finish scenario"
    );

    console.log("✅ TEST 5 PASSED");
}

async function testSessionIsolation() {
    console.log("\n=================================");
    console.log("TEST 6: SESSION ISOLATION");
    console.log("=================================");

    const sessionA = `session-a-${Date.now()}`;
    const sessionB = `session-b-${Date.now()}`;

    const resultA = await requestTurn(sessionA, {});
    const resultB = await requestTurn(sessionB, {});

    printResult("[Session A]", resultA);
    printResult("[Session B]", resultB);

    assert(
        resultA.status === 200,
        "Session A should work"
    );

    assert(
        resultB.status === 200,
        "Session B should work"
    );

    assert(
        resultA.data.currentLine === resultB.data.currentLine,
        "Both sessions should independently start from the scenario"
    );

    const finishA = await requestTurn(sessionA, {
        pilotTranscript:
            "Taxi via Alpha and hold short of runway 27",
    });

    printResult("[Session A completed]", finishA);

    assert(
        finishA.data.finished === true,
        "Session A should finish"
    );

    const stillActiveB = await requestTurn(sessionB, {
        pilotTranscript:
            "Taxi via Bravo and hold short of runway 27",
    });

    printResult("[Session B wrong readback]", stillActiveB);

    assert(
        stillActiveB.data.finished === false,
        "Session B must remain independent"
    );

    console.log("✅ TEST 6 PASSED");
}

async function testInvalidToken() {
    console.log("\n=================================");
    console.log("TEST 7: INVALID JWT");
    console.log("=================================");

    const sessionId = `auth-${Date.now()}`;

    const response = await fetch(
        `${BASE_URL}/sessions/${sessionId}/turn`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer invalid-token",
            },
            body: JSON.stringify({}),
        }
    );

    const text = await response.text();

    let data;

    try {
        data = JSON.parse(text);
    } catch {
        data = text;
    }

    console.log("HTTP:", response.status);
    console.log(JSON.stringify(data, null, 2));

    assert(
        response.status === 401,
        "Invalid JWT should return HTTP 401"
    );

    console.log("✅ TEST 7 PASSED");
}

async function run() {
    console.log("\n");
    console.log("==============================================");
    console.log("       ATC AI SERVICE INTEGRATION TEST");
    console.log("==============================================");

    console.log("Base URL:", BASE_URL);

    const tests = [
        ["Correct readback", testCorrectReadback],
        ["Wrong readback", testWrongReadback],
        ["Multiple wrong readbacks", testSecondWrongReadback],
        ["Wrong → correct recovery", testEventuallyCorrectReadback],
        ["Empty readback", testEmptyReadback],
        ["Session isolation", testSessionIsolation],
        ["Invalid JWT", testInvalidToken],
    ];

    let passed = 0;
    let failed = 0;

    for (const [name, test] of tests) {
        try {
            await test();
            passed++;
        } catch (error) {
            failed++;

            console.error(`\n❌ ${name} FAILED`);
            console.error(error.message);
        }
    }

    console.log("\n");
    console.log("==============================================");
    console.log("                 TEST SUMMARY");
    console.log("==============================================");

    console.log(`Total : ${tests.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed === 0) {
        console.log("\n🎉 ALL TESTS PASSED");
        console.log("The ATC agent passed the integration test suite.");
    } else {
        console.log("\n❌ SOME TESTS FAILED");
        process.exitCode = 1;
    }

    console.log("==============================================\n");
}

run().catch((error) => {
    console.error("\n❌ TEST RUNNER FAILED");
    console.error(error);
    process.exit(1);
});