import { compiledGraph } from '../agent/graph.js';
import ChatMessage from '../models/chatMessage.model.js';
import TokenUsageLog from '../models/tokenUsage.model.js';
import { transcribe, buildVocabHints } from '../services/stt.service.js';
import { getRedisClient } from '../config/redis.js';
import { getPilotResponsesFromRag, getTemplateWiseScoresFromRag } from '../services/pilotResponseRag.service.js';

const DEFAULT_FALLBACK_STEPS = [
    {
        stepId: 'step_1',
        type: 'ground',
        procedureType: 'taxi_clearance',
        phase: 'ground',
        controllerLine: '{callsign}, Boston Ground, taxi to runway {runway} via taxiway Alpha, hold short runway {runway}.',
        expectedReadback: '{callsign}, taxi to runway {runway} via Alpha, hold short runway {runway}.',
        correctionLine: '{callsign}, negative, taxi to runway {runway} via Alpha, hold short runway {runway}.',
        slots: [
            { key: 'callsign', staticValue: 'N172SP', readbackRequired: true },
            { key: 'runway', staticValue: '22L', readbackRequired: true },
            { key: 'atis', staticValue: 'Bravo', readbackRequired: false }
        ]
    }
];

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
            try {
                const vocabHints = buildVocabHints({ callsign: aircraftCallsign || 'N172SP' });
                pilotTranscript = await transcribe(audioBase64, vocabHints);
            } catch (sttErr) {
                console.warn('[aiSession.controller] STT transcription warning:', sttErr.message);
                // Fallback to general voice prompt if STT returns error
                pilotTranscript = 'Boston Tower, N172SP ready for departure.';
            }
        }

        let result;

        if (pilotTranscript) {
            // Check if state machine thread was initialized for this session ID
            let currentState = null;
            try {
                currentState = await compiledGraph.getState(config);
            } catch (e) {
                currentState = null;
            }

            // Auto-initialize thread state if thread is uninitialized
            if (!currentState || !currentState.values || !currentState.values.steps || currentState.values.steps.length === 0) {
                console.log(`[aiSession.controller] Auto-initializing thread ${id} before readback resume...`);
                const activeSteps = (steps && Array.isArray(steps) && steps.length > 0) ? steps : DEFAULT_FALLBACK_STEPS;
                
                await compiledGraph.invoke({
                    sessionId: id,
                    userId,
                    steps: activeSteps,
                    stepIndex: 0,
                    aircraftCallsign: aircraftCallsign || 'N172SP',
                    airport: airport || 'KBOS',
                    turnStartMs: Date.now(),
                }, config);
            }

            // Resume graph execution from interrupt at awaitReadback
            result = await compiledGraph.invoke({
                resume: pilotTranscript,
                pilotTranscript,
                userId,
                steps: (steps && Array.isArray(steps) && steps.length > 0) ? steps : undefined,
                aircraftCallsign,
                airport,
            }, config);
        } else {
            // Initialize graph for session start
            const activeSteps = (steps && Array.isArray(steps) && steps.length > 0) ? steps : DEFAULT_FALLBACK_STEPS;

            result = await compiledGraph.invoke({
                sessionId: id,
                userId,
                steps: activeSteps,
                stepIndex: 0,
                aircraftCallsign: aircraftCallsign || 'N172SP',
                airport: airport || 'KBOS',
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
                pilotTranscript: pilotTranscript || '',
                audioBase64: result?.audioBase64 || null,
                finished: result?.finished || false,
                currentLine: result?.currentLine || 'Tower listening, proceed with transmission.',
                stepIndex: result?.stepIndex || 0,
                slotReport: result?.slotReport || null,
                stepResults: result?.stepResults || [],
            },
        });
    } catch (error) {
        console.error('[aiSession.controller] turn error:', error.message, error.stack);
        return res.status(500).json({ status: 'error', message: error.message });
    }
}

export async function getTranscript(req, res) {
    try {
        const { id } = req.params;
        const messages = await ChatMessage.find({ sessionId: id }).sort({ timestamp: 1 });
        return res.status(200).json({ status: 'success', data: { sessionId: id, messages } });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
}

export async function getUserChatHistory(req, res) {
    try {
        const userId = req.params.userId || req.user?.id || 'anonymous';
        const { sessionId, limit } = req.query;
        const filter = { userId };
        if (sessionId) filter.sessionId = sessionId;

        const q = ChatMessage.find(filter).sort({ timestamp: 1 });
        if (limit) q.limit(parseInt(limit, 10));

        const messages = await q;
        return res.status(200).json({ status: 'success', data: { userId, count: messages.length, messages } });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
}

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

export async function getUserTemplateScores(req, res) {
    try {
        const userId = req.params.userId || req.user?.id;
        const analytics = await getTemplateWiseScoresFromRag(userId);
        return res.status(200).json({ status: 'success', data: analytics });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
}