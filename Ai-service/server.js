import 'dotenv/config';
import http from 'http';
import app from './app/app.js';
import { connectToDb } from './config/db.js';
import { connectToRedis } from './config/redis.js';
import { initWebSocketServer } from './config/ws.js';

const PORT = process.env.PORT || 7000;

const server = http.createServer(app);

// Attach WebSocket server for real-time 3D MetallicOrb reactivity
initWebSocketServer(server);

server.listen(PORT, async () => {
    await connectToDb();
    try {
        connectToRedis();
    } catch (err) {
        console.warn('[AI Service] Redis initialization warning:', err.message);
    }
    console.log(`[AI Service] Server and WebSocket running on port ${PORT}`);
});
