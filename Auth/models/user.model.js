import mongoose from 'mongoose';

// ── Constants ─────────────────────────────────────────────────────────────────
export const USER_ROLES = ['student', 'instructor', 'admin'];

// ── Schema ────────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
    {
        googleId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            index: true,
            lowercase: true,
        },
        name: {
            type: String,
            required: true,
        },
        photo: {
            type: String,
        },
        role: {
            type: String,
            enum: USER_ROLES,
            default: 'student',
        },
    },
    { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;
