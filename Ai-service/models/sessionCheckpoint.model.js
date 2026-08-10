const { Schema, model } = require('mongoose');

const sessionCheckpointSchema = new Schema({
    sessionId: { type: String, unique: true, index: true, required: true },
    langgraphState: { type: Schema.Types.Mixed, required: true },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = model('SessionCheckpoint', sessionCheckpointSchema);