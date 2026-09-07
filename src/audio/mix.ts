// Turning a music track into the film's soundtrack: loop it until the film
// ends, and shape the ends so it starts and finishes gracefully.

export interface MusicSettings {
  volume: number; // 0..1
  fadeIn: number; // seconds
  fadeOut: number; // seconds
}

export const DEFAULT_MUSIC: MusicSettings = { volume: 0.8, fadeIn: 1.2, fadeOut: 2.5 };

// Gain at film time `t` for a film of `total` seconds.
export function envelopeAt(t: number, total: number, s: MusicSettings): number {
  const v = Math.max(0, Math.min(1, s.volume));
  if (v === 0) return 0;
  let g = v;
  if (s.fadeIn > 0 && t < s.fadeIn) g *= Math.max(0, t / s.fadeIn);
  const outStart = total - s.fadeOut;
  if (s.fadeOut > 0 && t > outStart) g *= Math.max(0, (total - t) / s.fadeOut);
  return g;
}

// Render the full soundtrack offline: the source loops for as long as the film
// runs, so a 30-second song under a two-minute film simply starts over.
export async function renderMusicBed(
  buffer: AudioBuffer,
  totalSeconds: number,
  settings: MusicSettings,
  sampleRate = 48000,
): Promise<AudioBuffer> {
  const channels = Math.min(2, Math.max(1, buffer.numberOfChannels));
  const length = Math.max(1, Math.ceil(totalSeconds * sampleRate));
  const ctx = new OfflineAudioContext(channels, length, sampleRate);

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.loopStart = 0;
  source.loopEnd = buffer.duration;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(settings.fadeIn > 0 ? 0 : settings.volume, 0);
  if (settings.fadeIn > 0) {
    gain.gain.linearRampToValueAtTime(settings.volume, Math.min(settings.fadeIn, totalSeconds));
  }
  if (settings.fadeOut > 0 && totalSeconds > settings.fadeOut) {
    gain.gain.setValueAtTime(settings.volume, totalSeconds - settings.fadeOut);
    gain.gain.linearRampToValueAtTime(0, totalSeconds);
  }

  source.connect(gain).connect(ctx.destination);
  source.start(0);
  return ctx.startRendering();
}
