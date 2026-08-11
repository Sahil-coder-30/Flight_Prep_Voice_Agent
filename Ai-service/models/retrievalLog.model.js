const { Schema, model } = require('mongoose');

const retrievalLogSchema = new Schema({
    sessionId: { type: String, index: true, required: true },
    stepId: String,
    query: String,
    qdrantHits: [{ text: String, score: Number }],
    timestamp: { type: Date, default: Date.now },
});

module.exports = model('RetrievalLog', retrievalLogSchema);