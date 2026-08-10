import React, { useState } from 'react';
import { ArrowUpRight, BookOpen, CheckCircle2, Clock3, Headphones, Mic, Play, Radio, RotateCcw, Target, Volume2, Zap } from 'lucide-react';
import Layout from './components/Layout';

const scenarios = [
  { id: 'departure', label: 'IFR Departure', title: 'IFR departure clearance', detail: 'Clearance delivery', difficulty: 'Intermediate', duration: '08 min', color: 'coral', progress: 72 },
  { id: 'ground', label: 'Ground Movement', title: 'Taxi and ground movement', detail: 'Ground control', difficulty: 'Beginner', duration: '06 min', color: 'teal', progress: 38 },
  { id: 'approach', label: 'ILS Approach', title: 'ILS approach sequence', detail: 'Approach control', difficulty: 'Advanced', duration: '12 min', color: 'gold', progress: 0 },
];

const initialTranscript = [
  { speaker: 'ATC', text: 'N742QS, cleared to the Kennedy airport via the HAPIE departure.', time: '09:41:02' },
  { speaker: 'YOU', text: 'Cleared Kennedy via HAPIE departure, N742QS.', time: '09:41:18' },
];

function FeaturePage({ activeNav, activeScenario, isRecording, onRecord, onScenarioSelect }) {
  if (activeNav === 'Simulator') {
    return <section className="feature-page">
      <div className="feature-heading"><div><p className="eyebrow"><span className="status-dot" /> Live training room</p><h2>Voice <em>simulator</em></h2><p className="hero-copy">Practice a complete radio exchange with real-time feedback.</p></div><span className="live-label"><span className="pulse" /> Microphone ready</span></div>
      <div className="feature-columns"><div className="panel simulator-focus"><p className="section-kicker">Active scenario</p><h3>{activeScenario.title}</h3><p className="muted-copy">{activeScenario.detail} <i /> {activeScenario.difficulty}</p><div className="large-waveform waveform" aria-hidden="true">{Array.from({ length: 55 }, (_, index) => <i key={index} style={{ height: `${18 + ((index * 19) % 65)}%` }} />)}</div><button className={`record-button ${isRecording ? 'recording' : ''}`} onClick={onRecord}><span className="record-symbol">{isRecording ? <span className="stop-square" /> : <Mic size={22} />}</span>{isRecording ? 'Stop recording' : 'Start transmission'}</button><p className="record-hint">{isRecording ? 'Listening for your transmission...' : 'Your microphone is ready'}</p></div><div className="panel"><div className="panel-heading"><div><p className="section-kicker">Session log</p><h3>Live transcript</h3></div><Volume2 size={18} color="var(--brand-primary)" /></div><div className="transcript-list">{initialTranscript.map((message) => <div className="transcript-line" key={message.time}><span className="speaker">{message.speaker}</span><div><p>{message.text}</p><small>{message.time}</small></div></div>)}</div><div className="transcript-status"><CheckCircle2 size={15} /> Feedback will appear here after your response</div></div></div>
    </section>;
  }

  if (activeNav === 'Scenarios') {
    return <section className="feature-page"><div className="feature-heading"><div><p className="eyebrow"><span className="status-dot" /> Scenario library</p><h2>Choose your <em>next challenge.</em></h2><p className="hero-copy">Build confidence one radio exchange at a time.</p></div></div><div className="feature-scenario-grid">{scenarios.map((scenario) => <button className={`feature-scenario ${activeScenario.id === scenario.id ? 'selected' : ''}`} key={scenario.id} onClick={() => onScenarioSelect(scenario)}><span className={`scenario-mark ${scenario.color}`}><Radio size={19} /></span><p className="section-kicker">{scenario.label}</p><h3>{scenario.title}</h3><p className="muted-copy">{scenario.detail} <i /> {scenario.difficulty}</p><div className="scenario-progress"><span><b style={{ width: `${scenario.progress}%` }} /></span><small>{scenario.progress ? `${scenario.progress}% complete` : 'Not started'}</small></div><span className="text-button">Practice scenario <ArrowUpRight size={15} /></span></button>)}</div></section>;
  }

  if (activeNav === 'Progress') {
    return <section className="feature-page"><div className="feature-heading"><div><p className="eyebrow"><span className="status-dot" /> Training analytics</p><h2>Your flight <em>progress.</em></h2><p className="hero-copy">A clear view of the habits making you a stronger communicator.</p></div></div><div className="progress-layout"><div className="panel progress-score"><p className="section-kicker">Overall score</p><strong>86<small>%</small></strong><div className="score-ring"><span>+8%</span><small>this month</small></div></div><div className="panel"><p className="section-kicker">Skill breakdown</p><div className="skill-row"><span>Readback accuracy</span><b><i style={{ width: '91%' }} /></b><strong>91%</strong></div><div className="skill-row"><span>Radio confidence</span><b><i style={{ width: '84%' }} /></b><strong>84%</strong></div><div className="skill-row"><span>Phraseology</span><b><i style={{ width: '79%' }} /></b><strong>79%</strong></div><div className="skill-row"><span>Listening response</span><b><i style={{ width: '88%' }} /></b><strong>88%</strong></div></div></div></section>;
  }

  return <section className="feature-page"><div className="feature-heading"><div><p className="eyebrow"><span className="status-dot" /> Preferences</p><h2>Workspace <em>settings.</em></h2><p className="hero-copy">Tune your simulator for the way you learn.</p></div></div><div className="panel settings-list"><label><span><strong>Audio feedback</strong><small>Play ATC responses after each transmission</small></span><input type="checkbox" defaultChecked /></label><label><span><strong>Show transcript timestamps</strong><small>Keep precise timing visible in session logs</small></span><input type="checkbox" defaultChecked /></label><label><span><strong>Practice reminders</strong><small>Receive a gentle reminder after three days away</small></span><input type="checkbox" /></label></div></section>;
}

