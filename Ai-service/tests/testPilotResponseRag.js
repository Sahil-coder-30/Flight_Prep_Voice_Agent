import 'dotenv/config';
import { savePilotResponseToRag, getPilotResponsesFromRag, getTemplateWiseScoresFromRag } from '../services/pilotResponseRag.service.js';

async function main() {
    const testUserId = 'test_pilot_999';
    console.log(`Starting RAG verification test for pilot userId: ${testUserId}`);

    // Sample 1: Successful readback on IFR clearance template
    const id1 = await savePilotResponseToRag({
        userId: testUserId,
        sessionId: 'sess_test_01',
        question: 'N172SP, cleared to Boston airport via flight planned route, climb and maintain 4000, squawk 4712.',
        answer: 'Cleared to Boston via flight planned route, climb maintain 4000, squawk 4712, N172SP.',
        templateId: 'tmpl_ifr_clearance',
        stepId: 'step_clearance_01',
        scenarioId: 'scen_kbos_01',
        procedureType: 'Clearance Delivery',
        phase: 'Pre-flight',
        score: 100,
        passed: true,
        slotReport: { callsign: true, altitude: true, squawk: true },
        retries: 1,
    });

    console.log(`[Test 1] Saved point ID: ${id1}`);

    // Sample 2: Misreadback on Taxi clearance template
    const id2 = await savePilotResponseToRag({
        userId: testUserId,
        sessionId: 'sess_test_01',
        question: 'N172SP, taxi to runway 22L via Alpha, hold short of runway 22R.',
        answer: 'Taxiing to 22L via Alpha, N172SP.', // missed hold short
        templateId: 'tmpl_taxi_clearance',
        stepId: 'step_taxi_02',
        scenarioId: 'scen_kbos_01',
        procedureType: 'Ground',
        phase: 'Taxi',
        score: 50,
        passed: false,
        slotReport: { callsign: true, runway: true, holdShort: false },
        retries: 2,
    });

    console.log(`[Test 2] Saved point ID: ${id2}`);

    // Fetch pilot responses from RAG
    const responses = await getPilotResponsesFromRag(testUserId);
    console.log(`\nRetrieved ${responses.length} responses from RAG for ${testUserId}:`);
    for (const r of responses) {
        console.log(`- Template: ${r.templateId} | Q: "${r.question.slice(0, 30)}..." | A: "${r.answer.slice(0, 30)}..." | Score: ${r.score} | Passed: ${r.passed}`);
    }

    // Compute template-wise score breakdown
    const analytics = await getTemplateWiseScoresFromRag(testUserId);
    console.log('\nTemplate-Wise Performance Score Analytics:');
    console.log(JSON.stringify(analytics, null, 2));

    console.log('\n✅ Verification test complete successfully!');
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Verification test failed:', err);
    process.exit(1);
});
