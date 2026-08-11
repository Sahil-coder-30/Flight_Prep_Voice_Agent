import "dotenv/config";
import { qdrantClient } from "../config/qdrant.js";

const COLLECTION = process.env.QDRANT_COLLECTION;

async function embedText(text) {
    const response = await fetch(
        "https://api.mistral.ai/v1/embeddings",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "mistral-embed",
                input: [text],
            }),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(
            `Mistral embedding failed (${response.status}): ${error}`
        );
    }

    const data = await response.json();

    return data.data[0].embedding;
}

async function retrieve(query, procedureType, phase, limit = 3) {
    const vector = await embedText(query);

    console.log("[Qdrant] Collection:", COLLECTION);
    console.log("[Qdrant] Vector dimensions:", vector.length);

    const result = await qdrantClient.query(COLLECTION, {
        query: vector,
        limit,
        with_payload: true,
    });

    console.log(
        "[Qdrant] Number of results:",
        result.points?.length ?? 0
    );

    return (result.points ?? []).map((point) => ({
        text: point.payload?.text ?? "",
        score: point.score,
        metadata: point.payload ?? {},
    }));
}

export {
    embedText,
    retrieve,
};