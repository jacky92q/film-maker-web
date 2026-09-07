import { envelopeAt, type MusicSettings } from './mix';
import { loadTrack } from './store';

// Live music playback for preview, kept in step with the film's clock.
// The track loops for as long as the film runs.
export class MusicPlayer {
  private ctx: AudioContext | null = null;
  private gain: GainNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private buffer: AudioBuffer | null = null;
  private settings: MusicSettings;
  private total: number;
  private token = 0;

  constructor(settings: MusicSettings, total: number) {
    this.settings = settings;
    this.total = total;
  }

  get ready(): boolean {
    return !!this.buffer;
  }

  get duration(): number {
    return this.buffer?.duration ?? 0;
  }

  async load(path: string | null): Promise<boolean> {
    const token = ++this.token;
    const buffer = await loadTrack(path);
    if (token !== this.token) return false;
    this.buffer = buffer;
    return !!buffer;
  }

  update(settings: MusicSettings, total: number) {
    this.settings = settings;
    this.total = total;
  }

  private ensureContext(): AudioContext | null {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.gain = this.ctx.createGain();
      this.gain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  // `at` is the film's current time in seconds.
  play(at: number) {
    const ctx = this.ensureContext();
    if (!ctx || !this.buffer || !this.gain) return;
    void ctx.resume();
    this.stopSource();
    const source = ctx.createBufferSource();
    source.buffer = this.buffer;
    source.loop = true;
    source.loopStart = 0;
    source.loopEnd = this.buffer.duration;
    source.connect(this.gain);
    this.gain.gain.value = envelopeAt(at, this.total, this.settings);
    // Wrap the offset so a short song restarts from the top mid-film.
    source.start(0, at % this.buffer.duration);
    this.source = source;
  }

  pause() {
    this.stopSource();
  }

  // Called on every frame so fades follow the film's clock exactly.
  tick(at: number) {
    if (!this.gain || !this.ctx) return;
    const target = envelopeAt(at, this.total, this.settings);
    this.gain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.02);
  }

  private stopSource() {
    if (!this.source) return;
    try {
      this.source.stop();
    } catch {
      /* already stopped */
    }
    this.source.disconnect();
    this.source = null;
  }

  dispose() {
    this.token++;
    this.stopSource();
    void this.ctx?.close();
    this.ctx = null;
    this.gain = null;
  }
}
