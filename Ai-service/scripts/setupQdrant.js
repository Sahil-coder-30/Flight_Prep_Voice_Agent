import "dotenv/config";
import { qdrantClient } from "../config/qdrant.js";
import { initPilotResponsesCollection } from "../services/pilotResponseRag.service.js";

const COLLECTION = process.env.QDRANT_COLLECTION || 'atc_phraseology';

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
    } else {
        await qdrantClient.createCollection(COLLECTION, {
            vectors: {
                size: 1024,
                distance: "Cosine",
            },
        });
        console.log(`Created collection "${COLLECTION}"`);
    }

    // Initialize pilot responses collection with payload indices
    await initPilotResponsesCollection();
    console.log("Pilot responses Qdrant collection setup complete.");
}

setup().catch((error) => {
    console.error(error);
    process.exit(1);
});