import { Command } from "@langchain/langgraph";
import { compiledGraph } from "../agent/graph.js";
import { ChatMessage } from "../models/chatMessage.model.js";
import { scenarios } from "../data/scenarios.js";

async function turn(req, res) {
    try {
        const scenario = scenarios["taxi-basic"];

        if (!scenario) {
            throw new Error("Scenario 'taxi-basic' not found");
        }

        const { id } = req.params;
        const { pilotTranscript } = req.body;

        const config = {
            configurable: {
                thread_id: id,
            },
        };

        let result;

        if (pilotTranscript) {
            result = await compiledGraph.invoke(
                new Command({
                    resume: pilotTranscript,
                }),
                config
            );
        } else {
            result = await compiledGraph.invoke(
                {
                    sessionId: id,
                    steps: scenario.steps,
                    stepIndex: 0,
                },
                config
            );
        }

        if (result.transcript?.length) {
            await ChatMessage.insertMany(
                result.transcript.map((message) => ({
                    sessionId: id,
                    ...message,
                    stepId: result.stepIndex,
                }))
            );
        }

        res.json({
            audioBase64: result.audioBase64,
            finished: result.finished,
            currentLine: result.currentLine,
        });

    } catch (error) {
        console.error("[AI Controller] Turn failed:", error);

        res.status(500).json({
            error: "AI turn failed",
            message: error.message,
        });
    }
}

async function getTranscript(req, res) {
    try {
        const { id } = req.params;

        const messages = await ChatMessage
            .find({ sessionId: id })
            .sort({ timestamp: 1 });

        res.json({
            sessionId: id,
            messages,
        });

    } catch (error) {
        console.error("[AI Controller] Transcript failed:", error);

        res.status(500).json({
            error: "Failed to fetch transcript",
        });
    }
}

export {
    turn,
    getTranscript,
};