import express from 'express';
import { identifyUser } from '../middleware/identifyUser.middleware.js';
import { rateLimiter } from '../middleware/rate-limit.middleware.js';
import { turn, getTranscript, getUserChatHistory, getTokens, getUserPilotResponses, getUserTemplateScores } from '../controllers/aiSession.controller.js';

const router = express.Router();

router.use(identifyUser, rateLimiter);

router.post('/sessions/:id/turn', turn);
router.get('/sessions/:id/transcript', getTranscript);
router.get('/sessions/:id/tokens', getTokens);
router.get('/users/:userId/chat', getUserChatHistory);
router.get('/users/:userId/responses', getUserPilotResponses);
router.get('/users/:userId/template-scores', getUserTemplateScores);

export default router;