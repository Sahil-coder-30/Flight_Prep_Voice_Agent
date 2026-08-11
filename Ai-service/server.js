import "dotenv/config";
import http from "http";
import { Server } from "socket.io";

import app from "./app/app.js";
import { connectToDb } from "./config/db.js";
import { registerAISessionSocket } from "./sockets/aiSession.socket.js";

const PORT = process.env.PORT || 7000;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "*",
    },
});

registerAISessionSocket(io);

async function startServer() {
    try {
        await connectToDb();

        httpServer.listen(PORT, () => {
            console.log(
                `[AI Service] Server is running on port ${PORT}`
            );
        });
    } catch (error) {
        console.error(
            "[AI Service] Failed to start server:",
            error
        );

        process.exit(1);
    }
}

startServer();