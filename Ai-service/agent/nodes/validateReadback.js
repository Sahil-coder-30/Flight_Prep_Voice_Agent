import { extractReadback } from '../../services/mistral.service.js';
import { validateSlots, extractCallsignFromTranscript, extractSlotsRuleBased } from '../utils/fuzzyMatch.js';
import ChatMessage from '../../models/chatMessage.model.js';

const GENERAL_EXPLICIT_QUERY_PATTERNS = [
    /\?/,
    /\b(what|how|why|where|when|explain|tell me|can you explain|could you explain|what is|how do)\b/i,
    /\b(hello|hi|hey|good morning|good afternoon|good evening|test|testing)\b/i,
    /\b(request vfr flight following|request flight following|request clearance|request pushback)\b/i,
];

function isExplicitGeneralQuery(text) {
    if (!text) return false;
    const lower = text.toLowerCase().trim();
    return GENERAL_EXPLICIT_QUERY_PATTERNS.some((pattern) => pattern.test(lower));
}

/**
 * validateReadback — Node 6
 *
 * 1. Evaluates readback slots against the active scenario step.
 * 2. If slots pass or pilot is providing readback, advances state machine.
 * 3. Only routes to generalAnswerNode if the pilot explicitly asks an informational query or greeting.
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
    const { stepId = '', templateId = '', slots = [] } = currentStep || {};

    let requiredSlotKeys = slots.filter((s) => s.readbackRequired !== false).map((s) => s.key);
    if (requiredSlotKeys.length === 0) {
        requiredSlotKeys = Object.keys(resolvedSlots).filter(k => resolvedSlots[k] != null && k !== 'airport' && k !== 'atis');
    }

    // ── 1. Attempt Readback Slot Extraction & Validation First ─────────────────
    let extracted = {};
    let slotReport = null;
    let allPassed = false;
    let failedSlots = [];

    if (requiredSlotKeys.length > 0) {
        // Fast-Path 1: Rule-Based Extraction (< 0.1ms)
        const ruleBased = extractSlotsRuleBased(pilotTranscript, requiredSlotKeys, resolvedSlots);
        const { allPassed: rulePassed } = validateSlots(slots, resolvedSlots, ruleBased);

        if (rulePassed) {
            console.log(`[validateReadback] FAST-PATH — Rule-based extraction validated step "${stepId}" in < 0.1ms`);
            extracted = ruleBased;
        } else {
            // Fast-Path 2: LLM Extraction
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

        const validation = validateSlots(slots, resolvedSlots, extracted);
        slotReport = validation.report;
        allPassed = validation.allPassed;
        failedSlots = validation.failedSlots;
    } else {
        // Step with no required readback slots
        allPassed = true;
    }

    // ── 2. Check if input is an explicit general question ONLY if readback didn't pass ──
    if (!allPassed && isExplicitGeneralQuery(pilotTranscript)) {
        console.log(`[validateReadback] Explicit general query detected: "${pilotTranscript}" (callsign: ${activeCallsign}) -> Routing to generalAnswer`);
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
