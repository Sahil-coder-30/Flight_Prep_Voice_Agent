import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import aiSessionRoutes from '../routes/aiSession.routes.js';

const app = express();

app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' })); // base64 audio payloads need headroom

// ── Health Probes ──────────────────────────────────────────────────────────────
app.get('/healthz', (_req, res) => res.status(200).json({ status: 'ok' }));
app.get('/readyz',  (_req, res) => res.status(200).json({ status: 'ready' }));

// ── AI Session Routes ──────────────────────────────────────────────────────────
app.use('/api/ai', aiSessionRoutes);

export default app;