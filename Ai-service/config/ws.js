import { WebSocketServer } from 'ws';

let wss = null;

export function initWebSocketServer(server) {
    wss = new WebSocketServer({ server, path: '/ws/simulator' });

    wss.on('connection', (ws) => {
        console.log('[AI WebSocket] Client connected to simulator stream');

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message.toString());
                if (data.type === 'PING') {
                    ws.send(JSON.stringify({ type: 'PONG' }));
                }
            } catch (err) {
                // Ignore raw binary audio frames
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
