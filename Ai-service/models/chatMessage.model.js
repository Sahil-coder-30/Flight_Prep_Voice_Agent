import { Schema, model } from 'mongoose';

const chatMessageSchema = new Schema({
    sessionId:   { type: String, index: true, required: true },
    role:        { type: String, enum: ['controller', 'pilot'], required: true },
    text:        { type: String, required: true },
    audioRef:    String,
    stepId:      String,
    templateId:  String,         // which template produced this line
    tokensUsed:  Number,         // LLM tokens (0 if template-rendered)
    latencyMs:   Number,         // total node latency for this turn
    cacheHit:    { type: Boolean, default: false }, // was grounding from Redis?
    timestamp:   { type: Date, default: Date.now },
});

export default model('ChatMessage', chatMessageSchema);