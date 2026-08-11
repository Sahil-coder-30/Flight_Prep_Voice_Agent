export function getShapePosition(index, total, mode) {
  switch (mode) {
    case 'IDLE_CORE':       return getSpherePoint(index, total);
    case 'NEURAL_FABRIC':   return getNeuralFabricPoint(index, total);
    case 'RECURSIVE_LOOP':  return getTorusPoint(index, total);
    case 'DATA_VAULT':      return getCubePoint(index, total);
    case 'KNOWLEDGE_HELIX': return getHelixPoint(index, total);
    case 'CODE_SPACE':      return getCodeSpacePoint(index, total);
    case 'HEADPHONES':
    case 'FLIGHT_PATH':     return getHeadphonesPoint(index, total);
    case 'SWARM_OUT':       return getSwarmCloudPoint(index, total);
    case 'RADAR_SWEEP':     return getRadarSweepPoint(index, total);
    case 'LATTICE_MATRIX':  return getLatticeMatrixPoint(index, total);
    default:                return getSpherePoint(index, total);
  }
}

// 1. Interactive Spherical Fabric Mesh (Connected Nested Orb Globe)
function getSpherePoint(i, total) {
  const offset = 2 / total;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  const y = ((i * offset) - 1) + (offset / 2);
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  
  const theta = i * goldenAngle;
  const radius = 2.3;

  const x = Math.cos(theta) * r * radius;
  const z = Math.sin(theta) * r * radius;
  const yPos = y * radius;

  return { x, y: yPos, z };
}

// 2. Synaptic Network - 3 separate highly interconnected lobes with wider boundaries
function getNeuralFabricPoint(i, total) {
  const lobes = 3;
  const lobeIndex = i % lobes;
  const indexInLobe = Math.floor(i / lobes);
  const totalInLobe = Math.ceil(total / lobes);

  let centerX = 0;
  let centerY = 0;
  let centerZ = 0;

  if (lobeIndex === 0) {
    centerX = -1.6; centerY = 0.6; centerZ = 0;
  } else if (lobeIndex === 1) {
    centerX = 1.6; centerY = 0.6; centerZ = 0;
  } else {
    centerX = 0; centerY = -1.1; centerZ = 0.6;
  }

  const phi = Math.acos(1 - 2 * (indexInLobe + 0.5) / totalInLobe);
  const theta = Math.PI * (1 + Math.sqrt(5)) * indexInLobe;
  const r = 0.8 + 0.3 * Math.sin(indexInLobe * 0.15);

  return {
    x: centerX + r * 1.3 * Math.sin(phi) * Math.cos(theta),
    y: centerY + r * 1.0 * Math.cos(phi),
    z: centerZ + r * Math.sin(phi) * Math.sin(theta),
  };
}

// 3. Torus / Recursive Feedback Loop
function getTorusPoint(i, total) {
  const ringCount = 40;
  const particlesPerRing = Math.floor(total / ringCount) || 1;
  const ringIndex = Math.floor(i / particlesPerRing);
  const particleIndex = i % particlesPerRing;

  const u = (particleIndex / particlesPerRing) * Math.PI * 2;
  const v = (ringIndex / ringCount) * Math.PI * 2;
  
  const R = 2.3;
  const r = 0.9;

  return {
    x: (R + r * Math.cos(u)) * Math.cos(v),
    y: (R + r * Math.cos(u)) * Math.sin(v),
    z: r * Math.sin(u),
  };
}

// 4. Data Vault - Spaced Matrix / Cube
function getCubePoint(i, total) {
  const side = Math.ceil(Math.pow(total, 1 / 3));
  
  const xIdx = i % side;
  const yIdx = Math.floor((i / side) % side);
  const zIdx = Math.floor(i / (side * side));

  const spacing = 0.65;
  const offset = ((side - 1) * spacing) / 2;

  const noise = Math.sin(xIdx * 0.5 + yIdx * 0.5 + zIdx * 0.5) * 0.02;

  return {
    x: xIdx * spacing - offset + noise,
    y: yIdx * spacing - offset + noise,
    z: zIdx * spacing - offset + noise,
  };
}

// 5. DNA Helix of Synthesis
function getHelixPoint(i, total) {
  const strand = i % 2;
  const angle = (i / total) * Math.PI * 2 * 6.0;
  const height = ((i / total) - 0.5) * 5.2;
  const radius = 1.5;

  const offsetAngle = strand === 0 ? 0 : Math.PI;

  const isCrossbar = i % 12 === 0;
  let currentRadius = radius;
  let finalAngle = angle + offsetAngle;

  if (isCrossbar) {
    const interpolationFactor = (i % 3) / 2;
    currentRadius = radius * (2 * interpolationFactor - 1);
  }

  return {
    x: currentRadius * Math.cos(finalAngle),
    y: height,
    z: currentRadius * Math.sin(finalAngle),
  };
}

