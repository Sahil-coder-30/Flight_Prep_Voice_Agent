import mongoose from 'mongoose';

export const CHAT_ROLES = ['controller', 'pilot', 'system'];

const chatMessageSchema = new mongoose.Schema(
    {
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
        },
        stepId: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: CHAT_ROLES,
            required: true,
        },
        text: {
            type: String,
            required: true,
        },
        audioRef: {
            type: String, // URL or S3 key to synthesized audio file
        },
    },
    { timestamps: true }
);

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
export default ChatMessage;
