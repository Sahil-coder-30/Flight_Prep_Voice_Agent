import { composeLine } from '../../services/mistral.service.js';
import { retrieveGeneralQuery } from '../../services/qdrant.service.js';
import { savePilotResponseToRag } from '../../services/pilotResponseRag.service.js';
import { extractFacilityFromTranscript, extractCallsignFromTranscript } from '../utils/fuzzyMatch.js';

/**
 * generalAnswerNode — Node for answering general aviation / pilot questions & airborne requests
 */
export async function generalAnswerNode(state) {
    const { pilotTranscript, sessionId, userId, currentStep } = state;

    const callsign = extractCallsignFromTranscript(pilotTranscript, state.aircraftCallsign || 'Delta 421');
    const facility = extractFacilityFromTranscript(pilotTranscript, state.airport ? `${state.airport} Tower` : 'Boston Center');

    console.log(`[generalAnswerNode] Facility: "${facility}", Callsign: "${callsign}", Inquiry: "${pilotTranscript}"`);

    // 1. Retrieve RAG grounding from Qdrant vector DB (FAA JO 7110.65 & ICAO Doc 4444)
    let groundingTexts = [];
    try {
        const hits = await retrieveGeneralQuery(pilotTranscript, 3);
        groundingTexts = hits.map((h) => h.text).filter(Boolean);
    } catch (err) {
        console.warn('[generalAnswerNode] RAG retrieval error:', err.message);
    }

    const instruction = `You are a certified Air Traffic Controller (ATC) operating at facility "${facility}".
Pilot Transmission: "${pilotTranscript}".
Extracted Callsign: "${callsign}".
Extracted Facility: "${facility}".

Use the provided FAA Pilot/Controller Glossary (PCG) and FAA JO 7110.65 RAG grounding definitions to construct an authentic, professional ATC radio transmission (keep under 20 words, zero typos):

STRICT AVIATION PHRASEOLOGY & PROTOCOL RULES:
1. FACILITY & CALLSIGN ACCURACY:
   - Identify as the exact facility the pilot called ("${facility}").
   - Address the pilot using their exact callsign ("${callsign}").

2. ENROUTE CENTER & HIGH ALTITUDE CHECK-INS (Class A Airspace, FL180+ / 18,000+ FT):
   - Cruising aircraft at or above Flight Level 180 (e.g. FL340) use standard pressure 29.92 Hg. DO NOT issue altimeter settings!
   - Acknowledge check-in: "${callsign}, ${facility}, roger, radar contact."

3. AIRBORNE VFR FLIGHT FOLLOWING & RADAR SERVICES (Below 18,000 FT):
   - Issue 4-digit transponder squawk code & local altimeter setting: "${callsign}, ${facility}, squawk 4321 and altimeter 29.92."
   - Busy fallback: "${callsign}, ${facility}, remain outside Class B airspace, standby."

4. GROUND CONTROL / TAXI CLEARANCES:
   - Issue runway assignment, taxiway routing, and hold short instructions: "${callsign}, ${facility}, taxi to runway 22L via Alpha, hold short runway 22L."

5. TOWER / TAKEOFF & LANDING CLEARANCES:
   - Issue wind and runway clearance: "${callsign}, ${facility}, wind 270 at 10, runway 22L cleared for takeoff."`;

    const answer = await composeLine({
        grounding: groundingTexts,
        slots: {},
        instruction,
        ctx: {
            sessionId,
            userId,
            stepId: currentStep?.stepId || 'general_q',
            templateId: 'tmpl_general_answer',
        },
    });

    if (userId && pilotTranscript) {
        savePilotResponseToRag({
            userId,
            sessionId,
            question: pilotTranscript,
            answer,
            templateId: currentStep?.templateId || 'tmpl_general_answer',
            stepId: currentStep?.stepId || 'general_q',
            procedureType: currentStep?.procedureType || 'General',
            phase: currentStep?.phase || 'General',
            score: 100,
            passed: true,
            isGeneralQuery: true,
        }).catch((err) => console.error('[generalAnswerNode] Failed to save query to RAG:', err.message));
    }

    return {
        currentLine: answer,
        grounding: groundingTexts,
        isGeneralQuery: false,
        pilotTranscript: undefined,
    };
}
