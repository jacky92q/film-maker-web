import type { TransitionEffect } from '../domain/enums';

// Composite the incoming slide (cur) over the outgoing slide (prev) according
// to the transition effect and eased progress p (0..1).
export function compositeTransition(
  ctx: CanvasRenderingContext2D,
  prev: HTMLCanvasElement,
  cur: HTMLCanvasElement,
  effect: TransitionEffect,
  p: number,
  w: number,
  h: number,
) {
  ctx.clearRect(0, 0, w, h);
  // outgoing stays beneath
  ctx.drawImage(prev, 0, 0, w, h);

  ctx.save();
  switch (effect) {
    case 'fade':
    case 'kenBurns':
      ctx.globalAlpha = p;
      ctx.drawImage(cur, 0, 0, w, h);
      break;
    case 'slideLeft':
      ctx.drawImage(cur, (1 - p) * w, 0, w, h);
      break;
    case 'slideRight':
      ctx.drawImage(cur, -(1 - p) * w, 0, w, h);
      break;
    case 'pushUp':
      ctx.drawImage(prev, 0, -p * h, w, h);
      ctx.drawImage(cur, 0, (1 - p) * h, w, h);
      break;
    case 'pushDown':
      ctx.drawImage(prev, 0, p * h, w, h);
      ctx.drawImage(cur, 0, -(1 - p) * h, w, h);
      break;
    case 'zoomIn': {
      ctx.globalAlpha = p;
      const s = 0.5 + 0.5 * p;
      ctx.translate(w / 2, h / 2);
      ctx.scale(s, s);
      ctx.drawImage(cur, -w / 2, -h / 2, w, h);
      break;
    }
    case 'blurDissolve': {
      ctx.globalAlpha = p;
      ctx.filter = `blur(${(1 - p) * 14}px)`;
      ctx.drawImage(cur, 0, 0, w, h);
      ctx.filter = 'none';
      break;
    }
    case 'wipeLeft': {
      const cw = w * p;
      ctx.beginPath();
      ctx.rect(w - cw, 0, cw, h);
      ctx.clip();
      ctx.drawImage(cur, 0, 0, w, h);
      break;
    }
    case 'wipeRight': {
      const cw = w * p;
      ctx.beginPath();
      ctx.rect(0, 0, cw, h);
      ctx.clip();
      ctx.drawImage(cur, 0, 0, w, h);
      break;
    }
    case 'circleReveal': {
      const maxR = Math.hypot(w, h) / 2;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, maxR * p, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(cur, 0, 0, w, h);
      break;
    }
    default:
      ctx.globalAlpha = p;
      ctx.drawImage(cur, 0, 0, w, h);
  }
  ctx.restore();
}

export const TRANSITION_MS = 600;
