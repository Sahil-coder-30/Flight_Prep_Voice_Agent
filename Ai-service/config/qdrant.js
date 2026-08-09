const { QdrantClient } = require('@qdrant/js-client-rest');
const env = require('../config/env');

const client = new QdrantClient({ url: env.QDRANT_URL, apiKey: env.QDRANT_API_KEY });

