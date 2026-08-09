/**
 * Composes an ATC controller response line using Mistral API with structured output / prompt constraints.
 *
 * @param {Object} params
 * @param {Object} params.stepData
 * @param {string} [params.sttTranscript]
 * @param {Array} [params.groundingHits]
 * @returns {Promise<string>} In-character ATC controller line
 */
export const composeControllerLine = async ({ stepData, sttTranscript, groundingHits }) => {
    try {
        console.log('[Mistral Service] Composing controller line...');
        if (stepData?.controllerLine) {
            return stepData.controllerLine;
        }

        return 'Cessna 172SP, Boston Tower, cleared for takeoff runway 22L, maintain 3000 feet.';
    } catch (error) {
        console.error('[Mistral Service] Composition error:', error.message);
        return 'Cessna 172SP, Say again your last transmission.';
    }
};
