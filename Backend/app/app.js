import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import scenarioRouter from '../routes/scenario.routes.js';
import sessionRouter from '../routes/session.routes.js';
import progressRouter from '../routes/progress.routes.js';

const app = express();

// Trust reverse proxy for express-rate-limit and X-Forwarded-For headers
app.set('trust proxy', 1);

// ── CORS & Preflight Middleware ───────────────────────────────────────────────
app.use((req, res, next) => {
    const origin = req.headers.origin || 'http://localhost:5173';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

// ── Core Middleware ────────────────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/backend/scenarios', scenarioRouter);
app.use('/api/backend/sessions', sessionRouter);
app.use('/api/backend/users', progressRouter);

// ── Health Probes ─────────────────────────────────────────────────────────────
app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'backend', message: 'Backend service is healthy' });
});

app.get('/readyz', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'backend', message: 'Backend service is ready' });
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

    console.error(`[Backend Error] ${statusCode} — ${message}`, err.stack || '');

    res.status(statusCode).json({
        status: 'error',
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

export default app;
