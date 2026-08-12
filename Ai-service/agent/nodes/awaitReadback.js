/**
 * awaitReadback — Node 5
 *
 * Pass-through node representing the state graph interrupt boundary.
 * The LangGraph execution pauses BEFORE this node runs.
 * When the pilot transmits speech and the graph is resumed via:
 *   compiledGraph.invoke({ resume: pilotTranscript }, config)
 * the graph receives the pilotTranscript and passes it forward.
 *
 * Input:  state.pilotTranscript
 * Output: { pilotTranscript }
 */
export async function awaitReadbackNode(state) {
    console.log(`[awaitReadback] Resumed with pilot transcript: "${state.pilotTranscript}"`);
    return {
        pilotTranscript: state.pilotTranscript,
    };
}
