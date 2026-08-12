import { extractReadback } from '../../services/mistral.service.js';
import { validateSlots } from '../utils/fuzzyMatch.js';
import ChatMessage from '../../models/chatMessage.model.js';

const QUESTION_PATTERNS = [
    /\?/,
    /\b(what|how|why|where|when|explain|tell me|say again|can you|could you|request info)\b/i,
];

function isQuestion(text) {
    if (!text) return false;
    return QUESTION_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * validateReadback — Node 6
 *
 * 1. Checks if pilot input is a general question (e.g. "What is VFR ceiling?").
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

    // ── General Question Intent Detection ──────────────────────────────────────
    if (isQuestion(pilotTranscript)) {
        console.log(`[validateReadback] General question detected: "${pilotTranscript}" -> Routing to generalAnswer`);
        const pilotMsg = {
            role: 'pilot',
            text: pilotTranscript,
            stepId: currentStep?.stepId || 'general_q',
            timestamp: new Date(),
        };

        ChatMessage.create({ sessionId, ...pilotMsg }).catch(() => {});

        return {
            isGeneralQuery: true,
            allPassed: false,
            transcript: [pilotMsg],
        };
    }

    // ── Standard Readback Slot Validation ──────────────────────────────────────
    const { stepId, templateId, slots = [] } = currentStep;
    const requiredSlotKeys = slots.filter((s) => s.readbackRequired).map((s) => s.key);

    let extracted = {};
    if (requiredSlotKeys.length > 0) {
        try {
            extracted = await extractReadback(pilotTranscript, requiredSlotKeys, {
                sessionId,
                userId,
                stepId,
                templateId,
            });
        } catch (err) {
            console.error('[validateReadback] Extract error:', err.message);
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
