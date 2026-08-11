import React, { useEffect, useState } from 'react';
import { useDashboard } from '../Hooks/dashboard.hooks';
import MetallicOrb from '../../simulator/components/MetallicOrb/MetallicOrb';
import MetallicOrbControls from './MetallicOrbControls';
import './Dashboard.scss';

const MOCK_SCENARIOS = [
  { id: '1', name: 'KJFK Departure Clearance', icao: 'KJFK', runway: '22L', difficulty: 'Beginner', progress: 72, color: 'cyan',  tag: 'DEP' },
  { id: '2', name: 'KLAX Approach & Landing',  icao: 'KLAX', runway: '24R', difficulty: 'Intermediate', progress: 45, color: 'green', tag: 'APP' },
  { id: '3', name: 'EGLL Ground Movement',     icao: 'EGLL', runway: '27L', difficulty: 'Advanced', progress: 18, color: 'amber', tag: 'GND' },
  { id: '4', name: 'YSSY Oceanic Crossing',    icao: 'YSSY', runway: '16R', difficulty: 'Expert',   progress: 0,  color: 'cyan',  tag: 'OCE' },
];

function StatIcon({ type }) {
  switch (type) {
    case 'sessions': return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    );
    case 'score': return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    );
    case 'hours': return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    );
    case 'streak': return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    );
    default: return null;
  }
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

