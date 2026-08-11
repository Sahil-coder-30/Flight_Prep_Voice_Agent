import React, { useState, useEffect } from 'react';
import { useAuth } from '../Hooks/auth.hooks';
import './LoginPage.scss';

const RADIO_EXCHANGE = [
  { speaker: 'ATC',   text: 'Cessna 5CD, taxi to runway two-two via Alpha, hold short runway two-two.' },
  { speaker: 'PILOT', text: 'Taxi runway two-two via Alpha, hold short two-two, Cessna 5CD.' },
  { speaker: 'ATC',   text: 'Cessna 5CD, correction — hold short of runway two-zero, not two-two.' },
];

// Google logo SVG (per Google brand guidelines)
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
    </svg>
  );
}

export default function LoginPage({ onDemoAccess }) {
  const { loading, loginWithGoogle } = useAuth();
  const [typedLine, setTypedLine] = useState('');
  const [lineIdx,   setLineIdx]   = useState(0);
  const [charIdx,   setCharIdx]   = useState(0);
  const [done,      setDone]      = useState(false);

  // Typewriter effect for the ATC exchange preview
  useEffect(() => {
    if (lineIdx >= RADIO_EXCHANGE.length) { setDone(true); return; }
    const line = RADIO_EXCHANGE[lineIdx].text;
    if (charIdx < line.length) {
      const id = setTimeout(() => {
        setTypedLine(line.slice(0, charIdx + 1));
        setCharIdx(c => c + 1);
      }, 28 + Math.random() * 18);
      return () => clearTimeout(id);
    } else {
      const id = setTimeout(() => {
        setLineIdx(l => l + 1);
        setCharIdx(0);
        setTypedLine('');
      }, 1400);
      return () => clearTimeout(id);
    }
  }, [lineIdx, charIdx]);

  const currentSpeaker = RADIO_EXCHANGE[lineIdx]?.speaker;

  return (
    <main className="login-page" aria-label="ATC Voice Simulator login">
      {/* Animated radar background */}
      <div className="radar-bg" aria-hidden="true">
        <div className="radar-ring" />
        <div className="radar-ring" />
        <div className="radar-ring" />
        <div className="radar-ring" />
        <div className="radar-ring" />
        <div className="radar-sweep" />
        <div className="radar-ping" style={{ top: 'calc(50% - 75px)', left: 'calc(50% + 45px)' }} />
        <div className="radar-ping" style={{ top: 'calc(50% + 40px)', left: 'calc(50% - 90px)', animationDelay: '2s' }} />
        <div className="radar-ping" style={{ top: 'calc(50% - 20px)', left: 'calc(50% + 110px)', animationDelay: '4s' }} />
      </div>

      <div className="login-panel">
        {/* Brand */}
        <div className="login-panel__brand">
          <div className="brand-mark" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1>ATC Voice Simulator</h1>
          <p className="brand-sub">Aviation Phraseology Training Platform</p>
        </div>

        <div className="login-panel__card">
          {/* Live ATC exchange preview */}
          <div className="atc-exchange" aria-label="Sample ATC radio exchange">
            {RADIO_EXCHANGE.slice(0, lineIdx).map((line, i) => (
              <div key={i} className="exchange-line">
                <span className={`ex-speaker ${line.speaker.toLowerCase()}`}>{line.speaker}</span>
                <span className="ex-text">{line.text}</span>
              </div>
            ))}
            {!done && lineIdx < RADIO_EXCHANGE.length && (
              <div className="exchange-line">
                <span className={`ex-speaker ${currentSpeaker?.toLowerCase()}`}>{currentSpeaker}</span>
                <span className="ex-text">{typedLine}<span className="cursor" aria-hidden="true" /></span>
              </div>
            )}
          </div>

          <h2>Sign in to train</h2>
          <p>Practice real-world ATC radio procedures with an AI-powered controller grounded in ICAO phraseology standards.</p>

          {/* Google OAuth button */}
          <button
            id="btn-google-login"
            className="btn-google"
            onClick={loginWithGoogle}
            disabled={loading}
            aria-label="Continue with Google"
          >
            <GoogleLogo />
            {loading ? 'Authenticating…' : 'Continue with Google'}
          </button>

          {onDemoAccess && (
            <>
              <div className="divider-row">or</div>
              <button
                id="btn-demo-access"
                className="demo-bar"
                onClick={onDemoAccess}
                aria-label="Try the demo without signing in"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Try demo without signing in
              </button>
            </>
          )}

          <p className="login-note">
            By continuing, you agree to our{' '}
            <a href="#terms" aria-label="Terms of service">Terms</a> and{' '}
            <a href="#privacy" aria-label="Privacy policy">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </main>
  );
}
