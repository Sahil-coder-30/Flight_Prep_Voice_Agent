import { createStreamingTranscriber } from "../services/stt.service.js";
import { Command } from "@langchain/langgraph";
import { compiledGraph } from "../agent/graph.js";

export function registerAISessionSocket(io) {
    io.on("connection", (socket) => {
        console.log(`[Socket] Connected: ${socket.id}`);

        let transcriber = null;
        let sessionId = null;

        socket.on("start-session", ({ id, vocabHints = [] }) => {
            sessionId = id;

            transcriber = createStreamingTranscriber({
                vocabHints,

                onTranscript: ({ transcript, isFinal, speechFinal }) => {
                    socket.emit("transcript", {
                        transcript,
                        isFinal,
                        speechFinal,
                    });

                    if (speechFinal) {
                        handlePilotTranscript(transcript);
                    }
                },

                onError: (error) => {
                    socket.emit("stt-error", {
                        message: error.message,
                    });
                },

                onClose: () => {
                    console.log(
                        `[Socket] Deepgram closed for ${sessionId}`
                    );
                },
            });
        });

        socket.on("audio", (chunk) => {
            if (!transcriber) {
                return;
            }

            const buffer = Buffer.isBuffer(chunk)
                ? chunk
                : Buffer.from(chunk);

            transcriber.sendAudio(buffer);
        });

        socket.on("stop-speaking", () => {
            transcriber?.finalize();
        });

        socket.on("disconnect", () => {
            transcriber?.close();

            console.log(
                `[Socket] Disconnected: ${socket.id}`
            );
        });

        async function handlePilotTranscript(transcript) {
            if (!sessionId) {
                return;
            }

            try {
                const config = {
                    configurable: {
                        thread_id: sessionId,
                    },
                };

                const result = await compiledGraph.invoke(
                    new Command({
                        resume: transcript,
                    }),
                    config
                );

                socket.emit("agent-response", {
                    audioBase64: result.audioBase64,
                    currentLine: result.currentLine,
                    finished: result.finished,
                });

            } catch (error) {
                console.error(
                    "[Socket] Graph resume failed:",
                    error
                );

                socket.emit("agent-error", {
                    message: error.message,
                });
            }
        }
    });
}