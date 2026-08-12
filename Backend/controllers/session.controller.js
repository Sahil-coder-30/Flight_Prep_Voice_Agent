import Session from '../models/session.model.js';
import Scenario from '../models/scenario.model.js';
import UserProgress from '../models/userProgress.model.js';
import SessionAnalytics from '../models/sessionAnalytics.model.js';

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

        // Increment scenario play count
        scenario.playCount = (scenario.playCount || 0) + 1;
        await scenario.save();

        // Initialise step trackers from scenario template
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

        // Update UserProgress engagement metrics
        let progress = await UserProgress.findOne({ userId });
        if (!progress) {
            progress = new UserProgress({ userId });
        }

        progress.totalSessions += 1;
        const currentCount = progress.scenarioPlayCounts.get(String(scenarioId)) || 0;
        progress.scenarioPlayCounts.set(String(scenarioId), currentCount + 1);

        // Update favorite scenario if count is highest
        let maxCount = 0;
        let favId = null;
        for (const [sId, count] of progress.scenarioPlayCounts.entries()) {
            if (count > maxCount) {
                maxCount = count;
                favId = sId;
            }
        }
        if (favId) progress.favoriteScenarioId = favId;

        await progress.save();

        console.log(`[Backend] Session ${session._id} created for user ${userId}`);
        return res.status(201).json({ status: 'success', data: { session, scenario } });
    } catch (error) {
        console.error('[Backend] createSessionController error:', error.message);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * GET /api/backend/sessions/:id
 * Returns session state and progress. Verifies ownership.
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
 * Concludes a training session, records SessionAnalytics, and computes user progress stats.
 */
export const completeSessionController = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { score = 100, stepResults = [] } = req.body;

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

        const now = new Date();
        session.status = 'completed';
        session.completedAt = now;
        session.score = score;
        await session.save();

        const durationSeconds = Math.round((now - new Date(session.startedAt)) / 1000);

        // Record granular analytics
        await SessionAnalytics.create({
            sessionId: session._id,
            userId,
            scenarioId: session.scenarioId,
            durationSeconds,
            finalScore: score,
            stepResults,
        });

        // Update UserProgress metrics
        const progress = await UserProgress.findOne({ userId });
        if (progress) {
            progress.completedSessions += 1;
            progress.totalTimeSeconds += durationSeconds;

            // Streak computation
            const last = progress.lastPracticedAt ? new Date(progress.lastPracticedAt) : null;
            const today = new Date();
            if (!last) {
                progress.currentStreak = 1;
            } else {
                const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) progress.currentStreak += 1;
                else if (diffDays > 1) progress.currentStreak = 1;
            }
            if (progress.currentStreak > progress.longestStreak) {
                progress.longestStreak = progress.currentStreak;
            }
            progress.lastPracticedAt = now;

            // Scores
            if (score > progress.bestScore) progress.bestScore = score;
            const totalScoreSum = progress.avgScore * (progress.completedSessions - 1) + score;
            progress.avgScore = Math.round(totalScoreSum / progress.completedSessions);

            await progress.save();
        }

        console.log(`[Backend] Session ${id} completed for user ${userId}. Score: ${score}, Duration: ${durationSeconds}s`);
        return res.status(200).json({ status: 'success', data: { session, score, durationSeconds } });
    } catch (error) {
        console.error('[Backend] completeSessionController error:', error.message);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};
