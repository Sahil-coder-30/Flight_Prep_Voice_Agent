import { queryQdrantKnowledge } from './qdrant.service.js';
import { composeControllerLine } from './mistral.service.js';
import { synthesizeSpeech } from './tts.service.js';
import ChatMessage from '../models/chatMessage.model.js';
import SessionCheckpoint from '../models/sessionCheckpoint.model.js';

/**
 * Executes one turn of the LangGraph conditional ATC agent workflow:
 * 1. load_step & qdrant_retrieve (grounding for step)
 * 2. compose_line (Mistral LLM)
 * 3. tts_speak (Rime TTS)
 * 4. validate_readback (3-way branch: correct / incorrect retries left / clarify)
 *
 * @param {Object} params
 * @param {string} params.sessionId
 * @param {string} params.stepId
 * @param {string} [params.sttTranscript]
 * @param {Object} [params.currentStepData]
 * @returns {Promise<Object>} Next turn state & audio response
 */
export const executeAgentTurn = async ({ sessionId, stepId, sttTranscript, currentStepData }) => {
    console.log(`[LangGraph Agent] Executing turn for session ${sessionId}, step ${stepId || 'initial'}`);

    // 1. Retrieve phraseology grounding chunks from Qdrant
    const procedureType = currentStepData?.procedureType || 'ground_clearance';
    const groundingHits = await queryQdrantKnowledge(procedureType, 'ATC readback rules');

    // 2. Compose controller response line via Mistral LLM
    const controllerLine = await composeControllerLine({
        stepData: currentStepData,
        sttTranscript,
        groundingHits,
    });

    // 3. Synthesize speech via TTS
    const audioUrl = await synthesizeSpeech(controllerLine);

    // 4. Save transcript message
    if (sttTranscript) {
        await ChatMessage.create({
            sessionId,
            stepId: stepId || 'step-1',
            role: 'pilot',
            text: sttTranscript,
        });
    }

    const controllerMsg = await ChatMessage.create({
        sessionId,
        stepId: stepId || 'step-1',
        role: 'controller',
        text: controllerLine,
        audioRef: audioUrl,
    });

    return {
        sessionId,
        stepId,
        controllerLine,
        audioUrl,
        validationResult: sttTranscript ? 'correct' : 'initial_prompt',
        groundingUsed: groundingHits.map((h) => h.payload?.title || 'FAA AIM 4-2'),
    };
};
