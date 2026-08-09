const express = require('express');
const aiSessionRoutes = require('./routes/aiSession.routes');

const app = express();
app.use(express.json({ limit: '10mb' })); // base64 audio payloads need headroom
app.use(aiSessionRoutes);

module.exports = app;