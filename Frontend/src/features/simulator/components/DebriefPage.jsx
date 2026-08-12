import React from 'react';
import './DebriefPage.scss';

const MOCK_STEPS = [
  { name: 'Initial ATC Clearance Read',      status: 'cleared',   duration: '0:42' },
  { name: 'Departure Frequency Readback',    status: 'cleared',   duration: '0:31' },
  { name: 'Pushback Authorization',          status: 'corrected', duration: '1:05', note: 'Correction: used wrong runway designator' },
  { name: 'Taxi via Alpha Hold Short',       status: 'cleared',   duration: '0:58' },
  { name: 'Line-Up & Wait Acknowledgement',  status: 'cleared',   duration: '0:28' },
  { name: 'Takeoff Clearance',               status: 'corrected', duration: '0:44', note: 'Correction: omitted transponder squawk' },
  { name: 'Frequency Change to Departure',   status: 'cleared',   duration: '0:22' },
  { name: 'Initial Climb Altitude Report',   status: 'cleared',   duration: '0:35' },
];

const MOCK_TRANSCRIPT = [
  { role: 'atc',   text: 'N5CD, cleared to destination via Alpha Five departure, climb and maintain five thousand, squawk 4421.', status: 'neutral' },
  { role: 'pilot', text: 'Cleared to destination via Alpha Five departure, climb and maintain five thousand, squawk 4421, N5CD.', status: 'correct' },
  { role: 'atc',   text: 'N5CD, pushback approved, face west, runway two-two.', status: 'neutral' },
  { role: 'pilot', text: 'Pushback approved, face west, runway two-zero, N5CD.', status: 'corrected' },
  { role: 'atc',   text: 'N5CD, correction — runway two-two, not two-zero.', status: 'neutral' },
  { role: 'pilot', text: 'Runway two-two, N5CD. Apologies.', status: 'correct' },
  { role: 'atc',   text: 'N5CD, taxi to runway two-two via Alpha, hold short runway two-two.', status: 'neutral' },
  { role: 'pilot', text: 'Taxi runway two-two via Alpha, hold short runway two-two, N5CD.', status: 'correct' },
];

function scoreToColor(score) {
  if (score >= 85) return 'var(--cleared-green)';
  if (score >= 65) return 'var(--caution-amber)';
  return 'var(--alert-red)';
}

function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  );
}

function NextIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

