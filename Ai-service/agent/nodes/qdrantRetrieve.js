import { retrieve } from '../../services/qdrant.service.js';

/**
 * qdrantRetrieve — Node 2
 *
 * Retrieves grounding documents for the current step.
 * Redis L1 (embedding) + L2 (grounding) cache means most turns hit Redis.
 *
 * Cache hit path:  ~5ms
 * Cold path:       ~550ms (embed + Qdrant search)
 *
 * Input:  state.currentStep, state.sessionId, state.userId
 * Output: { grounding: string[] }
 */
export async function qdrantRetrieveNode(state) {
    const { currentStep, sessionId, userId, finished } = state;

    if (finished || !currentStep) {
        return { grounding: [] };
    }

    const { procedureType = 'general', phase = 'general', templateId = '', stepId = '' } = currentStep;

    const query = `${procedureType} ${phase} phraseology standard`;

    const hits = await retrieve(
        query,
        procedureType,
        phase,
        templateId,          // used as Redis cache key
        3,
        { sessionId, userId, stepId, templateId }
    );

    const grounding = hits.map((h) => h.text).filter(Boolean);
    const cacheHit  = hits.length > 0 && !!hits[0]._cacheHit; // set by service if from Redis

    console.log(`[qdrantRetrieve] Step "${stepId}": ${grounding.length} grounding docs (cache: ${cacheHit})`);

    return { grounding };
}
