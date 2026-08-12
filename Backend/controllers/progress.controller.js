import UserProgress from '../models/userProgress.model.js';
import SessionAnalytics from '../models/sessionAnalytics.model.js';

export const getMyProgressController = async (req, res) => {
    try {
        const userId = req.user.id;
        let progress = await UserProgress.findOne({ userId }).populate('favoriteScenarioId', 'title airport difficulty');

        if (!progress) {
            progress = await UserProgress.create({ userId });
        }

        return res.status(200).json({ status: 'success', data: { progress } });
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message });
    }
};

export const getMyStatsController = async (req, res) => {
    try {
        const userId = req.user.id;
        const progress = await UserProgress.findOne({ userId });

        return res.status(200).json({
            status: 'success',
            data: {
                totalSessions: progress?.totalSessions || 0,
                totalTimeSeconds: progress?.totalTimeSeconds || 0,
                currentStreak: progress?.currentStreak || 0,
                avgScore: progress?.avgScore || 0,
                bestScore: progress?.bestScore || 0,
                weakAreas: progress?.weakAreas || [],
            },
        });
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message });
    }
};

export const getMyWeakAreasController = async (req, res) => {
    try {
        const userId = req.user.id;
        const progress = await UserProgress.findOne({ userId });
        return res.status(200).json({ status: 'success', data: { weakAreas: progress?.weakAreas || [] } });
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message });
    }
};

export const getMyTemplateScoresController = async (req, res) => {
    try {
        const userId = req.user.id;
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost';
        const response = await fetch(`${aiServiceUrl}/api/ai/users/${userId}/template-scores`);
        
        if (response.ok) {
            const data = await response.json();
            return res.status(200).json(data);
        }

        return res.status(200).json({
            status: 'success',
            data: {
                userId,
                totalResponses: 0,
                overallAverageScore: 0,
                templates: [],
                improvementAreas: ['Complete simulator sessions to see your template-wise RAG performance score!'],
            },
        });
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message });
    }
};

