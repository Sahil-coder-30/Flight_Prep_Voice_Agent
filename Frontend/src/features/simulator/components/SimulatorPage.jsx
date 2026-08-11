import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import MetallicOrb from './MetallicOrb/MetallicOrb';
import { setOrbMode } from '../slice/simulator.slice';
import { useSimulator } from '../Hooks/simulator.hooks';
import './SimulatorPage.scss';

const AIRCRAFT_DATA = {
  callsign: 'N5CD',
  freq:     '118.300',
  runway:   '22L',
};

const GROUNDING_EXCERPTS = [
  {
    source: 'ICAO Doc 4444 §12.3.1 — Taxi Instructions',
    text:   '"The aerodrome controller shall give instructions to aircraft on the manoeuvring area so as to prevent collisions and to expedite and maintain an orderly flow of traffic."',
    score:  0.92,
  },
  {
    source: 'AIM 4-3-18 — Taxi Clearances',
    text:   '"Taxi instructions issued by ATC are required to include the runway assignment, taxi route, and any hold short instructions as applicable."',
    score:  0.87,
  },
];

function MicIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" rx="2"/>
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true" style={{ animation: 'orb-spin 0.8s linear infinite' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}

function BackArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  );
}

export default function SimulatorPage({ scenario, onBack }) {
  const dispatch = useDispatch();
  const { orbMode, transcript, isRecording, isProcessing, audioLevel } = useSelector(s => s.simulator);
  const { startSession, startRecording, stopRecordingAndSubmit } = useSimulator();

  const [audioLevels, setAudioLevels] = useState(Array(18).fill(4));
  const [showSourceDrawer, setShowSourceDrawer] = useState(false);

  // Boot session when scenario is ready
  useEffect(() => {
    if (scenario?.id) startSession(scenario.id);
  }, [scenario?.id]); // eslint-disable-line

  // Animate frequency audio bars from real microphone volume level
  useEffect(() => {
    if (isRecording) {
      const realLevel = audioLevel || 0;
      setAudioLevels(prev => prev.map((_, i) => Math.max(4, (realLevel * 36) * (0.6 + 0.8 * Math.sin(i * 0.7)))));
    } else {
      setAudioLevels(Array(18).fill(4));
    }
  }, [isRecording, audioLevel]);

  const handleMicClick = useCallback(async () => {
    if (isProcessing) return;
    if (isRecording) {
      await stopRecordingAndSubmit();
    } else {
      await startRecording();
    }
  }, [isRecording, isProcessing, startRecording, stopRecordingAndSubmit]);

  const lastAtcLine = [...transcript].reverse().find(t => t.role === 'atc');
  const lastPilotLine = [...transcript].reverse().find(t => t.role === 'pilot');

  // Real WebAudio microphone talking state passed to 3D MetallicOrb canvas
  const talkingState = {
    isTalking: isRecording && (audioLevel > 0.03),
    intensity: isRecording ? Math.min(1.0, (audioLevel || 0) * 2.8) : isProcessing ? 0.3 : 0,
  };

  return (
    <div className="serene-simulator-page" aria-label="ATC Voice Simulator">
      {/* ── TOP MINIMAL FLOATING HEADER ── */}
      <header className="sim-top-bar">
        <button className="sim-back-btn" onClick={onBack} aria-label="Return to Dashboard">
          <BackArrow /> Dashboard
        </button>

        <div className="sim-status-pill">
          <span className="live-dot green" aria-hidden="true" />
          <span className="pill-freq">{AIRCRAFT_DATA.freq} MHz</span>
          <span className="pill-sep">•</span>
          <span className="pill-callsign">{AIRCRAFT_DATA.callsign}</span>
          <span className="pill-sep">•</span>
          <span className="pill-rwy">RWY {scenario?.runway || AIRCRAFT_DATA.runway}</span>
        </div>

        <button
          className={`sim-source-toggle ${showSourceDrawer ? 'active' : ''}`}
          onClick={() => setShowSourceDrawer(s => !s)}
          aria-label="Toggle RAG grounding drawer"
        >
          <DatabaseIcon />
          <span>Source RAG</span>
        </button>
      </header>

      {/* ── CENTERSTAGE: 3D METALLIC ORB (NO NOISE) ── */}
      <main className="sim-orb-stage">
        <div className="orb-canvas-hero">
          <MetallicOrb
            mode={orbMode || 'IDLE_CORE'}
            talkingState={talkingState}
            colorScheme="steel"
          />
        </div>
      </main>

      {/* ── FLOATING ATC / PILOT STREAMING TRANSMISSION HUD ── */}
      <div className="sim-hud-overlay">
        {lastAtcLine && (
          <div className="hud-line-card atc-card">
            <span className="line-speaker">ATC TOWER</span>
            <p className="line-text">{lastAtcLine.text}</p>
          </div>
        )}

        {lastPilotLine && (
          <div className="hud-line-card pilot-card">
            <span className="line-speaker">PILOT ({AIRCRAFT_DATA.callsign})</span>
            <p className="line-text">{lastPilotLine.text}</p>
          </div>
        )}
      </div>

      {/* ── BOTTOM FLOATING AUDIO FREQUENCY DECK ── */}
      <footer className="sim-audio-deck">
        {/* Frequency visualizer bars */}
        <div className="audio-freq-bars" aria-hidden="true">
          {audioLevels.map((h, i) => (
            <div
              key={i}
              className="freq-bar"
              style={{
                height: `${h}px`,
                opacity: isRecording ? 0.95 : 0.25,
                background: isRecording ? 'var(--alert-red)' : 'var(--nav-cyan)',
              }}
            />
          ))}
        </div>

        {/* Minimal circular mic trigger */}
        <div className="mic-trigger-wrap">
          <button
            id="btn-mic-simulator"
            className={`sim-mic-btn ${isProcessing ? 'processing' : isRecording ? 'recording' : 'ready'}`}
            onClick={handleMicClick}
            disabled={isProcessing}
            aria-label={isRecording ? 'Stop transmission' : 'Start transmission'}
          >
            {isProcessing ? <SpinnerIcon /> : isRecording ? <StopIcon /> : <MicIcon />}
          </button>
        </div>

        <p className="mic-hint-text">
          {isProcessing ? 'Transmitting to ICAO Validator…' : isRecording ? 'Recording — tap to conclude readback' : 'Tap microphone to transmit radio callout'}
        </p>

        {/* Orb mode selector tabs */}
        <div className="orb-mode-tabs">
          {[
            { id: 'IDLE_CORE', label: 'CORE ORB' },
            { id: 'SWARM_OUT', label: 'SWARM CLOUD' },
            { id: 'RADAR_SWEEP', label: 'RADAR SWEEP' },
            { id: 'LATTICE_MATRIX', label: 'LATTICE MATRIX' },
            { id: 'FLIGHT_PATH', label: 'AVIATION HEADSET' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${orbMode === tab.id ? 'active' : ''}`}
              onClick={() => dispatch(setOrbMode(tab.id))}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </footer>

      {/* ── COLLAPSIBLE RAG GROUNDING DRAWER ── */}
      {showSourceDrawer && (
        <aside className="sim-source-drawer" role="region" aria-label="Retrieved Grounding Sources">
          <div className="drawer-header">
            <h4>ICAO Phraseology Reference</h4>
            <button className="drawer-close" onClick={() => setShowSourceDrawer(false)}>✕</button>
          </div>
          <div className="drawer-content">
            {GROUNDING_EXCERPTS.map((ex, i) => (
              <div key={i} className="drawer-excerpt">
                <p className="source-title">{ex.source}</p>
                <p className="source-quote">{ex.text}</p>
                <span className="source-match">Relevance Match: {Math.round(ex.score * 100)}%</span>
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