export default function DebriefPage({ scenario, sessionResult, onRetry, onNextScenario, onBackToDashboard }) {
  const stepsData = sessionResult?.stepResults?.length > 0
    ? sessionResult.stepResults.map((s, i) => ({
        name: s.stepName || s.procedureType || `Procedure Step ${i + 1}`,
        status: s.score >= 80 ? 'cleared' : s.score >= 50 ? 'corrected' : 'failed',
        duration: '0:30',
        note: s.feedback || (s.score < 80 ? 'Phraseology needs precision' : null),
      }))
    : MOCK_STEPS;

  const transcriptData = sessionResult?.transcript?.length > 0
    ? sessionResult.transcript
    : MOCK_TRANSCRIPT;

  const totalSteps     = stepsData.length;
  const clearedCount   = stepsData.filter(s => s.status === 'cleared').length;
  const correctedCount = stepsData.filter(s => s.status === 'corrected').length;
  const failedCount    = stepsData.filter(s => s.status === 'failed').length;
  const score          = sessionResult?.score ?? Math.round((clearedCount / Math.max(1, totalSteps)) * 100 - correctedCount * 4);
  const duration       = sessionResult?.duration || '4m 15s';
  const isPass         = score >= 65;

  return (
    <main className="debrief-page" aria-label="Session debrief">
      {/* ── Flight Progress Strip Card ── */}
      <div className="flight-strip-card" role="region" aria-label="Session results flight strip">
        {/* Header */}
        <div className="flight-strip-card__header">
          <div className={`strip-emblem ${isPass ? 'success' : 'partial'}`} aria-hidden="true">
            {isPass ? <CheckIcon /> : <WarningIcon />}
          </div>
          <div className="strip-meta">
            <p className="strip-scenario">{scenario?.name || scenario?.title || 'ATC Flight Sortie'}</p>
            <p className="strip-sub">
              <span>{scenario?.icao || 'KBOS'}</span>
              <span className="strip-dot" aria-hidden="true" />
              <span>RWY {scenario?.runway || '22L'}</span>
              <span className="strip-dot" aria-hidden="true" />
              <span>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </p>
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <span className={`chip ${isPass ? 'chip-green' : 'chip-amber'}`} aria-label={isPass ? 'Cleared — passed' : 'Corrected — needs review'}>
                <span className="chip-dot" aria-hidden="true" />
                {isPass ? 'Cleared' : 'Corrected'}
              </span>
              <span className="chip chip-ghost" aria-label={`${correctedCount} corrections`}>
                {correctedCount} correction{correctedCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="strip-score">
            <p className="score-big" style={{ color: scoreToColor(score) }} aria-label={`Score: ${score}%`}>
              {score}
            </p>
            <p className="score-unit">phraseology score</p>
          </div>
        </div>

        {/* Stat grid */}
        <div className="flight-strip-card__stats" role="list" aria-label="Session statistics">
          {[
            { label: 'Duration',    value: duration,                          color: 'var(--readout)' },
            { label: 'Cleared',     value: `${clearedCount}/${totalSteps}`,   color: 'var(--cleared-green)' },
            { label: 'Corrections', value: `${correctedCount}`,               color: correctedCount > 0 ? 'var(--caution-amber)' : 'var(--readout-muted)' },
            { label: 'Go-arounds',  value: `${failedCount}`,                  color: failedCount > 0 ? 'var(--alert-red)' : 'var(--readout-muted)' },
          ].map(s => (
            <div key={s.label} className="flight-strip-card__stat" role="listitem" aria-label={`${s.label}: ${s.value}`}>
              <p className="stat-lbl">{s.label}</p>
              <p className="stat-val" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Step checklist strip */}
        <div className="flight-strip-card__steps" role="list" aria-label="Step-by-step results">
          {stepsData.map((step, i) => (
            <div
              key={i}
              className={`flight-strip-card__step ${step.status}`}
              role="listitem"
              aria-label={`Step ${i + 1}: ${step.name} — ${step.status}${step.note ? ': ' + step.note : ''}`}
            >
              <span className="step-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="step-indicator" aria-hidden="true" />
              <span className="step-name">{step.name}</span>
              {step.note && (
                <span
                  style={{ fontSize: 10, color: 'var(--caution-amber)', fontFamily: 'var(--font-mono)', maxWidth: 220, textAlign: 'right', lineHeight: 1.4 }}
                  aria-label={`Note: ${step.note}`}
                >
                  {step.note}
                </span>
              )}
              <span className="step-label">{step.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Full Transcript ── */}
      <div className="debrief-transcript" role="region" aria-label="Full session transcript">
        <div className="dt-header">
          <h2>Full Transcript</h2>
        </div>
        <div className="dt-body" role="log" aria-label="Radio exchange transcript">
          {transcriptData.map((line, i) => (
            <div
              key={i}
              className="dt-line"
              aria-label={`${line.role === 'atc' ? 'ATC' : 'Pilot'}: ${line.text}`}
            >
              <span className={`dt-role ${line.role}`}>
                {line.role === 'atc' ? 'ATC' : 'PILOT'}
              </span>
              <span className={`dt-text ${line.status && line.status !== 'neutral' ? line.status : ''}`}>
                {line.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA Row ── */}
      <div className="debrief-cta">
        <button
          id="btn-retry-scenario"
          className="btn btn-ghost"
          onClick={onRetry}
          aria-label="Retry this scenario"
        >
          <RefreshIcon /> Retry scenario
        </button>
        <button
          id="btn-next-scenario"
          className="btn btn-cyan"
          onClick={onNextScenario}
          aria-label="Move to next scenario"
        >
          Next scenario <NextIcon />
        </button>
        <button
          id="btn-back-dashboard"
          className="btn btn-ghost"
          onClick={onBackToDashboard}
          style={{ marginLeft: 'auto' }}
          aria-label="Return to dashboard"
        >
          Dashboard
        </button>
      </div>
    </main>
  );
}

