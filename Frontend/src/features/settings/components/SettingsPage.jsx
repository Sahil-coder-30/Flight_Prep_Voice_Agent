import React, { useState } from 'react';
import './SettingsPage.scss';

function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
    </svg>
  );
}

export default function SettingsPage({ user }) {
  const [callsign, setCallsign] = useState(user?.callsign || 'N172SP');
  const [pttKey, setPttKey] = useState('Space');
  const [volume, setVolume] = useState(85);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [micTesting, setMicTesting] = useState(false);
  const [testLevel, setTestLevel] = useState(0);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const testIntervalRef = React.useRef(null);
  const testAudioCtxRef = React.useRef(null);
  const testStreamRef = React.useRef(null);

  const stopMicTest = React.useCallback(() => {
    if (testIntervalRef.current) {
      clearInterval(testIntervalRef.current);
      testIntervalRef.current = null;
    }
    if (testAudioCtxRef.current) {
      try { testAudioCtxRef.current.close(); } catch (e) {}
      testAudioCtxRef.current = null;
    }
    if (testStreamRef.current) {
      testStreamRef.current.getTracks().forEach(t => t.stop());
      testStreamRef.current = null;
    }
    setMicTesting(false);
    setTestLevel(0);
  }, []);

  React.useEffect(() => {
    return () => {
      stopMicTest();
    };
  }, [stopMicTest]);

  const handleTestMic = async () => {
    if (micTesting) {
      stopMicTest();
      return;
    }

    try {
      setMicTesting(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      testStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      testAudioCtxRef.current = audioCtx;
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      testIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setTestLevel(Math.min(100, Math.round((avg / 128) * 100)));
      }, 100);

      setTimeout(() => {
        stopMicTest();
      }, 5000);
    } catch (e) {
      alert('Microphone test failed: ' + e.message);
      stopMicTest();
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="settings-page" aria-label="Flight Deck Settings">
      <header className="settings-header">
        <h1 className="settings-title">Flight Deck & Audio Settings</h1>
        <p className="settings-subtitle">
          Configure aircraft callsign defaults, Push-to-Talk (PTT) keyboard bindings, and audio input/output parameters.
        </p>
      </header>

      {savedSuccess && (
        <div className="settings-toast-success" role="alert">
          ✓ Flight deck preferences saved successfully.
        </div>
      )}

      <form onSubmit={handleSave} className="settings-form">
        {/* SECTION 1: AIRCRAFT IDENTIFICATION */}
        <section className="settings-section">
          <div className="section-title-wrap">
            <h2 className="section-title">Aircraft Identification</h2>
            <p className="section-desc">Default tail number and callsign transmitted in simulation radio checks.</p>
          </div>

          <div className="field-group">
            <label htmlFor="input-callsign">Default Aircraft Callsign</label>
            <input
              id="input-callsign"
              type="text"
              className="form-input"
              value={callsign}
              onChange={(e) => setCallsign(e.target.value.toUpperCase())}
              placeholder="e.g. N172SP or AAL104"
            />
            <span className="field-hint">ICAO standard aviation callsign format (e.g. N172SP).</span>
          </div>
        </section>

        {/* SECTION 2: AUDIO INPUT & PTT KEYBINDING */}
        <section className="settings-section">
          <div className="section-title-wrap">
            <h2 className="section-title">Microphone & Push-to-Talk (PTT)</h2>
            <p className="section-desc">Test your microphone input and assign hotkeys for radio transmission.</p>
          </div>

          <div className="field-group">
            <label htmlFor="input-ptt">Push-to-Talk (PTT) Key</label>
            <div className="keybind-input-wrap">
              <KeyIcon />
              <input
                id="input-ptt"
                type="text"
                className="form-input keybind-input"
                value={pttKey}
                readOnly
                aria-label="PTT Keybinding"
              />
              <span className="keybind-badge">SPACEBAR</span>
            </div>
            <span className="field-hint">Press and hold Spacebar in the simulation deck to open microphone channel.</span>
          </div>

          <div className="field-group">
            <label>Microphone Test & Level Meter</label>
            <div className="mic-test-row">
              <button
                type="button"
                className={`btn ${micTesting ? 'btn-red' : 'btn-cyan'}`}
                onClick={handleTestMic}
              >
                <MicIcon /> {micTesting ? 'Testing Mic (5s)...' : 'Test Microphone'}
              </button>

              <div className="level-meter-bar">
                <div className="meter-fill" style={{ width: `${testLevel}%` }} />
              </div>
              <span className="meter-val">{testLevel}%</span>
            </div>
          </div>
        </section>

        {/* SECTION 3: ATC VOICE AUDIO OUTPUT */}
        <section className="settings-section">
          <div className="section-title-wrap">
            <h2 className="section-title">ATC Synthesizer Audio Output</h2>
            <p className="section-desc">Adjust synthesized air traffic controller voice playback speed and volume.</p>
          </div>

          <div className="field-group">
            <label htmlFor="input-volume">
              <VolumeIcon /> ATC Controller Volume ({volume}%)
            </label>
            <input
              id="input-volume"
              type="range"
              min="0"
              max="100"
              className="range-input"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </div>

          <div className="field-group">
            <label htmlFor="input-speed">ATC Speech Rate ({speechRate}x)</label>
            <input
              id="input-speed"
              type="range"
              min="0.8"
              max="1.4"
              step="0.1"
              className="range-input"
              value={speechRate}
              onChange={(e) => setSpeechRate(Number(e.target.value))}
            />
            <span className="field-hint">1.0x represents standard ICAO controller cadence.</span>
          </div>
        </section>

        <div className="form-actions">
          <button type="submit" className="btn btn-cyan btn-lg">
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
