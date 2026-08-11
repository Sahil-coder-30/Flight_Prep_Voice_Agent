import mongoose from "mongoose";

const retrievalLogSchema = new mongoose.Schema({
    sessionId: { type: String, index: true, required: true },
    stepId: String,
    query: String,
    qdrantHits: [{ text: String, score: Number }],
    timestamp: { type: Date, default: Date.now },
});

export { RetrievalLog }