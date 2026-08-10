const express = require('express');
const { identifyUser } = require('../middleware/identifyUser.middleware');
const { rateLimiter } = require('../middleware/rate-limit.middleware');
const aiSessionController = require('../controllers/aiSession.controller');

const router = express.Router();

router.use(identifyUser, rateLimiter);

router.post('/sessions/:id/turn', aiSessionController.turn);
router.get('/sessions/:id/transcript', aiSessionController.getTranscript);

module.exports = router;