import rateLimit from 'express-rate-limit';

// ── Standard API Rate Limiter ──────────────────────────────────────────────────
export const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 'error', message: 'Too many requests, please try again later.' },
});
