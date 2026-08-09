import ChatMessage from '../models/chatMessage.model.js';
import { executeAgentTurn } from '../services/langgraph.service.js';

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/ai/sessions/:id/turn
 * Processes one conversational turn: receives STT input, advances the LangGraph state machine,
 * generates TTS audio & text, and records the chat transcript.
 */
export const processSessionTurnController = async (req, res) => {
    try {
        const { id: sessionId } = req.params;
        const { sttTranscript, stepId, currentStepData } = req.body;

        if (!sttTranscript && !currentStepData) {
            return res.status(400).json({
                status: 'error',
                message: 'Either sttTranscript or currentStepData (for initial turn) is required',
            });
        }

        const turnResult = await executeAgentTurn({
            sessionId,
            stepId,
            sttTranscript,
            currentStepData,
        });

        return res.status(200).json({ status: 'success', data: turnResult });
    } catch (error) {
        console.error('[AI Service] processSessionTurnController error:', error.message);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * GET /api/ai/sessions/:id/transcript
 * Returns full chat transcript and audio references for a given session.
 */
export const getSessionTranscriptController = async (req, res) => {
    try {
        const { id: sessionId } = req.params;

        const transcript = await ChatMessage.find({ sessionId }).sort({ createdAt: 1 });

        return res.status(200).json({ status: 'success', data: { transcript } });
    } catch (error) {
        console.error('[AI Service] getSessionTranscriptController error:', error.message);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};
