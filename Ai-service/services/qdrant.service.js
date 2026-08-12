import 'dotenv/config';
import { qdrantClient } from '../config/qdrant.js';
import { getRedisClient } from '../config/redis.js';
import TokenUsageLog from '../models/tokenUsage.model.js';

const COLLECTION = process.env.QDRANT_COLLECTION || 'atc_phraseology';

// ── Embedding (Mistral) ────────────────────────────────────────────────────────

/**
 * Embed a text string using Mistral-embed, with Redis L1 cache keyed by templateId.
 */
export async function embedText(text, templateId = null, ctx = {}) {
    const redis = getRedisClient();

    if (templateId) {
        const cacheKey = `emb:tmpl:${templateId}`;
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
    }

    const apiKey = process.env.MISTRAL_API_KEY || process.env.MISTRALAI_API_KEY;
    const t0 = Date.now();
    const res = await fetch('https://api.mistral.ai/v1/embeddings', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'mistral-embed', input: [text] }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Mistral embedding failed: ${err}`);
    }

    const data = await res.json();
    const vector = data?.data?.[0]?.embedding;
    if (!vector) {
        throw new Error('Mistral embedding returned empty vector object');
    }
    const latencyMs = Date.now() - t0;

    if (templateId) {
        const cacheKey = `emb:tmpl:${templateId}`;
        await redis.setex(cacheKey, 60 * 60 * 24 * 30, JSON.stringify(vector));
    }

    if (ctx.sessionId) {
        TokenUsageLog.create({
            ...ctx,
            operation: 'embed_text',
            model: 'mistral-embed',
            promptTokens: data.usage?.prompt_tokens ?? 0,
            completionTokens: 0,
            totalTokens: data.usage?.total_tokens ?? 0,
            latencyMs,
            cacheHit: false,
        }).catch(() => {});
    }

    return vector;
}

// ── Qdrant Search Helper ───────────────────────────────────────────────────────

async function searchQdrant(vector, limit = 3, filter = null) {
    let rawHits = [];
    try {
        if (typeof qdrantClient.query === 'function') {
            const response = await qdrantClient.query(COLLECTION, {
                query: vector,
                limit,
                with_payload: true,
                ...(filter && { filter }),
            });
            rawHits = response?.points || response || [];
        } else if (typeof qdrantClient.searchPoints === 'function') {
            rawHits = await qdrantClient.searchPoints(COLLECTION, {
                vector,
                limit,
                with_payload: true,
                ...(filter && { filter }),
            });
        }
    } catch (err) {
        console.warn('[Qdrant] Search call warning:', err.message);
    }
    return rawHits;
}

// ── Qdrant Search ──────────────────────────────────────────────────────────────

export async function retrieve(query, procedureType, phase, templateId = null, limit = 3) {
    const redis = getRedisClient();

    if (templateId) {
        const cacheKey = `gnd:tmpl:${templateId}`;
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
    }

    const vector = await embedText(query, templateId);

    const mustFilter = [];
    if (procedureType) mustFilter.push({ key: 'procedure_type', match: { value: procedureType } });
    if (phase) mustFilter.push({ key: 'phase', match: { value: phase } });

    let rawHits = await searchQdrant(vector, limit, mustFilter.length > 0 ? { must: mustFilter } : null);

    // Fallback: search without filter if 0 hits
    if (!rawHits || rawHits.length === 0) {
        rawHits = await searchQdrant(vector, limit);
    }

    const hits = (rawHits || []).map((r) => ({
        text: r.payload?.text,
        score: r.score,
        metadata: r.payload,
        authority: r.payload?.authority || 'ICAO/FAA',
    }));

    if (templateId && hits.length > 0) {
        const cacheKey = `gnd:tmpl:${templateId}`;
        await redis.setex(cacheKey, 60 * 60 * 24 * 7, JSON.stringify(hits));
    }

    return hits;
}

export async function retrieveGeneralQuery(queryText, limit = 3) {
    try {
        const vector = await embedText(queryText);
        const rawHits = await searchQdrant(vector, limit);

        return (rawHits || []).map((r) => ({
            text: r.payload?.text,
            score: r.score,
            authority: r.payload?.authority,
            metadata: r.payload,
        }));
    } catch (err) {
        console.error('[Qdrant] retrieveGeneralQuery error:', err.message);
        return [];
    }
}