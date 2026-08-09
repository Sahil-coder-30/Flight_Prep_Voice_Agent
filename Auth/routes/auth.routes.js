import express from 'express';
import passport from 'passport';
import { identifyUser } from '../middleware/identifyUser.middleware.js';
import {
    getJwksController,
    authGoogleCallbackController,
    authGenerateAccessTokenController,
    getMeController,
    logoutController,
} from '../controllers/auth.controller.js';

const router = express.Router();

// ── JWKS Endpoint (Public) ────────────────────────────────────────────────────
// Served at /.well-known/jwks.json (mounted separately in app.js)
// Also accessible at /api/auth/.well-known/jwks.json via this router
router.get('/.well-known/jwks.json', getJwksController);

// ── Google OAuth Routes (Public) ──────────────────────────────────────────────
router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/api/auth/google' }),
    authGoogleCallbackController
);

// ── Token Refresh (Public — uses HttpOnly cookie) ─────────────────────────────
router.post('/refresh', authGenerateAccessTokenController);

// ── Authenticated Routes ──────────────────────────────────────────────────────
router.use(identifyUser);

router.get('/getMe', getMeController);
router.post('/logout', logoutController);

export default router;