// 6. Holographic 3D Volumetric Word "CodeSpace"
function getCodeSpacePoint(i, total) {
  const letters = ['C', 'o', 'd', 'e', 'S', 'p', 'a', 'c', 'e'];
  const numLetters = letters.length;
  const letIdx = i % numLetters;
  
  const indexInLetter = Math.floor(i / numLetters);
  const totalInLetter = Math.floor(total / numLetters);
  const t = totalInLetter > 0 ? (indexInLetter / totalInLetter) : 0.5;

  const hasGap = letIdx >= 4;
  const xCenter = -3.8 + letIdx * 0.82 + (hasGap ? 0.45 : 0);

  let lx = 0;
  let ly = 0;

  switch (letters[letIdx]) {
    case 'C': {
      const angle = 0.3 * Math.PI + t * 1.4 * Math.PI;
      lx = 0.28 * Math.cos(angle);
      ly = 0.28 * Math.sin(angle);
      break;
    }
    case 'o': {
      const angle = t * Math.PI * 2;
      lx = 0.20 * Math.cos(angle);
      ly = -0.06 + 0.20 * Math.sin(angle);
      break;
    }
    case 'd': {
      if (t < 0.65) {
        const angle = (t / 0.65) * Math.PI * 2;
        lx = 0.20 * Math.cos(angle);
        ly = -0.08 + 0.20 * Math.sin(angle);
      } else {
        const u = (t - 0.65) / 0.35;
        lx = 0.20;
        ly = -0.30 + u * 0.70;
      }
      break;
    }
    case 'e': {
      if (t < 0.3) {
        const u = t / 0.3;
        lx = -0.20 + u * 0.40;
        ly = -0.04;
      } else {
        const angle = 0.0 + ((t - 0.3) / 0.7) * Math.PI * 1.6;
        lx = 0.20 * Math.cos(angle);
        ly = -0.04 + 0.20 * Math.sin(angle);
      }
      break;
    }
    case 'S': {
      const angle = t * Math.PI * 2.15;
      lx = 0.18 * Math.sin(angle);
      ly = -0.30 + t * 0.62;
      break;
    }
    case 'p': {
      if (t < 0.45) {
        const u = t / 0.45;
        lx = -0.18;
        ly = 0.12 - u * 0.58;
      } else {
        const angle = -Math.PI * 0.5 + ((t - 0.45) / 0.55) * Math.PI * 2;
        lx = -0.02 + 0.16 * Math.cos(angle);
        ly = -0.05 + 0.16 * Math.sin(angle);
      }
      break;
    }
    case 'a': {
      if (t < 0.6) {
        const angle = (t / 0.6) * Math.PI * 2;
        lx = 0.18 * Math.cos(angle);
        ly = -0.1 + 0.18 * Math.sin(angle);
      } else {
        const u = (t - 0.6) / 0.4;
        lx = 0.18;
        ly = -0.28 + u * 0.40;
      }
      break;
    }
    case 'c': {
      const angle = 0.32 * Math.PI + t * 1.36 * Math.PI;
      lx = 0.18 * Math.cos(angle);
      ly = -0.08 + 0.18 * Math.sin(angle);
      break;
    }
    default: {
      if (t < 0.3) {
        const u = t / 0.3;
        lx = -0.18 + u * 0.36;
        ly = -0.08;
      } else {
        const angle = 0.0 + ((t - 0.3) / 0.7) * Math.PI * 1.6;
        lx = 0.18 * Math.cos(angle);
        ly = -0.08 + 0.18 * Math.sin(angle);
      }
      break;
    }
  }

  const zShift = (Math.sin(i * 0.85) * 0.22) + (Math.cos(i * 1.45) * 0.12);

  return {
    x: xCenter + lx,
    y: ly,
    z: zShift,
  };
}

