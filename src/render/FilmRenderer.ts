import type { Project, Slide } from '../domain/models';
import { ORIENTATION_DIMS } from '../domain/enums';
import { easeInOutCubic } from './anim';
import { drawSlide } from './drawSlide';
import { compositeTransition, TRANSITION_MS } from './transitions';
import { loadImage } from '../lib/imageStore';
import { loadProjectFonts } from '../lib/fonts';
import { preloadStickers } from './stickerImages';

// Opening and closing dips to black — the difference between a slideshow and
// something that reads as a film.
export const OPEN_FADE_MS = 700;
export const CLOSE_FADE_MS = 900;

// One place that knows how to paint the film at an arbitrary time, shared by
// live preview and by the exporter, so what you watch is what you get.
export class FilmRenderer {
  readonly w: number;
  readonly h: number;
  readonly total: number;
  readonly slides: Slide[];
  private starts: number[] = [];

  private main: HTMLCanvasElement;
  private mainCtx: CanvasRenderingContext2D;
  private prev: HTMLCanvasElement;
  private prevCtx: CanvasRenderingContext2D;
  private cur: HTMLCanvasElement;
  private curCtx: CanvasRenderingContext2D;

  constructor(private project: Project) {
    const dims = ORIENTATION_DIMS[project.orientation];
    this.w = dims.w;
    this.h = dims.h;
    this.slides = project.slides;

    let acc = 0;
    for (const s of this.slides) {
      this.starts.push(acc);
      acc += Math.max(0.5, s.durationSeconds);
    }
    this.total = Math.max(0.5, acc);

    [this.main, this.mainCtx] = makeCanvas(this.w, this.h);
    [this.prev, this.prevCtx] = makeCanvas(this.w, this.h);
    [this.cur, this.curCtx] = makeCanvas(this.w, this.h);
  }

  // Fetch every asset a frame could need. Until this resolves, frames may be
  // missing photos, stickers or the right typeface.
  async preload(): Promise<void> {
    const photos = new Set<string>();
    const stickers = new Set<string>();
    for (const s of this.slides) {
      if (s.imagePath) photos.add(s.imagePath);
      s.photoLayers.forEach((l) => l.imagePath && photos.add(l.imagePath));
      s.stickerLayers.forEach((l) => stickers.add(l.kind));
    }
    await Promise.all([
      ...[...photos].map((p) => loadImage(p)),
      preloadStickers(stickers),
      loadProjectFonts(this.project),
    ]);
  }

  slideIndexAt(t: number): number {
    for (let i = this.slides.length - 1; i >= 0; i--) {
      if (t >= this.starts[i] - 1e-6) return i;
    }
    return 0;
  }

  startOf(index: number): number {
    return this.starts[Math.max(0, Math.min(index, this.starts.length - 1))] ?? 0;
  }

  // Paint the composited frame at absolute time `t` onto the internal canvas.
  // `dip` draws the opening and closing fades to black; a poster frame wants
  // them skipped, since a black rectangle is a poor advert for the film.
  private compose(t: number, dip = true) {
    const idx = this.slideIndexAt(t);
    const slide = this.slides[idx];
    const localMs = (t - this.starts[idx]) * 1000;

    if (idx > 0 && localMs < TRANSITION_MS) {
      const previous = this.slides[idx - 1];
      const prevLocalMs = (this.starts[idx] - this.starts[idx - 1]) * 1000 + localMs;
      drawSlide(this.prevCtx, previous, this.w, this.h, { localMs: prevLocalMs });
      drawSlide(this.curCtx, slide, this.w, this.h, { localMs });
      const p = easeInOutCubic(localMs / TRANSITION_MS);
      compositeTransition(this.mainCtx, this.prev, this.cur, slide.transition, p, this.w, this.h);
    } else {
      drawSlide(this.mainCtx, slide, this.w, this.h, { localMs });
    }

    if (!dip) return;

    // Open on black, close on black.
    const ms = t * 1000;
    const fadeIn = Math.min(1, ms / OPEN_FADE_MS);
    const fadeOut = Math.min(1, (this.total * 1000 - ms) / CLOSE_FADE_MS);
    const amount = 1 - Math.min(fadeIn, Math.max(0, fadeOut));
    if (amount > 0.001) {
      this.mainCtx.save();
      this.mainCtx.fillStyle = `rgba(0,0,0,${amount})`;
      this.mainCtx.fillRect(0, 0, this.w, this.h);
      this.mainCtx.restore();
    }
  }

  // Draw the frame at time `t`, scaled to fill the destination canvas.
  renderTo(ctx: CanvasRenderingContext2D, t: number, outW: number, outH: number, dip = true) {
    this.compose(Math.max(0, Math.min(t, this.total)), dip);
    ctx.clearRect(0, 0, outW, outH);
    ctx.drawImage(this.main, 0, 0, outW, outH);
  }
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('2D canvas is unavailable in this browser.');
  return [canvas, ctx];
}
