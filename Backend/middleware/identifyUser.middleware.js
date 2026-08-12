import jwt from 'jsonwebtoken';
import { createPublicKey } from 'crypto';

// ── Constants ─────────────────────────────────────────────────────────────────
const AUTH_JWKS_URI = process.env.AUTH_JWKS_URI || 'http://localhost/api/auth/.well-known/jwks.json';

const JWT_VERIFY_OPTIONS = {
    algorithms: ['RS256'],
    issuer: process.env.JWT_ISSUER || 'auth.atcvoicesimulator.in',
    audience: process.env.JWT_AUDIENCE || 'atcvoicesimulator-services',
};

// ── JWKS Key Cache ─────────────────────────────────────────────────────────────
// Caches the full JWK array (not a single key) to support zero-downtime key
// rotation overlap windows. Stale cache is served on transient Auth network failure.
let cachedJwks = null;
let lastFetchedTime = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchJwks(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedJwks && now - lastFetchedTime < CACHE_TTL_MS) {
        return cachedJwks;
    }

    const urisToTry = [
        AUTH_JWKS_URI,
        'http://localhost:3000/api/auth/.well-known/jwks.json',
        'http://127.0.0.1:3000/api/auth/.well-known/jwks.json',
        'http://localhost:5001/api/auth/.well-known/jwks.json',
        'http://auth-service:3000/api/auth/.well-known/jwks.json',
    ];

    let lastError = null;
    for (const uri of [...new Set(urisToTry)]) {
        try {
            const response = await fetch(uri);
            if (!response.ok) continue;

            const data = await response.json();
            if (!data.keys || data.keys.length === 0) continue;

            cachedJwks = data.keys;
            lastFetchedTime = now;
            return cachedJwks;
        } catch (err) {
            lastError = err;
        }
    }

    if (cachedJwks) return cachedJwks; // Serve stale cache on transient Auth network failure
    throw new Error(`[Backend Auth Middleware] Failed to fetch JWKS from Auth Service: ${lastError?.message || 'Connection refused'}`);
}

/**
 * Resolves the correct RSA Public Key PEM for the token's kid claim.
 * On kid miss, force-refreshes the JWKS cache once before failing.
 */
async function resolvePublicKey(token) {
    const header = jwt.decode(token, { complete: true })?.header;
    if (!header?.kid) throw new Error('Token is missing the kid (key ID) header claim');

    let keys = await fetchJwks();
    let jwk = keys.find((k) => k.kid === header.kid);

    // If kid is not in cache, a new key may have rotated in — force refetch once
    if (!jwk) {
        keys = await fetchJwks(true);
        jwk = keys.find((k) => k.kid === header.kid);
    }

    if (!jwk) throw new Error(`No JWKS entry found for kid="${header.kid}"`);

    return createPublicKey({ key: jwk, format: 'jwk' }).export({ type: 'spki', format: 'pem' });
}

// ── Middleware ────────────────────────────────────────────────────────────────

/**
 * identifyUser — RS256 token verification middleware.
 * Fetches and caches JWKS from the Auth service.
 * Attaches req.user (decoded token payload) and req.authToken (raw token).
 */
export const identifyUser = async (req, res, next) => {
    // ── Extract Bearer Token ──────────────────────────────────────────────────
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
        // ── Key Resolution by kid ─────────────────────────────────────────────
        const publicKeyPem = await resolvePublicKey(token);

        // ── Cryptographic Signature & Expiry Verification ─────────────────────
        const decoded = jwt.verify(token, publicKeyPem, JWT_VERIFY_OPTIONS);

        // ── Identity Claim Validation ─────────────────────────────────────────
        const userId = decoded?.sub || decoded?.id;
        if (!decoded || !userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Unauthorized: Token payload is missing required identity claims (sub / id).',
            });
        }

        // ── Attach Verified Identity ──────────────────────────────────────────
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
