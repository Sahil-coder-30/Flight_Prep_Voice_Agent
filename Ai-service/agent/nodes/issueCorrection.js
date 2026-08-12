import { composeCorrection } from '../../services/mistral.service.js';

/**
 * issueCorrection — Node 7
 *
 * Triggered when a pilot readback fails validation.
 * Uses step.correctionLine template if available (fast path).
 * Falls back to mistral-small brief correction phrase if template is missing.
 *
 * Input:  state.currentStep, state.slotReport, state.resolvedSlots, state.sessionId
 * Output: { currentLine }
 */
export async function issueCorrectionNode(state) {
    const { currentStep, slotReport = {}, resolvedSlots, sessionId, userId } = state;
    const { correctionLine, stepId, templateId } = currentStep;

    const failedSlots = Object.keys(slotReport).filter((k) => !slotReport[k]);
    const callsign = resolvedSlots.callsign || 'aircraft';

    // Fast path: use step correction line template if defined
    if (correctionLine) {
        const line = correctionLine.replace('{callsign}', callsign).replace('{failedSlots}', failedSlots.join(', '));
        console.log(`[issueCorrection] Fast path correction for step "${stepId}"`);
        return { currentLine: line };
    }

    // Slow path: short LLM correction call
    const llmCorrection = await composeCorrection(failedSlots, callsign, {
        sessionId,
        userId,
        stepId,
        templateId,
    });

    console.log(`[issueCorrection] LLM correction generated for step "${stepId}"`);
    return { currentLine: llmCorrection };
}
