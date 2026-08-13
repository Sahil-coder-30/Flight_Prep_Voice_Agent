import { validateReadbackNode } from '../agent/nodes/validateReadback.js';
import { speak } from '../services/tts.service.js';

async function runTests() {
    console.log('====================================================');
    console.log('  TESTING ATC AUDIO, TTS & READBACK STATE MACHINE  ');
    console.log('====================================================\n');

    // ── Test 1: Readback Validation & Step Advancement ─────────────────
    console.log('Test 1: Validating Standard ATC Readback Phraseology...');
    const testState = {
        pilotTranscript: 'N172SP, taxi to runway 22L via Alpha, hold short runway 22L',
        currentStep: {
            stepId: 'step_1',
            procedureType: 'taxi_clearance',
            slots: [
                { key: 'callsign', staticValue: 'N172SP', readbackRequired: true },
                { key: 'runway', staticValue: '22L', readbackRequired: true },
            ]
        },
        resolvedSlots: {
            callsign: 'N172SP',
            runway: '22L',
        },
        sessionId: 'test_session_101',
        userId: 'test_user',
        retries: 0,
    };

    const valResult = await validateReadbackNode(testState);
    console.log(' -> isGeneralQuery:', valResult.isGeneralQuery);
    console.log(' -> allPassed:', valResult.allPassed);
    
    if (valResult.isGeneralQuery === false && valResult.allPassed === true) {
        console.log(' [PASS] Readback validation passed & will advance step correctly!\n');
    } else {
        console.error(' [FAIL] Readback validation failed!\n', valResult);
    }

    // ── Test 2: TTS Base64 Audio Generation ─────────────────────────────
    console.log('Test 2: Synthesizing Controller Audio Line via TTS Service...');
    const testLine = 'N172SP, Boston Ground, taxi to runway 22L via taxiway Alpha, hold short runway 22L.';
    const ttsResult = await speak(testLine);

    console.log(' -> audioBase64 present:', !!ttsResult.audioBase64);
    if (ttsResult.audioBase64) {
        console.log(' -> Base64 audio byte length:', ttsResult.audioBase64.length);
        console.log(' [PASS] TTS audio Base64 generated successfully!\n');
    } else {
        console.error(' [FAIL] TTS audio generation returned null!\n');
    }

    console.log('====================================================');
    console.log('  ALL TESTS COMPLETED SUCCESSFULLY!                ');
    console.log('====================================================');
}

runTests().catch((err) => {
    console.error('Test execution error:', err);
    process.exit(1);
});
