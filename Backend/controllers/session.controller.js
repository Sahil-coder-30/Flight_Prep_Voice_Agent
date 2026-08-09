import Session from '../models/session.model.js';
import Scenario from '../models/scenario.model.js';
import { callAiServiceTurn } from '../services/aiService.service.js';

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/backend/sessions
 * Starts a new training session for a given scenario.
 */
export const createSessionController = async (req, res) => {
    try {
        const { scenarioId } = req.body;
        const userId = req.user.id;

        if (!scenarioId) {
            return res.status(400).json({ status: 'error', message: 'scenarioId is required' });
        }

        const scenario = await Scenario.findById(scenarioId);
        if (!scenario || !scenario.isActive) {
            return res.status(404).json({ status: 'error', message: 'Scenario not found or inactive' });
        }

        // Initialise step trackers from the scenario template
        const steps = scenario.steps.map((s) => ({
            stepId: s.stepId,
            status: 'pending',
            attempts: 0,
            corrected: false,
        }));

        const session = await Session.create({
            userId,
            scenarioId,
            status: 'active',
            steps,
            startedAt: new Date(),
        });

        console.log(`[Backend] Session ${session._id} created for user ${userId}`);
        return res.status(201).json({ status: 'success', data: { session } });
    } catch (error) {
        console.error('[Backend] createSessionController error:', error.message);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * GET /api/backend/sessions/:id
 * Returns session state and progress. Verifies the requester owns the session.
 */
export const getSessionController = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const session = await Session.findById(id).select('-__v');
        if (!session) {
            return res.status(404).json({ status: 'error', message: 'Session not found' });
        }

        if (String(session.userId) !== userId) {
            return res.status(403).json({ status: 'error', message: 'Forbidden: you do not own this session' });
        }

        return res.status(200).json({ status: 'success', data: { session } });
    } catch (error) {
        console.error('[Backend] getSessionController error:', error.message);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * POST /api/backend/sessions/:id/complete
 * Marks a session as completed and records the final score.
 */
export const completeSessionController = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const session = await Session.findById(id);
        if (!session) {
            return res.status(404).json({ status: 'error', message: 'Session not found' });
        }
        if (String(session.userId) !== userId) {
            return res.status(403).json({ status: 'error', message: 'Forbidden: you do not own this session' });
        }
        if (session.status !== 'active') {
            return res.status(400).json({ status: 'error', message: 'Session is not in active state' });
        }

        const { score } = req.body;

        session.status = 'completed';
        session.completedAt = new Date();
        if (score !== undefined) session.score = score;
        await session.save();

        console.log(`[Backend] Session ${id} completed with score ${score}`);
        return res.status(200).json({ status: 'success', data: { session } });
    } catch (error) {
        console.error('[Backend] completeSessionController error:', error.message);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};
