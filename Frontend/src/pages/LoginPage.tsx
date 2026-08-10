import { ArrowRight, PlaneTakeoff, ShieldCheck, Waves } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getGoogleAuthUrl, shouldUseMockApi, signInWithGoogle } from '../api';

export function LoginPage() {
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    const authResult = await signInWithGoogle();

    if (shouldUseMockApi()) {
      navigate(authResult.redirectUrl);
      return;
    }

    window.location.assign(authResult.redirectUrl || getGoogleAuthUrl());
  };

  return (
    <div className="hero-shell">
      <section className="hero-card">
        <div className="hero-card__eyebrow">
          <PlaneTakeoff size={18} />
          ATC voice simulator
        </div>

        <h1>Practice pilot-controller phraseology against an AI tower.</h1>
        <p>
          Train the live radio flow, step by step, in a frontend-only build backed by mock data until the external services land.
        </p>

        <div className="hero-card__actions">
          <button type="button" className="primary-button" onClick={() => void handleGoogleSignIn()}>
            Sign in with Google
            <ArrowRight size={18} />
          </button>
          <button type="button" className="secondary-button" onClick={() => navigate('/scenarios')}>
            Use the mock demo
          </button>
        </div>

        <div className="hero-card__chips">
          <span>
            <ShieldCheck size={14} />
            Mock-first build
          </span>
          <span>
            <Waves size={14} />
            Push-to-talk support
          </span>
          <span>Grounding panel included</span>
        </div>
      </section>

      <aside className="hero-aside">
        <div className="hero-aside__panel">
          <p className="eyebrow">Flow</p>
          <ol>
            <li>Sign in</li>
            <li>Select a scenario</li>
            <li>Work the live session</li>
            <li>Review the debrief</li>
          </ol>
        </div>
      </aside>
    </div>
  );
}
