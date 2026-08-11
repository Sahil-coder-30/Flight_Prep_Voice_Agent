import {
    parseReadback,
    validateAgainstExpected,
} from "../services/readbackValidator.service.js";

const expected = {
    taxiway: "Alpha",
    runway: "27",
    hold_short: "runway 27",
};

const tests = [
    {
        name: "Correct readback",
        transcript:
            "Taxi via Alpha and hold short of runway 27",
        expectedValid: true,
    },

    {
        name: "Wrong taxiway",
        transcript:
            "Taxi via Bravo and hold short of runway 27",
        expectedValid: false,
    },

    {
        name: "Wrong runway",
        transcript:
            "Taxi via Alpha and hold short of runway 09",
        expectedValid: false,
    },

    {
        name: "Incomplete readback",
        transcript:
            "Taxi via Alpha",
        expectedValid: false,
    },

    {
        name: "Different natural wording",
        transcript:
            "Taxiway Alpha, hold short of runway 27",
        expectedValid: true,
    },

    {
        name: "Ambiguous response",
        transcript:
            "Yeah, Alpha, got it",
        expectedValid: false,
    },
];

console.log("\n=================================");
console.log("READBACK VALIDATOR TEST");
console.log("=================================\n");

let passed = 0;

for (const test of tests) {
    const extracted = parseReadback(test.transcript);

    const valid =
        extracted.confidence === "high"
            ? validateAgainstExpected(
                extracted,
                expected
            )
            : false;

    const pass = valid === test.expectedValid;

    console.log(
        `${pass ? "✅" : "❌"} ${test.name}`
    );

    console.log("   Transcript:", test.transcript);
    console.log("   Extracted:", extracted);
    console.log("   Valid:", valid);

    if (pass) {
        passed++;
    }
}

console.log(
    `\nPassed: ${passed}/${tests.length}`
);

if (passed !== tests.length) {
    process.exit(1);
}

console.log("\n✅ Readback validator test passed.");