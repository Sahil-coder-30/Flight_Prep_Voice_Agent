import mongoose from 'mongoose';

// ── Constants ─────────────────────────────────────────────────────────────────
export const SESSION_STATUS = ['pending', 'active', 'completed', 'abandoned'];
export const STEP_STATUS = ['pending', 'correct', 'corrected', 'failed'];

// ── Sub-Schema: SessionStep ───────────────────────────────────────────────────
// Tracks progress for each step within a session.
// Steps are always read/written together with their parent session — embedded is correct here.
const SessionStepSchema = new mongoose.Schema(
    {
        stepId: { type: String, required: true },
        status: { type: String, enum: STEP_STATUS, default: 'pending' },
        attempts: { type: Number, default: 0, min: 0 },
        corrected: { type: Boolean, default: false }, // True if student needed correction before passing
    },
    { _id: false }
);

// ── Schema ────────────────────────────────────────────────────────────────────
const sessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        scenarioId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Scenario',
            required: true,
        },
        status: {
            type: String,
            enum: SESSION_STATUS,
            default: 'pending',
            index: true,
        },
        steps: { type: [SessionStepSchema], default: [] },
        score: { type: Number, min: 0, max: 100 },
        startedAt: { type: Date },
        completedAt: { type: Date },
    },
    { timestamps: true }
);

const Session = mongoose.model('Session', sessionSchema);
export default Session;
