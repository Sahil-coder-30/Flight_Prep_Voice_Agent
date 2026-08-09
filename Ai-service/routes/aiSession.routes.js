const express = require('express');
const { compiledGraph } = require('../agent/graph');
const ChatMessage = require('../db/models/chatMessage.model');

const router = express.Router();

router.post('/sessions/:id/turn', async (req, res) => {
    const { id } = req.params;
    const { pilotTranscript } = req.body;
    const config = { configurable: { thread_id: id } };

    const result = pilotTranscript
        ? await compiledGraph.invoke({ resume: pilotTranscript }, config)
        : await compiledGraph.invoke({ sessionId: id, steps: demoScenario.steps, stepIndex: 0 }, config);

    ChatMessage.insertMany(
        (result.transcript ?? []).map(m => ({ sessionId: id, ...m, stepId: result.stepIndex }))
    ).catch(err => console.error(err));

    res.json({
        audioBase64: result.audioBase64,
        finished: result.finished,
        currentLine: result.currentLine,
    });
});

router.get('/sessions/:id/transcript', async (req, res) => {
    const { id } = req.params;
    const messages = await ChatMessage.find({ sessionId: id }).sort({ timestamp: 1 });
    res.json({ sessionId: id, messages });
});

module.exports = router;