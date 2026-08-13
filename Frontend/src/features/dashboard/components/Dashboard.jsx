import React, { useEffect, useState, useMemo } from 'react';
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
  airport: 'KBOS',
  runway: 'ANY',
  difficulty: 'All Levels',
  progress: 100,
  color: 'cyan',
  tag: 'TALK',
  aircraftCallsign: 'N172SP',
  description: 'Unscripted, free-form aviation radio dialogue with AI Controllers. Ask general aviation questions or practice custom clearances.',
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

const DEFAULT_TEMPLATES = [
  {
    id: '1',
    _id: '1',
    name: 'KBOS Ground Start & Taxi Clearance',
    title: 'KBOS Ground Start & Taxi Clearance',
    airport: 'Boston Logan Intl (KBOS)',
    icao: 'KBOS',
    runway: '22L',
    difficulty: 'Beginner',
    tag: 'GND',
    color: 'cyan',
    aircraftCallsign: 'N172SP',
    description: 'Master engine start, pushback request, taxi routing via Taxiway Alpha, and holding short instructions with Boston Ground.',
    steps: [1, 2, 3],
  },
  {
    id: '2',
    _id: '2',
    name: 'KJFK VFR Tower Departure',
    title: 'KJFK VFR Tower Departure',
    airport: 'John F. Kennedy Intl (KJFK)',
    icao: 'KJFK',
    runway: '31L',
    difficulty: 'Beginner',
    tag: 'DEP',
    color: 'green',
    aircraftCallsign: 'N5CD',
    description: 'Request VFR departure clearance, read back line up & wait directives, and execute clean takeoff roll clearances.',
    steps: [1, 2],
  },
  {
    id: '3',
    _id: '3',
    name: 'KLAX ILS Approach & Landing',
    title: 'KLAX ILS Approach & Landing',
    airport: 'Los Angeles Intl (KLAX)',
    icao: 'KLAX',
    runway: '25L',
    difficulty: 'Intermediate',
    tag: 'APP',
    color: 'amber',
    aircraftCallsign: 'N9028',
    description: 'Interlock with SoCal Approach for radar vectors onto ILS 25L localizer, glide slope intercept, and landing clearance.',
    steps: [1, 2, 3],
  },
  {
    id: '4',
    _id: '4',
    name: 'KORD Enroute Center Handoff',
    title: 'KORD Enroute Center Handoff',
    airport: "Chicago O'Hare Intl (KORD)",
    icao: 'KORD',
    runway: '10C',
    difficulty: 'Intermediate',
    tag: 'ENR',
    color: 'cyan',
    aircraftCallsign: 'AAL104',
    description: 'Execute high-altitude radar handoffs, altimeter setting confirmations, and speed restriction compliance with Chicago Center.',
    steps: [1, 2],
  },
  {
    id: '5',
    _id: '5',
    name: 'KSFO Emergency Squawk 7700',
    title: 'KSFO Emergency Squawk 7700',
    airport: 'San Francisco Intl (KSFO)',
    icao: 'KSFO',
    runway: '28R',
    difficulty: 'Advanced',
    tag: 'EMG',
    color: 'red',
    aircraftCallsign: 'N770EM',
    description: 'Declare MAYDAY emergency due to engine failure, request priority vectoring, and coordinate emergency equipment response.',
    steps: [1, 2],
  },
];

function StatIcon({ type }) {
  switch (type) {
    case 'sessions': return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    );
    case 'score': return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    );
    case 'hours': return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    );
    case 'streak': return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    );
    default: return null;
  }
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
    </svg>
  );
}

