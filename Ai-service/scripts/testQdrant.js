import "dotenv/config";
import { embedText } from "../services/qdrant.service.js";
import { qdrantClient } from "../config/qdrant.js";

const COLLECTION = process.env.QDRANT_COLLECTION;

async function main() {
    console.log("Collection:", COLLECTION);

    const vector = await embedText(
        "Issue a taxi clearance to runway 27."
    );

    console.log("Vector dimensions:", vector.length);

    const result = await qdrantClient.query(COLLECTION, {
        query: vector,
        limit: 3,
        with_payload: true,
    });

    console.log("\nQDRANT RESULTS:");
    console.dir(result, { depth: 5 });
}

main().catch((error) => {
    console.error("\nQDRANT TEST FAILED");
    console.error(error);
});