import { QdrantClient } from '@qdrant/js-client-rest';

let qdrantClient = null;

export const connectToQdrant = () => {
    try {
        const url = process.env.QDRANT_URL || 'http://localhost:6333';
        const apiKey = process.env.QDRANT_API_KEY || undefined;

        qdrantClient = new QdrantClient({ url, apiKey });
        console.log(`[AI Service Qdrant] Initialized Qdrant client at ${url}`);
        return qdrantClient;
    } catch (error) {
        console.error('[AI Service Qdrant] Connection error:', error.message);
        process.exit(1);
    }
};

export const getQdrantClient = () => {
    if (!qdrantClient) {
        return connectToQdrant();
    }
    return qdrantClient;
};
