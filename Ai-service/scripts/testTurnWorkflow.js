import 'dotenv/config';
import { compiledGraph } from '../agent/graph.js';

const mockScenarioSteps = [
    {
        stepId: 'step_1_taxi',
        templateId: 'tmpl_ground_taxi_v1',
        type: 'ground',
        controllerLine: 'Cessna {callsign}, Boston Ground, taxi to runway {runway} via Alpha, hold short runway {runway}.',
        expectedReadback: '{callsign}, taxi to runway {runway} via Alpha, hold short runway {runway}.',
        slots: [
            { key: 'callsign', staticValue: 'N172SP', readbackRequired: true },
            { key: 'runway', staticValue: '22L', readbackRequired: true }
        ],
        maxRetries: 3
    },
    {
        stepId: 'step_2_takeoff',
        templateId: 'tmpl_tower_takeoff_v1',
        type: 'departure',
        controllerLine: '{callsign}, Boston Tower, wind {windDir} at {windSpeed}, runway {runway}, cleared for takeoff.',
        expectedReadback: 'Runway {runway}, cleared for takeoff, {callsign}.',
        slots: [
            { key: 'callsign', staticValue: 'N172SP', readbackRequired: true },
            { key: 'runway', staticValue: '22L', readbackRequired: true }
        ],
        maxRetries: 3
    }
];

async function runTest() {
    const threadId = 'test_session_' + Date.now();
    const config = { configurable: { thread_id: threadId } };

    console.log('\n--- 🧪 TEST 1: Initializing Session (Step 1) ---');
    let res1 = await compiledGraph.invoke({
        sessionId: threadId,
        userId: 'test_user',
        steps: mockScenarioSteps,
        stepIndex: 0,
        aircraftCallsign: 'N172SP',
        airport: 'KBOS',
        turnStartMs: Date.now(),
    }, config);

    console.log('ATC Output Line:', res1.currentLine);
    console.log('Step Index:', res1.stepIndex);

    console.log('\n--- 🧪 TEST 2: Correct Readback Input for Step 1 ---');
    const correctInput = 'Taxi to runway 22L via Alpha, hold short 22L, N172SP.';
    console.log('Pilot Input:', correctInput);

    let res2 = await compiledGraph.invoke({
        resume: correctInput,
        pilotTranscript: correctInput,
        userId: 'test_user',
    }, config);

    console.log('ATC Output Line (Step 2):', res2.currentLine);
    console.log('New Step Index:', res2.stepIndex);
    console.log('Finished:', res2.finished);

    console.log('\n--- 🧪 TEST 3: General Question Input ("What is VFR ceiling?") ---');
    const questionInput = 'What is the VFR ceiling requirement?';
    console.log('Pilot Input:', questionInput);

    let res3 = await compiledGraph.invoke({
        resume: questionInput,
        pilotTranscript: questionInput,
        userId: 'test_user',
    }, config);

    console.log('ATC RAG Answer:', res3.currentLine);
    console.log('Is General Query:', res3.isGeneralQuery);

    console.log('\n--- 🧪 TEST 4: Takeoff Readback Input for Step 2 ---');
    const takeoffInput = 'Cleared for takeoff runway 22L, N172SP.';
    console.log('Pilot Input:', takeoffInput);

    let res4 = await compiledGraph.invoke({
        resume: takeoffInput,
        pilotTranscript: takeoffInput,
        userId: 'test_user',
    }, config);

    console.log('ATC Output Line (Debrief/End):', res4.currentLine);
    console.log('Finished:', res4.finished);
    console.log('Final Score Report:', res4.stepResults);

    console.log('\n🎉 Turn Workflow Test Completed Successfully!');
    process.exit(0);
}

runTest().catch((err) => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
});
