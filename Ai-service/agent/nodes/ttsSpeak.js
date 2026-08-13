import { speak, isCacheable } from '../../services/tts.service.js';
import ChatMessage from '../../models/chatMessage.model.js';
import { broadcastSimulatorEvent } from '../../config/ws.js';

/**
 * ttsSpeak — Node 4
 *
 * Synthesizes the controller line into audio via Rime TTS.
 * Uses Redis L7 TTS audio caching for static-slot lines (~5ms response).
 * Broadcasts WebSocket audio events to sync 3D MetallicOrb reactivity.
 *
 * Input:  state.currentLine, state.currentStep, state.resolvedSlots, state.sessionId
 * Output: { audioBase64, transcript: [...] }
 */
export async function ttsSpeakNode(state) {
    const { currentLine, currentStep, resolvedSlots, sessionId, userId } = state;

    if (!currentLine) {
        console.error('[ttsSpeak] No currentLine to speak');
        return {};
    }

    let audioBase64 = null;
    let cacheHit = false;
    try {
        const cacheable = isCacheable(resolvedSlots);
        const ttsRes = await speak(currentLine, cacheable);
        audioBase64 = ttsRes?.audioBase64 || null;
        cacheHit = !!ttsRes?.cacheHit;
        console.log(`[ttsSpeak] Audio generated for step "${currentStep?.stepId}" (cached: ${cacheHit})`);
    } catch (ttsErr) {
        console.warn('[ttsSpeak] TTS generation warning (falling back to text):', ttsErr.message);
    }

    const msg = {
        role: 'controller',
        text: currentLine,
        stepId: currentStep?.stepId,
        templateId: currentStep?.templateId,
        cacheHit,
        timestamp: new Date(),
    };

    ChatMessage.create({
        sessionId,
        userId: userId || 'anonymous',
        ...msg,
    }).catch((err) => console.error('[ttsSpeak] ChatMessage log error:', err.message));

    return {
        audioBase64,
        transcript: [msg],
    };
}
