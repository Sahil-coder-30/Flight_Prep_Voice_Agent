import "dotenv/config";
import { qdrantClient } from "../config/qdrant.js";
import { embedText } from "../services/qdrant.service.js";

const COLLECTION = process.env.QDRANT_COLLECTION;

const text = "Taxi via Alpha and hold short of runway 27.";

async function main() {
    const vector = await embedText(text);

    console.log("Embedding dimensions:", vector.length);

    await qdrantClient.upsert(COLLECTION, {
        wait: true,
        points: [
            {
                id: 1,
                vector,
                payload: {
                    text,
                    procedure_type: "taxi",
                    phase: "ground",
                    source: "test",
                },
            },
        ],
    });

    console.log("Inserted test point");

    const results = await qdrantClient.query(COLLECTION, {
        vector,
        limit: 3,
    });

    console.log(results);
}

main().catch(console.error);