import { renderTemplate } from '../utils/slotResolver.js';
import { composeLine } from '../../services/mistral.service.js';

/**
 * composeLine — Node 3
 *
 * Renders the controller line using a 2-path strategy:
 *
 * FAST PATH  (~0ms): Template rendering when all slots resolved.
 *   "{callsign}, runway {runway}, cleared for takeoff." → "N172SP, runway 22L, cleared for takeoff."
 *
 * SLOW PATH  (~900ms): LLM fallback only when slots unresolvable.
 *   Uses mistral-large-latest with Qdrant grounding.
 *
 * Input:  state.currentStep, state.resolvedSlots, state.grounding, state.sessionId
 * Output: { currentLine }
 */
export async function composeLineNode(state) {
    const { currentStep, resolvedSlots = {}, grounding = [], sessionId, userId, finished } = state;

    if (finished || !currentStep) {
        return { currentLine: 'Sortie completed, maintain current frequency.' };
    }

    const { controllerLine = '', stepId = '', templateId = '', procedureType = '', phase = '' } = currentStep;

    const { line, allResolved, unresolvedKeys } = renderTemplate(controllerLine, resolvedSlots);

    if (allResolved) {
        console.log(`[composeLine] FAST PATH — template rendered for "${stepId}"`);
        return { currentLine: line };
    }

    // Slow path: LLM fallback
    console.log(`[composeLine] SLOW PATH — unresolved: ${unresolvedKeys.join(', ')}`);

    const instruction = `Generate the controller's spoken line for procedure "${procedureType}" during the "${phase}" phase. Fill in missing values appropriately.`;

    const llmLine = await composeLine({
        grounding,
        slots: resolvedSlots,
        instruction,
        ctx: { sessionId, userId, stepId, templateId },
    });

    return { currentLine: llmLine };
}
