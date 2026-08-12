import { compiledGraph } from '../agent/graph.js';
import ChatMessage from '../models/chatMessage.model.js';
import TokenUsageLog from '../models/tokenUsage.model.js';
import { transcribe, buildVocabHints } from '../services/stt.service.js';
import { getRedisClient } from '../config/redis.js';
import { getPilotResponsesFromRag, getTemplateWiseScoresFromRag } from '../services/pilotResponseRag.service.js';

/**
 * POST /api/ai/sessions/:id/turn
 * Advances the LangGraph turn machine. Accepts audioBase64 or pilotTranscript.
 */
export async function turn(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.id || 'anonymous';
        const { audioBase64, pilotTranscript: inputTranscript, steps, aircraftCallsign, airport } = req.body;
        const config = { configurable: { thread_id: id } };

        let pilotTranscript = inputTranscript;

        // If audio provided, transcribe via Deepgram STT
        if (audioBase64 && !pilotTranscript) {
            const vocabHints = buildVocabHints({ callsign: aircraftCallsign });
            pilotTranscript = await transcribe(audioBase64, vocabHints);
        }

        let result;

        if (pilotTranscript) {
            // Resume graph execution from interrupt at awaitReadback
            result = await compiledGraph.invoke({
                resume: pilotTranscript,
                pilotTranscript,
                userId,
            }, config);
        } else {
            // Initialize graph for session start
            if (!steps || !Array.isArray(steps)) {
                return res.status(400).json({ status: 'error', message: 'steps array is required for session start' });
            }

            result = await compiledGraph.invoke({
                sessionId: id,
                userId,
                steps,
                stepIndex: 0,
                aircraftCallsign,
                airport,
                turnStartMs: Date.now(),
            }, config);
        }

        // Cache checkpoint state in Redis for 24h
        const redis = getRedisClient();
        redis.setex(`sess:cp:${id}`, 86400, JSON.stringify(result)).catch(() => {});

        return res.status(200).json({
            status: 'success',
            data: {
                sessionId: id,
                audioBase64: result.audioBase64,
                finished: result.finished,
                currentLine: result.currentLine,
                stepIndex: result.stepIndex,
                slotReport: result.slotReport,
                stepResults: result.stepResults,
            },
        });
    } catch (error) {
        console.error('[aiSession.controller] turn error:', error.message);
        return res.status(500).json({ status: 'error', message: error.message });
    }
}

/**
 * GET /api/ai/sessions/:id/transcript
 * Returns session chat transcript.
 */
export async function getTranscript(req, res) {
    try {
        const { id } = req.params;
        const messages = await ChatMessage.find({ sessionId: id }).sort({ timestamp: 1 });
        return res.status(200).json({ status: 'success', data: { sessionId: id, messages } });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
}

/**
 * GET /api/ai/sessions/:id/tokens
 * Returns token usage logs and totals for a session.
 */
export async function getTokens(req, res) {
    try {
        const { id } = req.params;
        const logs = await TokenUsageLog.find({ sessionId: id }).sort({ timestamp: 1 });
        const totalTokens = logs.reduce((acc, l) => acc + (l.totalTokens || 0), 0);
        return res.status(200).json({ status: 'success', data: { sessionId: id, totalTokens, logs } });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
}

/**
 * GET /api/ai/users/:userId/responses
 * Returns saved pilot answers from Qdrant RAG.
 */
export async function getUserPilotResponses(req, res) {
    try {
        const userId = req.params.userId || req.user?.id;
        const { templateId, query, limit } = req.query;
        const responses = await getPilotResponsesFromRag(userId, {
            templateId,
            query,
            limit: limit ? parseInt(limit, 10) : 50,
        });
        return res.status(200).json({ status: 'success', data: { userId, responses } });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
}

/**
 * GET /api/ai/users/:userId/template-scores
 * Returns template-wise scoring analytics and improvement suggestions from RAG history.
 */
export async function getUserTemplateScores(req, res) {
    try {
        const userId = req.params.userId || req.user?.id;
        const analytics = await getTemplateWiseScoresFromRag(userId);
        return res.status(200).json({ status: 'success', data: analytics });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
}