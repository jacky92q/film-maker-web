import type { Project, Slide } from '../domain/models';
import { easeInOutCubic } from './anim';
import { drawSlide } from './drawSlide';
import { compositeTransition, TRANSITION_MS } from './transitions';
import { loadImage } from '../lib/imageStore';
import { ORIENTATION_DIMS } from '../domain/enums';

export interface PlayerCallbacks {
  onTick?: (elapsed: number, total: number, slideIndex: number) => void;
  onEnded?: () => void;
}

// Drives slideshow playback (and frame-accurate rendering for export) onto a
// 2D canvas at the project's canonical resolution.
export class FilmPlayer {
  readonly w: number;
  readonly h: number;
  private ctx: CanvasRenderingContext2D;
  private prevCanvas: HTMLCanvasElement;
  private curCanvas: HTMLCanvasElement;
  private prevCtx: CanvasRenderingContext2D;
  private curCtx: CanvasRenderingContext2D;

  private slides: Slide[];
  private starts: number[] = []; // start time (s) of each slide
  total = 0;

  private raf = 0;
  private lastTs = 0;
  elapsed = 0;
  playing = false;

  constructor(
    private canvas: HTMLCanvasElement,
    project: Project,
    private cb: PlayerCallbacks = {},
  ) {
    const dims = ORIENTATION_DIMS[project.orientation];
    this.w = dims.w;
    this.h = dims.h;
    canvas.width = this.w;
    canvas.height = this.h;
    this.ctx = canvas.getContext('2d')!;
    this.slides = project.slides;

    this.prevCanvas = document.createElement('canvas');
    this.curCanvas = document.createElement('canvas');
    this.prevCanvas.width = this.curCanvas.width = this.w;
    this.prevCanvas.height = this.curCanvas.height = this.h;
    this.prevCtx = this.prevCanvas.getContext('2d')!;
    this.curCtx = this.curCanvas.getContext('2d')!;

    let acc = 0;
    for (const s of this.slides) {
      this.starts.push(acc);
      acc += s.durationSeconds;
    }
    this.total = acc;
    this.preload();
  }

  private async preload() {
    const paths = new Set<string>();
    for (const s of this.slides) {
      if (s.imagePath) paths.add(s.imagePath);
      s.photoLayers.forEach((l) => l.imagePath && paths.add(l.imagePath));
    }
    await Promise.all([...paths].map((p) => loadImage(p)));
    this.renderAt(this.elapsed);
  }

  slideIndexAt(t: number): number {
    for (let i = this.slides.length - 1; i >= 0; i--) {
      if (t >= this.starts[i] - 1e-6) return i;
    }
    return 0;
  }

  // Render the composited film at absolute time t (seconds).
  renderAt(t: number) {
    const idx = this.slideIndexAt(t);
    const slide = this.slides[idx];
    const localS = t - this.starts[idx];
    const localMs = localS * 1000;

    const inTransition = idx > 0 && localMs < TRANSITION_MS;
    if (inTransition) {
      const prev = this.slides[idx - 1];
      const prevLocalMs = (this.starts[idx] - this.starts[idx - 1]) * 1000 + localMs;
      drawSlide(this.prevCtx, prev, this.w, this.h, { localMs: prevLocalMs });
      drawSlide(this.curCtx, slide, this.w, this.h, { localMs });
      const p = easeInOutCubic(localMs / TRANSITION_MS);
      compositeTransition(this.ctx, this.prevCanvas, this.curCanvas, slide.transition, p, this.w, this.h);
    } else {
      drawSlide(this.ctx, slide, this.w, this.h, { localMs });
    }
    this.cb.onTick?.(t, this.total, idx);
  }

  private loop = (ts: number) => {
    if (!this.playing) return;
    if (!this.lastTs) this.lastTs = ts;
    const dt = (ts - this.lastTs) / 1000;
    this.lastTs = ts;
    this.elapsed += dt;
    if (this.elapsed >= this.total) {
      this.elapsed = this.total;
      this.renderAt(this.elapsed);
      this.pause();
      this.cb.onEnded?.();
      return;
    }
    this.renderAt(this.elapsed);
    this.raf = requestAnimationFrame(this.loop);
  };

  play() {
    if (this.playing) return;
    if (this.elapsed >= this.total) this.elapsed = 0;
    this.playing = true;
    this.lastTs = 0;
    this.raf = requestAnimationFrame(this.loop);
  }

  pause() {
    this.playing = false;
    cancelAnimationFrame(this.raf);
  }

  toggle() {
    this.playing ? this.pause() : this.play();
  }

  seek(t: number) {
    this.elapsed = Math.max(0, Math.min(t, this.total));
    this.lastTs = 0;
    this.renderAt(this.elapsed);
  }

  seekSlide(i: number) {
    const idx = Math.max(0, Math.min(i, this.slides.length - 1));
    this.seek(this.starts[idx] + 0.0001);
  }

  nextSlide() {
    this.seekSlide(this.slideIndexAt(this.elapsed) + 1);
  }
  prevSlide() {
    this.seekSlide(this.slideIndexAt(this.elapsed) - 1);
  }

  dispose() {
    this.pause();
  }
}
