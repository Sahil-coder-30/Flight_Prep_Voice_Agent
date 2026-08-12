import { Schema, model } from 'mongoose';

const sessionCheckpointSchema = new Schema({
    sessionId:       { type: String, unique: true, index: true, required: true },
    langgraphState:  { type: Schema.Types.Mixed, required: true },
    updatedAt:       { type: Date, default: Date.now },
});

export default model('SessionCheckpoint', sessionCheckpointSchema);