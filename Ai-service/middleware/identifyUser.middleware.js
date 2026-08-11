const jwt = require('jsonwebtoken');
const env = require('../config/env');

// Express-style (req, res, next) instead of Fastify's (req, reply)
function verifyJwt(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing token' });
    }
    try {
        req.user = jwt.verify(header.slice(7), env.JWT_SECRET);
        next();
    } catch (err) {
        console.error('JWT verification error:', err);
        return res.status(401).json({ error: 'Invalid token' });
    }
}

module.exports = { verifyJwt };