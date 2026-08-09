import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import aiSessionRouter from '../routes/aiSession.routes.js';

const app = express();

// ── Core Middleware ────────────────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/ai/sessions', aiSessionRouter);

// ── Health Probes ─────────────────────────────────────────────────────────────
app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'ai-service', message: 'AI service is healthy' });
});

app.get('/readyz', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'ai-service', message: 'AI service is ready' });
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

    console.error(`[AI Service Error] ${statusCode} — ${message}`, err.stack || '');

    res.status(statusCode).json({
        status: 'error',
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

export default app;
