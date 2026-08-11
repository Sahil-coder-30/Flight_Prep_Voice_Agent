import { Command } from "@langchain/langgraph";

import { compiledGraph } from "../agent/graph.js";

import { ChatMessage } from "../models/chatMessage.model.js";

import { scenarios } from "../data/scenarios.js";

async function saveTranscript(
    sessionId,
    state
) {
    const messages =
        state?.transcript ?? [];

    if (!messages.length) {
        return;
    }

    const documents =
        messages.map((message) => ({
            sessionId,

            role:
                message.role,

            content:
                message.content,

            stepId:
                message.stepId,

            timestamp:
                message.timestamp ??
                new Date(),
        }));

    await ChatMessage.deleteMany({
        sessionId,
    });

    await ChatMessage.insertMany(
        documents
    );
}

async function turn(req, res) {
    try {
        const { id } = req.params;

        const {
            pilotTranscript,
            scenarioId,
        } = req.body;

        const config = {
            configurable: {
                thread_id: id,
            },
        };

        if (!pilotTranscript) {
            if (!scenarioId) {
                return res.status(400).json({
                    error:
                        "scenarioId is required when starting a session",
                });
            }

            const scenario =
                scenarios[scenarioId];

            if (!scenario) {
                return res.status(400).json({
                    error:
                        `Scenario '${scenarioId}' not found`,

                    availableScenarios:
                        Object.keys(scenarios),
                });
            }

            const result =
                await compiledGraph.invoke(
                    {
                        sessionId: id,

                        scenarioId,

                        steps:
                            scenario.steps,

                        stepIndex: 0,

                        retries: 0,

                        finished: false,
                    },

                    config
                );

            await saveTranscript(
                id,
                result
            );

            return res.json({
                audioBase64:
                    result.audioBase64,

                finished:
                    result.finished,

                currentLine:
                    result.currentLine,
            });
        }

        const result =
            await compiledGraph.invoke(
                new Command({
                    resume:
                        pilotTranscript,
                }),

                config
            );

        await saveTranscript(
            id,
            result
        );

        return res.json({
            audioBase64:
                result.audioBase64,

            finished:
                result.finished,

            currentLine:
                result.currentLine,
        });

    } catch (error) {
        console.error(
            "\n================================="
        );

        console.error(
            "[AI Controller] TURN FAILED"
        );

        console.error(
            "================================="
        );

        console.error(
            "Message:",
            error?.message
        );

        console.error(
            "Provider:",
            error?.provider
        );

        console.error(
            "Stage:",
            error?.stage
        );

        console.error(
            "Status:",
            error?.status
        );

        console.error(
            "Provider body:",
            error?.providerBody
        );

        if (error?.cause) {
            console.error(
                "Cause:",
                error.cause
            );
        }

        console.error(
            "Stack:",
            error?.stack
        );

        console.error(
            "=================================\n"
        );

        return res.status(500).json({
            error:
                "AI turn failed",

            message:
                error?.message ??
                "Unknown error",

            stage:
                error?.stage ??
                null,

            provider:
                error?.provider ??
                null,

            providerStatus:
                error?.status ??
                null,
        });
    }
}

async function getTranscript(req, res) {
    try {
        const { id } = req.params;

        const messages =
            await ChatMessage
                .find({
                    sessionId: id,
                })
                .sort({
                    timestamp: 1,
                });

        return res.json({
            sessionId: id,
            messages,
        });

    } catch (error) {
        console.error(
            "[AI Controller] Transcript failed:",
            error
        );

        return res.status(500).json({
            error:
                "Failed to fetch transcript",
        });
    }
}

export {
    turn,
    getTranscript,
};