export default function Dashboard({ onStartScenario, onResumeSession, activeSession }) {
  const { stats = {}, scenarios = [], recentSessions = [], loading, loadDashboard } = useDashboard();
  const [selectedId, setSelectedId] = useState(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [activeDifficulty, setActiveDifficulty] = useState('ALL');

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
    { type: 'sessions', label: 'Sessions Logged', value: stats.sessionsCompleted || 0, unit: '', iconClass: 'cyan', trend: 'Total Flight Sorties' },
    { type: 'score', label: 'Phraseology Score', value: stats.phraseologyScore || 100, unit: '%', iconClass: 'green', trend: 'Average Accuracy' },
    { type: 'hours', label: 'Flight Practice', value: stats.hoursLogged || 0, unit: 'h', iconClass: 'amber', trend: 'Cockpit Practice Time' },
    { type: 'streak', label: 'Daily Streak', value: stats.streak || 0, unit: 'd', iconClass: 'cyan', trend: 'Consecutive Days' },
  ];

  const rawScenarios = scenarios.length > 0 ? scenarios : DEFAULT_TEMPLATES;

  const filteredTemplates = useMemo(() => {
    return rawScenarios.filter((sc) => {
      const title = (sc.title || sc.name || '').toLowerCase();
      const airport = (sc.airport || sc.icao || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch = !query || title.includes(query) || airport.includes(query);

      const scTag = (sc.tag || '').toUpperCase();
      const matchesCategory = activeCategory === 'ALL' || scTag === activeCategory;

      const scDiff = (sc.difficulty || 'beginner').toLowerCase();
      const matchesDifficulty = activeDifficulty === 'ALL' || scDiff === activeDifficulty.toLowerCase();

      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [rawScenarios, searchQuery, activeCategory, activeDifficulty]);

  return (
    <main className="dashboard-space" aria-label="Flight Deck Dashboard">

      {/* ── HERO BANNER WITH METALLIC ORB (GLASSMORPHISM) ── */}
      <header className="dashboard-hero-glass">
        <div className="hero-glass-ambient-glow" aria-hidden="true" />
        
        <div className="hero-content">
          <div className="hero-badge">
            <span className="live-dot green" aria-hidden="true" />
            <span className="badge-text">AIRSPACE SIMULATION CONTROL · FREQ 118.300</span>
          </div>

          <h1 className="hero-headline">
            Command the Sky with <em>Precision Phraseology</em>
          </h1>

          <p className="hero-description">
            Practice real-world ICAO air traffic control radio exchanges. Master departure clearances, ground navigation, and emergency procedures with instant RAG feedback.
          </p>

          <div className="hero-actions">
            <button
              id="btn-launch-direct-talk"
              className="btn btn-cyan btn-lg hero-direct-talk-btn"
              onClick={() => onStartScenario?.(FREE_TALK_SCENARIO)}
            >
              <MicIcon /> Direct Controller Voice Talk <ChevronRight />
            </button>

            <button
              className="btn btn-ghost btn-lg hero-orb-morph-btn"
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
      </header>

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
              <span className="resume-time">ACTIVE ATC SESSION</span>
            </div>
            <h3 className="resume-scenario-title">{activeSession.scenarioName || 'Active ATC Flight Session'}</h3>
          </div>
          <button
            id="btn-resume-session"
            className="btn btn-cyan btn-lg resume-action-btn"
            onClick={() => onResumeSession?.(activeSession)}
          >
            Resume Flight Deck <ChevronRight />
          </button>
        </section>
      )}

      {/* ── TELEMETRY STATS GRID ── */}
      <section className="telemetry-grid" role="region" aria-label="Flight Metrics">
        {statCards.map((s) => (
          <article key={s.type} className="telemetry-card" aria-label={`${s.label}: ${s.value}${s.unit}`}>
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
          </article>
        ))}
      </section>

      {/* ── FEATURED QUICK START: DIRECT VOICE CONTROLLER TALK ── */}
      <article className="featured-direct-talk-banner">
        <div className="banner-bg-glow" />
        <div className="banner-left">
          <div className="banner-badge-row">
            <span className="tag-chip tag-cyan">DIRECT VOICE</span>
            <span className="icao-chip">ICAO VFR</span>
            <span className="live-wave-indicator">
              <span className="wave-bar" />
              <span className="wave-bar" />
              <span className="wave-bar" />
              <span className="wave-text">UNSCRIPTED ATC</span>
            </span>
          </div>
          <h2 className="banner-title">🎙️ Free-Form Controller Voice Talk</h2>
          <p className="banner-desc">
            Engage in unscripted aviation radio dialogue. Practice radio checks, general airport inquiries, custom clearances, or emergency declarations directly with the AI Controller.
          </p>
        </div>
        <div className="banner-right">
          <button
            id="btn-launch-direct-talk-banner"
            className="btn btn-cyan btn-lg banner-launch-btn"
            onClick={() => onStartScenario?.(FREE_TALK_SCENARIO)}
          >
            Start Voice Dialogue <ChevronRight />
          </button>
        </div>
      </article>

      {/* ── TRAINING TEMPLATES SECTION ── */}
      <section className="templates-section" role="region" aria-label="Training Scenarios">
        {/* Section Header & Toolbar */}
        <div className="templates-header">
          <div className="header-title-wrap">
            <h2 className="section-title">ICAO Training Sortie Templates</h2>
            <p className="section-subtitle">Select an ATC simulation template grounded in standard ICAO procedure</p>
          </div>

          <div className="templates-toolbar">
            {/* Search Input */}
            <div className="template-search-box">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search templates, airports (KBOS, KJFK)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search training templates"
              />
              {searchQuery && (
                <button className="clear-search-btn" onClick={() => setSearchQuery('')}>✕</button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="filter-pill-group" role="tablist" aria-label="Filter by ATC phase">
              {[
                { id: 'ALL', label: 'All Phases' },
                { id: 'GND', label: 'Ground' },
                { id: 'DEP', label: 'Departure' },
                { id: 'APP', label: 'Approach' },
                { id: 'ENR', label: 'Enroute' },
                { id: 'EMG', label: 'Emergency' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  role="tab"
                  aria-selected={activeCategory === cat.id}
                  className={`filter-pill ${activeCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Difficulty Filter */}
            <div className="filter-pill-group difficulty-pills" role="tablist" aria-label="Filter by difficulty">
              {['ALL', 'Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                <button
                  key={lvl}
                  role="tab"
                  aria-selected={activeDifficulty === lvl}
                  className={`filter-pill diff-pill ${activeDifficulty === lvl ? 'active' : ''}`}
                  onClick={() => setActiveDifficulty(lvl)}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Templates Card Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="templates-empty-state">
            <p>No training templates match your search filters.</p>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setSearchQuery(''); setActiveCategory('ALL'); setActiveDifficulty('ALL'); }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="templates-grid">
            {filteredTemplates.map((sc) => {
              const id = sc._id || sc.id;
              const title = sc.title || sc.name;
              const icao = sc.icao || (sc.airport ? sc.airport.split(' ')[0] : 'KBOS');
              const airportName = sc.airport || `${icao} Airport`;
              const difficulty = sc.difficulty || 'Beginner';
              const diffClass = difficulty.toLowerCase();
              const tag = (sc.tag || 'ATC').toUpperCase();

              let tagColor = sc.color || 'cyan';
              if (tag === 'GND') tagColor = 'cyan';
              else if (tag === 'DEP') tagColor = 'green';
              else if (tag === 'APP') tagColor = 'amber';
              else if (tag === 'ENR') tagColor = 'indigo';
              else if (tag === 'EMG') tagColor = 'red';

              return (
                <article
                  key={id}
                  id={`btn-scenario-${id}`}
                  className={`template-card ${selectedId === id ? 'active' : ''}`}
                  onClick={() => { setSelectedId(id); onStartScenario?.(sc); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedId(id); onStartScenario?.(sc); } }}
                >
                  {/* Card Header Badges */}
                  <div className="template-card-header">
                    <div className="badges-left">
                      <span className={`tag-chip tag-${tagColor}`}>{tag}</span>
                      <span className="icao-chip">{icao}</span>
                    </div>
                    <span className={`diff-chip diff-${diffClass}`}>{difficulty}</span>
                  </div>

                  {/* Card Title & Airport */}
                  <h3 className="template-title">{title}</h3>
                  <div className="template-location">
                    <span className="airport-name">{airportName}</span>
                    <span className="runway-badge">RWY {sc.runway || '22L'}</span>
                  </div>

                  {/* Description Snippet */}
                  <p className="template-description">
                    {sc.description || 'Master standard ICAO radio check and ATC clearances with instant phraseology feedback.'}
                  </p>

                  {/* Card Meta & Footer */}
                  <div className="template-card-footer">
                    <div className="card-specs">
                      <span className="spec-tag">Callsign: {sc.aircraftCallsign || 'N172SP'}</span>
                      <span className="spec-dot">•</span>
                      <span className="spec-tag">{sc.steps?.length || 3} Procedure Steps</span>
                    </div>

                    <div className="template-launch-action">
                      <span className="launch-text">Launch Sortie <ChevronRight /></span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ── RECENT SORTIES & FLIGHT ACTIVITY PANEL ── */}
      <section className="recent-activity-section" role="region" aria-label="Recent Flight Activity">
        <div className="activity-header">
          <div>
            <h2 className="section-title">Recent Sortie Telemetry</h2>
            <p className="section-subtitle">History of completed phraseology evaluation sessions</p>
          </div>
        </div>

        {recentSessions.length === 0 ? (
          <div className="activity-empty-card">
            <div className="empty-icon">✈</div>
            <h4>No Flight Telemetry Recorded Yet</h4>
            <p>Select any training template above to initiate your first ICAO simulation session.</p>
          </div>
        ) : (
          <div className="activity-list">
            {recentSessions.map((session, idx) => {
              const score = session.score ?? session.phraseologyScore ?? 100;
              let scoreColor = 'green';
              if (score < 70) scoreColor = 'red';
              else if (score < 85) scoreColor = 'amber';

              return (
                <div key={session._id || session.id || idx} className="activity-row">
                  <div className="row-left">
                    <div className="flight-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13.5 8.5 5.3 6.7c-.5-.1-.9.1-1.2.5l-.9.9c-.3.3-.3.8 0 1.1l5.1 4-3.1 3.1-2.4-.6c-.3-.1-.6 0-.8.2l-.6.6c-.2.2-.2.6 0 .8l3.2 3.2 3.2 3.2c.2.2.6.2.8 0l.6-.6c.2-.2.3-.5.2-.8l-.6-2.4 3.1-3.1 4 5.1c.3.3.8.3 1.1 0l.9-.9c.4-.3.6-.7.5-1.2z"/>
                      </svg>
                    </div>
                    <div className="flight-meta">
                      <h4 className="flight-title">{session.scenarioName || 'ATC Practice Session'}</h4>
                      <span className="flight-time">
                        {session.createdAt ? new Date(session.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Completed'}
                      </span>
                    </div>
                  </div>

                  <div className="row-right">
                    <span className={`score-badge score-${scoreColor}`}>
                      {score}% Grade
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </main>
  );
}
