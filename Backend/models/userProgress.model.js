import mongoose from 'mongoose';

const weakAreaSchema = new mongoose.Schema(
    {
        procedureType: { type: String, required: true },
        avgAttempts:   { type: Number, required: true },
        totalAttempts: { type: Number, required: true },
        totalSessions: { type: Number, required: true },
    },
    { _id: false }
);

const userProgressSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },

        // ── Session Metrics ───────────────────────────────────────────────────
        totalSessions:     { type: Number, default: 0 },
        completedSessions: { type: Number, default: 0 },
        totalTimeSeconds:  { type: Number, default: 0 },
        currentStreak:     { type: Number, default: 0 },
        longestStreak:     { type: Number, default: 0 },
        lastPracticedAt:   { type: Date },

        // ── Engagement ────────────────────────────────────────────────────────
        favoriteScenarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scenario' },
        scenarioPlayCounts: { type: Map, of: Number, default: {} },

        // ── Performance Metrics ───────────────────────────────────────────────
        avgScore:          { type: Number, default: 0 },
        bestScore:         { type: Number, default: 0 },
        weakAreas:         { type: [weakAreaSchema], default: [] },
    },
    { timestamps: true }
);

const UserProgress = mongoose.model('UserProgress', userProgressSchema);
export default UserProgress;
