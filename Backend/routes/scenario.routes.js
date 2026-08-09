import express from 'express';
import { identifyUser } from '../middleware/identifyUser.middleware.js';
import { getScenariosController, getScenarioByIdController } from '../controllers/scenario.controller.js';

const router = express.Router();

// ── Authenticated Routes ──────────────────────────────────────────────────────
router.use(identifyUser);

router.get('/', getScenariosController);
router.get('/:id', getScenarioByIdController);

export default router;
