import mongoose from 'mongoose';

const sessionCheckpointSchema = new mongoose.Schema(
    {
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            unique: true,
            index: true,
        },
        langgraphState: {
            type: mongoose.Schema.Types.Mixed, // Stores serialized LangGraph checkpoint state
            required: true,
        },
    },
    { timestamps: true }
);

const SessionCheckpoint = mongoose.model('SessionCheckpoint', sessionCheckpointSchema);
export default SessionCheckpoint;