export default function Dashboard({ onStartScenario, onResumeSession, activeSession }) {
  const { stats, recentSessions, loading, loadDashboard } = useDashboard();
  const [selectedId, setSelectedId] = useState(null);

  // Metallic Orb State
  const [orbMode, setOrbMode] = useState('IDLE_CORE');
  const [colorScheme, setColorScheme] = useState('chrome');
  const [isSimulatingVoice, setIsSimulatingVoice] = useState(false);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // Handle Voice pulse simulation state
  const talkingState = {
    isTalking: isSimulatingVoice,
    intensity: isSimulatingVoice ? 0.85 : 0,
  };

  const statCards = [
    { type: 'sessions', label: 'Sessions Logged', value: stats.sessionsCompleted, unit: '',     iconClass: 'cyan',  trend: '+3 this week' },
    { type: 'score',    label: 'Phraseology Score', value: stats.phraseologyScore,  unit: '%',   iconClass: 'green', trend: '↑ 4pts vs last week' },
    { type: 'hours',    label: 'Flight Time',     value: stats.hoursLogged,   unit: 'h',   iconClass: 'amber', trend: 'Last: 1.2h today' },
    { type: 'streak',   label: 'Current Streak',  value: stats.streak,          unit: 'd',   iconClass: 'cyan',  trend: 'Active Pilot' },
  ];

  function scoreColor(n) {
    if (n >= 85) return 'var(--cleared-green)';
    if (n >= 65) return 'var(--caution-amber)';
    return 'var(--alert-red)';
  }

  function scoreLabel(n) {
    if (n >= 85) return 'Cleared';
    if (n >= 65) return 'Corrected';
    return 'Go-around';
  }

  return (
    <main className="dashboard-space" aria-label="Flight Deck Dashboard">
      {/* ── HERO BANNER WITH METALLIC ORB ── */}
      <section className="dashboard-hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="live-dot cyan" aria-hidden="true" />
            <span className="badge-text">AIRSPACE SIMULATION CONTROL · FREQ 118.300</span>
          </div>

          <h1 className="hero-headline">
            Command the Sky with <em>Precision Phraseology</em>
          </h1>

          <p className="hero-description">
            Experience real-world ICAO air traffic control radio exchanges. Master departure clearances, ground navigation, and emergency procedures with instant RAG grounding.
          </p>

          <div className="hero-actions">
            <button
              id="btn-launch-first-scenario"
              className="btn btn-cyan btn-lg"
              onClick={() => onStartScenario?.(MOCK_SCENARIOS[0])}
            >
              Launch Primary Sortie <ChevronRight />
            </button>
            <button
              className="btn btn-ghost btn-lg"
              onClick={() => setOrbMode(m => m === 'SWARM_OUT' ? 'IDLE_CORE' : 'SWARM_OUT')}
            >
              Morph Orb Matrix
            </button>
          </div>
        </div>

        {/* ── 3D METALLIC ORB DISPLAY VIEWPORT ── */}
        <div className="hero-orb-viewport" role="img" aria-label="3D Metallic Orb Flight Simulator Core">
          <div className="orb-frame-header">
            <span className="frame-title">AI CORE · METALLIC SYNTHESIS</span>
            <span className="frame-mode-badge">{orbMode.replace('_', ' ')}</span>
          </div>

          <div className="orb-canvas-container">
            <MetallicOrb
              mode={orbMode}
              talkingState={talkingState}
              colorScheme={colorScheme}
            />
          </div>

          <div className="orb-controls-overlay">
            <MetallicOrbControls
              currentMode={orbMode}
              onModeChange={setOrbMode}
              currentColorScheme={colorScheme}
              onColorSchemeChange={setColorScheme}
              isSimulatingVoice={isSimulatingVoice}
              onToggleVoice={() => setIsSimulatingVoice(v => !v)}
            />
          </div>
        </div>
      </section>

      {/* ── RESUME ACTIVE SESSION CARD ── */}
      {activeSession && (
        <section className="dashboard-resume-card" role="region" aria-label="Resume session">
          <div className="resume-glow" />
          <div className="resume-icon-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
          <div className="resume-details">
            <div className="resume-top-line">
              <span className="chip chip-cyan">IN FLIGHT</span>
              <span className="resume-time">{activeSession.elapsed || '14m elapsed'}</span>
            </div>
            <h3 className="resume-scenario-title">{activeSession.scenarioName || 'KJFK Departure Clearance'}</h3>
            <p className="resume-progress-text">Step {activeSession.step || 3} of {activeSession.totalSteps || 8} · Hold short Runway 22L</p>
          </div>
          <button
            id="btn-resume-session"
            className="btn btn-cyan"
            onClick={() => onResumeSession?.(activeSession)}
          >
            Resume Flight Deck <ChevronRight />
          </button>
        </section>
      )}

      {/* ── TELEMETRY STATS GRID ── */}
      <section className="telemetry-grid" role="region" aria-label="Flight Metrics">
        {statCards.map((s) => (
          <div key={s.type} className="telemetry-card" aria-label={`${s.label}: ${s.value}${s.unit}`}>
            <div className="card-top">
              <span className="card-label">{s.label}</span>
              <div className={`card-icon ${s.iconClass}`}>
                <StatIcon type={s.type} />
              </div>
            </div>
            <div className="card-value-wrap">
              <span className="card-value">{loading ? '—' : s.value}</span>
              {s.unit && <span className="card-unit">{s.unit}</span>}
            </div>
            <div className="card-trend">{s.trend}</div>
          </div>
        ))}
      </section>

      {/* ── MAIN CONTENT GRID: SCENARIOS & RECENT SESSIONS ── */}
      <div className="dashboard-deck-grid">
        {/* Scenario Library */}
        <section className="deck-panel scenario-deck" role="region" aria-label="Training Scenarios">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Training Sorties</h2>
              <p className="panel-subtitle">Select an ATC simulation exercise grounded in ICAO protocol</p>
            </div>
            <span className="chip chip-green">
              <span className="live-dot green" aria-hidden="true" />
              4 Scenarios Ready
            </span>
          </div>

          <div className="scenario-card-grid">
            {MOCK_SCENARIOS.map((sc) => (
              <div
                key={sc.id}
                id={`btn-scenario-${sc.id}`}
                className={`scenario-deck-card ${selectedId === sc.id ? 'active' : ''}`}
                onClick={() => { setSelectedId(sc.id); onStartScenario?.(sc); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedId(sc.id); onStartScenario?.(sc); } }}
                aria-label={`${sc.name}, ${sc.difficulty}, Runway ${sc.runway}`}
              >
                <div className="card-header">
                  <span className={`tag-badge ${sc.color}`}>{sc.tag}</span>
                  <span className="icao-badge">{sc.icao}</span>
                </div>

                <h3 className="scenario-name">{sc.name}</h3>

                <div className="scenario-specs">
                  <span className="spec-item">RWY {sc.runway}</span>
                  <span className="spec-divider">•</span>
                  <span className="spec-item">{sc.difficulty}</span>
                </div>

                <div className="card-footer">
                  <div className="progress-track">
                    <div className={`progress-bar ${sc.color}`} style={{ width: `${sc.progress}%` }} />
                  </div>
                  <span className="progress-num">{sc.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Flights Log */}
        <section className="deck-panel history-deck" role="region" aria-label="Recent Sorties Log">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Recent Sorties</h2>
              <p className="panel-subtitle">Audit transcript & phraseology performance</p>
            </div>
          </div>

          <div className="session-history-list">
            {recentSessions.length === 0 && (
              <div className="empty-history-state">
                <p>No sorties logged in flight recorder.</p>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => onStartScenario?.(MOCK_SCENARIOS[0])}
                >
                  Start First Flight
                </button>
              </div>
            )}

            {recentSessions.map((s) => {
              const color = scoreColor(s.score);
              return (
                <div key={s.id} className="history-row-card">
                  <div className="history-main">
                    <h4 className="history-name">{s.scenario}</h4>
                    <div className="history-meta">
                      <span>{s.date}</span>
                      <span className="meta-sep">•</span>
                      <span>{s.duration}</span>
                    </div>
                  </div>

                  <div className="history-score-wrap">
                    <span className="score-val" style={{ color }}>{s.score}%</span>
                    <span className={`chip ${s.score >= 85 ? 'chip-green' : s.score >= 65 ? 'chip-amber' : 'chip-red'}`}>
                      {scoreLabel(s.score)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
