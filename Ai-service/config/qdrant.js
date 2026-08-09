const { QdrantClient } = require('@qdrant/js-client-rest');

const qdrantClient = new QdrantClient({ url: process.env.QDRANT_URL });

module.exports = { qdrantClient };