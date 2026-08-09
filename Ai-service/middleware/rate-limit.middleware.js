import rateLimit from 'express-rate-limit';

export const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 'error', message: 'Too many AI inference requests, please try again later.' },
});