export default function App() {
  const [activeScenario, setActiveScenario] = useState(scenarios[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [activeNav, setActiveNav] = useState('Overview');
  const [transcript, setTranscript] = useState(initialTranscript);

  const startSession = () => {
    setActiveNav('Simulator');
    setIsRecording(true);
  };

  const toggleRecording = () => {
    setIsRecording((recording) => !recording);
    if (isRecording) {
      setTranscript((messages) => [...messages, { speaker: 'YOU', text: 'Ready for the next instruction.', time: '09:41:32' }]);
    }
  };

  if (activeNav !== 'Overview') {
    return <Layout activeNav={activeNav} onNavigate={setActiveNav}><FeaturePage activeNav={activeNav} activeScenario={activeScenario} isRecording={isRecording} onRecord={toggleRecording} onScenarioSelect={setActiveScenario} /></Layout>;
  }

  return (
    <Layout activeNav={activeNav} onNavigate={setActiveNav}>
      <section className="hero-row">
        <div><p className="eyebrow"><span className="status-dot" /> Training control / Monday, 12 August</p><h2>Good morning, <em>captain.</em></h2><p className="hero-copy">Sharpen your radio phraseology. Your next clearance is waiting.</p></div>
        <button className="button button-primary" onClick={startSession}><Play size={16} fill="currentColor" /> Start a session</button>
      </section>

      <section className="stat-grid" aria-label="Training statistics">
        <article className="stat-card stat-card-accent"><div className="stat-icon"><Zap size={18} /></div><p>Current streak</p><strong>04 <small>days</small></strong><span className="stat-foot positive">+1 from last week</span></article>
        <article className="stat-card"><div className="stat-icon muted"><Target size={18} /></div><p>Average score</p><strong>86<small>%</small></strong><span className="stat-foot positive">+8% this month</span></article>
        <article className="stat-card"><div className="stat-icon muted"><Clock3 size={18} /></div><p>Practice time</p><strong>2h 48<small>m</small></strong><span className="stat-foot">12 sessions completed</span></article>
      </section>

      <div className="content-grid">
        <section className="panel scenarios-panel"><div className="panel-heading"><div><p className="section-kicker">Practice library</p><h3>Choose a scenario</h3></div><button className="icon-button" aria-label="View all scenarios" title="View all scenarios" onClick={() => setActiveNav('Scenarios')}><ArrowUpRight size={18} /></button></div><div className="scenario-list">{scenarios.map((scenario) => <button key={scenario.id} className={`scenario-item ${activeScenario.id === scenario.id ? 'selected' : ''}`} onClick={() => setActiveScenario(scenario)}><span className={`scenario-mark ${scenario.color}`}><Radio size={17} /></span><span className="scenario-info"><strong>{scenario.title}</strong><small>{scenario.detail} <i /> {scenario.difficulty}</small></span><span className="scenario-progress"><span><b style={{ width: `${scenario.progress}%` }} /></span><small>{scenario.progress ? `${scenario.progress}%` : 'New'}</small></span></button>)}</div><button className="text-button" onClick={() => setActiveNav('Scenarios')}>Browse full library <ArrowUpRight size={15} /></button></section>

        <section className="panel session-panel"><div className="panel-heading"><div><p className="section-kicker">Live practice</p><h3>Your workspace</h3></div><span className="live-label"><span className="pulse" /> Ready</span></div><div className="workspace-card"><div className="workspace-top"><span className={`scenario-mark ${activeScenario.color}`}><Headphones size={17} /></span><div><strong>{activeScenario.label}</strong><small>{activeScenario.title}</small></div><span className="difficulty-tag">{activeScenario.difficulty}</span></div><div className="waveform" aria-hidden="true">{Array.from({ length: 42 }, (_, index) => <i key={index} style={{ height: `${18 + ((index * 17) % 46)}%` }} />)}</div><div className="workspace-footer"><span><Clock3 size={14} /> {activeScenario.duration}</span><span><CheckCircle2 size={14} /> {activeScenario.progress ? 'In progress' : 'Not started'}</span></div></div><button className={`record-button ${isRecording ? 'recording' : ''}`} onClick={toggleRecording}><span className="record-symbol">{isRecording ? <span className="stop-square" /> : <Mic size={22} />}</span>{isRecording ? 'Stop recording' : 'Hold to speak'}</button><p className="record-hint">{isRecording ? 'Listening for your transmission...' : 'Use your microphone to respond to ATC'}</p></section>

        <section className="panel transcript-panel"><div className="panel-heading"><div><p className="section-kicker">Session log</p><h3>Live transcript</h3></div><button className="icon-button" aria-label="Reset transcript" title="Reset transcript" onClick={() => setTranscript(initialTranscript)}><RotateCcw size={16} /></button></div><div className="transcript-list">{transcript.map((message, index) => <div className={`transcript-line ${message.speaker === 'YOU' ? 'user-line' : ''}`} key={`${message.time}-${index}`}><span className="speaker">{message.speaker}</span><div><p>{message.text}</p><small>{message.time}</small></div></div>)}</div><div className="transcript-status"><Volume2 size={15} /> Audio feedback is enabled</div></section>
      </div>

      <section className="tip-banner"><span className="tip-icon"><BookOpen size={18} /></span><div><strong>Phraseology tip</strong><p>Keep your readback concise: repeat the runway, route, altitude, and squawk code in that order.</p></div><button className="icon-button" aria-label="Open phraseology guide" title="Open phraseology guide"><ArrowUpRight size={18} /></button></section>
    </Layout>
  );
}
