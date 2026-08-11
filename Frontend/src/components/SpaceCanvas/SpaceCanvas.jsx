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

    // ── 1. Twinkling Starfield ──────────────────────────────────────────
    const STAR_COUNT = Math.floor(Math.min(width, height) * 0.2);
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.4,
      alpha: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.04 + 0.01,
      color: Math.random() > 0.35 ? '#F8FAFC' : Math.random() > 0.5 ? '#00F0FF' : '#10B981',
      twinkleSpeed: Math.random() * 0.025 + 0.005,
      twinklePhase: Math.random() * Math.PI * 2,
    }));

    // ── 2. Floating Ambient Blurry Cosmic Nebulae Orbs ─────────────────
    const ambientOrbs = [
      {
        baseX: 0.25, baseY: 0.3,
        radius: 260,
        color: '0, 240, 255', // Cyber Cyan
        opacity: 0.12,
        speedX: 0.12, speedY: 0.08,
      },
      {
        baseX: 0.75, baseY: 0.6,
        radius: 320,
        color: '99, 102, 241', // Indigo Violet
        opacity: 0.09,
        speedX: 0.09, speedY: 0.14,
      },
      {
        baseX: 0.45, baseY: 0.8,
        radius: 220,
        color: '16, 185, 129', // Emerald
        opacity: 0.08,
        speedX: 0.15, speedY: 0.1,
      },
    ];

    // ── 3. Shooting Stars (Meteors / Comets) ───────────────────────────
    const shootingStars = [];

    const spawnShootingStar = () => {
      const startOnTop = Math.random() > 0.5;
      const x = startOnTop ? Math.random() * width * 0.8 : -50;
      const y = startOnTop ? -50 : Math.random() * height * 0.6;
      const length = Math.random() * 100 + 80;
      const speed = Math.random() * 8 + 6;
      const angle = Math.PI / 4 + (Math.random() * 0.2 - 0.1); // ~45 deg
      const color = Math.random() > 0.4 ? '#FFFFFF' : Math.random() > 0.5 ? '#00F0FF' : '#10B981';

      shootingStars.push({
        x, y,
        length, speed, angle, color,
        alpha: 1.0,
        life: 0,
        maxLife: Math.random() * 40 + 35,
      });
    };

    // Periodically spawn shooting stars
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

      // Deep Obsidian base space gradient
      const baseGrad = ctx.createRadialGradient(
        width * 0.5, height * 0.45, 80,
        width * 0.5, height * 0.5, Math.max(width, height) * 0.85
      );
      baseGrad.addColorStop(0, '#0A0F17');
      baseGrad.addColorStop(0.6, '#05080E');
      baseGrad.addColorStop(1, '#020408');

      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // ── RENDER FLOATING AMBIENT BLURRY ORBS ─────────────────────────
      ambientOrbs.forEach(orb => {
        const ox = (orb.baseX + Math.sin(time * orb.speedX) * 0.12) * width;
        const oy = (orb.baseY + Math.cos(time * orb.speedY) * 0.12) * height;

        ctx.save();
        const orbGrad = ctx.createRadialGradient(ox, oy, 10, ox, oy, orb.radius);
        orbGrad.addColorStop(0, `rgba(${orb.color}, ${orb.opacity})`);
        orbGrad.addColorStop(0.5, `rgba(${orb.color}, ${orb.opacity * 0.4})`);
        orbGrad.addColorStop(1, `rgba(${orb.color}, 0)`);

        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(ox, oy, orb.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // ── SUBTLE ORBITAL RADAR RINGS ─────────────────────────────────
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.022)';
      ctx.lineWidth = 1;

      for (let r = 200; r <= Math.max(width, height); r += 280) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // ── RENDER TWINKLING STARS ────────────────────────────────────
      stars.forEach(star => {
        star.twinklePhase += star.twinkleSpeed;
        const currentAlpha = Math.max(0.1, star.alpha + Math.sin(star.twinklePhase) * 0.25);

        star.y -= star.speed;
        if (star.y < 0) {
          star.y = height;
          star.x = Math.random() * width;
        }

        ctx.save();
        ctx.globalAlpha = currentAlpha;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // ── SPAWN & RENDER SHOOTING STARS ──────────────────────────────
      if (now - lastSpawnTime > (Math.random() * 2500 + 2000)) {
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

        // Calculate tail end point
        const tailX = ss.x - Math.cos(ss.angle) * ss.length;
        const tailY = ss.y - Math.sin(ss.angle) * ss.length;

        ctx.save();
        ctx.globalAlpha = ss.alpha;

        // Fading linear gradient tail
        const tailGrad = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY);
        tailGrad.addColorStop(0, '#FFFFFF');
        tailGrad.addColorStop(0.3, ss.color);
        tailGrad.addColorStop(1, 'transparent');

        ctx.strokeStyle = tailGrad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        // Head glare dot
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 1.8, 0, Math.PI * 2);
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
