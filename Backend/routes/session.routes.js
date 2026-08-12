import express from 'express';
import { identifyUser } from '../middleware/identifyUser.middleware.js';
import {
    createSessionController,
    getSessionController,
    completeSessionController,
    getUserSessionsController,
} from '../controllers/session.controller.js';

const router = express.Router();

// ── Authenticated Routes ──────────────────────────────────────────────────────
router.use(identifyUser);

router.get('/my-sessions', getUserSessionsController);
router.post('/', createSessionController);
router.get('/:id', getSessionController);
router.post('/:id/complete', completeSessionController);

export default router;
