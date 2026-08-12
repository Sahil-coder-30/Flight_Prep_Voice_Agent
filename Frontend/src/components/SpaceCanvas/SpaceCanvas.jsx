import React, { useRef, useEffect } from 'react';
import './SpaceCanvas.scss';

export default function SpaceCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // ── 1. Aesthetic Twinkling & Drifting Starfield ─────────────────────
    // Clean, elegant density (approx 90-110 stars)
    const STAR_COUNT = Math.floor(Math.min(width, height) * 0.10);
    const stars = Array.from({ length: STAR_COUNT }, () => {
      const typeRand = Math.random();
      let size = Math.random() * 0.7 + 0.4; // 80% micro stars (0.4px - 1.1px)
      let isHero = false;
      if (typeRand > 0.94) {
        size = Math.random() * 0.7 + 1.7; // 6% hero glowing stars (1.7px - 2.4px)
        isHero = true;
      } else if (typeRand > 0.80) {
        size = Math.random() * 0.5 + 1.1; // 14% medium stars (1.1px - 1.6px)
      }

      // Elegant palette: Pure warm white, champagne gold dust, ice silver, soft mint spark
      const colorRand = Math.random();
      let color = '#F8FAFC';
      if (colorRand > 0.82) {
        color = '#FDE68A'; // Warm champagne gold
      } else if (colorRand > 0.68) {
        color = '#A7F3D0'; // Soft mint emerald
      } else if (colorRand > 0.52) {
        color = '#E2E8F0'; // Ice silver
      }

      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size,
        isHero,
        baseAlpha: Math.random() * 0.45 + 0.3,
        twinkleSpeed: Math.random() * 0.025 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
        // Smooth floating motion velocity
        vx: (Math.random() * 0.16 - 0.08),
        vy: -(Math.random() * 0.22 + 0.08) * (size * 0.6 + 0.5),
        color,
      };
    });

    // ── 2. Floating Ambient Cosmic Nebulae Orbs ─────────────────────────
    const ambientOrbs = [
      {
        baseX: 0.22, baseY: 0.28,
        radius: 340,
        color: '255, 255, 255', // Pristine Off-White Glow
        opacity: 0.04,
        speedX: 0.08, speedY: 0.06,
      },
      {
        baseX: 0.78, baseY: 0.55,
        radius: 380,
        color: '228, 228, 231', // Silver Dust
        opacity: 0.035,
        speedX: 0.06, speedY: 0.09,
      },
      {
        baseX: 0.48, baseY: 0.82,
        radius: 280,
        color: '244, 244, 245', // Zinc White
        opacity: 0.03,
        speedX: 0.1, speedY: 0.07,
      },
    ];

    // ── 3. Shooting Stars (Meteors / Comets) ───────────────────────────
    const shootingStars = [];

    const spawnShootingStar = () => {
      const startOnTop = Math.random() > 0.5;
      const x = startOnTop ? Math.random() * width * 0.8 : -50;
      const y = startOnTop ? -50 : Math.random() * height * 0.6;
      const length = Math.random() * 90 + 70;
      const speed = Math.random() * 6 + 5;
      const angle = Math.PI / 4 + (Math.random() * 0.15 - 0.075); // ~45 deg
      const color = Math.random() > 0.5 ? '#FAFAFA' : Math.random() > 0.5 ? '#E4E4E7' : '#FFFFFF';

      shootingStars.push({
        x, y,
        length, speed, angle, color,
        alpha: 1.0,
        life: 0,
        maxLife: Math.random() * 38 + 32,
      });
    };

    let lastSpawnTime = 0;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    let startTime = performance.now();

    const render = (now) => {
      const time = (now - startTime) / 1000;
      ctx.clearRect(0, 0, width, height);

      // Pitch-Black Luxury SaaS Space Gradient
      const baseGrad = ctx.createRadialGradient(
        width * 0.5, height * 0.4, 100,
        width * 0.5, height * 0.5, Math.max(width, height) * 0.9
      );
      baseGrad.addColorStop(0, '#0C0C0F');
      baseGrad.addColorStop(0.55, '#08080A');
      baseGrad.addColorStop(1, '#040405');

      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // ── RENDER FLOATING AMBIENT NEBULAE ──────────────────────────────
      ambientOrbs.forEach(orb => {
        const ox = (orb.baseX + Math.sin(time * orb.speedX) * 0.10) * width;
        const oy = (orb.baseY + Math.cos(time * orb.speedY) * 0.10) * height;

        ctx.save();
        const orbGrad = ctx.createRadialGradient(ox, oy, 10, ox, oy, orb.radius);
        orbGrad.addColorStop(0, `rgba(${orb.color}, ${orb.opacity})`);
        orbGrad.addColorStop(0.5, `rgba(${orb.color}, ${orb.opacity * 0.35})`);
        orbGrad.addColorStop(1, `rgba(${orb.color}, 0)`);

        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(ox, oy, orb.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // ── SUBTLE RADAR HUD RINGS ──────────────────────────────────────
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.015)';
      ctx.lineWidth = 1;

      for (let r = 220; r <= Math.max(width, height); r += 320) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // ── RENDER CLEAN MOVING & TWINKLING STARS ───────────────────────
      stars.forEach(star => {
        // 1. Smooth Sine-wave Twinkle
        star.twinklePhase += star.twinkleSpeed;
        const twinkleFactor = (Math.sin(star.twinklePhase) + 1) / 2; // 0 to 1
        const currentAlpha = Math.max(0.12, star.baseAlpha * (0.35 + twinkleFactor * 0.65));

        // 2. Fluid Drift Motion
        star.x += star.vx;
        star.y += star.vy;

        // Wrap around edges seamlessly
        if (star.y < -10) {
          star.y = height + 10;
          star.x = Math.random() * width;
        }
        if (star.x < -10) star.x = width + 10;
        if (star.x > width + 10) star.x = -10;

        ctx.save();
        ctx.globalAlpha = currentAlpha;

        if (star.isHero) {
          // Soft aura glow for hero stars
          const glowGrad = ctx.createRadialGradient(
            star.x, star.y, 0,
            star.x, star.y, star.size * 3.5
          );
          glowGrad.addColorStop(0, star.color);
          glowGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
          glowGrad.addColorStop(1, 'transparent');

          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Hero core
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = star.color;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // ── SPAWN & RENDER SHOOTING STARS ──────────────────────────────
      if (now - lastSpawnTime > (Math.random() * 3000 + 3000)) {
        spawnShootingStar();
        lastSpawnTime = now;
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.life += 1;
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;
        ss.alpha = Math.max(0, 1 - ss.life / ss.maxLife);

        if (ss.life >= ss.maxLife || ss.x > width + 100 || ss.y > height + 100) {
          shootingStars.splice(i, 1);
          continue;
        }

        const tailX = ss.x - Math.cos(ss.angle) * ss.length;
        const tailY = ss.y - Math.sin(ss.angle) * ss.length;

        ctx.save();
        ctx.globalAlpha = ss.alpha;

        const tailGrad = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY);
        tailGrad.addColorStop(0, '#FFFFFF');
        tailGrad.addColorStop(0.3, ss.color);
        tailGrad.addColorStop(1, 'transparent');

        ctx.strokeStyle = tailGrad;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="space-canvas" aria-hidden="true" />;
}
