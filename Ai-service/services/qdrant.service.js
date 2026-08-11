import "dotenv/config";

import { qdrantClient } from "../config/qdrant.js";
import { scheduleMistralRequest } from "./mistralRateLimiter.js";

const COLLECTION = process.env.QDRANT_COLLECTION;

function createProviderError({
    provider,
    stage,
    status,
    body,
    cause,
}) {
    const error = new Error(
        `[${provider}] ${stage} failed` +
        (status ? ` (${status})` : "") +
        (body ? `: ${body}` : "")
    );

    error.provider = provider;
    error.stage = stage;
    error.status = status ?? null;
    error.providerBody = body ?? null;
    error.cause = cause ?? null;

    return error;
}

async function embedText(text) {
    if (!text || typeof text !== "string") {
        throw createProviderError({
            provider: "Mistral",
            stage: "embedding-input",
            body: `Invalid embedding input: ${text}`,
        });
    }

    let response;

    try {
        response =
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
                            input: [text],
                        }),
                    }
                )
            );
    } catch (cause) {
        throw createProviderError({
            provider: "Mistral",
            stage: "embedding-request",
            cause,
            body: cause?.message,
        });
    }

    const responseBody =
        await response.text();

    if (!response.ok) {
        throw createProviderError({
            provider: "Mistral",
            stage: "embedding",
            status: response.status,
            body: responseBody,
        });
    }

    let data;

    try {
        data =
            JSON.parse(responseBody);
    } catch (cause) {
        throw createProviderError({
            provider: "Mistral",
            stage: "embedding-response",
            status: response.status,
            body: responseBody,
            cause,
        });
    }

    const embedding =
        data?.data?.[0]?.embedding;

    if (
        !Array.isArray(embedding) ||
        embedding.length === 0
    ) {
        throw createProviderError({
            provider: "Mistral",
            stage: "embedding-response",
            status: response.status,
            body:
                "Mistral response did not contain a valid embedding.",
        });
    }

    return embedding;
}

async function retrieve(
    query,
    procedureType,
    phase,
    limit = 3
) {
    if (!COLLECTION) {
        throw createProviderError({
            provider: "Qdrant",
            stage: "configuration",
            body:
                "QDRANT_COLLECTION is not defined.",
        });
    }

    console.log(
        "[Qdrant] Retrieval request:",
        {
            query,
            procedureType,
            phase,
            limit,
            collection: COLLECTION,
        }
    );

    let vector;

    try {
        vector =
            await embedText(query);
    } catch (error) {
        console.error(
            "[Qdrant] Embedding stage failed:",
            error
        );

        throw error;
    }

    console.log(
        "[Qdrant] Vector dimensions:",
        vector.length
    );

    const must = [];

    if (procedureType) {
        must.push({
            key: "procedure_type",

            match: {
                value: procedureType,
            },
        });
    }

    if (phase) {
        must.push({
            key: "phase",

            match: {
                value: phase,
            },
        });
    }

    const filter =
        must.length
            ? { must }
            : undefined;

    console.log(
        "[Qdrant] Query:",
        {
            collection: COLLECTION,
            limit,
            filter,
        }
    );

    let result;

    try {
        result =
            await qdrantClient.query(
                COLLECTION,
                {
                    query: vector,

                    limit,

                    with_payload: true,

                    filter,
                }
            );
    } catch (cause) {
        console.error(
            "[Qdrant] Query failed:",
            cause
        );

        throw createProviderError({
            provider: "Qdrant",
            stage: "query",
            body: cause?.message,
            cause,
        });
    }

    console.log(
        "[Qdrant] Number of results:",
        result.points?.length ?? 0
    );

    return (
        result.points ?? []
    ).map(
        (point) => ({
            text:
                point.payload?.text ?? "",

            score:
                point.score,

            metadata:
                point.payload ?? {},
        })
    );
}

export {
    embedText,
    retrieve,
};