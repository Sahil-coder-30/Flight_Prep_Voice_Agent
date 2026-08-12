import { composeDebrief } from '../../services/mistral.service.js';

/**
 * debrief — Node 9
 *
 * Runs upon session conclusion.
 * Computes overall weighted session score and composes final controller summary.
 *
 * Input:  state.stepResults, state.sessionId, state.userId
 * Output: { currentLine, finished: true }
 */
export async function debriefNode(state) {
    const { stepResults = [], sessionId, userId } = state;

    const totalScore = stepResults.reduce((acc, r) => acc + (r.score || 0), 0);
    const avgScore = stepResults.length > 0 ? Math.round(totalScore / stepResults.length) : 100;

    const failedSteps = stepResults.filter((r) => !r.passed).map((r) => r.stepId);

    const debriefText = await composeDebrief(avgScore, failedSteps, {
        sessionId,
        userId,
        operation: 'debrief',
    });

    console.log(`[debrief] Session ${sessionId} completed. Overall Score: ${avgScore}`);

    return {
        currentLine: debriefText,
        finished: true,
    };
}
