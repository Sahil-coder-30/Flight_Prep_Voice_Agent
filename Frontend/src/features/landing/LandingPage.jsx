import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import MetallicOrb from '../simulator/components/MetallicOrb/MetallicOrb';
import ATCLogo from '../../components/Logo/ATCLogo';
import './LandingPage.scss';

const LANDING_TEMPLATES = [
  { id: 'gbos', title: 'KBOS Ground Start & Taxi', code: 'KBOS', rwy: '22L', diff: 'Beginner', icon: '🛫', desc: 'Engine startup, ATIS validation, and taxi instructions to runway 22L.' },
  { id: 'jfk',  title: 'KJFK VFR Tower Departure', code: 'KJFK', rwy: '31L', diff: 'Beginner', icon: '🛫', desc: 'Clearance delivery, squawk validation, takeoff approval, and frequency handoff.' },
  { id: 'lax',  title: 'KLAX ILS Approach & Landing', code: 'KLAX', rwy: '25L', diff: 'Intermediate', icon: '🛬', desc: 'Radar vectoring, altitude descent, ILS localizer intercept, and landing clearance.' },
  { id: 'ord',  title: 'KORD Enroute Center Handoff', code: 'KORD', rwy: '10C', diff: 'Intermediate', icon: '🌐', desc: 'Altitude reassignment, waypoint navigation, and Minneapolis Center handoff.' },
  { id: 'sfo',  title: 'KSFO Emergency Squawk 7700', code: 'KSFO', rwy: '28R', diff: 'Advanced', icon: '🚨', desc: 'Mayday emergency declaration, souls/fuel report, and priority vectoring.' },
];

const FEATURES_LIST = [
  {
    id: 'voice',
    icon: '🎙️',
    title: 'Push-to-Talk Voice Loop',
    subtitle: 'Half-Duplex Radio Emulation',
    desc: 'Simulates authentic aviation radio procedures with physical PTT keyboard shortcuts, Web Audio spectrum analysis, and Deepgram STT keyphrase biasing for callsigns and airport identifiers.',
    stat: '<500ms Voice Loop',
    codeSnippet: 'const ptt = usePTT({ key: "Space", bias: ["KBOS", "N172SP"] });',
    category: 'Acoustic Core',
  },
  {
    id: 'latency',
    icon: '⚡',
    title: 'Sub-Second Phraseology Engine',
    subtitle: 'Zero-LLM Phraseology Caching',
    desc: 'Multi-layer Redis caching strategy pre-renders 90% of controller templates instantaneously (~0ms) while preserving dynamic slot extraction for tail numbers and runways.',
    stat: '90% Cache Hit Rate',
    codeSnippet: 'await phraseologyCache.matchOrStream(slotMap);',
    category: 'Performance',
  },
  {
    id: 'langgraph',
    icon: '🧠',
    title: 'LangGraph State Machine',
    subtitle: 'Stateful Flight Turn Control',
    desc: 'Orchestrates complex multi-turn ICAO procedure graphs with interrupt boundaries, fuzzy slot readback validation (NATO phonetics), and real-time guidance nodes.',
    stat: 'Stateful Memory',
    codeSnippet: 'const workflow = new StateGraph({ channels: stateChannels });',
    category: 'AI Engine',
  },
  {
    id: 'rag',
    icon: '🔍',
    title: 'Qdrant Vector RAG Grounding',
    subtitle: 'Official ICAO & FAA Manual Indexing',
    desc: 'Retrieval-Augmented Generation indexes official ICAO Doc 4444 and FAA AIM manuals to verify phraseology compliance and provide precise rule citations.',
    stat: 'ICAO Doc 4444',
    codeSnippet: 'const docs = await qdrant.search({ collection: "icao_rules" });',
    category: 'Compliance',
  },
  {
    id: 'telemetry',
    icon: '📊',
    title: 'Student Flight Telemetry',
    subtitle: 'Automated Scoring & Analytics',
    desc: 'Monitors practice flight hours, daily streaks, score trends, and procedure proficiency to pinpoint weak clearance areas before checkrides.',
    stat: 'Real-Time Scoring',
    codeSnippet: 'const score = calculateReadbackAccuracy(target, transcript);',
    category: 'Analytics',
  },
  {
    id: 'security',
    icon: '🛡️',
    title: 'Zero-Trust Enterprise Security',
    subtitle: 'Asymmetric RS256 Validation',
    desc: 'Built on microservices with RS256 JWT key rotation, JWKS endpoint verification, and opaque rotating refresh token families for cadet privacy.',
    stat: 'RS256 JWT',
    codeSnippet: 'jwt.verify(token, jwksClient, { algorithms: ["RS256"] });',
    category: 'Security',
  },
];

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

