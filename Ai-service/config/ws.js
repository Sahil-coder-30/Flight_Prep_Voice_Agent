import { WebSocketServer } from 'ws';
import { compiledGraph } from '../agent/graph.js';
import { transcribe, buildVocabHints } from '../services/stt.service.js';

let wss = null;

export function initWebSocketServer(server) {
    wss = new WebSocketServer({ server, path: '/ws/simulator' });

    wss.on('connection', (ws) => {
        console.log('[AI WebSocket] Client connected to simulator stream');

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message.toString());
                if (data.type === 'PING') {
                    ws.send(JSON.stringify({ type: 'PONG' }));
                } else if (data.type === 'PILOT_SPEAK' || data.type === 'USER_PROMPT') {
                    const sessionId = data.sessionId || 'sim_session_ws';
                    let pilotTranscript = data.pilotTranscript || data.prompt || '';

                    if (data.audioBase64 && !pilotTranscript) {
                        try {
                            const hints = buildVocabHints({ callsign: data.aircraftCallsign || 'N172SP' });
                            pilotTranscript = await transcribe(data.audioBase64, hints);
                        } catch (sttErr) {
                            console.warn('[AI WebSocket] STT transcription warning:', sttErr.message);
                            pilotTranscript = 'Boston Tower, N172SP ready for departure.';
                        }
                    }

                    const config = { configurable: { thread_id: sessionId } };
                    let result;
                    if (pilotTranscript) {
                        result = await compiledGraph.invoke({
                            resume: pilotTranscript,
                            pilotTranscript,
                            userId: data.userId || 'anonymous',
                            steps: data.steps,
                            aircraftCallsign: data.aircraftCallsign,
                            airport: data.airport,
                        }, config);
                    } else {
                        result = await compiledGraph.invoke({
                            sessionId,
                            userId: data.userId || 'anonymous',
                            steps: data.steps || [],
                            stepIndex: 0,
                            aircraftCallsign: data.aircraftCallsign || 'N172SP',
                        }, config);
                    }

                    ws.send(JSON.stringify({
                        type: 'ATC_RESPONSE',
                        sessionId,
                        pilotTranscript: pilotTranscript || '',
                        currentLine: result?.currentLine || '',
                        audioBase64: result?.audioBase64 || null,
                        finished: result?.finished || false,
                        stepIndex: result?.stepIndex || 0,
                    }));
                }
            } catch (err) {
                console.warn('[AI WebSocket] Error processing message:', err.message);
            }
        });

        ws.on('close', () => {
            console.log('[AI WebSocket] Client disconnected');
        });
    });

    console.log('[AI WebSocket] Server initialized on /ws/simulator');
    return wss;
}

/**
 * Broadcast an event payload to all connected simulator WebSocket clients.
 * e.g., { type: 'ATC_SPEAKING', text: '...', intensity: 0.85 }
 */
export function broadcastSimulatorEvent(eventData) {
    if (!wss) return;

    const payload = JSON.stringify(eventData);
    wss.clients.forEach((client) => {
        if (client.readyState === 1) { // 1 = OPEN
            client.send(payload);
        }
    });
}
