import express from 'express';
import { identifyUser } from '../middleware/identifyUser.middleware.js';
import {
    getMyProgressController,
    getMyStatsController,
    getMyWeakAreasController,
    getMyTemplateScoresController,
} from '../controllers/progress.controller.js';

const router = express.Router();

router.use(identifyUser);

router.get('/progress', getMyProgressController);
router.get('/stats', getMyStatsController);
router.get('/weak-areas', getMyWeakAreasController);
router.get('/template-scores', getMyTemplateScoresController);

export default router;

