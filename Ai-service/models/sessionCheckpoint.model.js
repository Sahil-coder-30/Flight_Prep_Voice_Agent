import mongoose from "mongoose";


const sessionCheckpointSchema = new mongoose.Schema({
    sessionId: { type: String, unique: true, index: true, required: true },
    langgraphState: { type: Schema.Types.Mixed, required: true },
    updatedAt: { type: Date, default: Date.now },
});

export { sessionCheckpointSchema };