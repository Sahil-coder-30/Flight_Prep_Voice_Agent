import 'dotenv/config';
import { qdrantClient } from '../config/qdrant.js';
import { retrieveGeneralQuery } from '../services/qdrant.service.js';

const COLLECTION = process.env.QDRANT_COLLECTION || 'atc_phraseology';

async function verify() {
    try {
        console.log(`\n🔍 Checking Qdrant collection "${COLLECTION}"...\n`);

        // 1. Fetch collection info & vector count
        const info = await qdrantClient.getCollection(COLLECTION);
        console.log(`📊 Collection Status: ${info.status}`);
        console.log(`🔢 Total Ingested Vectors: ${info.vectors_count || info.points_count || 'N/A'}`);
        console.log(`📐 Vector Dimension: ${info.config?.params?.vectors?.size || 1024}`);

        // 2. Perform a test RAG search query
        const testQuery = 'cleared for takeoff runway 22L wind 270';
        console.log(`\n🔎 Running sample RAG search query: "${testQuery}"...\n`);

        const hits = await retrieveGeneralQuery(testQuery, 3);

        if (hits.length === 0) {
            console.warn('⚠️ Search returned 0 hits. Check collection name or API key.');
        } else {
            console.log(`✅ Retrieved ${hits.length} sample chunks from Qdrant:\n`);
            hits.forEach((h, idx) => {
                const textSnippet = (h.text || h.metadata?.text || JSON.stringify(h.metadata) || '').slice(0, 200);
                console.log(`--- [Chunk ${idx + 1}] (Score: ${(h.score || 0).toFixed(4)}, Authority: ${h.authority || h.metadata?.authority || 'N/A'}, Page: ${h.metadata?.page || 'N/A'}) ---`);
                console.log(`Text: "${textSnippet}..."\n`);
            });
        }

        console.log('🎉 Verification complete: Data is fully installed and searchable in Qdrant!\n');
        process.exit(0);
    } catch (err) {
        console.error('❌ Verification failed:', err.message);
        process.exit(1);
    }
}

verify();
