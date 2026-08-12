import mongoose from 'mongoose';

const stepAnalyticsSchema = new mongoose.Schema(
    {
        stepId:     { type: String, required: true },
        templateId: { type: String, required: true },
        attempts:   { type: Number, default: 1 },
        passed:     { type: Boolean, default: true },
        corrected:  { type: Boolean, default: false },
        score:      { type: Number, default: 100 },
    },
    { _id: false }
);

const sessionAnalyticsSchema = new mongoose.Schema(
    {
        sessionId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, unique: true },
        userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        scenarioId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Scenario', required: true },
        durationSeconds: { type: Number, default: 0 },
        finalScore:      { type: Number, required: true },
        stepResults:     { type: [stepAnalyticsSchema], default: [] },
    },
    { timestamps: true }
);

const SessionAnalytics = mongoose.model('SessionAnalytics', sessionAnalyticsSchema);
export default SessionAnalytics;
