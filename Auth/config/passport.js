import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

// ── Constants ──────────────────────────────────────────────────────────────────
// Google OAuth2 strategy is configured here and imported once in app.js.
// The actual controller logic lives in auth.controller.js — passport only
// handles the redirect/callback handshake and passes the Google profile forward.

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID || 'placeholder-google-client-id',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder-google-client-secret',
            callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
        },
        // Passport verify callback — passes the raw Google profile to the request
        // as req.user so the controller can look up or create the local user record.
        (_accessToken, _refreshToken, profile, done) => {
            done(null, profile);
        }
    )
);

export default passport;
