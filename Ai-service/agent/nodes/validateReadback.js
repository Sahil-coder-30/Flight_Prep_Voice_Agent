import { extractReadback } from '../../services/mistral.service.js';
import { validateSlots, extractCallsignFromTranscript, extractSlotsRuleBased } from '../utils/fuzzyMatch.js';
import ChatMessage from '../../models/chatMessage.model.js';

const GENERAL_EXPLICIT_QUERY_PATTERNS = [
    /\?/,
    /\b(what|how|why|where|when|explain|tell me|can you explain|could you explain|what is|how do)\b/i,
    /\b(hello|hi|hey|good morning|good afternoon|good evening|test|testing)\b/i,
    /\b(request\s+push\s*back|push\s*back|pushback|request\s+start|engine\s+start|start\s+and\s+pushback|request\s+taxi|ready\s+for\s+taxi|ready\s+for\s+pushback|request\s+clearance|request\s+vfr|flight\s+following|gate\s+[a-z0-9]+)\b/i,
    /\b(radio\s+check|say\ +again|say\ +altimeter|say\ +wind|information\ +[a-z])\b/i,
];

function isExplicitGeneralQuery(text) {
    if (!text) return false;
    const lower = text.toLowerCase().trim();
    return GENERAL_EXPLICIT_QUERY_PATTERNS.some((pattern) => pattern.test(lower));
}

/**
 * validateReadback — Node 6
 *
 * 1. Checks if input is an explicit informational query or unscripted pilot request (e.g. pushback/start/taxi request).
 *    If so, routes directly to generalAnswerNode (Qdrant RAG).
 * 2. Otherwise extracts readback slots and validates against step slots.
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

    // Extract dynamic callsign if pilot spoke it (e.g. Delta 3088, N172SP)
    const activeCallsign = extractCallsignFromTranscript(pilotTranscript, state.aircraftCallsign || 'N172SP');
    const { stepId = '', templateId = '', slots = [] } = currentStep || {};

    // ── 1. Route explicit queries & unscripted requests to generalAnswerNode (RAG) ──
    if (isExplicitGeneralQuery(pilotTranscript)) {
        console.log(`[validateReadback] Unscripted request/query detected: "${pilotTranscript}" (callsign: ${activeCallsign}) -> Routing to generalAnswer`);
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

    // ── 2. Standard Readback Slot Validation ───────────────────────────────────
    let requiredSlotKeys = slots.filter((s) => s.readbackRequired !== false).map((s) => s.key);
    if (requiredSlotKeys.length === 0) {
        requiredSlotKeys = Object.keys(resolvedSlots).filter(k => resolvedSlots[k] != null && k !== 'airport' && k !== 'atis');
    }

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
        allPassed = true;
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
