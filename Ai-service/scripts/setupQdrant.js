import "dotenv/config";
import { qdrantClient } from "../config/qdrant.js";

const COLLECTION = process.env.QDRANT_COLLECTION;

console.log("QDRANT_URL:", process.env.QDRANT_URL);
console.log(
    "QDRANT_API_KEY:",
    process.env.QDRANT_API_KEY ? "loaded" : "missing"
);
console.log("QDRANT_COLLECTION:", COLLECTION);

async function ensurePayloadIndex(
    collection,
    fieldName,
    fieldSchema
) {
    console.log(
        `[Qdrant] Ensuring payload index: ${fieldName}`
    );

    try {
        await qdrantClient.createPayloadIndex(
            collection,
            {
                field_name: fieldName,
                field_schema: fieldSchema,
                wait: true,
            }
        );

        console.log(
            `[Qdrant] Payload index ready: ${fieldName}`
        );
    } catch (error) {
        const message =
            error?.data?.status?.error ??
            error?.message ??
            "";

        if (
            message
                .toLowerCase()
                .includes("already exists")
        ) {
            console.log(
                `[Qdrant] Payload index already exists: ${fieldName}`
            );

            return;
        }

        throw error;
    }
}

async function setup() {
    if (!COLLECTION) {
        throw new Error(
            "QDRANT_COLLECTION is not defined"
        );
    }

    const { exists } =
        await qdrantClient.collectionExists(
            COLLECTION
        );

    if (!exists) {
        await qdrantClient.createCollection(
            COLLECTION,
            {
                vectors: {
                    size: 1024,
                    distance: "Cosine",
                },
            }
        );

        console.log(
            `Created collection "${COLLECTION}"`
        );
    } else {
        console.log(
            `Collection "${COLLECTION}" already exists`
        );
    }

    await ensurePayloadIndex(
        COLLECTION,
        "procedure_type",
        "keyword"
    );

    await ensurePayloadIndex(
        COLLECTION,
        "phase",
        "keyword"
    );

    console.log(
        "\n================================="
    );

    console.log(
        "✅ QDRANT SETUP COMPLETE"
    );

    console.log(
        "================================="
    );
}

setup().catch((error) => {
    console.error(
        "\n❌ QDRANT SETUP FAILED"
    );

    console.error(error);

    process.exit(1);
});