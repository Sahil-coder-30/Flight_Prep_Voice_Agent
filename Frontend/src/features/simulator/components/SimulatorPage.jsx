import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import MetallicOrb from './MetallicOrb/MetallicOrb';
import DebriefPage from './DebriefPage';
import { setOrbMode, addTranscriptMessage, setIsAgentSpeaking, setAgentAudioLevel } from '../slice/simulator.slice';
import { useSimulator, speakLine } from '../Hooks/simulator.hooks';
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

function ChatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

const AudioFrequencyBars = React.memo(function AudioFrequencyBars({ isRecording, audioLevel }) {
  const [bars, setBars] = useState(Array(18).fill(4));

  useEffect(() => {
    if (isRecording) {
      const realLevel = audioLevel || 0;
      setBars(prev => prev.map((_, i) => Math.max(4, (realLevel * 36) * (0.6 + 0.8 * Math.sin(i * 0.7)))));
    } else {
      setBars(Array(18).fill(4));
    }
  }, [isRecording, audioLevel]);

  return (
    <div className="audio-freq-bars" aria-hidden="true">
      {bars.map((h, i) => (
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
  );
});

export default function SimulatorPage({ scenario, onBack }) {
  const dispatch = useDispatch();
  const { orbMode, transcript, isRecording, isProcessing, isAgentSpeaking, agentAudioLevel, audioLevel } = useSelector(s => s.simulator);
  const { startSession, startRecording, stopRecordingAndSubmit, endSession } = useSimulator();

  const [showSourceDrawer, setShowSourceDrawer] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(true);
  const [isMinimizedChat, setIsMinimizedChat] = useState(false);
  const [chatPosition, setChatPosition] = useState({ x: 0, y: 0 });
  const [isDraggingChat, setIsDraggingChat] = useState(false);

  const [wsTalkingIntensity, setWsTalkingIntensity] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionResult, setSessionResult] = useState(null);

  const chatEndRef = useRef(null);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });
  const dragMovedRef = useRef(false);
  const bootedScenarioIdRef = useRef(null);

  // Drag handler for chat box header & capsule
  const handleMouseDownChat = (e) => {
    if (e.target.closest('.drawer-close') || e.target.closest('.drawer-minimize')) return;
    dragMovedRef.current = false;
    setIsDraggingChat(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: chatPosition.x,
      posY: chatPosition.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingChat) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragMovedRef.current = true;
      }
      setChatPosition({
        x: dragStartRef.current.posX + dx,
        y: dragStartRef.current.posY + dy,
      });
    };

    const handleMouseUp = () => {
      if (isDraggingChat) setIsDraggingChat(false);
    };

    if (isDraggingChat) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingChat]);

  // Boot session when scenario is ready (guaranteed single execution)
  useEffect(() => {
    const scId = scenario?.id || scenario?._id;
    if (scId && bootedScenarioIdRef.current !== scId) {
      bootedScenarioIdRef.current = scId;
      setSessionCompleted(false);
      setSessionResult(null);
      startSession(scId);
    }
  }, [scenario?.id, scenario?._id, startSession]);

  // Auto-scroll chat drawer to bottom on new message
  useEffect(() => {
    if (showChatDrawer && !isMinimizedChat && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript, showChatDrawer, isMinimizedChat]);

  const processTurnResult = useCallback((turnResult) => {
    if (turnResult?.finished) {
      setSessionResult({
        score: turnResult.score || 95,
        stepResults: turnResult.stepResults || [],
        transcript: transcript,
      });
      setSessionCompleted(true);
    }
  }, [transcript]);

  const handleMicClick = useCallback(async () => {
    if (isProcessing) return;
    if (isRecording) {
      const turnResult = await stopRecordingAndSubmit();
      processTurnResult(turnResult);
    } else {
      await startRecording();
    }
  }, [isRecording, isProcessing, startRecording, stopRecordingAndSubmit, processTurnResult]);

  const handleEndSession = async () => {
    const res = await endSession();
    setSessionResult({
      score: res?.score || 90,
      stepResults: res?.stepResults || [],
      transcript: transcript,
    });
    setSessionCompleted(true);
  };

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
          } else if (data.type === 'ATC_RESPONSE') {
            if (data.pilotTranscript) {
              dispatch(addTranscriptMessage({
                role: 'pilot',
                text: data.pilotTranscript,
                timestamp: new Date().toISOString(),
              }));
            }
            if (data.currentLine) {
              dispatch(addTranscriptMessage({
                role: 'atc',
                text: data.currentLine,
                timestamp: new Date().toISOString(),
              }));
              speakLine(
                data.currentLine,
                data.audioBase64,
                () => {
                  dispatch(setIsAgentSpeaking(false));
                  dispatch(setAgentAudioLevel(0));
                },
                () => {
                  dispatch(setIsAgentSpeaking(true));
                },
                (lvl) => {
                  dispatch(setAgentAudioLevel(lvl));
                }
              );
            }
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
  }, [dispatch]);

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

    const handleKeyUp = async (e) => {
      if (e.code === 'Space' && isRecording && !isProcessing) {
        const target = e.target;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          const turnResult = await stopRecordingAndSubmit();
          processTurnResult(turnResult);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRecording, isProcessing, startRecording, stopRecordingAndSubmit, processTurnResult]);

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

  const aircraftCallsign = scenario?.aircraftCallsign || 'N172SP';
  const freq = '118.300';
  const runway = scenario?.steps?.[0]?.slots?.find(s => s.key === 'runway')?.staticValue || '22L';

  const talkingState = {
    isTalking: isRecording ? (audioLevel > 0.03) : isAgentSpeaking,
    intensity: isRecording
      ? Math.min(1.0, (audioLevel || 0) * 2.8)
      : isAgentSpeaking
      ? Math.max(0.35, Math.min(1.0, (agentAudioLevel || 0.6) * 2.8))
      : 0,
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
            className={`sim-source-toggle ${showChatDrawer ? 'active' : ''}`}
            onClick={() => {
              if (!showChatDrawer) {
                setShowChatDrawer(true);
                setIsMinimizedChat(false);
              } else {
                setIsMinimizedChat(m => !m);
              }
              if (showSourceDrawer) setShowSourceDrawer(false);
            }}
            aria-label="Toggle Live Radio Chat Drawer"
          >
            <ChatIcon />
            <span>{isMinimizedChat ? 'Expand Chat' : 'Live Chat'} ({transcript.length})</span>
          </button>

          <button
            className={`sim-source-toggle ${showSourceDrawer ? 'active' : ''}`}
            onClick={() => {
              setShowSourceDrawer(s => !s);
              if (showChatDrawer) setShowChatDrawer(false);
            }}
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

      {/* ── BOTTOM FLOATING AUDIO FREQUENCY DECK ── */}
      <footer className="sim-audio-deck">
        <AudioFrequencyBars isRecording={isRecording} audioLevel={audioLevel} />

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

      {/* ── DRAGGABLE & HIDEABLE LIVE RADIO CHAT SYSTEM ── */}
      {showChatDrawer && (
        isMinimizedChat ? (
          /* Minimized Floating Capsule */
          <div
            className={`sim-chat-capsule ${isDraggingChat ? 'dragging' : ''}`}
            style={{
              transform: `translate(${chatPosition.x}px, ${chatPosition.y}px)`,
            }}
            onMouseDown={handleMouseDownChat}
            onClick={() => {
              if (!dragMovedRef.current) {
                setIsMinimizedChat(false);
              }
            }}
            role="button"
            title="Drag to reposition, click to expand chat"
            aria-label="Expand Radio Chat"
          >
            <span className="capsule-dot" />
            <ChatIcon />
            <span className="capsule-text">Radio Chat</span>
            <span className="capsule-badge">{transcript.length}</span>
          </div>
        ) : (
          /* Full Expanded Chat Drawer */
          <aside
            className={`sim-chat-drawer ${isDraggingChat ? 'dragging' : ''}`}
            style={{
              transform: `translate(${chatPosition.x}px, ${chatPosition.y}px)`,
            }}
            role="region"
            aria-label="Radio Transmission History"
          >
            <div className="drawer-header" onMouseDown={handleMouseDownChat}>
              <div className="header-title-wrap">
                <span className="drag-handle" title="Drag to reposition">⋮⋮</span>
                <ChatIcon />
                <h4>Radio Transmission Log</h4>
                <span className="msg-badge">{transcript.length}</span>
              </div>
              <div className="header-actions">
                <button
                  className="drawer-minimize"
                  onClick={() => setIsMinimizedChat(true)}
                  title="Minimize to floating capsule"
                  aria-label="Minimize chat drawer"
                >
                  —
                </button>
                <button
                  className="drawer-close"
                  onClick={() => setShowChatDrawer(false)}
                  title="Close chat drawer"
                  aria-label="Close chat drawer"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="chat-content">
              {transcript.length === 0 ? (
                <div className="empty-chat-state">
                  <p className="empty-title">Awaiting Transmission…</p>
                  <p className="empty-sub">Initializing radio frequency. Hold Spacebar PTT to transmit radio callout.</p>
                </div>
              ) : (
                transcript.map((msg, idx) => (
                  <div key={idx} className={`chat-message-bubble ${msg.role === 'pilot' ? 'pilot-bubble' : 'atc-bubble'}`}>
                    <div className="bubble-meta">
                      <span className="speaker-tag">{msg.role === 'pilot' ? `PILOT (${aircraftCallsign})` : 'AI CONTROLLER (ATC TOWER)'}</span>
                      <span className="time-tag">
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'NOW'}
                      </span>
                    </div>
                    <p className="bubble-text">{msg.text}</p>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
          </aside>
        )
      )}

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

