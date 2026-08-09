import Session from '../models/session.model.js';

/**
 * Updates the status of a specific step within a session document.
 * @param {string} sessionId
 * @param {string} stepId
 * @param {{ status: string, corrected?: boolean }} update
 * @returns {Promise<Object>} Updated session document
 */
export const updateSessionStepService = async (sessionId, stepId, update) => {
    const session = await Session.findById(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const step = session.steps.find((s) => s.stepId === stepId);
    if (!step) throw new Error(`Step ${stepId} not found in session ${sessionId}`);

    step.attempts += 1;
    if (update.status) step.status = update.status;
    if (update.corrected !== undefined) step.corrected = update.corrected;

    await session.save();
    console.log(`[Backend Session Service] Step ${stepId} updated in session ${sessionId}`);
    return session;
};
