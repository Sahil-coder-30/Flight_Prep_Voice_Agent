import { Schema, model } from 'mongoose';

const retrievalLogSchema = new Schema({
    sessionId:   { type: String, index: true, required: true },
    stepId:      String,
    templateId:  String,
    query:       String,
    cacheHit:    { type: Boolean, default: false },
    qdrantHits:  [{ text: String, score: Number }],
    latencyMs:   Number,
    timestamp:   { type: Date, default: Date.now },
});

export default model('RetrievalLog', retrievalLogSchema);