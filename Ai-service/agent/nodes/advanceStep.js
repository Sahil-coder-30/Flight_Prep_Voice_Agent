import { savePilotResponseToRag } from '../../services/pilotResponseRag.service.js';

/**
 * advanceStep — Node 8
 *
 * Computes per-step performance score, appends to stepResults,
 * saves pilot answer + question to RAG, increments stepIndex, resets retries, and checks if session is finished.
 *
 * Input:  state.stepIndex, state.steps, state.retries, state.allPassed, state.currentStep, state.userId, state.currentLine, state.pilotTranscript
 * Output: { stepIndex, retries, finished, stepResults: [...] }
 */
export async function advanceStepNode(state) {
    const {
        stepIndex,
        steps,
        retries,
        allPassed,
        currentStep,
        userId,
        sessionId,
        currentLine,
        pilotTranscript,
        slotReport,
        extracted,
    } = state;

    // Calculate step score
    const weight = currentStep?.gradeWeight || 1.0;
    let attemptMultiplier = 1.0;
    if (!allPassed) attemptMultiplier = 0;
    else if (retries === 2) attemptMultiplier = 0.8;
    else if (retries > 2) attemptMultiplier = 0.5;

    const calculatedScore = Math.round(100 * attemptMultiplier * weight);

    const resultRecord = {
        stepId: currentStep?.stepId,
        templateId: currentStep?.templateId,
        attempts: retries,
        passed: allPassed,
        corrected: retries > 1 && allPassed,
        score: calculatedScore,
    };

    // ── Save pilot answer + question into RAG for historical scoring & analytics ──
    if (userId && pilotTranscript) {
        savePilotResponseToRag({
            userId,
            sessionId,
            question: currentLine || currentStep?.controllerLine || '',
            answer: pilotTranscript,
            templateId: currentStep?.templateId || 'unknown_template',
            stepId: currentStep?.stepId || '',
            scenarioId: currentStep?.scenarioId || '',
            procedureType: currentStep?.procedureType || '',
            phase: currentStep?.phase || '',
            score: calculatedScore,
            passed: Boolean(allPassed),
            slotReport,
            extracted,
            retries,
            isGeneralQuery: false,
        }).catch((err) => console.error('[advanceStep] Failed to save response to RAG:', err.message));
    }

    const nextIndex = stepIndex + 1;
    const isFinished = nextIndex >= steps.length;

    console.log(`[advanceStep] Step ${stepIndex} -> ${nextIndex} (finished: ${isFinished}, step score: ${resultRecord.score})`);

    return {
        stepIndex: nextIndex,
        retries: 0,
        finished: isFinished,
        pilotTranscript: undefined,
        stepResults: [resultRecord],
    };
}

