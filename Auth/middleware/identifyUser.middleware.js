import jwt from 'jsonwebtoken';
import { createPublicKey } from 'crypto';
import { getJwksData } from '../controllers/auth.controller.js';

// ── Constants ─────────────────────────────────────────────────────────────────
const JWT_VERIFY_OPTIONS = {
    algorithms: ['RS256'],
    issuer: process.env.JWT_ISSUER || 'auth.atcvoicesimulator.in',
    audience: process.env.JWT_AUDIENCE || 'atcvoicesimulator-services',
};

/**
 * Resolves the correct RSA Public Key PEM by calling getJwksData() directly internally.
 * Zero HTTP network calls — pure in-process execution.
 */
async function resolvePublicKey(token) {
    const header = jwt.decode(token, { complete: true })?.header;
    const jwks = getJwksData();

    if (!jwks?.keys || jwks.keys.length === 0) {
        throw new Error('Auth Service: JWKS is empty internally');
    }

    // Match kid if present, or use primary key
    let jwk = jwks.keys.find((k) => k.kid === header?.kid) || jwks.keys[0];
    if (!jwk) {
        throw new Error(`Auth Service: No matching JWK found for kid="${header?.kid}"`);
    }

    return createPublicKey({ key: jwk, format: 'jwk' }).export({ type: 'spki', format: 'pem' });
}

// ── Middleware ────────────────────────────────────────────────────────────────

/**
 * identifyUser — Auth Service token verification middleware.
 * Directly resolves JWKS internally without external HTTP calls.
 */
export const identifyUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            status: 'error',
            message: 'Unauthorized: Missing Authorization header. Expected: Bearer <JWT>',
        });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized: Bearer token value is empty.' });
    }

    try {
        const publicKeyPem = await resolvePublicKey(token);
        const decoded = jwt.verify(token, publicKeyPem, JWT_VERIFY_OPTIONS);

        const userId = decoded?.sub || decoded?.id;
        if (!decoded || !userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Unauthorized: Token payload is missing required identity claims (sub / id).',
            });
        }

        req.user = {
            id: userId,
            email: decoded.email,
            name: decoded.name,
            role: decoded.role || 'student',
        };
        req.authToken = token;

        next();
    } catch (err) {
        const isExpired = err.name === 'TokenExpiredError';
        return res.status(401).json({
            status: 'error',
            message: isExpired
                ? 'Unauthorized: Access token expired. Please refresh.'
                : `Unauthorized: ${err.message}`,
            expired: isExpired,
        });
    }
};
