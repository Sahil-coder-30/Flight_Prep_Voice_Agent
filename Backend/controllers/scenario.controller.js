import Scenario from '../models/scenario.model.js';

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /api/backend/scenarios
 * Returns all active scenarios (list view — no step detail).
 */
export const getScenariosController = async (req, res) => {
    try {
        const scenarios = await Scenario.find({ isActive: true })
            .select('-steps -__v')
            .sort({ difficulty: 1 });

        return res.status(200).json({ status: 'success', data: { scenarios } });
    } catch (error) {
        console.error('[Backend] getScenariosController error:', error.message);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * GET /api/backend/scenarios/:id
 * Returns full scenario including step template (consumed by AI service).
 */
export const getScenarioByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const scenario = await Scenario.findById(id).select('-__v');

        if (!scenario) {
            return res.status(404).json({ status: 'error', message: 'Scenario not found' });
        }

        return res.status(200).json({ status: 'success', data: { scenario } });
    } catch (error) {
        console.error('[Backend] getScenarioByIdController error:', error.message);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};
