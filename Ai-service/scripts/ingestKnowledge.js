import "dotenv/config";

import crypto from "node:crypto";

import { atcKnowledge } from "../data/atcKnowledge.js";
import { qdrantClient } from "../config/qdrant.js";
import { scheduleMistralRequest } from "../services/mistralRateLimiter.js";

const COLLECTION =
    process.env.QDRANT_COLLECTION;

function makePointId(value) {
    const hash =
        crypto
            .createHash("sha256")
            .update(value)
            .digest("hex");

    return [
        hash.slice(0, 8),
        hash.slice(8, 12),
        "5" + hash.slice(13, 16),
        ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80)
            .toString(16)
            .padStart(2, "0") +
        hash.slice(18, 20),
        hash.slice(20, 32),
    ].join("-");
}

async function embedTexts(texts) {
    if (!texts.length) {
        return [];
    }

    const response =
        await scheduleMistralRequest(() =>
            fetch(
                "https://api.mistral.ai/v1/embeddings",
                {
                    method: "POST",

                    headers: {
                        Authorization:
                            `Bearer ${process.env.MISTRAL_API_KEY}`,

                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        model: "mistral-embed",
                        input: texts,
                    }),
                }
            )
        );

    const body =
        await response.text();

    if (!response.ok) {
        throw new Error(
            `Mistral embedding failed (${response.status}): ${body}`
        );
    }

    let data;

    try {
        data = JSON.parse(body);
    } catch {
        throw new Error(
            "Mistral returned invalid JSON."
        );
    }

    if (
        !Array.isArray(data?.data) ||
        data.data.length !== texts.length
    ) {
        throw new Error(
            `Expected ${texts.length} embeddings, received ${data?.data?.length ?? 0
            }.`
        );
    }

    return data.data
        .sort(
            (a, b) =>
                a.index - b.index
        )
        .map(
            (item) =>
                item.embedding
        );
}

async function ensureIndexes() {
    await qdrantClient.createPayloadIndex(
        COLLECTION,
        {
            field_name:
                "procedure_type",

            field_schema:
                "keyword",

            wait: true,
        }
    );

    await qdrantClient.createPayloadIndex(
        COLLECTION,
        {
            field_name:
                "phase",

            field_schema:
                "keyword",

            wait: true,
        }
    );
}

async function main() {
    console.log(
        "\n================================="
    );

    console.log(
        "ATC KNOWLEDGE INGESTION"
    );

    console.log(
        "=================================\n"
    );

    if (!COLLECTION) {
        throw new Error(
            "QDRANT_COLLECTION is not defined."
        );
    }

    console.log(
        "Collection:",
        COLLECTION
    );

    console.log(
        "Documents:",
        atcKnowledge.length
    );

    await ensureIndexes();

    console.log(
        "\nGenerating embeddings..."
    );

    const embeddings =
        await embedTexts(
            atcKnowledge.map(
                (item) =>
                    item.text
            )
        );

    console.log(
        `Generated ${embeddings.length} embeddings.`
    );

    const points =
        atcKnowledge.map(
            (item, index) => ({
                id:
                    makePointId(
                        item.id
                    ),

                vector:
                    embeddings[index],

                payload: {
                    id:
                        item.id,

                    text:
                        item.text,

                    procedure_type:
                        item.procedure_type,

                    phase:
                        item.phase,

                    category:
                        item.category,

                    jurisdiction:
                        item.jurisdiction,

                    source:
                        item.source,
                },
            })
        );

    await qdrantClient.upsert(
        COLLECTION,
        {
            wait: true,
            points,
        }
    );

    console.log(
        `\nUpserted ${points.length} knowledge points.`
    );

    console.log(
        "\n================================="
    );

    console.log(
        "✅ KNOWLEDGE INGESTION COMPLETE"
    );

    console.log(
        "=================================\n"
    );
}

main().catch((error) => {
    console.error(
        "\n❌ KNOWLEDGE INGESTION FAILED"
    );

    console.error(error);

    process.exit(1);
});