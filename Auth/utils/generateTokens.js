import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import RefreshToken from '../models/refreshToken.model.js';

// ── Constants ─────────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const getPrivateKey = () => {
    if (process.env.RSA_PRIVATE_KEY) return process.env.RSA_PRIVATE_KEY;
    const keyPath = path.join(__dirname, '../keys/private.pem');
    if (fs.existsSync(keyPath)) {
        return fs.readFileSync(keyPath, 'utf-8');
    }
    throw new Error('RSA private key not found in process.env.RSA_PRIVATE_KEY or Auth/keys/private.pem');
};

const JWT_OPTIONS = {
    algorithm: 'RS256',
    issuer: process.env.JWT_ISSUER || 'auth.atcvoicesimulator.in',
    audience: process.env.JWT_AUDIENCE || 'atcvoicesimulator-services',
    keyid: 'auth-rsa-v1', // Matches kid in /.well-known/jwks.json
};

const REFRESH_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Creates a SHA256 hash of a raw token string.
 * @param {string} rawToken
 * @returns {string} hex digest
 */
export const hashToken = (rawToken) => {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
};

/**
 * Signs a short-lived RS256 access token for the given user.
 * @param {Object} user - Mongoose user document or plain object
 * @returns {string} signed JWT
 */
export const signAccessToken = (user) =>
    jwt.sign(
        {
            sub: String(user._id || user.id),
            id: String(user._id || user.id),
            email: user.email,
            name: user.name,
            role: user.role || 'student',
        },
        getPrivateKey(),
        { ...JWT_OPTIONS, expiresIn: '15m' }
    );

/**
 * Issues a new access + refresh token pair and persists the refresh token hash.
 * Pass the existing familyId to rotate within the same family (avoids replay reuse).
 * @param {Object} user - User document
 * @param {string|null} familyId - Rotation family ID (null = new login, new family)
 * @returns {Promise<{ accessToken: string, refreshToken: string, familyId: string }>}
 */
export const issueTokenPair = async (user, familyId = null) => {
    const accessToken = signAccessToken(user);
    const rawRefreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = hashToken(rawRefreshToken);
    const activeFamilyId = familyId || crypto.randomUUID();

    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    await RefreshToken.create({
        userId: user._id || user.id,
        tokenHash,
        familyId: activeFamilyId,
        expiresAt,
    });

    return {
        accessToken,
        refreshToken: rawRefreshToken,
        familyId: activeFamilyId,
    };
};

/**
 * Sets the refresh token as an HttpOnly cookie scoped to /api/auth/refresh.
 * @param {Object} res - Express response object
 * @param {string} rawRefreshToken - The raw (unhashed) refresh token
 */
export const setRefreshCookie = (res, rawRefreshToken) => {
    res.cookie('refreshToken', rawRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/auth/refresh',
        maxAge: REFRESH_TOKEN_EXPIRY_MS,
    });
};
