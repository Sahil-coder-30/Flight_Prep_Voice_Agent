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
    const { steps, stepIndex = 0, sessionId } = state;

    const activeSteps = (Array.isArray(steps) && steps.length > 0) ? steps : [
        {
            stepId: 'step_1',
            procedureType: 'taxi_clearance',
            phase: 'ground',
            controllerLine: '{callsign}, Boston Ground, taxi to runway {runway} via taxiway Alpha, hold short runway {runway}.',
            expectedReadback: '{callsign}, taxi to runway {runway} via Alpha, hold short runway {runway}.',
            slots: [{ key: 'callsign', staticValue: 'N172SP' }, { key: 'runway', staticValue: '22L' }]
        }
    ];

    if (!activeSteps[stepIndex]) {
        console.warn(`[loadStep] No step at index ${stepIndex} (steps count: ${activeSteps.length})`);
        return { finished: true, currentStep: null };
    }

    const currentStep = activeSteps[stepIndex];

    const scenarioMeta = {
        aircraftCallsign: state.aircraftCallsign,
        airport: state.airport,
    };

    const resolvedSlots = await resolveSlots(currentStep, sessionId, scenarioMeta);
    if (!resolvedSlots.callsign) resolvedSlots.callsign = state.aircraftCallsign || 'N172SP';
    if (!resolvedSlots.atis) resolvedSlots.atis = 'Bravo';
    if (!resolvedSlots.runway) resolvedSlots.runway = '22L';

    console.log(`[loadStep] Step ${stepIndex}: "${currentStep.stepId}" (${currentStep.templateId})`);

    return { currentStep, resolvedSlots, finished: false };
}
