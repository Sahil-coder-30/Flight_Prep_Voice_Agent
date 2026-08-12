import React from 'react';
import './MetallicOrbControls.scss';

const SHAPE_MODES = [
  { id: 'IDLE_CORE', label: 'Core Orb', icon: '◎' },
  { id: 'SWARM_OUT', label: 'Swarm Cloud', icon: '✦' },
  { id: 'RADAR_SWEEP', label: 'Radar Grid', icon: '⊕' },
  { id: 'LATTICE_MATRIX', label: 'Lattice', icon: '⬡' },
  { id: 'FLIGHT_PATH', label: 'Flight Path', icon: '✈' },
];

const COLOR_SCHEMES = [
  { id: 'chrome', label: 'Titanium Chrome', color: '#FFFFFF' },
  { id: 'steel', label: 'Silver Steel', color: '#E4E4E7' },
  { id: 'emerald', label: 'Emerald Mint', color: '#10B981' },
  { id: 'gold', label: 'Solar Amber', color: '#F59E0B' },
];

export default function MetallicOrbControls({
  currentMode,
  onModeChange,
  currentColorScheme,
  onColorSchemeChange,
  isSimulatingVoice,
  onToggleVoice,
}) {
  return (
    <div className="orb-controls" role="region" aria-label="Metallic Orb Controls">
      {/* Shape Modes Selector */}
      <div className="orb-controls__group">
        <span className="group-label">Shape Matrix:</span>
        <div className="btn-group">
          {SHAPE_MODES.map((m) => (
            <button
              key={m.id}
              className={`orb-mode-btn ${currentMode === m.id ? 'active' : ''}`}
              onClick={() => onModeChange(m.id)}
              title={m.label}
              aria-label={`Morph orb to ${m.label}`}
            >
              <span className="btn-icon">{m.icon}</span>
              <span className="btn-text">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Finish & Voice Reactive Controls */}
      <div className="orb-controls__sub">
        <div className="color-presets">
          <span className="group-label">Metallic Finish:</span>
          {COLOR_SCHEMES.map((c) => (
            <button
              key={c.id}
              className={`color-dot-btn ${currentColorScheme === c.id ? 'active' : ''}`}
              style={{ '--dot-color': c.color }}
              onClick={() => onColorSchemeChange(c.id)}
              title={c.label}
              aria-label={`Set metallic finish to ${c.label}`}
            />
          ))}
        </div>

        <button
          className={`voice-sim-btn ${isSimulatingVoice ? 'simulating' : ''}`}
          onClick={onToggleVoice}
          aria-label={isSimulatingVoice ? 'Stop frequency audio pulse' : 'Simulate live frequency audio pulse'}
        >
          <span className={`voice-dot ${isSimulatingVoice ? 'pulse' : ''}`} />
          {isSimulatingVoice ? 'Voice Transmitting…' : 'Test Audio Pulse'}
        </button>
      </div>
    </div>
  );
}
