import React, { useState, useEffect } from 'react';
import './InstrumentStrip.scss';

function useClockTick() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function pad(n) { return String(n).padStart(2, '0'); }

export default function InstrumentStrip({ user, session, steps = [] }) {
  const now = useClockTick();
  const utc = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}Z`;

  const callsign = user?.callsign || 'N/A';
  const sessionActive = !!session;
  const statusLabel   = sessionActive ? 'SESSION ACTIVE' : 'STANDBY';
  const statusClass   = sessionActive ? 'active' : '';
  const freq          = session?.frequency || '122.800';

  return (
    <div className="instrument-strip" role="banner" aria-label="Instrument strip">
      {/* Callsign */}
      <div className="instrument-strip__segment instrument-strip__segment--callsign">
        <span>ATC</span>
        <span>{callsign}</span>
        {sessionActive && (
          <span className="strip-live" aria-label="Live session">
            <span className="live-dot cyan" aria-hidden="true" />
            LIVE
          </span>
        )}
      </div>

      {/* Session status */}
      <div className={`instrument-strip__segment instrument-strip__segment--status ${statusClass}`}>
        <span aria-label={`Status: ${statusLabel}`}>{statusLabel}</span>
      </div>

      {/* Frequency */}
      {sessionActive && (
        <div className="instrument-strip__segment instrument-strip__segment--freq">
          <span className="strip-label">FREQ</span>
          <span className="strip-value" aria-label={`Frequency ${freq} MHz`}>{freq}</span>
        </div>
      )}

      {/* Step progress checklist */}
      {steps.length > 0 && (
        <div className="instrument-strip__steps" aria-label="Session progress">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`instrument-strip__step ${step.status}`}
              title={`${step.label}: ${step.status}`}
              aria-label={`Step ${idx + 1}: ${step.label}, ${step.status}`}
            >
              <div className="step-fill" />
            </div>
          ))}
        </div>
      )}

      {/* UTC clock */}
      <div className="instrument-strip__segment instrument-strip__segment--time" aria-live="polite" aria-label={`UTC time ${utc}`}>
        {utc}
      </div>
    </div>
  );
}
