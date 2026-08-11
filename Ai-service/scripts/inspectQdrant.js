import "dotenv/config";
import { qdrantClient } from "../config/qdrant.js";

const COLLECTION = process.env.QDRANT_COLLECTION;

async function main() {
    console.log("\n=================================");
    console.log("QDRANT KNOWLEDGE INSPECTION");
    console.log("=================================\n");

    console.log("Collection:", COLLECTION);

    const result = await qdrantClient.scroll(COLLECTION, {
        limit: 20,
        with_payload: true,
        with_vector: false,
    });

    console.log(`\nFound ${result.points.length} points\n`);

    for (const [index, point] of result.points.entries()) {
        console.log(`---------- POINT ${index + 1} ----------`);

        console.log("ID:", point.id);

        console.log("Payload:");
        console.dir(point.payload, {
            depth: null,
        });

        console.log();
    }
}

main().catch((error) => {
    console.error("\n❌ QDRANT INSPECTION FAILED");
    console.error(error);
    process.exit(1);
});