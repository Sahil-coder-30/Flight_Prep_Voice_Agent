import 'dotenv/config';
import mongoose from 'mongoose';
import Scenario from '../models/scenario.model.js';
import { getRedisClient, connectToRedis } from '../config/redis.js';
import { embedText } from '../services/qdrant.service.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/atc_ai_service';

async function warm() {
    try {
        await mongoose.connect(MONGO_URI);
        connectToRedis();
        const redis = getRedisClient();

        console.log('[WarmEmbeddings] Fetching scenarios...');
        const scenarios = await Scenario.find({ isActive: true });

        let count = 0;
        for (const scenario of scenarios) {
            for (const step of scenario.steps) {
                if (!step.templateId) continue;

                const cacheKey = `emb:tmpl:${step.templateId}`;
                const exists = await redis.exists(cacheKey);

                if (!exists) {
                    const query = `${step.procedureType} ${step.phase} phraseology standard`;
                    console.log(`[WarmEmbeddings] Embedding & caching template "${step.templateId}"...`);
                    await embedText(query, step.templateId);
                    count++;
                } else {
                    console.log(`[WarmEmbeddings] Template "${step.templateId}" already cached in Redis.`);
                }
            }
        }

        console.log(`[WarmEmbeddings] Pre-warming complete. ${count} new template embeddings cached to Redis.`);
        process.exit(0);
    } catch (err) {
        console.error('[WarmEmbeddings] Error:', err.message);
        process.exit(1);
    }
}

warm();
