import { Schema, model } from 'mongoose';

/**
 * TokenUsageLog — AI Service owns all token tracking.
 * Every Mistral API call (compose, extract, embed, debrief) logs here.
 * The Backend service can query the aggregate per session via the AI service API.
 */
const tokenUsageSchema = new Schema({
    sessionId:        { type: String, required: true, index: true },
    userId:           { type: String, required: true, index: true },
    stepId:           String,
    templateId:       String,
    operation: {
        type: String,
        enum: ['compose_line', 'extract_readback', 'issue_correction', 'embed_text', 'debrief'],
        required: true,
    },
    model:            String,            // "mistral-small-latest" | "mistral-large-latest"
    promptTokens:     { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens:      { type: Number, default: 0 },
    latencyMs:        Number,
    cacheHit:         { type: Boolean, default: false }, // true → 0 tokens
    timestamp:        { type: Date, default: Date.now },
});

// Fast per-session queries & per-user monthly aggregation
tokenUsageSchema.index({ sessionId: 1, timestamp: 1 });
tokenUsageSchema.index({ userId: 1, timestamp: -1 });

export default model('TokenUsageLog', tokenUsageSchema);
