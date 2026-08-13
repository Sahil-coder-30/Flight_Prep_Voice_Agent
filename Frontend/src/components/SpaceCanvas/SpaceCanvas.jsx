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

    // ── 1. Pristine Twinkling Starfield ──────────────────────────────────
    const STAR_COUNT = Math.floor(Math.min(width, height) * 0.12);
    const stars = Array.from({ length: STAR_COUNT }, () => {
      const typeRand = Math.random();
      let size = Math.random() * 0.7 + 0.4;
      let isHero = false;
      if (typeRand > 0.93) {
        size = Math.random() * 0.7 + 1.7; // Glowing hero star
        isHero = true;
      } else if (typeRand > 0.80) {
        size = Math.random() * 0.5 + 1.0;
      }

      const colorRand = Math.random();
      let color = '#FAFAFA'; // Pristine Off-White
      if (colorRand > 0.85) color = '#FDE68A';      // Champagne Gold pinch
      else if (colorRand > 0.72) color = '#A7F3D0'; // Emerald Mint pinch
      else if (colorRand > 0.55) color = '#E4E4E7'; // Silver Zinc

      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size,
        isHero,
        baseAlpha: Math.random() * 0.45 + 0.3,
        twinkleSpeed: Math.random() * 0.025 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
        vx: (Math.random() * 0.14 - 0.07),
        vy: -(Math.random() * 0.2 + 0.06) * (size * 0.5 + 0.5),
        color,
      };
    });

    // ── 2. Subtle Industry SaaS Blurred Orbs (Zinc/Silver/Emerald Pinches) ─────
    const ambientOrbs = [
      {
        baseX: 0.22, baseY: 0.28,
        radius: 400,
        color: '255, 255, 255', // Pure Crisp White Glow
        opacity: 0.035,
        speedX: 0.05, speedY: 0.06,
      },
      {
        baseX: 0.78, baseY: 0.48,
        radius: 450,
        color: '228, 228, 231', // Zinc Silver
        opacity: 0.03,
        speedX: 0.04, speedY: 0.05,
      },
      {
        baseX: 0.48, baseY: 0.80,
        radius: 360,
        color: '16, 185, 129', // Subtle Emerald Pinch
        opacity: 0.025,
        speedX: 0.06, speedY: 0.07,
      },
    ];

    // ── 3. Shooting Stars (Meteors with Silver & White Trails) ───────────
    const shootingStars = [];

    const spawnShootingStar = () => {
      const startOnTop = Math.random() > 0.5;
      const x = startOnTop ? Math.random() * width * 0.85 : -50;
      const y = startOnTop ? -50 : Math.random() * height * 0.6;
      const length = Math.random() * 110 + 80;
      const speed = Math.random() * 7 + 6;
      const angle = Math.PI / 4 + (Math.random() * 0.1 - 0.05); // ~45 deg trail
      const colors = ['#FFFFFF', '#F4F4F5', '#E4E4E7', '#A7F3D0'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      shootingStars.push({
        x, y,
        length, speed, angle, color,
        alpha: 1.0,
        life: 0,
        maxLife: Math.random() * 36 + 30,
      });
    };

    let lastSpawnTime = 0;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const startTime = performance.now();

    const render = (now) => {
      const time = (now - startTime) / 1000;
      ctx.clearRect(0, 0, width, height);

      // Pitch-Black Pitch-Zinc Industry Standard SaaS Gradient (Vercel/Linear)
      const baseGrad = ctx.createRadialGradient(
        width * 0.5, height * 0.35, 120,
        width * 0.5, height * 0.5, Math.max(width, height) * 0.95
      );
      baseGrad.addColorStop(0, '#09090B');   // Deep Obsidian Pitch-Zinc
      baseGrad.addColorStop(0.6, '#060608'); // Dark Obsidian Void
      baseGrad.addColorStop(1, '#030304');   // Pure Obsidian Boundary

      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // ── RENDER SUBTLE AMBIENT BLURRED ORBS ────────────────────────────
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

      // ── RENDER SUBTLE TACTICAL COCKPIT HUD RINGS ──────────────────────
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1;

      for (let r = 240; r <= Math.max(width, height); r += 320) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // ── RENDER TWINKLING STARS ────────────────────────────────────────
      stars.forEach(star => {
        star.twinklePhase += star.twinkleSpeed;
        const twinkleFactor = (Math.sin(star.twinklePhase) + 1) / 2;
        const currentAlpha = Math.max(0.12, star.baseAlpha * (0.35 + twinkleFactor * 0.65));

        star.x += star.vx;
        star.y += star.vy;

        if (star.y < -10) {
          star.y = height + 10;
          star.x = Math.random() * width;
        }
        if (star.x < -10) star.x = width + 10;
        if (star.x > width + 10) star.x = -10;

        ctx.save();
        ctx.globalAlpha = currentAlpha;

        if (star.isHero) {
          const glowGrad = ctx.createRadialGradient(
            star.x, star.y, 0,
            star.x, star.y, star.size * 3.5
          );
          glowGrad.addColorStop(0, star.color);
          glowGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.12)');
          glowGrad.addColorStop(1, 'transparent');

          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 3.5, 0, Math.PI * 2);
          ctx.fill();

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

      // ── SPAWN & RENDER SHOOTING STARS (METEORS) ─────────────────────
      if (now - lastSpawnTime > (Math.random() * 2200 + 1800)) {
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
        tailGrad.addColorStop(0.25, ss.color);
        tailGrad.addColorStop(1, 'transparent');

        ctx.strokeStyle = tailGrad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 1.6, 0, Math.PI * 2);
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