// 7. Studio Over-Ear Headphones Shape
function getHeadphonesPoint(i, total) {
  // Allocate points across anatomical sections:
  // - Top Headband & Arch Cushion: 30%
  // - Left Ear Cup & Cushion Pad: 33%
  // - Right Ear Cup & Cushion Pad: 33%
  // - Hinge Sliders & Yoke Extensions: 4%

  const segment = i % 100;

  if (segment < 30) {
    // 1. Padded Overhead Band Arch
    const t = ((i / total) * 3.333 + (i % 7) * 0.01) % 1;
    // Smooth arc from left side (0.92 * PI) to right side (0.08 * PI)
    const angle = Math.PI * (0.92 - t * 0.84);
    
    // Band layers: inner cushion vs outer metal spring band
    const isInnerPad = (i % 3 === 0);
    const R = isInnerPad ? 1.95 : 2.15;
    
    // Z band width (spread evenly across depth)
    const zOffset = (((i % 9) / 8) - 0.5) * 0.42; 
    
    // Subtle physical curvature refinement
    const curveRefinement = Math.sin(t * Math.PI) * 0.08;

    const x = (R + curveRefinement) * Math.cos(angle);
    const y = (R + curveRefinement) * Math.sin(angle) - 0.35;
    const z = zOffset;

    return { x, y, z };
  } else if (segment < 63) {
    // 2. Left Ear Cup (x = -1.82, y = -0.65)
    const subIdx = Math.floor(((segment - 30) / 33) * 100);
    const centerX = -1.82;
    const centerY = -0.65;

    const pIdx = Math.floor(i / 100);
    const t = (pIdx * 0.173 + (i % 13) * 0.071) % 1;
    const u = (i * 0.239) % (Math.PI * 2);

    if (subIdx < 65) {
      // Oval Ergonomic Cushion Pad (Plush ear ring facing inward)
      const cupHeightY = 0.78;
      const cupWidthZ = 0.58;
      const cushionThickness = 0.20;

      const ringRadius = 0.72 + 0.28 * Math.cos(t * Math.PI * 2);
      const ly = Math.sin(u) * cupHeightY * ringRadius;
      const lz = Math.cos(u) * cupWidthZ * ringRadius;
      // Cushion protrudes slightly inward toward center (+x direction from -1.82)
      const lx = 0.20 + Math.sin(t * Math.PI * 2) * cushionThickness;

      return {
        x: centerX + lx,
        y: centerY + ly,
        z: lz,
      };
    } else {
      // Outer Metallic Ear Cup Dome / Shell
      const phi = Math.acos(1 - 2 * t);
      const theta = u;
      const shellRadius = 0.68;

      // Dome points outward (-x direction)
      const lx = -Math.abs(Math.cos(phi)) * 0.32 - 0.02;
      const ly = Math.sin(phi) * Math.sin(theta) * shellRadius * 1.12;
      const lz = Math.sin(phi) * Math.cos(theta) * shellRadius * 0.88;

      return {
        x: centerX + lx,
        y: centerY + ly,
        z: lz,
      };
    }
  } else if (segment < 96) {
    // 3. Right Ear Cup (Symmetric at x = +1.82, y = -0.65)
    const subIdx = Math.floor(((segment - 63) / 33) * 100);
    const centerX = 1.82;
    const centerY = -0.65;

    const pIdx = Math.floor(i / 100);
    const t = (pIdx * 0.173 + (i % 13) * 0.071) % 1;
    const u = (i * 0.239) % (Math.PI * 2);

    if (subIdx < 65) {
      // Oval Ergonomic Cushion Pad
      const cupHeightY = 0.78;
      const cupWidthZ = 0.58;
      const cushionThickness = 0.20;

      const ringRadius = 0.72 + 0.28 * Math.cos(t * Math.PI * 2);
      const ly = Math.sin(u) * cupHeightY * ringRadius;
      const lz = Math.cos(u) * cupWidthZ * ringRadius;
      // Cushion protrudes inward (-x direction from +1.82)
      const lx = -0.20 - Math.sin(t * Math.PI * 2) * cushionThickness;

      return {
        x: centerX + lx,
        y: centerY + ly,
        z: lz,
      };
    } else {
      // Outer Metallic Ear Cup Dome / Shell
      const phi = Math.acos(1 - 2 * t);
      const theta = u;
      const shellRadius = 0.68;

      // Dome points outward (+x direction)
      const lx = Math.abs(Math.cos(phi)) * 0.32 + 0.02;
      const ly = Math.sin(phi) * Math.sin(theta) * shellRadius * 1.12;
      const lz = Math.sin(phi) * Math.cos(theta) * shellRadius * 0.88;

      return {
        x: centerX + lx,
        y: centerY + ly,
        z: lz,
      };
    }
  } else {
    // 4. Hinge Sliders & Yoke Arms (Linking headband ends to ear cup pivots)
    const isLeft = (i % 2 === 0);
    const sideX = isLeft ? -1.82 : 1.82;
    const hProgress = (segment - 96) / 4;
    
    // Vertical slider rod connecting y = 0.28 down to y = -0.15
    const ly = 0.28 - hProgress * 0.43;
    const lz = (Math.sin(i * 1.5) * 0.12);
    const lx = (i % 4 === 0 ? -0.06 : 0.06);

    return {
      x: sideX + lx,
      y: ly,
      z: lz,
    };
  }
}

// 8. Swarm Cloud
function getSwarmCloudPoint(i, total) {
  const phi = Math.acos(1 - 2 * (i + 0.5) / total);
  const theta = Math.PI * (1 + Math.sqrt(5)) * i;
  const noise = Math.sin(i * 0.3) * 0.45;
  const r = 2.4 + noise;
  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.cos(phi),
    z: r * Math.sin(phi) * Math.sin(theta),
  };
}

// 9. Radar Sweep
function getRadarSweepPoint(i, total) {
  const rings = 5;
  const ringIndex = i % rings;
  const t = (i / total) * Math.PI * 2;
  const r = (ringIndex + 1) * 0.55;
  return {
    x: r * Math.cos(t),
    y: (ringIndex - 2) * 0.35 + Math.sin(t * 3) * 0.1,
    z: r * Math.sin(t),
  };
}

// 10. Lattice Matrix
function getLatticeMatrixPoint(i, total) {
  const side = Math.ceil(Math.pow(total, 1 / 3));
  const xIdx = i % side;
  const yIdx = Math.floor((i / side) % side);
  const zIdx = Math.floor(i / (side * side));
  const spacing = 0.42;
  const offset = ((side - 1) * spacing) / 2;
  return {
    x: xIdx * spacing - offset,
    y: yIdx * spacing - offset,
    z: zIdx * spacing - offset,
  };
}
