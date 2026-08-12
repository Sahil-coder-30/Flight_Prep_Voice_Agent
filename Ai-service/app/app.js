import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import aiSessionRoutes from '../routes/aiSession.routes.js';

const app = express();

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

app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ── Health Probes ──────────────────────────────────────────────────────────────
app.get('/healthz', (_req, res) => res.status(200).json({ status: 'ok' }));
app.get('/readyz',  (_req, res) => res.status(200).json({ status: 'ready' }));

// ── AI Session Routes ──────────────────────────────────────────────────────────
app.use('/api/ai', aiSessionRoutes);

export default app;