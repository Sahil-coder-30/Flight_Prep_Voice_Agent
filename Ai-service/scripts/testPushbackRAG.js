import 'dotenv/config';
import { generalAnswerNode } from '../agent/nodes/generalAnswer.js';
import { validateReadbackNode } from '../agent/nodes/validateReadback.js';

async function testPushbackRAG() {
    const input = "Carry log ground delta three 088. Gate e eight request push back and start.";
    console.log(`\n--- 🧪 TEST: Processing Pilot Pushback Request ---`);
    console.log(`Input Transcript: "${input}"`);

    const state = {
        pilotTranscript: input,
        sessionId: 'test_rag_pushback_' + Date.now(),
        userId: 'test_pilot_1',
        aircraftCallsign: 'N172SP',
        airport: 'KBOS',
        currentStep: {
            stepId: 'step_1_ground',
            templateId: 'tmpl_ground_taxi_v1',
            procedureType: 'Ground',
            phase: 'Pushback',
            slots: [{ key: 'callsign' }, { key: 'runway' }],
        },
        retries: 0,
    };

    const valResult = await validateReadbackNode(state);
    console.log(`ValidateReadback Output:`, {
        isGeneralQuery: valResult.isGeneralQuery,
        allPassed: valResult.allPassed,
        aircraftCallsign: valResult.aircraftCallsign,
    });

    if (valResult.isGeneralQuery || !valResult.allPassed) {
        console.log(`\n--- 🔍 Routing to GeneralAnswerNode (RAG Vector Search) ---`);
        const ansResult = await generalAnswerNode({ ...state, pilotTranscript: input });
        console.log(`\n✅ ATC Spoken Line: "${ansResult.currentLine}"`);
        console.log(`\n📚 Qdrant RAG Grounding Docs (${ansResult.grounding?.length || 0} retrieved):`);
        (ansResult.grounding || []).forEach((doc, i) => console.log(`  [${i+1}] ${doc.substring(0, 120)}...`));
    }

    process.exit(0);
}

testPushbackRAG().catch((err) => {
    console.error('❌ Test error:', err);
    process.exit(1);
});
