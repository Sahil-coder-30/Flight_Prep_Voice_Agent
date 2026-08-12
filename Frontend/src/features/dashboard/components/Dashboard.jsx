import React, { useEffect, useState } from 'react';
import { useDashboard } from '../Hooks/dashboard.hooks';
import MetallicOrb from '../../simulator/components/MetallicOrb/MetallicOrb';
import MetallicOrbControls from './MetallicOrbControls';
import './Dashboard.scss';

const FREE_TALK_SCENARIO = {
  id: 'free_talk',
  _id: 'free_talk',
  name: 'Direct Controller Voice Talk',
  title: 'Direct Controller Voice Talk',
  icao: 'VFR',
  runway: 'ANY',
  difficulty: 'All Levels',
  progress: 100,
  color: 'cyan',
  tag: 'TALK',
  aircraftCallsign: 'N172SP',
  airport: 'KBOS',
  steps: [
    {
      stepId: 'free_01',
      templateId: 'tmpl_free_talk',
      phase: 'ground',
      procedureType: 'general_talk',
      controllerLine: 'Boston Tower, N172SP, radio check and general inquiry.',
      slots: [],
      maxRetries: 3,
    },
  ],
};

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
  const { stats, scenarios = [], loading, loadDashboard } = useDashboard();
  const [selectedId, setSelectedId] = useState(null);

  // Metallic Orb State
  const [orbMode, setOrbMode] = useState('IDLE_CORE');
  const [colorScheme, setColorScheme] = useState('chrome');
  const [isSimulatingVoice, setIsSimulatingVoice] = useState(false);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const talkingState = {
    isTalking: isSimulatingVoice,
    intensity: isSimulatingVoice ? 0.85 : 0,
  };

  const statCards = [
    { type: 'sessions', label: 'Sessions Logged', value: stats.sessionsCompleted || 0, unit: '', iconClass: 'cyan', trend: 'Total Sorties' },
    { type: 'score', label: 'Phraseology Score', value: stats.phraseologyScore || 100, unit: '%', iconClass: 'green', trend: 'Average Grade' },
    { type: 'hours', label: 'Flight Practice', value: stats.hoursLogged || 0, unit: 'h', iconClass: 'amber', trend: 'Practice Time' },
    { type: 'streak', label: 'Daily Streak', value: stats.streak || 0, unit: 'd', iconClass: 'cyan', trend: 'Consecutive Days' },
  ];

  const activeScenariosList = scenarios.length > 0 ? scenarios : [
    { id: '1', name: 'KBOS Ground Start & Taxi Clearance', title: 'KBOS Ground Start & Taxi Clearance', airport: 'KBOS', icao: 'KBOS', runway: '22L', difficulty: 'beginner', color: 'cyan', tag: 'GND' },
    { id: '2', name: 'KJFK VFR Tower Departure', title: 'KJFK VFR Tower Departure', airport: 'KJFK', icao: 'KJFK', runway: '31L', difficulty: 'beginner', color: 'green', tag: 'DEP' },
    { id: '3', name: 'KLAX ILS Approach & Landing', title: 'KLAX ILS Approach & Landing', airport: 'KLAX', icao: 'KLAX', runway: '25L', difficulty: 'intermediate', color: 'amber', tag: 'APP' },
    { id: '4', name: 'KORD Enroute Center Handoff', title: 'KORD Enroute Center Handoff', airport: 'KORD', icao: 'KORD', runway: '10C', difficulty: 'intermediate', color: 'cyan', tag: 'ENR' },
    { id: '5', name: 'KSFO Emergency Squawk 7700', title: 'KSFO Emergency Squawk 7700', airport: 'KSFO', icao: 'KSFO', runway: '28R', difficulty: 'advanced', color: 'red', tag: 'EMG' },
  ];

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
            Practice real-world ICAO air traffic control radio exchanges. Master departure clearances, ground navigation, and emergency procedures with instant RAG grounding.
          </p>

          <div className="hero-actions">
            <button
              id="btn-launch-direct-talk"
              className="btn btn-cyan btn-lg"
              onClick={() => onStartScenario?.(FREE_TALK_SCENARIO)}
            >
              🎙️ Direct Controller Voice Talk <ChevronRight />
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
            </div>
            <h3 className="resume-scenario-title">{activeSession.scenarioName || 'Active ATC Flight Session'}</h3>
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

      {/* ── SCENARIOS LISTING GRID ── */}
      <div className="dashboard-deck-grid">
        <section className="deck-panel scenario-deck" role="region" aria-label="Training Scenarios">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Training Sortie Templates</h2>
              <p className="panel-subtitle">Select an ATC simulation template grounded in ICAO protocol</p>
            </div>
            <span className="chip chip-green">
              <span className="live-dot green" aria-hidden="true" />
              {activeScenariosList.length} Templates Ready
            </span>
          </div>

          <div className="scenario-card-grid">
            {/* Direct Talk Card */}
            <div
              className="scenario-deck-card active"
              onClick={() => onStartScenario?.(FREE_TALK_SCENARIO)}
              style={{ borderLeft: '4px solid var(--nav-cyan)' }}
            >
              <div className="card-header">
                <span className="tag-badge cyan">DIRECT VOICE</span>
                <span className="icao-badge">FREE TALK</span>
              </div>
              <h3 className="scenario-name">🎙️ Direct Voice Controller Chat</h3>
              <p className="scenario-specs">Ask general aviation questions or engage in free-form ATC dialogue.</p>
              <div className="card-footer" style={{ marginTop: 12 }}>
                <span className="launch-text" style={{ color: 'var(--nav-cyan)' }}>Start Free Voice Talk <ChevronRight /></span>
              </div>
            </div>

            {/* Template Cards */}
            {activeScenariosList.map((sc) => {
              const id = sc._id || sc.id;
              const title = sc.title || sc.name;
              const code = sc.airport || sc.icao || 'KBOS';
              const difficulty = sc.difficulty || 'beginner';
              return (
                <div
                  key={id}
                  id={`btn-scenario-${id}`}
                  className={`scenario-deck-card ${selectedId === id ? 'active' : ''}`}
                  onClick={() => { setSelectedId(id); onStartScenario?.(sc); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedId(id); onStartScenario?.(sc); } }}
                >
                  <div className="card-header">
                    <span className="tag-badge green">{sc.tag || 'ATC'}</span>
                    <span className="icao-badge">{code}</span>
                  </div>

                  <h3 className="scenario-name">{title}</h3>

                  <div className="scenario-specs">
                    <span className="spec-item">RWY {sc.runway || '22L'}</span>
                    <span className="spec-divider">•</span>
                    <span className="spec-item">{difficulty}</span>
                  </div>

                  <div className="card-footer">
                    <span className="launch-text">Launch Sortie <ChevronRight /></span>
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
