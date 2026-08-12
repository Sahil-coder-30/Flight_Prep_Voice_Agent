import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { qdrantClient } from '../config/qdrant.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLLECTION = process.env.QDRANT_COLLECTION || 'atc_phraseology';
const JSON_PATH = path.join(__dirname, '../../helpers/extracted_atc_text.json');

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Batch embed array of texts with Mistral Embed API and retry on rate limits (HTTP 429).
 */
async function embedBatch(textArray, retries = 5) {
    const apiKey = process.env.MISTRAL_API_KEY || process.env.MISTRALAI_API_KEY;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const res = await fetch('https://api.mistral.ai/v1/embeddings', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ model: 'mistral-embed', input: textArray }),
            });

            if (res.status === 429) {
                const waitMs = attempt * 2000;
                console.warn(`[RAG Ingest] Rate limited (429). Retrying batch in ${waitMs}ms (Attempt ${attempt}/${retries})...`);
                await sleep(waitMs);
                continue;
            }

            if (!res.ok) {
                const err = await res.text();
                throw new Error(`Mistral embed error (${res.status}): ${err}`);
            }

            const data = await res.json();
            return data.data.map((d) => d.embedding);
        } catch (err) {
            if (attempt === retries) throw err;
            await sleep(attempt * 1000);
        }
    }
    throw new Error('Failed to embed batch after maximum retries');
}

async function ingest() {
    try {
        if (!fs.existsSync(JSON_PATH)) {
            throw new Error(`JSON file not found at ${JSON_PATH}. Run python extract script first.`);
        }

        const rawData = fs.readFileSync(JSON_PATH, 'utf-8');
        const chunks = JSON.parse(rawData);

        console.log(`[RAG Ingest] Loaded ${chunks.length} extracted chunks from PDF documents.`);

        // 1. Ensure collection exists in Qdrant
        try {
            await qdrantClient.getCollection(COLLECTION);
            console.log(`[RAG Ingest] Qdrant collection "${COLLECTION}" exists.`);
        } catch (err) {
            console.log(`[RAG Ingest] Collection "${COLLECTION}" not found. Creating collection...`);
            await qdrantClient.createCollection(COLLECTION, {
                vectors: {
                    size: 1024, // mistral-embed vector size
                    distance: 'Cosine',
                },
            });
            console.log(`[RAG Ingest] Collection "${COLLECTION}" created.`);
        }

        // 2. Batch process embeddings (10 texts per API call) to avoid rate limits
        const EMBED_BATCH_SIZE = 10;
        const points = [];

        for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
            const batchChunks = chunks.slice(i, i + EMBED_BATCH_SIZE);
            const batchTexts = batchChunks.map((c) => c.text);

            console.log(`[RAG Ingest] Embedding batch ${Math.floor(i / EMBED_BATCH_SIZE) + 1} (${i + 1} to ${Math.min(i + EMBED_BATCH_SIZE, chunks.length)} of ${chunks.length})...`);

            const vectors = await embedBatch(batchTexts);

            for (let j = 0; j < batchChunks.length; j++) {
                const chunk = batchChunks[j];
                const vector = vectors[j];

                points.push({
                    id: i + j + 1,
                    vector,
                    payload: {
                        text: chunk.text,
                        authority: chunk.authority,
                        phase: chunk.phase,
                        procedure_type: chunk.procedure_type,
                        page: chunk.page,
                        filename: chunk.filename,
                    },
                });
            }

            // Small delay between batch requests to respect API rate limits
            await sleep(500);
        }

        // 3. Upsert points into Qdrant in batches of 50
        console.log(`[RAG Ingest] Upserting ${points.length} vectors into Qdrant collection "${COLLECTION}"...`);
        const UPSERT_BATCH_SIZE = 50;
        for (let i = 0; i < points.length; i += UPSERT_BATCH_SIZE) {
            const batch = points.slice(i, i + UPSERT_BATCH_SIZE);
            await qdrantClient.upsert(COLLECTION, { points: batch });
        }

        console.log(`[RAG Ingest] 🎉 Successfully ingested ALL ${points.length}/${chunks.length} chunks into Qdrant collection "${COLLECTION}"!`);
        process.exit(0);
    } catch (err) {
        console.error('[RAG Ingest] Ingestion error:', err.message);
        process.exit(1);
    }
}

ingest();
