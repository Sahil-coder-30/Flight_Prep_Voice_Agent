import { composeLine } from '../../services/mistral.service.js';
import { retrieveGeneralQuery } from '../../services/qdrant.service.js';
import { savePilotResponseToRag } from '../../services/pilotResponseRag.service.js';

/**
 * generalAnswerNode — Node for answering general aviation / pilot questions
 *
 * Triggered when the pilot asks a question ("What is VFR ceiling?", "Explain ILS", etc.)
 * queries Qdrant RAG across the ingested ICAO & FAA manuals, generates an authoritative response,
 * and saves the query/response pair for historical scoring analytics.
 *
 * Input:  state.pilotTranscript, state.sessionId, state.userId
 * Output: { currentLine, grounding }
 */
export async function generalAnswerNode(state) {
    const { pilotTranscript, sessionId, userId, currentStep } = state;

    console.log(`[generalAnswerNode] Querying RAG for general inquiry: "${pilotTranscript}"`);

    // 1. Retrieve RAG grounding from Qdrant vector DB (FAA JO 7110.65 & ICAO Doc 4444)
    let groundingTexts = [];
    try {
        const hits = await retrieveGeneralQuery(pilotTranscript, 3);
        groundingTexts = hits.map((h) => h.text).filter(Boolean);
        console.log(`[generalAnswerNode] RAG retrieved ${groundingTexts.length} grounding snippets.`);
    } catch (err) {
        console.warn('[generalAnswerNode] RAG retrieval error:', err.message);
    }

    const instruction = `The pilot asked: "${pilotTranscript}". Provide a professional, concise, radio-style answer (under 35 words) using the RAG grounding text. Use standard ICAO/FAA phraseology if applicable.`;

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
        isGeneralQuery: false, // reset flag for next turn
    };
}
