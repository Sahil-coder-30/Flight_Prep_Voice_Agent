import "dotenv/config";

import { retrieve } from "../services/qdrant.service.js";

async function test(
    name,
    query,
    procedureType,
    phase
) {
    console.log(
        "\n================================="
    );

    console.log(name);

    console.log(
        "================================="
    );

    const results =
        await retrieve(
            query,
            procedureType,
            phase
        );

    console.log(
        "Results:",
        results.length
    );

    for (const result of results) {
        console.log({
            text:
                result.text,

            score:
                result.score,

            procedure_type:
                result.metadata?.procedure_type,

            phase:
                result.metadata?.phase,

            category:
                result.metadata?.category,
        });
    }

    return results;
}

async function main() {
    const taxi =
        await test(
            "TAXI RETRIEVAL",
            "Issue a taxi clearance to runway 27.",
            "taxi",
            "ground"
        );

    if (taxi.length === 0) {
        throw new Error(
            "Taxi retrieval returned no knowledge."
        );
    }

    const departure =
        await test(
            "DEPARTURE RETRIEVAL",
            "Issue an IFR departure clearance to the aircraft.",
            "departure",
            "clearance"
        );

    if (departure.length === 0) {
        throw new Error(
            "Departure retrieval returned no knowledge."
        );
    }

    const landing =
        await test(
            "LANDING RETRIEVAL",
            "Issue a landing clearance to the aircraft.",
            "landing",
            "tower"
        );

    if (landing.length === 0) {
        throw new Error(
            "Landing retrieval returned no knowledge."
        );
    }

    const frequency =
        await test(
            "FREQUENCY CHANGE RETRIEVAL",
            "Instruct the aircraft to contact departure control on frequency 124.7.",
            "frequency_change",
            "departure"
        );

    if (frequency.length === 0) {
        throw new Error(
            "Frequency-change retrieval returned no knowledge."
        );
    }

    console.log(
        "\n================================="
    );

    console.log(
        "✅ ATC RETRIEVAL TEST PASSED"
    );

    console.log(
        "================================="
    );
}

main().catch((error) => {
    console.error(
        "\n❌ QDRANT TEST FAILED"
    );

    console.error(error);

    process.exit(1);
});