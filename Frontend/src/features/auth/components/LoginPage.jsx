import React from 'react';
import { useAuth } from '../Hooks/auth.hooks';
import ATCLogo from '../../../components/Logo/ATCLogo';
import './LoginPage.scss';

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function LoginPage({ onBackToLanding }) {
  const { loading, loginWithGoogle } = useAuth();

  return (
    <main className="login-page" aria-label="ATC Voice Simulator authentication">
      {/* ── Soft Ambient Glow Backdrop (Pure Deep Obsidian Void) ── */}
      <div className="login-backdrop" aria-hidden="true">
        <div className="glow-spot spot-center" />
      </div>

      {/* ── Ultra-Minimalist Centered Container (No Card Panel) ── */}
      <div className="login-hero">
        {/* Masterpiece Silver & Titanium Logo */}
        <div
          className="hero-logo"
          onClick={onBackToLanding}
          style={{ cursor: onBackToLanding ? 'pointer' : 'default' }}
          title="Return to landing page"
        >
          <ATCLogo size="hero" variant="stacked" />
        </div>

        {/* Single Action: Continue with Google Button */}
        <div className="hero-action">
          <button
            id="btn-google-login"
            className="btn-google-sso"
            onClick={loginWithGoogle}
            disabled={loading}
            aria-label="Continue with Google"
          >
            <GoogleLogo />
            <span className="btn-text">
              {loading ? 'Connecting to Google…' : 'Continue with Google'}
            </span>
          </button>
        </div>

        {/* Minimal Navigation Back Link */}
        {onBackToLanding && (
          <div className="hero-back">
            <button
              type="button"
              className="btn-back"
              onClick={onBackToLanding}
            >
              ← Back to Landing Page
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
