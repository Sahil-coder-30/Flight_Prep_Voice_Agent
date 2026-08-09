import mongoose from 'mongoose';

const retrievalLogSchema = new mongoose.Schema(
    {
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
        },
        stepId: {
            type: String,
            required: true,
        },
        query: {
            type: String,
            required: true,
        },
        qdrantHits: {
            type: [mongoose.Schema.Types.Mixed], // Array of retrieved chunks with similarity scores
            default: [],
        },
    },
    { timestamps: true }
);

const RetrievalLog = mongoose.model('RetrievalLog', retrievalLogSchema);
export default RetrievalLog;
