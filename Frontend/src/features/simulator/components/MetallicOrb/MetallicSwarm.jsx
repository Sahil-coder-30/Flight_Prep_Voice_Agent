import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { getShapePosition } from './shapeGenerator';

export default function MetallicSwarm({ mode = 'IDLE_CORE', settings = {}, onLobeHovered, talkingState = { isTalking: false, intensity: 0 } }) {
  const meshRef = useRef(null);
  const { gl } = useThree();

  const particleCount = settings.particleCount || 1050;
  const particleSize = settings.particleSize || 0.85;
  const colorScheme = settings.colorScheme || 'steel';
  const morphSpeed = settings.morphSpeed || 1.0;
  const metalness = settings.metalness !== undefined ? settings.metalness : 0.95;
  const roughness = settings.roughness !== undefined ? settings.roughness : 0.12;
  const autoRotate = settings.autoRotate !== undefined ? settings.autoRotate : true;
  const gravityStrength = settings.gravityStrength || 1.0;
  const repulsionForce = settings.repulsionForce || 1.0;

  // Real-time smoothed frequency bands tracking
  const lowFreq = useRef(0);
  const midFreq = useRef(0);
  const highFreq = useRef(0);

  const maxParticles = 2400;

  // Track physical particle positions
  const currentPositions = useMemo(() => {
    const arr = [];
    for (let i = 0; i < maxParticles; i++) {
      const pt = getShapePosition(i, maxParticles, 'IDLE_CORE');
      arr.push(new THREE.Vector3(pt.x, pt.y, pt.z));
    }
    return arr;
  }, []);

  const sourcePositions = useMemo(() => {
    const arr = [];
    for (let i = 0; i < maxParticles; i++) {
      const pt = getShapePosition(i, maxParticles, 'IDLE_CORE');
      arr.push(new THREE.Vector3(pt.x, pt.y, pt.z));
    }
    return arr;
  }, []);

  const targetPositions = useMemo(() => {
    const arr = [];
    for (let i = 0; i < maxParticles; i++) {
      const pt = getShapePosition(i, maxParticles, 'IDLE_CORE');
      arr.push(new THREE.Vector3(pt.x, pt.y, pt.z));
    }
    return arr;
  }, []);

  // Track base metallic colors for 3-group steel shader interpolation
  const baseColors = useMemo(() => {
    const arr = [];
    for (let i = 0; i < maxParticles; i++) {
      arr.push(new THREE.Color('#9ca3af'));
    }
    return arr;
  }, []);

  const transition = useMemo(() => ({ progress: 1.0 }), []);

  // Track shape morphs whenever mode or particleCount changes
  useEffect(() => {
    for (let i = 0; i < particleCount; i++) {
      sourcePositions[i].copy(currentPositions[i]);
    }
    for (let i = 0; i < particleCount; i++) {
      const pt = getShapePosition(i, particleCount, mode);
      targetPositions[i].set(pt.x, pt.y, pt.z);
    }
    transition.progress = 0;
    gsap.killTweensOf(transition);
    gsap.to(transition, {
      progress: 1.0,
      duration: 2.2 / morphSpeed,
      ease: 'power3.out',
    });
  }, [mode, particleCount, morphSpeed, currentPositions, sourcePositions, targetPositions, transition]);

  // Handle color updates of sphere instances dynamically based on colorScheme
  useEffect(() => {
    if (!meshRef.current) return;
    const tempColor = new THREE.Color();
    const count = particleCount;

    for (let i = 0; i < maxParticles; i++) {
      if (i >= count) {
        tempColor.setHex(0x000000);
        baseColors[i].copy(tempColor);
        meshRef.current.setColorAt(i, tempColor);
        continue;
      }

      let colorHex = '#9ca3af';
      const group = i % 3;

      if (colorScheme === 'steel') {
        colorHex = group === 0 ? '#f1f5f9' : group === 1 ? '#cbd5e1' : '#94a3b8';
      } else if (colorScheme === 'gold') {
        colorHex = group === 0 ? '#fef08a' : group === 1 ? '#fde047' : '#ca8a04';
      } else if (colorScheme === 'chrome') {
        colorHex = group === 0 ? '#ffffff' : group === 1 ? '#f1f5f9' : '#cbd5e1';
      } else if (colorScheme === 'emerald') {
        colorHex = group === 0 ? '#00FF87' : group === 1 ? '#10B981' : '#059669';
      } else if (colorScheme === 'neon-blue') {
        colorHex = group === 0 ? '#2563eb' : group === 1 ? '#1d4ed8' : '#1e40af';
      } else if (colorScheme === 'rose-gold') {
        colorHex = group === 0 ? '#fda4af' : group === 1 ? '#fca5a5' : '#fb7185';
      }

      tempColor.set(colorHex);
      baseColors[i].copy(tempColor);
      meshRef.current.setColorAt(i, tempColor);
    }

    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [colorScheme, particleCount, baseColors]);

  // Local object wrappers to prevent memory garbage collection in frame loop
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const mouse3D = useMemo(() => new THREE.Vector3(9999, 9999, 0), []);
  const repulsionDir = useMemo(() => new THREE.Vector3(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  const highlightColor = useMemo(() => new THREE.Color(), []);
  const planeNormal = useMemo(() => new THREE.Vector3(), []);
  const plane = useMemo(() => new THREE.Plane(), []);
  const intersectPoint = useMemo(() => new THREE.Vector3(), []);
  const basePos = useMemo(() => new THREE.Vector3(), []);
  const pullDir = useMemo(() => new THREE.Vector3(), []);
  const voiceHighlight = useMemo(() => new THREE.Color(), []);
  const wireColor = useMemo(() => new THREE.Color(), []);

  const pointerRef = useRef({ active: false });

  // Wireframe lattice lines structures
  const groupRef = useRef(null);
  const lineGeomRef = useRef(null);
  const lineMaterialRef = useRef(null);
  const lineOpacity = useRef(0);
  const linePositions = useMemo(() => new Float32Array(150000), []);

  useEffect(() => {
    const dom = gl.domElement;
    if (!dom) return;

    const handleMove = () => { pointerRef.current.active = true; };
    const handleLeave = () => { pointerRef.current.active = false; };

    dom.addEventListener('pointermove', handleMove);
    dom.addEventListener('pointerleave', handleLeave);
    dom.addEventListener('pointerout', handleLeave);

    return () => {
      dom.removeEventListener('pointermove', handleMove);
      dom.removeEventListener('pointerleave', handleLeave);
      dom.removeEventListener('pointerout', handleLeave);
    };
  }, [gl]);

  // Frame simulation loop running at 60fps
  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();
    const count = particleCount;

    // Smoothly calculate multi-band voice frequencies with physical acoustic delay
    let targetLow = 0;
    let targetMid = 0;
    let targetHigh = 0;

    if (talkingState && talkingState.isTalking) {
      const intensity = talkingState.intensity;
      targetLow = intensity * (0.82 + 0.18 * Math.sin(time * 11.0));
      targetMid = intensity * (0.45 + 0.55 * Math.sin(time * 19.0 + 1.2));
      targetHigh = intensity * (0.25 + 0.75 * Math.sin(time * 33.0 + 2.5));
    }

    lowFreq.current = THREE.MathUtils.lerp(lowFreq.current, targetLow, 0.28);
    midFreq.current = THREE.MathUtils.lerp(midFreq.current, targetMid, 0.22);
    highFreq.current = THREE.MathUtils.lerp(highFreq.current, targetHigh, 0.20);

    // Raycast pointer intersection
    if (pointerRef.current.active) {
      state.camera.getWorldDirection(planeNormal).multiplyScalar(-1);
      plane.set(planeNormal, 0);
      state.raycaster.ray.intersectPlane(plane, intersectPoint);
      mouse3D.lerp(intersectPoint, 0.16);
    } else {
      mouse3D.lerp(new THREE.Vector3(9999, 9999, 9999), 0.12);
    }

    // Set interactive highlight color contrast dynamically based on palette
    if (colorScheme === 'gold') {
      highlightColor.set('#f59e0b');
    } else if (colorScheme === 'neon-blue') {
      highlightColor.set('#60a5fa');
    } else if (colorScheme === 'emerald') {
      highlightColor.set('#34d399');
    } else {
      highlightColor.set('#ffffff');
    }

    let hoveredLobe = null;
    let minLobeDist = Infinity;

    for (let i = 0; i < maxParticles; i++) {
      if (i >= count) {
        tempObject.position.set(9999, 9999, 9999);
        tempObject.scale.set(0, 0, 0);
        tempObject.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObject.matrix);
        continue;
      }

      // 1. Core target interpolation
      const source = sourcePositions[i];
      const target = targetPositions[i];
      const progress = transition.progress;

      let x = THREE.MathUtils.lerp(source.x, target.x, progress);
      let y = THREE.MathUtils.lerp(source.y, target.y, progress);
      let z = THREE.MathUtils.lerp(source.z, target.z, progress);

      basePos.set(x, y, z);

      // 2. Resting biological breathing
      let dirX = 0, dirY = 0, dirZ = 0;
      if (mode === 'IDLE_CORE') {
        dirX = basePos.x / 2.3;
        dirY = basePos.y / 2.3;
        dirZ = basePos.z / 2.3;
      } else {
        const currentRadius = Math.sqrt(x * x + y * y + z * z) || 1.0;
        dirX = x / currentRadius;
        dirY = y / currentRadius;
        dirZ = z / currentRadius;
      }

      const breathFreq = 1.4;
      const breathAmp = mode === 'IDLE_CORE' ? 0.045 : 0.02;
      const breathPhase = Math.sin(time * breathFreq + (basePos.y * 0.5) + (i * 0.01));
      const breathOffset = (0.5 + 0.5 * breathPhase) * breathAmp;

      const driftX = Math.sin(time * 0.45 + i * 0.12) * 0.012;
      const driftY = Math.cos(time * 0.35 + i * 0.08) * 0.012;
      const driftZ = Math.sin(time * 0.55 + i * 0.15) * 0.012;

      x += dirX * breathOffset + driftX;
      y += dirY * breathOffset + driftZ;
      z += dirZ * breathOffset + driftY;

      // 2.5 Dynamic 8-band acoustic frequency physics
      let activeVoiceWave = 0;
      let activeScaleBonus = 1.0;

      if (talkingState && talkingState.isTalking) {
        const b0 = lowFreq.current * 1.3;
        const b1 = lowFreq.current * 0.95 + midFreq.current * 0.2;
        const b2 = lowFreq.current * 0.5 + midFreq.current * 0.65;
        const b3 = midFreq.current * 1.25;
        const b4 = midFreq.current * 0.9 + highFreq.current * 0.3;
        const b5 = midFreq.current * 0.45 + highFreq.current * 0.8;
        const b6 = highFreq.current * 1.25;
        const b7 = highFreq.current * 1.5;

        const bands = [b0, b1, b2, b3, b4, b5, b6, b7];
        const normalizedY = (basePos.y + 2.3) / 4.6;
        const bandIndex = (i + Math.floor(normalizedY * 3)) % 8;
        const bandIntensity = bands[bandIndex];

        const bandFreq = 14.0 + bandIndex * 6.5;
        const individualPhase = time * bandFreq + i * 0.75;

        activeVoiceWave = Math.sin(individualPhase) * 0.18 * bandIntensity;

        if (bandIndex >= 5) {
          activeVoiceWave += Math.sin(time * 68.0 + i * 1.5) * 0.022 * bandIntensity;
        }

        x += dirX * activeVoiceWave;
        y += dirY * activeVoiceWave;
        z += dirZ * activeVoiceWave;

        const scalePhase = Math.sin(individualPhase * 0.8);
        activeScaleBonus = 1.0 + (bandIntensity * 0.42) * (0.55 + 0.45 * scalePhase);
      }

      // 3. Pointer repulsion / swirl physics
      const interactiveThreshold = mode === 'CODE_SPACE' ? 1.1 : mode === 'IDLE_CORE' ? 1.25 : 0.95;
      const interactiveThresholdSq = interactiveThreshold * interactiveThreshold;

      const dx_m = x - mouse3D.x;
      const dy_m = y - mouse3D.y;
      const dz_m = z - mouse3D.z;
      const distToMouseSq = dx_m * dx_m + dy_m * dy_m + dz_m * dz_m;

      let distToMouse = 9999;
      let scaleFactor = 1.0;

      if (distToMouseSq < interactiveThresholdSq) {
        distToMouse = Math.sqrt(distToMouseSq);
        const force = (interactiveThreshold - distToMouse) / interactiveThreshold;

        if (mode === 'CODE_SPACE') {
          const dx = x - mouse3D.x;
          const dy = y - mouse3D.y;
          const dist2D = Math.sqrt(dx * dx + dy * dy) || 0.1;
          const tx = -dy / dist2D;
          const ty = dx / dist2D;
          const swirlStrength = force * repulsionForce * 0.5;
          x += tx * swirlStrength;
          y += ty * swirlStrength;
          x = THREE.MathUtils.lerp(x, mouse3D.x, force * 0.12);
          y = THREE.MathUtils.lerp(y, mouse3D.y, force * 0.12);
          const zShift = (Math.sin(i * 0.85) * 0.22) + (Math.cos(i * 1.45) * 0.12);
          z += (zShift >= 0 ? 1 : -1) * force * 0.5 * repulsionForce;
          scaleFactor = 1.0 + force * 0.8;
        } else if (mode === 'IDLE_CORE') {
          const pullStrength = force * repulsionForce * 0.08;
          pullDir.copy(mouse3D).sub(basePos).normalize();
          const wave = Math.sin(distToMouse * 4.5 - time * 6.0) * 0.015 * force;
          x += pullDir.x * pullStrength + pullDir.x * wave;
          y += pullDir.y * pullStrength + pullDir.y * wave;
          z += pullDir.z * pullStrength * 0.22 + pullDir.z * wave;
          scaleFactor = 1.0 + force * 0.22;
        } else {
          const repulsionStrength = (interactiveThreshold - distToMouse) * repulsionForce * 0.12;
          repulsionDir.copy(basePos).sub(mouse3D).normalize();
          x += repulsionDir.x * repulsionStrength;
          y += repulsionDir.y * repulsionStrength;
          z += repulsionDir.z * repulsionStrength * 0.4;

          if (mode === 'NEURAL_FABRIC' && distToMouse < minLobeDist) {
            minLobeDist = distToMouse;
            const lobeId = i % 3;
            hoveredLobe = lobeId === 0 ? 'Frontal Cognitive Node' : lobeId === 1 ? 'Analytical Synthesis Hub' : 'System Memory Registrar';
          }
        }
      }

      // 3.5 Real-time specular color mapping
      tempColor.copy(baseColors[i]);

      if (distToMouse < interactiveThreshold) {
        const force = (interactiveThreshold - distToMouse) / interactiveThreshold;
        tempColor.lerp(highlightColor, force * 0.98);
      }

      if (talkingState && talkingState.isTalking && activeVoiceWave !== 0) {
        const wavePower = Math.abs(activeVoiceWave) / 0.16;
        const voiceGlow = Math.min(1.0, wavePower);

        if (colorScheme === 'steel' || colorScheme === 'chrome') {
          voiceHighlight.set('#ffffff');
        } else if (colorScheme === 'gold') {
          voiceHighlight.set('#fffbeb');
        } else if (colorScheme === 'emerald') {
          voiceHighlight.set('#6ee7b7');
        } else if (colorScheme === 'neon-blue') {
          voiceHighlight.set('#93c5fd');
        } else if (colorScheme === 'rose-gold') {
          voiceHighlight.set('#fecdd3');
        } else {
          voiceHighlight.set('#ffffff');
        }

        tempColor.lerp(voiceHighlight, voiceGlow * 0.75);
      }

      meshRef.current.setColorAt(i, tempColor);
      currentPositions[i].set(x, y, z);

      tempObject.position.set(x, y, z);
      const pulse = mode === 'IDLE_CORE' ? 0 : Math.sin(time * 2.5 + i * 0.1) * 0.12;
      const nodeScale = (0.055 * particleSize) * (1.0 + pulse) * scaleFactor * activeScaleBonus;
      tempObject.scale.set(nodeScale, nodeScale, nodeScale);
      tempObject.rotation.set(time * 0.1, time * 0.05, 0);

      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }

    // 5. Quantum Neural Wireframe connections
    let targetOpacity = 0.18;
    if (talkingState && talkingState.isTalking) {
      targetOpacity = 0.45 + (talkingState.intensity * 0.35) + Math.sin(time * 16.0) * 0.12 * talkingState.intensity;
    } else if (pointerRef.current.active) {
      targetOpacity = 0.32;
    } else if (mode !== 'IDLE_CORE') {
      targetOpacity = 0.24;
    }

    lineOpacity.current = THREE.MathUtils.lerp(lineOpacity.current, targetOpacity, 0.08);

    if (lineMaterialRef.current) {
      lineMaterialRef.current.opacity = lineOpacity.current;
      lineMaterialRef.current.visible = lineOpacity.current > 0.01;

      if (colorScheme === 'steel') {
        wireColor.set(talkingState?.isTalking ? '#f8fafc' : '#cbd5e1');
      } else if (colorScheme === 'chrome') {
        wireColor.set(talkingState?.isTalking ? '#ffffff' : '#f1f5f9');
      } else if (colorScheme === 'gold') {
        wireColor.set(talkingState?.isTalking ? '#fef08a' : '#fbbf24');
      } else if (colorScheme === 'emerald') {
        wireColor.set(talkingState?.isTalking ? '#a7f3d0' : '#10b981');
      } else if (colorScheme === 'neon-blue') {
        wireColor.set(talkingState?.isTalking ? '#bae6fd' : '#38bdf8');
      } else if (colorScheme === 'rose-gold') {
        wireColor.set(talkingState?.isTalking ? '#fecdd3' : '#fb7185');
      } else {
        wireColor.set('#94a3b8');
      }

      const shimmerSpeed = talkingState?.isTalking ? 22.0 : 3.0;
      const shimmerAmp = talkingState?.isTalking ? 0.18 : 0.08;
      const glint = 1.0 + Math.sin(time * shimmerSpeed) * shimmerAmp;

      wireColor.multiplyScalar(glint);
      lineMaterialRef.current.color.copy(wireColor);
    }

    if (lineGeomRef.current && lineOpacity.current > 0.01) {
      const positions = lineGeomRef.current.attributes.position.array;
      let vertexIndex = 0;
      const cols = 40;

      const maxDistance = mode === 'IDLE_CORE' ? (Math.sqrt(80.0 / count) * 2.2) : 1.25;
      const maxDistanceSq = maxDistance * maxDistance;

      const addLine = (idx1, idx2) => {
        if (idx2 >= count) return;
        const p1 = currentPositions[idx1];
        const p2 = currentPositions[idx2];
        const distSq = p1.distanceToSquared(p2);
        if (distSq > maxDistanceSq) return;

        if (vertexIndex + 5 < positions.length) {
          positions[vertexIndex++] = p1.x;
          positions[vertexIndex++] = p1.y;
          positions[vertexIndex++] = p1.z;
          positions[vertexIndex++] = p2.x;
          positions[vertexIndex++] = p2.y;
          positions[vertexIndex++] = p2.z;
        }
      };

      if (mode === 'IDLE_CORE') {
        const offsets = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
        for (let i = 0; i < count; i++) {
          for (let o = 0; o < offsets.length; o++) {
            addLine(i, i + offsets[o]);
          }
        }
      } else {
        for (let i = 0; i < count; i++) {
          const c = i % cols;
          if (c < cols - 1) addLine(i, i + 1);
          addLine(i, i + cols);
          if (c < cols - 1) addLine(i, i + cols + 1);
          if (c > 0) addLine(i, i + cols - 1);
        }
      }

      const maxFloats = positions.length;
      while (vertexIndex < maxFloats) {
        positions[vertexIndex++] = 0;
      }

      lineGeomRef.current.attributes.position.needsUpdate = true;
    }

    if (onLobeHovered) {
      onLobeHovered(hoveredLobe);
    }

    if (groupRef.current) {
      if (autoRotate) {
        groupRef.current.rotation.y = time * 0.07 * gravityStrength;
        groupRef.current.rotation.x = Math.sin(time * 0.03) * 0.08 * gravityStrength;
      } else {
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.05);
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.05);
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      {/* Dynamic Instanced Spheres */}
      <instancedMesh
        ref={meshRef}
        args={[null, null, maxParticles]}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          metalness={metalness}
          roughness={roughness}
          envMapIntensity={2.5}
          flatShading={false}
        />
      </instancedMesh>

      {/* Wireframe connections */}
      <lineSegments>
        <bufferGeometry ref={lineGeomRef}>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
            count={linePositions.length / 3}
            array={linePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          ref={lineMaterialRef}
          color="#cbd5e1"
          transparent
          opacity={0}
          linewidth={1.5}
          depthWrite={true}
          depthTest={true}
        />
      </lineSegments>
    </group>
  );
}
