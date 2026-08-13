import { extractReadback } from '../../services/mistral.service.js';
import { validateSlots, extractCallsignFromTranscript, extractSlotsRuleBased } from '../utils/fuzzyMatch.js';
import ChatMessage from '../../models/chatMessage.model.js';

const AVIATION_REQUEST_PATTERNS = [
    /\?/,
    /\b(request|flight following|vfr|ifr|approach|center|tower|ground|departure|vector|vectors|climb|descend|maintain|direct|ident|squawk|mayday|pan pan|inbound|outbound|divert|holding|traffic|visual|ils|rnav|vor|ndb|altitude|heading|airspeed|wind|altimeter|atis|clearance|say again|radio check|check|read|signal|volume)\b/i,
    /\b(what|how|why|where|when|explain|tell me|can you|could you)\b/i,
    /\b(hello|hi|hey|good morning|good afternoon|good evening|test|testing)\b/i,
];

function isGeneralQueryOrRequest(text) {
    if (!text) return false;
    const lower = text.toLowerCase().trim();
    return AVIATION_REQUEST_PATTERNS.some((pattern) => pattern.test(lower));
}

/**
 * validateReadback — Node 6
 *
 * 1. Checks if pilot input is a general question, greeting, or airborne request (e.g. "Request VFR flight following", "Hello", "What is VFR ceiling?").
 *    If so, sets isGeneralQuery: true to route to generalAnswerNode.
 * 2. Otherwise extracts readback slots using mistral-small and validates against step slots.
 *
 * Input:  state.pilotTranscript, state.currentStep, state.resolvedSlots, state.sessionId, state.retries
 * Output: { extracted, slotReport, allPassed, isGeneralQuery, retries, transcript: [...] }
 */
export async function validateReadbackNode(state) {
    const { pilotTranscript, currentStep = {}, resolvedSlots = {}, sessionId, userId, retries } = state;

    if (!pilotTranscript) {
        console.warn('[validateReadback] No pilotTranscript to validate');
        return {
            allPassed: false,
            isGeneralQuery: false,
            retries: retries + 1,
        };
    }

    // Extract dynamic callsign if pilot spoke it
    const activeCallsign = extractCallsignFromTranscript(pilotTranscript, state.aircraftCallsign || 'N172SP');

    // ── General Question, Greeting, or Airborne Request Intent Detection ────────
    if (isGeneralQueryOrRequest(pilotTranscript)) {
        console.log(`[validateReadback] Aviation request or general query detected: "${pilotTranscript}" (callsign: ${activeCallsign}) -> Routing to generalAnswer`);
        const pilotMsg = {
            role: 'pilot',
            text: pilotTranscript,
            stepId: currentStep?.stepId || 'general_q',
            timestamp: new Date(),
        };

        ChatMessage.create({ sessionId, userId: userId || 'anonymous', ...pilotMsg }).catch(() => {});

        return {
            isGeneralQuery: true,
            allPassed: false,
            aircraftCallsign: activeCallsign,
            transcript: [pilotMsg],
        };
    }

    // ── Standard Readback Slot Validation ──────────────────────────────────────
    const { stepId = '', templateId = '', slots = [] } = currentStep || {};
    let requiredSlotKeys = slots.filter((s) => s.readbackRequired !== false).map((s) => s.key);
    if (requiredSlotKeys.length === 0) {
        requiredSlotKeys = Object.keys(resolvedSlots).filter(k => resolvedSlots[k] != null && k !== 'airport' && k !== 'atis');
    }

    let extracted = {};
    if (requiredSlotKeys.length > 0) {
        // Fast-Path 1: Rule-Based Extraction (< 0.1ms)
        const ruleBased = extractSlotsRuleBased(pilotTranscript, requiredSlotKeys, resolvedSlots);
        const { allPassed: rulePassed } = validateSlots(slots, resolvedSlots, ruleBased);

        if (rulePassed) {
            console.log(`[validateReadback] FAST-PATH — Rule-based extraction validated step "${stepId}" in < 0.1ms`);
            extracted = ruleBased;
        } else {
            // Fast-Path 2: LLM Extraction with strict timeout
            try {
                extracted = await extractReadback(pilotTranscript, requiredSlotKeys, {
                    sessionId,
                    userId,
                    stepId,
                    templateId,
                });
            } catch (err) {
                console.error('[validateReadback] Extract error:', err.message);
                extracted = ruleBased;
            }
        }
    }

    const { report: slotReport, allPassed, failedSlots } = validateSlots(slots, resolvedSlots, extracted);

    console.log(`[validateReadback] Step "${stepId}": passed=${allPassed}, failed=[${failedSlots.join(', ')}]`);

    const pilotMsg = {
        role: 'pilot',
        text: pilotTranscript,
        stepId,
        templateId,
        timestamp: new Date(),
    };

    ChatMessage.create({
        sessionId,
        userId: userId || 'anonymous',
        ...pilotMsg,
    }).catch((err) => console.error('[validateReadback] ChatMessage log error:', err.message));

    return {
        extracted,
        slotReport,
        allPassed,
        isGeneralQuery: false,
        retries: retries + 1,
        transcript: [pilotMsg],
    };
}
