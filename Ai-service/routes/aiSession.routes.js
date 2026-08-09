import express from 'express';
import { identifyUser } from '../middleware/identifyUser.middleware.js';
import {
    processSessionTurnController,
    getSessionTranscriptController,
} from '../controllers/aiSession.controller.js';

const router = express.Router();

// ── Authenticated Routes ──────────────────────────────────────────────────────
router.use(identifyUser);

router.post('/:id/turn', processSessionTurnController);
router.get('/:id/transcript', getSessionTranscriptController);

export default router;
