import 'dotenv/config';
import mongoose from 'mongoose';
import Scenario from '../models/scenario.model.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/atc_backend';

const SCENARIOS = [
    {
        title: 'KBOS Ground Start & Taxi Clearance',
        description: 'Practice engine start request, ATIS readback, and ground taxi clearance to runway 22L at Boston Logan.',
        difficulty: 'beginner',
        airport: 'KBOS',
        aircraftCallsign: 'N172SP',
        steps: [
            {
                stepId: 'gbos_01',
                templateId: 'tmpl_ground_startup_v1',
                phase: 'ground',
                procedureType: 'engine_start',
                controllerLine: '{callsign}, Boston Ground, good morning, information {atis} is current, altimeter {altimeter}.',
                slots: [
                    { key: 'callsign', source: 'session', readbackRequired: true },
                    { key: 'atis', source: 'dynamic', dynamicType: 'atis', readbackRequired: true },
                    { key: 'altimeter', source: 'dynamic', dynamicType: 'altimeter', readbackRequired: true, matchType: 'approximate', tolerance: 0.05 },
                ],
                maxRetries: 3,
                correctionLine: '{callsign}, negative, verify information {atis} and altimeter.',
                gradeWeight: 1.0,
            },
            {
                stepId: 'gbos_02',
                templateId: 'tmpl_ground_taxi_clearance_v1',
                phase: 'ground',
                procedureType: 'taxi_clearance',
                controllerLine: '{callsign}, taxi to runway 22L via taxiway Bravo, hold short of runway 15R.',
                slots: [
                    { key: 'callsign', source: 'session', readbackRequired: true },
                    { key: 'runway', source: 'static', staticValue: '22L', readbackRequired: true },
                    { key: 'taxiway', source: 'static', staticValue: 'Bravo', readbackRequired: true },
                    { key: 'holdShort', source: 'static', staticValue: '15R', readbackRequired: true },
                ],
                maxRetries: 3,
                correctionLine: '{callsign}, negative, read back taxiway Bravo and hold short 15R.',
                gradeWeight: 1.2,
            },
        ],
    },
    {
        title: 'KJFK VFR Tower Departure',
        description: 'Clearance delivery confirmation, takeoff clearance on runway 31L, and departure frequency handoff.',
        difficulty: 'beginner',
        airport: 'KJFK',
        aircraftCallsign: 'N5482X',
        steps: [
            {
                stepId: 'jfk_01',
                templateId: 'tmpl_departure_clearance_delivery_v1',
                phase: 'departure',
                procedureType: 'clearance_delivery',
                controllerLine: '{callsign}, JFK Clearance, cleared to Montauk airport, maintain 3000 feet, squawk {squawk}.',
                slots: [
                    { key: 'callsign', source: 'session', readbackRequired: true },
                    { key: 'altitude', source: 'static', staticValue: '3000', readbackRequired: true, matchType: 'approximate', tolerance: 100 },
                    { key: 'squawk', source: 'dynamic', dynamicType: 'squawk', readbackRequired: true },
                ],
                maxRetries: 3,
                correctionLine: '{callsign}, verify altitude 3000 and assigned squawk.',
                gradeWeight: 1.0,
            },
            {
                stepId: 'jfk_02',
                templateId: 'tmpl_departure_takeoff_clearance_v1',
                phase: 'departure',
                procedureType: 'takeoff_clearance',
                controllerLine: '{callsign}, JFK Tower, runway 31L, cleared for takeoff, wind {windDir} at {windSpeed}.',
                slots: [
                    { key: 'callsign', source: 'session', readbackRequired: true },
                    { key: 'runway', source: 'static', staticValue: '31L', readbackRequired: true },
                    { key: 'windDir', source: 'dynamic', dynamicType: 'wind_dir', readbackRequired: false },
                    { key: 'windSpeed', source: 'dynamic', dynamicType: 'wind_speed', readbackRequired: false },
                ],
                maxRetries: 3,
                correctionLine: '{callsign}, negative, runway 31L cleared for takeoff.',
                gradeWeight: 1.5,
            },
        ],
    },
    {
        title: 'KLAX ILS Approach & Landing',
        description: 'Radar vectoring, ILS localizer intercept clearance, and runway 25L landing approval.',
        difficulty: 'intermediate',
        airport: 'KLAX',
        aircraftCallsign: 'N8821K',
        steps: [
            {
                stepId: 'lax_01',
                templateId: 'tmpl_approach_ils_clearance_v1',
                phase: 'approach',
                procedureType: 'ils_approach_clearance',
                controllerLine: '{callsign}, turn left heading 220, descend and maintain 2500, cleared ILS runway 25L approach.',
                slots: [
                    { key: 'callsign', source: 'session', readbackRequired: true },
                    { key: 'heading', source: 'static', staticValue: '220', readbackRequired: true, matchType: 'approximate', tolerance: 10 },
                    { key: 'altitude', source: 'static', staticValue: '2500', readbackRequired: true, matchType: 'approximate', tolerance: 100 },
                    { key: 'runway', source: 'static', staticValue: '25L', readbackRequired: true },
                ],
                maxRetries: 3,
                correctionLine: '{callsign}, read back heading 220, altitude 2500, cleared ILS 25L.',
                gradeWeight: 1.5,
            },
            {
                stepId: 'lax_02',
                templateId: 'tmpl_approach_landing_clearance_v1',
                phase: 'approach',
                procedureType: 'landing_clearance',
                controllerLine: '{callsign}, LA Tower, runway 25L cleared to land, wind {windDir} at {windSpeed}.',
                slots: [
                    { key: 'callsign', source: 'session', readbackRequired: true },
                    { key: 'runway', source: 'static', staticValue: '25L', readbackRequired: true },
                ],
                maxRetries: 3,
                correctionLine: '{callsign}, verify runway 25L cleared to land.',
                gradeWeight: 1.2,
            },
        ],
    },
    {
        title: 'KORD Enroute Center Handoff',
        description: 'Chicago Center altitude reassignment, direct fix navigation, and Minneapolis Center frequency handoff.',
        difficulty: 'intermediate',
        airport: 'KORD',
        aircraftCallsign: 'N2234Q',
        steps: [
            {
                stepId: 'ord_01',
                templateId: 'tmpl_enroute_altitude_assignment_v1',
                phase: 'enroute',
                procedureType: 'altitude_reassignment',
                controllerLine: '{callsign}, Chicago Center, climb and maintain 12000, proceed direct JOT.',
                slots: [
                    { key: 'callsign', source: 'session', readbackRequired: true },
                    { key: 'altitude', source: 'static', staticValue: '12000', readbackRequired: true, matchType: 'approximate', tolerance: 200 },
                    { key: 'waypoint', source: 'static', staticValue: 'JOT', readbackRequired: true },
                ],
                maxRetries: 3,
                correctionLine: '{callsign}, negative, climb maintain 12000, direct JOT.',
                gradeWeight: 1.0,
            },
            {
                stepId: 'ord_02',
                templateId: 'tmpl_enroute_freq_change_v1',
                phase: 'enroute',
                procedureType: 'frequency_handoff',
                controllerLine: '{callsign}, contact Minneapolis Center on {frequency}, good day.',
                slots: [
                    { key: 'callsign', source: 'session', readbackRequired: true },
                    { key: 'frequency', source: 'dynamic', dynamicType: 'frequency', readbackRequired: true, matchType: 'approximate', tolerance: 0.2 },
                ],
                maxRetries: 3,
                correctionLine: '{callsign}, verify Minneapolis Center frequency.',
                gradeWeight: 1.0,
            },
        ],
    },
    {
        title: 'KSFO Emergency Squawk & Priority Landing',
        description: 'Mayday squawk confirmation, emergency souls on board report, and priority vectors to land on 28R.',
        difficulty: 'advanced',
        airport: 'KSFO',
        aircraftCallsign: 'N9944F',
        steps: [
            {
                stepId: 'sfo_01',
                templateId: 'tmpl_emergency_squawk_declare_v1',
                phase: 'approach',
                procedureType: 'emergency_declaration',
                controllerLine: '{callsign}, SFO Approach, radar contact, squawk 7700, say fuel remaining and souls on board.',
                slots: [
                    { key: 'callsign', source: 'session', readbackRequired: true },
                    { key: 'squawk', source: 'static', staticValue: '7700', readbackRequired: true },
                ],
                maxRetries: 3,
                correctionLine: '{callsign}, confirm squawk 7700 emergency.',
                gradeWeight: 2.0,
            },
            {
                stepId: 'sfo_02',
                templateId: 'tmpl_emergency_priority_landing_v1',
                phase: 'approach',
                procedureType: 'priority_landing_clearance',
                controllerLine: '{callsign}, fly heading 280, runway 28R cleared to land, emergency response standing by.',
                slots: [
                    { key: 'callsign', source: 'session', readbackRequired: true },
                    { key: 'heading', source: 'static', staticValue: '280', readbackRequired: true, matchType: 'approximate', tolerance: 10 },
                    { key: 'runway', source: 'static', staticValue: '28R', readbackRequired: true },
                ],
                maxRetries: 3,
                correctionLine: '{callsign}, heading 280, runway 28R cleared to land.',
                gradeWeight: 2.0,
            },
        ],
    },
];

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('[Seed] Connected to MongoDB');

        await Scenario.deleteMany({});
        console.log('[Seed] Cleared existing scenarios');

        const inserted = await Scenario.insertMany(SCENARIOS);
        console.log(`[Seed] Successfully inserted ${inserted.length} scenario templates:`);
        inserted.forEach((s) => console.log(` - [${s.difficulty}] ${s.title} (${s.steps.length} steps)`));

        await mongoose.disconnect();
        console.log('[Seed] Completed successfully');
    } catch (err) {
        console.error('[Seed] Error:', err);
        process.exit(1);
    }
}

seed();
