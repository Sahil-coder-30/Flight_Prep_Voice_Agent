// ── Constants ─────────────────────────────────────────────────────────────────
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost';

/**
 * Sends one conversational turn to the AI service.
 * The AI service advances the LangGraph agent one step and returns the controller's
 * next audio/text response plus updated session checkpoint state.
 *
 * @param {string} sessionId - The ATC session ID
 * @param {Object} turnPayload - { sttTranscript: string, accessToken: string }
 * @returns {Promise<Object>} AI service response payload
 */
export const callAiServiceTurn = async (sessionId, turnPayload) => {
    const { accessToken, ...body } = turnPayload;

    const response = await fetch(`${AI_SERVICE_URL}/api/ai/sessions/${sessionId}/turn`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`[Backend AI Service] Turn failed: ${response.status} — ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    console.log(`[Backend AI Service] Turn completed for session ${sessionId}`);
    return data;
};

/**
 * Fetches the conversation transcript for a session from the AI service.
 *
 * @param {string} sessionId - The ATC session ID
 * @param {string} accessToken - Bearer JWT for inter-service auth
 * @returns {Promise<Object>} Transcript payload
 */
export const getAiSessionTranscript = async (sessionId, accessToken) => {
    const response = await fetch(`${AI_SERVICE_URL}/api/ai/sessions/${sessionId}/transcript`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`[Backend AI Service] Transcript fetch failed: ${response.status} — ${errorData.message || response.statusText}`);
    }

    return response.json();
};
