import "dotenv/config";
import { qdrantClient } from "../config/qdrant.js";

const COLLECTION = process.env.QDRANT_COLLECTION;

console.log("QDRANT_URL:", process.env.QDRANT_URL);
console.log(
    "QDRANT_API_KEY:",
    process.env.QDRANT_API_KEY ? "loaded" : "missing"
);
console.log("QDRANT_COLLECTION:", COLLECTION);

async function setup() {
    if (!COLLECTION) {
        throw new Error("QDRANT_COLLECTION is not defined");
    }

    const { exists } = await qdrantClient.collectionExists(COLLECTION);

    if (exists) {
        console.log(`Collection "${COLLECTION}" already exists`);
        return;
    }

    await qdrantClient.createCollection(COLLECTION, {
        vectors: {
            size: 1024,
            distance: "Cosine",
        },
    });

    console.log(`Created collection "${COLLECTION}"`);
}

setup().catch((error) => {
    console.error(error);
    process.exit(1);
});