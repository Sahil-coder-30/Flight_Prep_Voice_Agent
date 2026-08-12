import React from 'react';
import AgenticCanvas from './AgenticCanvas';
import './MetallicOrb.scss';

const DEFAULT_SETTINGS = {
  particleCount: 1050,
  particleSize: 0.85,
  colorScheme: 'chrome',
  morphSpeed: 1.0,
  metalness: 0.95,
  roughness: 0.12,
  autoRotate: true,
  gravityStrength: 1.0,
  repulsionForce: 1.0,
};

export default function MetallicOrb({
  mode = 'IDLE_CORE',
  talkingState = { isTalking: false, intensity: 0 },
  colorScheme = 'chrome',
  particleCount = 1050,
}) {
  const settings = {
    ...DEFAULT_SETTINGS,
    colorScheme,
    particleCount,
  };

  return (
    <div className="metallic-orb-wrap">
      <AgenticCanvas
        mode={mode}
        settings={settings}
        theme="dark"
        talkingState={talkingState}
      />
    </div>
  );
}
