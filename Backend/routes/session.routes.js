import express from 'express';
import { identifyUser } from '../middleware/identifyUser.middleware.js';
import {
    createSessionController,
    getSessionController,
    completeSessionController,
    getUserSessionsController,
    updateSessionController,
    deleteSessionController,
} from '../controllers/session.controller.js';

const router = express.Router();

// ── Authenticated Routes ──────────────────────────────────────────────────────
router.use(identifyUser);

router.get('/my-sessions', getUserSessionsController);
router.post('/', createSessionController);
router.get('/:id', getSessionController);
router.put('/:id', updateSessionController);
router.delete('/:id', deleteSessionController);
router.post('/:id/complete', completeSessionController);

export default router;
