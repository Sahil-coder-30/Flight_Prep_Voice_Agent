import mongoose from 'mongoose';

export const SCENARIO_DIFFICULTY = ['beginner', 'intermediate', 'advanced'];
export const SCENARIO_PHASE = ['ground', 'departure', 'arrival', 'approach', 'enroute'];

// ── Sub-Schema: Slot ──────────────────────────────────────────────────────────
const SlotSchema = new mongoose.Schema(
    {
        key:              { type: String, required: true },
        source:           { type: String, enum: ['static', 'dynamic', 'session'], required: true },
        staticValue:      String,
        dynamicType:      { type: String, enum: ['wind_dir', 'wind_speed', 'altimeter', 'squawk', 'frequency', 'atis'] },
        required:         { type: Boolean, default: true },
        readbackRequired: { type: Boolean, default: true },
        matchType:        { type: String, enum: ['exact', 'approximate', 'phonetic'], default: 'exact' },
        tolerance:        { type: Number, default: 0 },
    },
    { _id: false }
);

// ── Sub-Schema: Step ──────────────────────────────────────────────────────────
const StepSchema = new mongoose.Schema(
    {
        stepId:                { type: String, required: true },
        templateId:            { type: String, required: true },
        phase:                 { type: String, enum: SCENARIO_PHASE, required: true },
        procedureType:         { type: String, required: true },
        controllerLine:        { type: String, required: true },
        slots:                 { type: [SlotSchema], default: [] },
        maxRetries:            { type: Number, default: 3, min: 0 },
        correctionLine:        String,
        gradeWeight:           { type: Number, default: 1.0 },
    },
    { _id: false }
);

// ── Master Schema ─────────────────────────────────────────────────────────────
const scenarioSchema = new mongoose.Schema(
    {
        title:            { type: String, required: true },
        description:      { type: String },
        difficulty:       { type: String, enum: SCENARIO_DIFFICULTY, required: true },
        airport:          { type: String, required: true },
        aircraftCallsign: { type: String, required: true },
        steps:            { type: [StepSchema], default: [] },
        isActive:         { type: Boolean, default: true },
        playCount:        { type: Number, default: 0 },
    },
    { timestamps: true }
);

const Scenario = mongoose.model('Scenario', scenarioSchema);
export default Scenario;
