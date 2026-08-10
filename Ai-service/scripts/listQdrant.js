import "dotenv/config";
import { qdrantClient } from "../config/qdrant.js";

async function main() {
    const result = await qdrantClient.getCollections();

    console.log(
        result.collections.map((collection) => collection.name)
    );
}

main().catch(console.error);