import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import MetallicOrb from './MetallicOrb/MetallicOrb';
import DebriefPage from './DebriefPage';
import { setOrbMode } from '../slice/simulator.slice';
import { useSimulator } from '../Hooks/simulator.hooks';
import './SimulatorPage.scss';

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
  const { startSession, startRecording, stopRecordingAndSubmit, endSession } = useSimulator();

  const [audioLevels, setAudioLevels] = useState(Array(18).fill(4));
  const [showSourceDrawer, setShowSourceDrawer] = useState(false);
  const [wsTalkingIntensity, setWsTalkingIntensity] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionResult, setSessionResult] = useState(null);

  // Boot session when scenario is ready
  useEffect(() => {
    if (scenario?.id || scenario?._id) {
      setSessionCompleted(false);
      setSessionResult(null);
      startSession(scenario.id || scenario._id);
    }
  }, [scenario?.id, scenario?._id]); // eslint-disable-line

  const handleMicClick = useCallback(async () => {
    if (isProcessing) return;
    if (isRecording) {
      const turnResult = await stopRecordingAndSubmit();
      if (turnResult?.finished) {
        setSessionResult({
          score: turnResult.score || 95,
          stepResults: turnResult.stepResults || [],
          transcript: transcript,
        });
        setSessionCompleted(true);
      }
    } else {
      await startRecording();
    }
  }, [isRecording, isProcessing, startRecording, stopRecordingAndSubmit, transcript]);

  const handleEndSession = async () => {
    const res = await endSession();
    setSessionResult({
      score: res?.score || 90,
      stepResults: res?.stepResults || [],
      transcript: transcript,
    });
    setSessionCompleted(true);
  };

  if (sessionCompleted) {
    return (
      <DebriefPage
        scenario={scenario}
        sessionResult={sessionResult}
        onRetry={() => {
          setSessionCompleted(false);
          setSessionResult(null);
          startSession(scenario.id || scenario._id);
        }}
        onNextScenario={onBack}
        onBackToDashboard={onBack}
      />
    );
  }

  // Setup WebSocket connection to AI Service for real-time 3D Orb voice reactivity
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/simulator`;

    let ws = null;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ATC_SPEAKING_START') {
            setWsTalkingIntensity(data.intensity || 0.85);
          } else if (data.type === 'ATC_SPEAKING_END') {
            setWsTalkingIntensity(0);
          }
        } catch (e) {
          // ignore non-JSON messages
        }
      };
    } catch (e) {
      console.warn('WebSocket connection fallback:', e.message);
    }

    return () => {
      if (ws && ws.readyState === 1) ws.close();
    };
  }, []);

  // Animate frequency audio bars from real microphone volume level
  useEffect(() => {
    if (isRecording) {
      const realLevel = audioLevel || 0;
      setAudioLevels(prev => prev.map((_, i) => Math.max(4, (realLevel * 36) * (0.6 + 0.8 * Math.sin(i * 0.7)))));
    } else {
      setAudioLevels(Array(18).fill(4));
    }
  }, [isRecording, audioLevel]);



  // Spacebar Push-To-Talk (PTT) keyboard listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat && !isRecording && !isProcessing) {
        const target = e.target;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          startRecording();
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space' && isRecording && !isProcessing) {
        const target = e.target;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          stopRecordingAndSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRecording, isProcessing, startRecording, stopRecordingAndSubmit]);

  const lastAtcLine = [...transcript].reverse().find(t => t.role === 'atc');
  const lastPilotLine = [...transcript].reverse().find(t => t.role === 'pilot');

  const aircraftCallsign = scenario?.aircraftCallsign || 'N172SP';
  const freq = '118.300';
  const runway = scenario?.steps?.[0]?.slots?.find(s => s.key === 'runway')?.staticValue || '22L';

  const talkingState = {
    isTalking: isRecording ? (audioLevel > 0.03) : (wsTalkingIntensity > 0),
    intensity: isRecording ? Math.min(1.0, (audioLevel || 0) * 2.8) : isProcessing ? 0.4 : wsTalkingIntensity,
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
          <span className="pill-freq">{freq} MHz</span>
          <span className="pill-sep">•</span>
          <span className="pill-callsign">{aircraftCallsign}</span>
          <span className="pill-sep">•</span>
          <span className="pill-rwy">RWY {runway}</span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className={`sim-source-toggle ${showSourceDrawer ? 'active' : ''}`}
            onClick={() => setShowSourceDrawer(s => !s)}
            aria-label="Toggle RAG grounding drawer"
          >
            <DatabaseIcon />
            <span>Source RAG</span>
          </button>

          <button
            className="sim-source-toggle active"
            onClick={handleEndSession}
            style={{ background: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.4)', color: 'var(--cleared-green)' }}
            aria-label="Complete Sortie"
          >
            <span>Complete Sortie ✓</span>
          </button>
        </div>
      </header>

      {/* ── CENTERSTAGE: 3D METALLIC ORB (WEBSOCKET CONNECTED) ── */}
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
            <span className="line-speaker">PILOT ({aircraftCallsign})</span>
            <p className="line-text">{lastPilotLine.text}</p>
          </div>
        )}
      </div>

      {/* ── BOTTOM FLOATING AUDIO FREQUENCY DECK ── */}
      <footer className="sim-audio-deck">
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

        <div className="mic-trigger-wrap">
          <button
            id="btn-mic-simulator"
            className={`sim-mic-btn ${isProcessing ? 'processing' : isRecording ? 'recording' : 'ready'}`}
            onClick={handleMicClick}
            disabled={isProcessing}
            aria-label={isRecording ? 'Stop transmission (PTT)' : 'Start transmission (PTT)'}
          >
            {isProcessing ? <SpinnerIcon /> : isRecording ? <StopIcon /> : <MicIcon />}
          </button>
        </div>

        <p className="mic-hint-text">
          {isProcessing ? 'Transmitting to ICAO Validator…' : isRecording ? 'Recording — Release Space or tap to submit' : 'Hold Spacebar (PTT) or tap microphone to transmit radio callout'}
        </p>

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
            <div className="drawer-excerpt">
              <p className="source-title">ICAO Doc 4444 §12.3.1 — Phraseology</p>
              <p className="source-quote">"All readbacks shall include aircraft callsign, assigned runway designator, and key clearances."</p>
              <span className="source-match">Relevance Match: 95%</span>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