export default function LandingPage({ onLoginClick, onDirectTalkClick }) {
  const [orbMode, setOrbMode] = useState('IDLE_CORE');
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');

  // GSAP animation refs
  const heroRef = useRef(null);
  const featureDetailRef = useRef(null);
  const featuresSectionRef = useRef(null);

  useEffect(() => {
    // GSAP Entrance timeline for Hero Section
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo('.landing-nav', 
        { y: -30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.7 }
      )
      .fromTo('.hero-pill', 
        { y: 20, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.5 }, '-=0.3'
      )
      .fromTo('.hero-title', 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.7 }, '-=0.3'
      )
      .fromTo('.hero-subtitle', 
        { y: 20, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.5 }, '-=0.4'
      )
      .fromTo('.hero-buttons', 
        { y: 20, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.5 }, '-=0.3'
      )
      .fromTo('.hero-stats-row', 
        { opacity: 0, y: 15 }, 
        { opacity: 1, y: 0, duration: 0.6 }, '-=0.2'
      )
      .fromTo('.hero-orb-frame', 
        { scale: 0.9, opacity: 0, y: 30 }, 
        { scale: 1, opacity: 1, y: 0, duration: 0.8 }, '-=0.7'
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // GSAP animation when active feature tab changes
  useEffect(() => {
    if (featureDetailRef.current) {
      gsap.fromTo(
        featureDetailRef.current,
        { opacity: 0, y: 15, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, [activeFeatureIndex]);

  const scrollToSection = (id) => (e) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const activeFeature = FEATURES_LIST[activeFeatureIndex];

  const filteredTemplates = selectedDifficulty === 'All'
    ? LANDING_TEMPLATES
    : LANDING_TEMPLATES.filter(t => t.diff === selectedDifficulty);

  return (
    <div className="landing-page" ref={heroRef} aria-label="ATC Voice Simulator Landing Page">
      {/* ── TOP NAVIGATION BAR ── */}
      <header className="landing-nav-wrapper">
        <nav className="landing-nav">
          <div className="nav-brand" style={{ cursor: 'pointer' }} onClick={onLoginClick}>
            <ATCLogo size="sm" variant="horizontal" />
          </div>

          <div className="nav-links">
            <a href="#features" onClick={scrollToSection('features')}>Capabilities</a>
            <a href="#templates" onClick={scrollToSection('templates')}>Sorties</a>
            <a href="#architecture" onClick={scrollToSection('architecture')}>Architecture</a>
          </div>

          <div className="nav-actions">
            <button id="btn-nav-login" className="btn btn-ghost" onClick={onLoginClick}>
              Sign In
            </button>
            <button id="btn-nav-launch" className="btn btn-primary-saas" onClick={onLoginClick}>
              Launch Flight Deck <ChevronRight />
            </button>
          </div>
        </nav>
      </header>

      {/* ── HERO SECTION WITH 3D METALLIC ORB ── */}
      <section className="landing-hero-container">
        <div className="landing-hero">
          <div className="hero-content">
            <div className="hero-pill">
              <span className="pill-dot live" aria-hidden="true" />
              <span>ICAO & FAA AIR TRAFFIC CONTROL VOICE SIMULATOR</span>
            </div>

            <h1 className="hero-title">
              Master Aviation Radio Phraseology with <em>Real-Time AI</em>
            </h1>

            <p className="hero-subtitle">
              Train against an interactive, voice-driven AI controller. Sub-second voice round-trips, RAG-grounded phraseology rules, and automated student progress scoring.
            </p>

            <div className="hero-buttons">
              <button id="btn-hero-login" className="btn btn-primary-saas btn-lg" onClick={onLoginClick}>
                Enter Flight Deck <ChevronRight />
              </button>

              <button id="btn-hero-talk" className="btn btn-ghost-saas btn-lg" onClick={onDirectTalkClick}>
                🎙️ Direct Controller Voice Talk
              </button>
            </div>

            <div className="hero-stats-row">
              <div className="hero-stat">
                <span className="stat-num">&lt;500ms</span>
                <span className="stat-label">Voice Loop Latency</span>
              </div>
              <div className="stat-sep" />
              <div className="hero-stat">
                <span className="stat-num">ICAO Doc 4444</span>
                <span className="stat-label">Vector RAG Grounded</span>
              </div>
              <div className="stat-sep" />
              <div className="hero-stat">
                <span className="stat-num">5 Sorties</span>
                <span className="stat-label">Pre-Built Scenarios</span>
              </div>
            </div>
          </div>

          {/* 3D Orb Display Frame */}
          <div className="hero-orb-frame">
            <div className="orb-frame-header">
              <div className="status-indicator">
                <span className="status-dot" />
                <span className="orb-status">3D SYNTHESIS CORE</span>
              </div>
              <span className="orb-badge">{orbMode.replace('_', ' ')}</span>
            </div>

            <div className="orb-canvas">
              <MetallicOrb
                mode={orbMode}
                talkingState={{ isTalking: false, intensity: 0 }}
                colorScheme="chrome"
              />
            </div>

            <div className="orb-mode-bar">
              {['IDLE_CORE', 'SWARM_OUT', 'RADAR_SWEEP', 'LATTICE_MATRIX'].map((m) => (
                <button
                  key={m}
                  className={`mode-btn ${orbMode === m ? 'active' : ''}`}
                  onClick={() => setOrbMode(m)}
                >
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE LUXURY FEATURE SHOWCASE (GSAP-POWERED) ── */}
      <section id="features" ref={featuresSectionRef} className="landing-section features-section">
        <div className="section-header">
          <span className="section-badge">SYSTEM CAPABILITIES</span>
          <h2>Enterprise AI Flight Deck Architecture</h2>
          <p>Engineered with zero-trust Kubernetes microservices, LangGraph state machines, and ultra-low-latency phraseology engines.</p>
        </div>

        <div className="interactive-feature-deck">
          {/* Left Column: Interactive Feature Nav List */}
          <div className="feature-nav-list" role="tablist" aria-label="Feature Capabilities">
            {FEATURES_LIST.map((feat, idx) => (
              <button
                key={feat.id}
                role="tab"
                aria-selected={activeFeatureIndex === idx}
                className={`feature-nav-item ${activeFeatureIndex === idx ? 'active' : ''}`}
                onClick={() => setActiveFeatureIndex(idx)}
              >
                <div className="item-icon-box">{feat.icon}</div>
                <div className="item-text-box">
                  <div className="item-title">{feat.title}</div>
                  <div className="item-subtitle">{feat.subtitle}</div>
                </div>
                <span className="item-arrow">→</span>
              </button>
            ))}
          </div>

          {/* Right Column: Dynamic Feature Detail Card (GSAP Animated) */}
          <div className="feature-detail-view" ref={featureDetailRef}>
            <div className="detail-card-inner">
              <div className="detail-header">
                <span className="category-pill">{activeFeature.category}</span>
                <span className="metric-badge">{activeFeature.stat}</span>
              </div>

              <h3 className="detail-title">
                {activeFeature.icon} {activeFeature.title}
              </h3>
              
              <p className="detail-desc">{activeFeature.desc}</p>

              <div className="code-preview-box">
                <div className="code-header">
                  <span className="code-dot red" />
                  <span className="code-dot yellow" />
                  <span className="code-dot green" />
                  <span className="code-label">engine_core.ts</span>
                </div>
                <pre className="code-body">
                  <code>{activeFeature.codeSnippet}</code>
                </pre>
              </div>

              <div className="detail-footer">
                <button className="btn btn-ghost-saas btn-sm" onClick={onLoginClick}>
                  Explore Technical Specs <ChevronRight />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRE-BUILT SORTIES SECTION ── */}
      <section id="templates" className="landing-section templates-section">
        <div className="section-header">
          <span className="section-badge">PRE-BUILT SORTIES</span>
          <h2>Aviation Procedure Templates</h2>
          <p>Practice procedures across Ground, Departure, Approach, Enroute, and Emergency flight phases.</p>
          
          {/* Difficulty Filter Tabs */}
          <div className="difficulty-filter-bar">
            {['All', 'Beginner', 'Intermediate', 'Advanced'].map((diff) => (
              <button
                key={diff}
                className={`filter-btn ${selectedDifficulty === diff ? 'active' : ''}`}
                onClick={() => setSelectedDifficulty(diff)}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        <div className="templates-grid">
          {filteredTemplates.map((tmpl) => (
            <div key={tmpl.id} className="template-card" onClick={onLoginClick}>
              <div className="card-top">
                <span className="card-icon">{tmpl.icon}</span>
                <span className="card-code">{tmpl.code}</span>
                <span className={`chip ${tmpl.diff === 'Beginner' ? 'chip-green' : tmpl.diff === 'Intermediate' ? 'chip-cyan' : 'chip-amber'}`}>
                  {tmpl.diff}
                </span>
              </div>
              <h3 className="card-title">{tmpl.title}</h3>
              <p className="card-desc">{tmpl.desc}</p>
              <div className="card-footer">
                <span className="rwy-badge">RWY {tmpl.rwy}</span>
                <span className="launch-text">Launch Sortie <ChevronRight /></span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ARCHITECTURE SPECIFICATIONS BAR ── */}
      <section id="architecture" className="landing-section architecture-section">
        <div className="architecture-banner">
          <div className="arch-header">
            <h3>Engineered for Precision & Compliance</h3>
            <p>Ground-up architecture supporting ICAO Doc 4444, FAA AIM phraseology, and low-latency voice telemetry.</p>
          </div>
          <div className="arch-grid">
            <div className="arch-item">
              <span className="arch-val">Deepgram Nova-2</span>
              <span className="arch-lbl">STT Keyphrase Biasing</span>
            </div>
            <div className="arch-item">
              <span className="arch-val">Qdrant Hybrid</span>
              <span className="arch-lbl">Dense Vector Search</span>
            </div>
            <div className="arch-item">
              <span className="arch-val">LangGraph</span>
              <span className="arch-lbl">State Machine Router</span>
            </div>
            <div className="arch-item">
              <span className="arch-val">Redis Stack</span>
              <span className="arch-lbl">7-Layer Cache Strategy</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER CALL TO ACTION ── */}
      <footer className="landing-footer">
        <div className="footer-box">
          <h2>Ready to Master Radio Phraseology?</h2>
          <p>Sign in with your cadet credentials to log practice flight hours and receive automated procedure evaluations.</p>
          <button id="btn-footer-launch" className="btn btn-primary-saas btn-lg" onClick={onLoginClick}>
            Sign In to Flight Deck <ChevronRight />
          </button>
        </div>
        <div className="footer-bottom">
          <div className="footer-brand">
            <ATCLogo size="sm" variant="mark-only" />
            <span>© 2026 ATC Voice Simulator · ICAO & FAA Compliant AI Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
