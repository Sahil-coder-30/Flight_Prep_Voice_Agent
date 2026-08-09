import mongoose from 'mongoose';

// ── Schema ────────────────────────────────────────────────────────────────────
// Refresh tokens are never stored in plaintext.
// Only their SHA256 hash is saved in MongoDB alongside their rotation familyId.
// A MongoDB TTL index automatically removes expired documents.

const refreshTokenSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        tokenHash: {
            type: String,
            required: true,
            unique: true,
        },
        familyId: {
            type: String,
            required: true,
            index: true,
        },
        used: {
            type: Boolean,
            default: false,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true }
);

// Automatic TTL index — MongoDB removes expired documents automatically
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
export default RefreshToken;
