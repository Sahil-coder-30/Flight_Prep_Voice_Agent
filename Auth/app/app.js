import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import passport from 'passport';
import '../config/passport.js'; // Initialize Passport strategies
import authRouter from '../routes/auth.routes.js';

import { getJwksController } from '../controllers/auth.controller.js';

const app = express();

// ── Core Middleware ────────────────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(passport.initialize());

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/.well-known/jwks.json', getJwksController);
app.use('/api/auth', authRouter);

// ── Health Probes ─────────────────────────────────────────────────────────────
app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'auth', message: 'Auth service is healthy' });
});

app.get('/readyz', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'auth', message: 'Auth service is ready' });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ status: 'error', message: 'Route not found' });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Internal server error';

    console.error(`[Auth Error] ${statusCode} — ${message}`, err.stack || '');

    res.status(statusCode).json({
        status: 'error',
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

export default app;
