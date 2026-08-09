const { QdrantClient } = require('@qdrant/js-client-rest');
const env = require('../config/env');

const client = new QdrantClient({ 
    url: env.QDRANT_URL, 
    apiKey: env.QDRANT_API_KEY
 });

async function embedText(text) {
    const res = await fetch('https://api.mistral.ai/v1/embeddings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.MISTRAL_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'mistral-embed', input: [text] }),
    });
    const data = await res.json();
    return data.data[0].embedding;
}

async function retrieve(query, procedureType, phase, limit = 3) {
    const vector = await embedText(query);
    const result = await client.search(env.QDRANT_COLLECTION, {
        vector,
        limit,
        filter: {
            must: [
                { key: 'procedure_type', match: { value: procedureType } },
                { key: 'phase', match: { value: phase } },
            ],
        },
    });
    return result.map(r => ({ text: r.payload.text, score: r.score }));
}

module.exports = { retrieve };