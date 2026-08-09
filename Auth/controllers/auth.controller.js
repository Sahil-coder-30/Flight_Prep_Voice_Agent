import User from '../models/user.model.js';
import RefreshToken from '../models/refreshToken.model.js';
import { issueTokenPair, setRefreshCookie, hashToken, signAccessToken } from '../utils/generateTokens.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createPublicKey } from 'crypto';

// ── Constants ─────────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_KEY_PEM = fs.readFileSync(path.join(__dirname, '../keys/public.pem'), 'utf-8');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Derives JWK n and e components from the RSA public key PEM.
 * Used to build the JWKS endpoint response.
 * @returns {{ n: string, e: string }}
 */
const deriveJwkComponents = () => {
    const pubKey = createPublicKey(PUBLIC_KEY_PEM);
    const jwk = pubKey.export({ format: 'jwk' });
    return { n: jwk.n, e: jwk.e };
};

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /.well-known/jwks.json
 * Serves the RSA public key as a JWK set.
 * All downstream microservices fetch and cache this to verify access tokens locally.
 */
export const getJwksController = (_req, res) => {
    try {
        const { n, e } = deriveJwkComponents();
        return res.status(200).json({
            keys: [
                {
                    kty: 'RSA',
                    use: 'sig',
                    alg: 'RS256',
                    kid: 'auth-rsa-v1',
                    n,
                    e,
                },
            ],
        });
    } catch (error) {
        console.error('[Auth] getJwksController error:', error.message);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * GET /api/auth/google
 * Redirects to Google OAuth consent screen via Passport.
 * (Handled in routes — passport.authenticate('google', { scope }) is the handler.)
 */

/**
 * GET /api/auth/google/callback
 * Google redirects back here after consent.
 * Looks up or creates a local user record, then issues a token pair.
 */
export const authGoogleCallbackController = async (req, res, next) => {
    try {
        const { id, displayName, emails, photos } = req.user;

        let user = await User.findOne({ googleId: id });
        if (!user) {
            user = await User.create({
                googleId: id,
                name: displayName,
                email: emails[0].value,
                photo: photos?.[0]?.value || '',
            });
            console.log(`[Auth] New user created: ${user.email}`);
        }

        const { refreshToken } = await issueTokenPair(user);
        setRefreshCookie(res, refreshToken);

        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        res.redirect(clientUrl);
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/auth/refresh
 * Rotates the refresh token and returns a new access token in JSON.
 * Detects replay attacks (reused token) and revokes the entire token family.
 */
export const authGenerateAccessTokenController = async (req, res, next) => {
    try {
        const rawRefreshToken = req.cookies.refreshToken;
        if (!rawRefreshToken) {
            return res.status(401).json({ status: 'error', message: 'No refresh token provided' });
        }

        const tokenHash = hashToken(rawRefreshToken);
        const stored = await RefreshToken.findOne({ tokenHash });

        if (!stored || stored.expiresAt < new Date()) {
            res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
            return res.status(401).json({ status: 'error', message: 'Invalid or expired refresh token' });
        }

        // ── Replay Detection ──────────────────────────────────────────────────
        if (stored.used) {
            console.warn(`[Auth Security] Token reuse detected for family ${stored.familyId}! Revoking family.`);
            await RefreshToken.deleteMany({ familyId: stored.familyId });
            res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
            return res.status(401).json({
                status: 'error',
                message: 'Token reuse detected — all sessions revoked',
            });
        }

        // Mark old token as used (rotated)
        stored.used = true;
        await stored.save();

        const user = await User.findById(stored.userId);
        if (!user) {
            return res.status(401).json({ status: 'error', message: 'User no longer exists' });
        }

        // Issue new pair within the same rotation family
        const { accessToken, refreshToken: newRefreshToken } = await issueTokenPair(user, stored.familyId);
        setRefreshCookie(res, newRefreshToken);

        return res.status(200).json({
            status: 'success',
            message: 'Access token refreshed successfully',
            accessToken,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/auth/getMe
 * Returns the authenticated user's profile from the access token payload.
 * Requires identifyUser middleware to be applied on the route.
 */
export const getMeController = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-__v');
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }
        return res.status(200).json({ status: 'success', data: { user } });
    } catch (error) {
        console.error('[Auth] getMeController error:', error.message);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * POST /api/auth/logout
 * Deletes the current refresh token family, clearing all active sessions.
 */
export const logoutController = async (req, res, next) => {
    try {
        const rawRefreshToken = req.cookies.refreshToken;

        if (rawRefreshToken) {
            const tokenHash = hashToken(rawRefreshToken);
            const stored = await RefreshToken.findOne({ tokenHash });
            if (stored) {
                await RefreshToken.deleteMany({ familyId: stored.familyId });
                console.log(`[Auth] User ${stored.userId} logged out — family ${stored.familyId} revoked`);
            }
        }

        res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
        return res.status(200).json({ status: 'success', message: 'Logged out successfully' });
    } catch (err) {
        next(err);
    }
};
