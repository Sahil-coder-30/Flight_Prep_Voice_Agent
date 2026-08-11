import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
    },

    role: {
        type: String,
        required: true,
    },

    content: {
        type: String,
        required: true,
    },

    stepId: {
        type: Number,
    },

    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const ChatMessage = mongoose.model(
    "ChatMessage",
    chatMessageSchema
);

export { ChatMessage };