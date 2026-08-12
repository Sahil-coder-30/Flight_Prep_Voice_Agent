import { resolveSlots } from '../utils/slotResolver.js';

/**
 * loadStep — Node 1
 *
 * Loads the current step from state.steps[stepIndex] and resolves
 * all slot values (static + dynamic from Redis) into resolvedSlots.
 *
 * Input:  state.stepIndex, state.steps, state.sessionId
 * Output: { currentStep, resolvedSlots }
 * Latency: ~5ms (Redis read for dynamic slots)
 */
export async function loadStepNode(state) {
    const { steps, stepIndex, sessionId } = state;
    const currentStep = steps[stepIndex];

    if (!currentStep) {
        console.error(`[loadStep] No step at index ${stepIndex}`);
        return { finished: true };
    }

    const scenarioMeta = {
        aircraftCallsign: state.aircraftCallsign,
        airport: state.airport,
    };

    const resolvedSlots = await resolveSlots(currentStep, sessionId, scenarioMeta);

    console.log(`[loadStep] Step ${stepIndex}: "${currentStep.stepId}" (${currentStep.templateId})`);

    return { currentStep, resolvedSlots };
}
