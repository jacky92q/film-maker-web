import type { SlideAmbientEffect } from '../domain/enums';

// Deterministic PRNG so particle layouts are stable frame-to-frame.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Particle {
  x: number;
  size: number;
  speed: number;
  phase: number;
  hue: number;
  rot: number;
}

const cache = new Map<string, Particle[]>();
function particles(effect: string, count: number, w: number, h: number): Particle[] {
  const key = `${effect}_${count}_${w}x${h}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rnd = mulberry32(7 + effect.length * 13);
  const arr: Particle[] = [];
  for (let i = 0; i < count; i++) {
    arr.push({
      x: rnd(),
      size: rnd(),
      speed: rnd(),
      phase: rnd(),
      hue: rnd(),
      rot: rnd(),
    });
  }
  cache.set(key, arr);
  return arr;
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.4;
    const x = cx + Math.cos(ang) * rad;
    const y = cy + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.3);
  ctx.bezierCurveTo(cx + s, cy - s * 0.5, cx + s * 0.5, cy - s, cx, cy - s * 0.4);
  ctx.bezierCurveTo(cx - s * 0.5, cy - s, cx - s, cy - s * 0.5, cx, cy + s * 0.3);
  ctx.closePath();
  ctx.fill();
}

const CONFETTI = ['#E8B4B8', '#C9A84C', '#88A8C0', '#8FAF8F', '#E88070', '#B090C8'];

export function drawAmbient(
  ctx: CanvasRenderingContext2D,
  effect: SlideAmbientEffect,
  w: number,
  h: number,
  timeMs: number,
) {
  if (effect === 'none') return;
  const unit = Math.min(w, h);
  ctx.save();

  const cycle = (sec: number) => (timeMs / 1000 / sec) % 1;

  switch (effect) {
    case 'petalFall': {
      for (const p of particles(effect, 26, w, h)) {
        const t = (cycle(5) * (0.35 + p.speed * 0.45) + p.phase) % 1;
        const x = p.x * w + Math.sin(t * Math.PI * 4 + p.phase * 6) * w * 0.04;
        const y = t * h * 1.1 - h * 0.05;
        const s = unit * (0.01 + p.size * 0.014);
        ctx.globalAlpha = 0.7 * fade(t);
        ctx.fillStyle = `hsl(${340 + p.hue * 20}, 60%, ${72 + p.hue * 10}%)`;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * Math.PI * 4 + p.rot * 6);
        ctx.beginPath();
        ctx.ellipse(0, 0, s, s * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      break;
    }
    case 'sparkleRise': {
      for (const p of particles(effect, 22, w, h)) {
        const t = (cycle(5) * (0.3 + p.speed * 0.6) + p.phase) % 1;
        const x = p.x * w + Math.sin(t * Math.PI * 3) * w * 0.02;
        const y = h - t * h * 1.05;
        const s = unit * (0.006 + p.size * 0.016) * (0.6 + 0.4 * Math.sin(t * Math.PI));
        ctx.globalAlpha = fade(t);
        ctx.fillStyle = `hsl(${45 + p.hue * 12}, 90%, 70%)`;
        drawStar(ctx, x, y, s);
      }
      break;
    }
    case 'snowFall': {
      for (const p of particles(effect, 32, w, h)) {
        const t = (cycle(5) * (0.25 + p.speed * 0.4) + p.phase) % 1;
        const x = p.x * w + Math.sin(t * Math.PI * 3 + p.phase * 6) * w * 0.03;
        const y = t * h * 1.1 - h * 0.05;
        const s = unit * (0.006 + p.size * 0.012);
        ctx.globalAlpha = 0.85 * fade(t);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'heartFloat': {
      for (const p of particles(effect, 16, w, h)) {
        const t = (cycle(5) * (0.25 + p.speed * 0.45) + p.phase) % 1;
        const x = p.x * w + Math.sin(t * Math.PI * 2 + p.phase * 6) * w * 0.04;
        const y = h - t * h * 1.05;
        const s = unit * (0.012 + p.size * 0.018);
        ctx.globalAlpha = 0.8 * fade(t);
        ctx.fillStyle = `hsl(${342 + p.hue * 14}, 70%, 72%)`;
        drawHeart(ctx, x, y, s);
      }
      break;
    }
    case 'goldDust': {
      for (const p of particles(effect, 55, w, h)) {
        const t = (cycle(5) * (0.2 + p.speed * 0.5) + p.phase) % 1;
        const x = p.x * w + Math.sin(t * Math.PI * 2 + p.phase * 8) * w * 0.03;
        const y = h - t * h;
        const s = unit * (0.003 + p.size * 0.008);
        ctx.globalAlpha = (0.3 + 0.5 * Math.abs(Math.sin(t * Math.PI * 3 + p.phase * 6))) * fade(t);
        ctx.fillStyle = '#E8C86A';
        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'confettiFall': {
      const parr = particles(effect, 30, w, h);
      parr.forEach((p, i) => {
        const t = (cycle(5) * (0.3 + p.speed * 0.5) + p.phase) % 1;
        const x = p.x * w + Math.sin(t * Math.PI * 3 + p.phase * 6) * w * 0.05;
        const y = t * h * 1.1 - h * 0.05;
        const s = unit * (0.008 + p.size * 0.012);
        ctx.globalAlpha = fade(t);
        ctx.fillStyle = CONFETTI[i % CONFETTI.length];
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * Math.PI * 6 + p.rot * 6);
        ctx.fillRect(-s / 2, -s, s, s * 2);
        ctx.restore();
      });
      break;
    }
    case 'bokeFloat': {
      for (const p of particles(effect, 11, w, h)) {
        const t = cycle(8);
        const ang = p.phase * Math.PI * 2 + t * Math.PI * 2 * (0.3 + p.speed * 0.4);
        const x = p.x * w + Math.cos(ang) * w * 0.06;
        const y = (p.size * 0.8 + 0.1) * h + Math.sin(ang) * h * 0.06;
        const s = unit * (0.06 + p.size * 0.12);
        const grad = ctx.createRadialGradient(x, y, 0, x, y, s);
        const col = CONFETTI[Math.floor(p.hue * CONFETTI.length) % CONFETTI.length];
        grad.addColorStop(0, hexA(col, 0.22));
        grad.addColorStop(0.7, hexA(col, 0.1));
        grad.addColorStop(1, hexA(col, 0));
        ctx.globalAlpha = 1;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'starTwinkle': {
      for (const p of particles(effect, 22, w, h)) {
        const x = p.x * w;
        const y = p.size * h;
        const tw = Math.pow(Math.abs(Math.sin(timeMs / 1000 / 1.8 * Math.PI * (0.4 + p.speed) + p.phase * 6)), 1.5);
        const s = unit * (0.008 + p.hue * 0.018);
        ctx.globalAlpha = 0.2 + 0.8 * tw;
        ctx.fillStyle = p.rot > 0.5 ? '#FFFFFF' : '#E8C86A';
        drawStar(ctx, x, y, s);
      }
      break;
    }
    case 'ribbonStream': {
      const parr = particles(effect, 14, w, h);
      parr.forEach((p, i) => {
        const t = (cycle(5) * (0.3 + p.speed * 0.4) + p.phase) % 1;
        const x = p.x * w;
        const y = t * h * 1.1 - h * 0.05;
        const len = unit * 0.18;
        ctx.globalAlpha = 0.6 * fade(t);
        ctx.strokeStyle = CONFETTI[i % CONFETTI.length];
        ctx.lineWidth = unit * (0.003 + p.size * 0.004);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.bezierCurveTo(
          x + Math.sin(t * 8) * w * 0.03, y + len * 0.33,
          x - Math.sin(t * 8) * w * 0.03, y + len * 0.66,
          x + Math.sin(t * 6) * w * 0.02, y + len,
        );
        ctx.stroke();
      });
      break;
    }
    case 'lightRays': {
      const parr = particles(effect, 7, w, h);
      ctx.globalCompositeOperation = 'screen';
      parr.forEach((p) => {
        const baseAng = -Math.PI / 2 + (p.x - 0.5) * 1.2;
        const ang = baseAng + Math.sin(timeMs / 1000 / 10 * Math.PI * 2 + p.phase * 6) * 0.06;
        const ox = w * (0.2 + p.x * 0.6);
        const width = unit * (0.14 + p.size * 0.1);
        const len = h * 1.3;
        ctx.save();
        ctx.translate(ox, -h * 0.05);
        ctx.rotate(ang + Math.PI / 2);
        const grad = ctx.createLinearGradient(0, 0, 0, len);
        grad.addColorStop(0, hexA('#FFF4D0', 0.22 + p.hue * 0.1));
        grad.addColorStop(1, hexA('#FFF4D0', 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(-width * 0.1, 0);
        ctx.lineTo(width * 0.1, 0);
        ctx.lineTo(width, len);
        ctx.lineTo(-width, len);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
      break;
    }
  }
  ctx.restore();
}

// fade-in/out near the start/end of a particle's travel
function fade(t: number): number {
  if (t < 0.08) return t / 0.08;
  if (t > 0.92) return (1 - t) / 0.08;
  return 1;
}

function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
