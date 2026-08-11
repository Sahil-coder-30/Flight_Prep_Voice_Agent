import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import MetallicSwarm from './MetallicSwarm';

export default function AgenticCanvas({ mode = 'IDLE_CORE', settings = {}, theme = 'dark', onLobeHovered, talkingState = { isTalking: false, intensity: 0 } }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', outline: 'none' }} id="canvas-container">
      <Suspense fallback={null}>
        <Canvas
          camera={{ position: [0, 0, 5.5], fov: 60 }}
          gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
          dpr={[1, 1.5]}
          shadows
        >
          {/* Subtle Ambient base light */}
          <ambientLight intensity={theme === 'dark' ? 0.25 : 0.45} />

          {/* Dual-toned hemisphere light */}
          <hemisphereLight
            color={theme === 'dark' ? '#1e1b4b' : '#e0f2fe'}
            groundColor={theme === 'dark' ? '#020617' : '#f1f5f9'}
            intensity={theme === 'dark' ? 0.8 : 1.2}
          />

          {/* Directional key light */}
          <directionalLight
            position={[5, 8, 5]}
            intensity={theme === 'dark' ? 2.5 : 3.0}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0001}
          />

          {/* Studio Specular Spotlights for Metal Gleam */}
          <pointLight
            position={[-4, 3, 3]}
            intensity={theme === 'dark' ? 5.0 : 4.0}
            color="#ffffff"
          />

          <pointLight
            position={[4, -3, 3]}
            intensity={theme === 'dark' ? 4.5 : 3.5}
            color="#ffffff"
          />

          <pointLight
            position={[0, 5, -2]}
            intensity={theme === 'dark' ? 3.5 : 2.5}
            color="#ffffff"
          />

          <directionalLight
            position={[-5, -5, -5]}
            intensity={theme === 'dark' ? 1.5 : 1.0}
            color="#ffffff"
          />

          {/* Metallic Swarm Component */}
          <MetallicSwarm
            mode={mode}
            settings={settings}
            onLobeHovered={onLobeHovered}
            talkingState={talkingState}
          />

          {/* Contact Shadows on Floor */}
          <ContactShadows
            position={[0, -2.4, 0]}
            opacity={theme === 'dark' ? 0.45 : 0.25}
            scale={6}
            blur={2.4}
            far={4}
          />

          {/* Orbit Controls with locked distance & disabled zoom for fixed orb size */}
          <OrbitControls
            enableZoom={false}
            enableRotate={true}
            enableDamping
            dampingFactor={0.06}
            minDistance={5.5}
            maxDistance={5.5}
            enablePan={false}
            makeDefault
          />
        </Canvas>
      </Suspense>
    </div>
  );
}
