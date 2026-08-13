import { compiledGraph } from '../agent/graph.js';
import ChatMessage from '../models/chatMessage.model.js';
import TokenUsageLog from '../models/tokenUsage.model.js';
import { transcribe, buildVocabHints } from '../services/stt.service.js';
import { getRedisClient } from '../config/redis.js';
import { getPilotResponsesFromRag, getTemplateWiseScoresFromRag } from '../services/pilotResponseRag.service.js';

const DEFAULT_FALLBACK_STEPS = [
    {
        stepId: 'step_1_ground',
        templateId: 'tmpl_ground_taxi_v1',
        type: 'ground',
        controllerLine: 'Boston Ground, {callsign}, gate 14, ready for taxi with {atis}.',
        expectedReadback: '{callsign}, taxi to runway {runway} via taxiways Alpha, hold short runway {runway}.',
        slots: [
            { key: 'callsign', source: 'session', staticValue: 'N172SP', readbackRequired: true },
            { key: 'runway', source: 'static', staticValue: '22L', readbackRequired: true },
            { key: 'atis', source: 'dynamic', dynamicType: 'atis', readbackRequired: false }
        ]
    },
    {
        stepId: 'step_2_tower',
        templateId: 'tmpl_tower_takeoff_v1',
        type: 'departure',
        controllerLine: '{callsign}, Boston Tower, wind {windDir} at {windSpeed}, runway {runway}, cleared for takeoff.',
        expectedReadback: 'Runway {runway}, cleared for takeoff, {callsign}.',
        slots: [
            { key: 'callsign', source: 'session', staticValue: 'N172SP', readbackRequired: true },
            { key: 'runway', source: 'static', staticValue: '22L', readbackRequired: true },
            { key: 'windDir', source: 'dynamic', dynamicType: 'windDir', readbackRequired: false },
            { key: 'windSpeed', source: 'dynamic', dynamicType: 'windSpeed', readbackRequired: false }
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

        let pilotTranscript = inputTranscript || '';

        // If audio provided, attempt transcribe via Deepgram STT
        if (audioBase64) {
            try {
                const vocabHints = buildVocabHints({ callsign: aircraftCallsign || 'N172SP' });
                const sttResult = await transcribe(audioBase64, vocabHints);
                if (sttResult && sttResult.trim()) {
                    pilotTranscript = sttResult;
                }
            } catch (sttErr) {
                console.warn('[aiSession.controller] STT transcription warning:', sttErr.message);
            }
        }

        let result;

        if (pilotTranscript && pilotTranscript.trim() !== '') {
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
                aircraftCallsign: aircraftCallsign || 'N172SP',
                airport: airport || 'KBOS',
            }, config);
        } else {
            // Initialize graph for session start or silent turn prompt
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
                currentLine: result?.currentLine || 'Boston Tower listening, say again transmission.',
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
        const userId = req.params.userId || req.user?.id;
        const messages = await ChatMessage.find({ userId }).sort({ timestamp: -1 }).limit(100);
        return res.status(200).json({ status: 'success', data: { userId, messages } });
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