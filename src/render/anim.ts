import type { SlideContentAnimation } from '../domain/enums';

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 2);
export const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

export interface AnimState {
  alpha: number;
  dx: number; // in canvas px
  dy: number;
  scale: number;
  reveal: number; // 0..1 horizontal clip reveal (for wipe / typewriter)
  textFraction: number; // 0..1 of characters shown (typewriter / handwriting)
  shimmer: number; // 0..1 sweep position, <0 = inactive
}

const DEFAULT: AnimState = { alpha: 1, dx: 0, dy: 0, scale: 1, reveal: 1, textFraction: 1, shimmer: -1 };

interface Cfg {
  duration: number; // ms
  loop: boolean;
}
const CONFIG: Record<SlideContentAnimation, Cfg> = {
  none: { duration: 100, loop: false },
  typewriter: { duration: 2800, loop: false },
  slideUp: { duration: 1200, loop: false },
  slideIn: { duration: 1200, loop: false },
  fadeStagger: { duration: 2000, loop: false },
  float: { duration: 2200, loop: true },
  zoomPulse: { duration: 3000, loop: true },
  wipeReveal: { duration: 2200, loop: false },
  handwriting: { duration: 2600, loop: false },
  shimmer: { duration: 2600, loop: true },
  driftZoom: { duration: 7000, loop: true },
};

// localMs = milliseconds since the slide became current.
export function computeAnim(
  type: SlideContentAnimation,
  localMs: number,
  w: number,
  h: number,
): AnimState {
  if (type === 'none') return DEFAULT;
  const cfg = CONFIG[type];
  const raw = localMs / cfg.duration;
  const t = cfg.loop ? raw % 1 : clamp01(raw);
  const unit = Math.min(w, h);
  switch (type) {
    case 'typewriter':
      return { ...DEFAULT, alpha: clamp01(localMs / 250), textFraction: t };
    case 'slideUp': {
      const e = easeOutCubic(t);
      return { ...DEFAULT, alpha: e, dy: (1 - e) * unit * 0.14 };
    }
    case 'slideIn': {
      const e = easeOutCubic(t);
      return { ...DEFAULT, alpha: e, dx: -(1 - e) * w * 0.22 };
    }
    case 'fadeStagger':
      return { ...DEFAULT, alpha: t };
    case 'float': {
      const phase = (localMs / cfg.duration) * Math.PI * 2;
      return { ...DEFAULT, dy: -Math.sin(phase) * unit * 0.02 };
    }
    case 'zoomPulse': {
      const phase = (localMs / cfg.duration) * Math.PI * 2;
      return { ...DEFAULT, scale: 1 + 0.08 * Math.sin(phase) };
    }
    case 'wipeReveal':
      return { ...DEFAULT, reveal: easeOut(t) };
    case 'handwriting':
      return { ...DEFAULT, alpha: clamp01(localMs / 200), textFraction: easeInOutCubic(t) };
    case 'shimmer': {
      const p = (localMs % cfg.duration) / cfg.duration; // 0..1
      return { ...DEFAULT, shimmer: -0.18 + p * 1.36 };
    }
    case 'driftZoom': {
      const phase = (localMs / cfg.duration) * Math.PI * 2;
      return { ...DEFAULT, scale: 1 + 0.06 * Math.sin(phase), dx: Math.sin(phase * 0.5) * w * 0.03 };
    }
    default:
      return DEFAULT;
  }
}
