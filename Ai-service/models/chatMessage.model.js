const { Schema, model } = require('mongoose');

const chatMessageSchema = new Schema({
    sessionId: { type: String, index: true, required: true },
    role: { type: String, enum: ['controller', 'pilot'], required: true },
    text: { type: String, required: true },
    audioRef: String,
    stepId: String,
    timestamp: { type: Date, default: Date.now },
});

module.exports = model('ChatMessage', chatMessageSchema);