import type { Project } from '../domain/models';
import { musicSettings } from '../domain/models';
import { FilmRenderer } from './FilmRenderer';
import { MusicPlayer } from '../audio/player';

export interface PlayerCallbacks {
  onTick?: (elapsed: number, total: number, slideIndex: number) => void;
  onEnded?: () => void;
  onReady?: () => void;
}

// Drives playback of a film onto a canvas, with the soundtrack riding along.
export class FilmPlayer {
  readonly renderer: FilmRenderer;
  readonly total: number;
  readonly music: MusicPlayer;

  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private lastTs = 0;
  private disposed = false;

  elapsed = 0;
  playing = false;
  hasMusic = false;

  constructor(
    private canvas: HTMLCanvasElement,
    project: Project,
    private cb: PlayerCallbacks = {},
  ) {
    this.renderer = new FilmRenderer(project);
    this.total = this.renderer.total;
    canvas.width = this.renderer.w;
    canvas.height = this.renderer.h;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('2D canvas is unavailable in this browser.');
    this.ctx = ctx;

    this.music = new MusicPlayer(musicSettings(project), this.total);
    void this.prepare(project);
  }

  private async prepare(project: Project) {
    await this.renderer.preload();
    this.hasMusic = await this.music.load(project.musicPath);
    if (this.disposed) return;
    // Show a real frame rather than the film's opening black.
    this.renderAt(this.elapsed, false);
    this.cb.onReady?.();
  }

  slideIndexAt(t: number): number {
    return this.renderer.slideIndexAt(t);
  }

  renderAt(t: number, dip = true) {
    this.renderer.renderTo(this.ctx, t, this.canvas.width, this.canvas.height, dip);
    this.cb.onTick?.(t, this.total, this.renderer.slideIndexAt(t));
  }

  private loop = (ts: number) => {
    if (!this.playing) return;
    if (!this.lastTs) this.lastTs = ts;
    // Clamp the step so a backgrounded tab does not jump the film forward.
    const dt = Math.min(0.25, (ts - this.lastTs) / 1000);
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
    this.music.tick(this.elapsed);
    this.raf = requestAnimationFrame(this.loop);
  };

  play() {
    if (this.playing) return;
    if (this.elapsed >= this.total - 0.01) this.elapsed = 0;
    this.playing = true;
    this.lastTs = 0;
    this.music.play(this.elapsed);
    this.raf = requestAnimationFrame(this.loop);
  }

  pause() {
    this.playing = false;
    cancelAnimationFrame(this.raf);
    this.music.pause();
  }

  toggle() {
    if (this.playing) this.pause();
    else this.play();
  }

  seek(t: number) {
    const wasPlaying = this.playing;
    if (wasPlaying) this.pause();
    this.elapsed = Math.max(0, Math.min(t, this.total));
    this.lastTs = 0;
    this.renderAt(this.elapsed);
    if (wasPlaying) this.play();
  }

  seekSlide(i: number) {
    const idx = Math.max(0, Math.min(i, this.renderer.slides.length - 1));
    this.seek(this.renderer.startOf(idx) + 0.001);
  }

  nextSlide() {
    this.seekSlide(this.renderer.slideIndexAt(this.elapsed) + 1);
  }

  prevSlide() {
    // Tap once to restart the current slide, again to step back — like a
    // music player's previous-track button.
    const idx = this.renderer.slideIndexAt(this.elapsed);
    const intoSlide = this.elapsed - this.renderer.startOf(idx);
    this.seekSlide(intoSlide > 1.2 ? idx : idx - 1);
  }

  dispose() {
    this.disposed = true;
    this.pause();
    this.music.dispose();
  }
}
