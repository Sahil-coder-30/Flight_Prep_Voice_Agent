import mongoose from 'mongoose';

// ── Constants ─────────────────────────────────────────────────────────────────
export const SCENARIO_DIFFICULTY = ['beginner', 'intermediate', 'advanced'];
export const SCENARIO_PHASE = ['ground', 'departure', 'arrival', 'approach', 'enroute'];

// ── Sub-Schema: Step ──────────────────────────────────────────────────────────
// Defines one conversational exchange in a scenario.
// The AI service consumes this template to drive LangGraph execution.
const StepSchema = new mongoose.Schema(
    {
        stepId: { type: String, required: true },
        phase: { type: String, enum: SCENARIO_PHASE, required: true },
        controllerLine: { type: String, required: true },       // What ATC says
        expectedReadbackSlots: { type: [String], default: [] }, // Checklist elements pilot must read back
        procedureType: { type: String, required: true },        // Used by Qdrant retrieval filter
        maxRetries: { type: Number, default: 3, min: 0 },
    },
    { _id: false }
);

// ── Schema ────────────────────────────────────────────────────────────────────
const scenarioSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        difficulty: { type: String, enum: SCENARIO_DIFFICULTY, required: true },
        airport: { type: String, required: true },           // e.g. KJFK
        aircraftCallsign: { type: String, required: true },  // e.g. N12345
        steps: { type: [StepSchema], default: [] },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const Scenario = mongoose.model('Scenario', scenarioSchema);
export default Scenario;
