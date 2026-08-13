import { StateGraph, MemorySaver, END } from '@langchain/langgraph';
import { AgentState } from './state.js';
import { loadStepNode } from './nodes/loadStep.js';
import { qdrantRetrieveNode } from './nodes/qdrantRetrieve.js';
import { composeLineNode } from './nodes/composeLine.js';
import { ttsSpeakNode } from './nodes/ttsSpeak.js';
import { awaitReadbackNode } from './nodes/awaitReadback.js';
import { validateReadbackNode } from './nodes/validateReadback.js';
import { issueCorrectionNode } from './nodes/issueCorrection.js';
import { advanceStepNode } from './nodes/advanceStep.js';
import { debriefNode } from './nodes/debrief.js';
import { generalAnswerNode } from './nodes/generalAnswer.js';

const graph = new StateGraph(AgentState)
    .addNode('loadStep', loadStepNode)
    .addNode('qdrantRetrieve', qdrantRetrieveNode)
    .addNode('composeLine', composeLineNode)
    .addNode('ttsSpeak', ttsSpeakNode)
    .addNode('awaitReadback', awaitReadbackNode)
    .addNode('validateReadback', validateReadbackNode)
    .addNode('generalAnswer', generalAnswerNode)
    .addNode('issueCorrection', issueCorrectionNode)
    .addNode('advanceStep', advanceStepNode)
    .addNode('debrief', debriefNode)

    // ── Graph Edges ───────────────────────────────────────────────────────────
    .addEdge('__start__', 'loadStep')
    .addConditionalEdges('loadStep', (state) => {
        if (state.finished || !state.currentStep) return 'debrief';
        if (state.pilotTranscript && String(state.pilotTranscript).trim() !== '') return 'validateReadback';
        return 'qdrantRetrieve';
    })
    .addEdge('qdrantRetrieve', 'composeLine')
    .addEdge('composeLine', 'ttsSpeak')
    .addEdge('ttsSpeak', 'awaitReadback')
    .addEdge('awaitReadback', 'validateReadback')

    // ── Readback Validation / General Question Branch ────────────────────────
    .addConditionalEdges('validateReadback', (state) => {
        if (state.isGeneralQuery) return 'generalAnswer';
        if (state.allPassed) return 'advanceStep';
        if (state.retries >= (state.currentStep?.maxRetries || 3)) {
            console.log(`[graph] Max retries (${state.retries}) reached for step "${state.currentStep?.stepId}". Forcing advance.`);
            return 'advanceStep';
        }
        return 'issueCorrection';
    })

    .addEdge('generalAnswer', 'ttsSpeak')
    .addEdge('issueCorrection', 'ttsSpeak')

    // ── Step Advancement Branch ──────────────────────────────────────────────
    .addConditionalEdges('advanceStep', (state) => {
        if (state.finished) return 'debrief';
        return 'loadStep';
    })

    .addEdge('debrief', 'ttsSpeak');

const checkpointer = new MemorySaver();

export const compiledGraph = graph.compile({
    checkpointer,
    interruptBefore: ['awaitReadback'],
});
