import type { Project } from '../domain/models';
import { musicSettings } from '../domain/models';
import { FilmRenderer } from './FilmRenderer';
import { loadTrack } from '../audio/store';
import { renderMusicBed } from '../audio/mix';
import { Muxer as Mp4Muxer, ArrayBufferTarget as Mp4Target } from 'mp4-muxer';
import { Muxer as WebmMuxer, ArrayBufferTarget as WebmTarget } from 'webm-muxer';

export type ExportPhase = 'preparing' | 'soundtrack' | 'rendering' | 'finishing';

export interface ExportOptions {
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  onProgress?: (progress: number, phase: ExportPhase) => void;
  signal?: { cancelled: boolean };
}

export interface ExportResult {
  blob: Blob;
  ext: 'mp4' | 'webm';
  mime: string;
  hasAudio: boolean;
  /** True when the film was encoded frame by frame rather than captured live. */
  frameAccurate: boolean;
}

export class ExportCancelled extends Error {
  constructor() {
    super('Export cancelled');
    this.name = 'ExportCancelled';
  }
}

const AUDIO_SAMPLE_RATE = 48000;
const AUDIO_BITRATE = 192_000;
const AUDIO_FRAME = 1024;

// Every frame sitting in the encoder's queue is a full uncompressed picture —
// about 3 MB at 1080p, 12 MB at 4K. Handing the encoder frames faster than it
// drains them is what makes a phone's tab run out of memory and die, so the
// render loop waits for the queue to come down before drawing the next frame.
const MAX_VIDEO_QUEUE = 3;
const MAX_AUDIO_QUEUE = 16;

const hasWebCodecs = () =>
  typeof window !== 'undefined' && 'VideoEncoder' in window && 'VideoFrame' in window;

const yieldToUi = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

// Wait until the encoder has worked through its backlog. `encodeQueueSize`
// only falls as frames are actually encoded, so this is real backpressure
// rather than a single yield that lets the loop race ahead.
async function awaitQueue(encoder: { encodeQueueSize: number }, max: number, signal?: { cancelled: boolean }) {
  while (encoder.encodeQueueSize > max) {
    if (signal?.cancelled) return;
    await new Promise<void>((resolve) => setTimeout(resolve, 4));
  }
}

/* ------------------------------------------------------------------ *
 * Codec probing
 * ------------------------------------------------------------------ */

const AVC_CANDIDATES = ['avc1.640034', 'avc1.640033', 'avc1.4d0032', 'avc1.4d0028', 'avc1.42E01E'];
const VP9_CANDIDATES = ['vp09.00.10.08', 'vp8'];

async function firstSupportedVideo(
  candidates: string[],
  width: number,
  height: number,
  fps: number,
  bitrate: number,
): Promise<string | null> {
  for (const codec of candidates) {
    try {
      const res = await VideoEncoder.isConfigSupported({ codec, width, height, bitrate, framerate: fps });
      if (res?.supported) return codec;
    } catch {
      /* try the next one */
    }
  }
  return null;
}

async function audioSupported(codec: string, channels: number): Promise<boolean> {
  if (typeof AudioEncoder === 'undefined') return false;
  try {
    const res = await AudioEncoder.isConfigSupported({
      codec,
      sampleRate: AUDIO_SAMPLE_RATE,
      numberOfChannels: channels,
      bitrate: AUDIO_BITRATE,
    });
    return !!res?.supported;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ *
 * Containers
 * ------------------------------------------------------------------ */

interface Container {
  ext: 'mp4' | 'webm';
  mime: string;
  addVideo: (chunk: EncodedVideoChunk, meta?: EncodedVideoChunkMetadata) => void;
  addAudio: (chunk: EncodedAudioChunk, meta?: EncodedAudioChunkMetadata) => void;
  finalize: () => Blob;
}

function mp4Container(width: number, height: number, fps: number, channels: number | null): Container {
  const target = new Mp4Target();
  const muxer = new Mp4Muxer({
    target,
    video: { codec: 'avc', width, height, frameRate: fps },
    audio: channels ? { codec: 'aac', numberOfChannels: channels, sampleRate: AUDIO_SAMPLE_RATE } : undefined,
    fastStart: 'in-memory',
  });
  return {
    ext: 'mp4',
    mime: 'video/mp4',
    addVideo: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    addAudio: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
    finalize: () => {
      muxer.finalize();
      return new Blob([target.buffer], { type: 'video/mp4' });
    },
  };
}

function webmContainer(codec: string, width: number, height: number, fps: number, channels: number | null): Container {
  const target = new WebmTarget();
  const muxer = new WebmMuxer({
    target,
    video: { codec: codec.startsWith('vp09') ? 'V_VP9' : 'V_VP8', width, height, frameRate: fps },
    audio: channels
      ? { codec: 'A_OPUS', numberOfChannels: channels, sampleRate: AUDIO_SAMPLE_RATE }
      : undefined,
  });
  return {
    ext: 'webm',
    mime: 'video/webm',
    addVideo: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    addAudio: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
    finalize: () => {
      muxer.finalize();
      return new Blob([target.buffer], { type: 'video/webm' });
    },
  };
}

/* ------------------------------------------------------------------ *
 * Audio
 * ------------------------------------------------------------------ */

interface EncodedAudio {
  chunk: EncodedAudioChunk;
  meta?: EncodedAudioChunkMetadata;
}

// Encode the whole soundtrack up front. It is small next to the video and
// having it in hand lets us interleave it against the video timeline.
async function encodeAudio(bed: AudioBuffer, codec: string): Promise<EncodedAudio[]> {
  const channels = bed.numberOfChannels;
  const out: EncodedAudio[] = [];
  let failure: unknown = null;

  const encoder = new AudioEncoder({
    output: (chunk, meta) => out.push({ chunk, meta }),
    error: (e) => { failure = e; },
  });
  encoder.configure({
    codec,
    sampleRate: AUDIO_SAMPLE_RATE,
    numberOfChannels: channels,
    bitrate: AUDIO_BITRATE,
  });

  const planes: Float32Array[] = [];
  for (let c = 0; c < channels; c++) planes.push(bed.getChannelData(c));

  for (let offset = 0; offset < bed.length; offset += AUDIO_FRAME) {
    if (failure) break;
    const frames = Math.min(AUDIO_FRAME, bed.length - offset);
    const data = new Float32Array(frames * channels);
    for (let c = 0; c < channels; c++) {
      data.set(planes[c].subarray(offset, offset + frames), c * frames);
    }
    const audioData = new AudioData({
      format: 'f32-planar',
      sampleRate: AUDIO_SAMPLE_RATE,
      numberOfFrames: frames,
      numberOfChannels: channels,
      timestamp: Math.round((offset / AUDIO_SAMPLE_RATE) * 1_000_000),
      data,
    });
    encoder.encode(audioData);
    audioData.close();
    await awaitQueue(encoder, MAX_AUDIO_QUEUE);
  }

  await encoder.flush();
  encoder.close();
  if (failure) throw failure;
  return out;
}

/* ------------------------------------------------------------------ *
 * Frame-accurate export (WebCodecs)
 * ------------------------------------------------------------------ */

async function encodeFilm(
  renderer: FilmRenderer,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  container: Container,
  videoCodec: string,
  audio: EncodedAudio[] | null,
  opts: ExportOptions,
): Promise<ExportResult> {
  const { width, height, fps, bitrate } = opts;
  let failure: unknown = null;

  const encoder = new VideoEncoder({
    output: (chunk, meta) => container.addVideo(chunk, meta),
    error: (e) => { failure = e; },
  });
  encoder.configure({ codec: videoCodec, width, height, bitrate, framerate: fps, latencyMode: 'quality' });

  const totalFrames = Math.max(1, Math.round(renderer.total * fps));
  const frameDurUs = 1_000_000 / fps;
  let audioCursor = 0;

  const drainAudio = (untilUs: number) => {
    if (!audio) return;
    while (audioCursor < audio.length && audio[audioCursor].chunk.timestamp <= untilUs) {
      const { chunk, meta } = audio[audioCursor++];
      container.addAudio(chunk, meta);
    }
  };

  for (let i = 0; i < totalFrames; i++) {
    if (opts.signal?.cancelled) {
      encoder.close();
      throw new ExportCancelled();
    }
    if (failure) throw failure;

    // Draw only once there is room for the frame, so memory stays flat.
    await awaitQueue(encoder, MAX_VIDEO_QUEUE, opts.signal);
    if (opts.signal?.cancelled) {
      encoder.close();
      throw new ExportCancelled();
    }

    const timestamp = Math.round(i * frameDurUs);
    renderer.renderTo(ctx, i / fps, width, height);

    const frame = new VideoFrame(canvas, { timestamp, duration: Math.round(frameDurUs) });
    // A keyframe every two seconds keeps the file seekable without bloating it.
    encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
    frame.close();
    drainAudio(timestamp);

    if (i % 8 === 0) await yieldToUi();
    if (i % 4 === 0) opts.onProgress?.(0.15 + 0.8 * (i / totalFrames), 'rendering');
  }

  opts.onProgress?.(0.95, 'finishing');
  await encoder.flush();
  encoder.close();
  if (failure) throw failure;
  drainAudio(Number.MAX_SAFE_INTEGER);

  const blob = container.finalize();
  opts.onProgress?.(1, 'finishing');
  return { blob, ext: container.ext, mime: container.mime, hasAudio: !!audio, frameAccurate: true };
}

/* ------------------------------------------------------------------ *
 * Live capture fallback (MediaRecorder)
 * ------------------------------------------------------------------ */

async function captureFilm(
  renderer: FilmRenderer,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  bed: AudioBuffer | null,
  opts: ExportOptions,
): Promise<ExportResult> {
  const candidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  const mime = candidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? 'video/webm';

  const stream = canvas.captureStream(opts.fps);
  let audioCtx: AudioContext | null = null;
  let source: AudioBufferSourceNode | null = null;

  if (bed) {
    audioCtx = new AudioContext();
    await audioCtx.resume();
    const dest = audioCtx.createMediaStreamDestination();
    source = audioCtx.createBufferSource();
    source.buffer = bed;
    source.connect(dest);
    dest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
  }

  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: opts.bitrate });
  recorder.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
  const stopped = new Promise<void>((resolve) => { recorder.onstop = () => resolve(); });

  renderer.renderTo(ctx, 0, opts.width, opts.height);
  recorder.start(250);
  source?.start();

  let cancelled = false;
  await new Promise<void>((resolve) => {
    const startWall = performance.now();
    const step = () => {
      if (opts.signal?.cancelled) {
        cancelled = true;
        return resolve();
      }
      const t = (performance.now() - startWall) / 1000;
      renderer.renderTo(ctx, Math.min(t, renderer.total), opts.width, opts.height);
      opts.onProgress?.(0.15 + 0.8 * Math.min(1, t / renderer.total), 'rendering');
      if (t >= renderer.total) return resolve();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  recorder.stop();
  await stopped;
  try { source?.stop(); } catch { /* already finished */ }
  await audioCtx?.close();
  if (cancelled) throw new ExportCancelled();

  opts.onProgress?.(1, 'finishing');
  return {
    blob: new Blob(chunks, { type: mime }),
    ext: 'webm',
    mime,
    hasAudio: !!bed,
    frameAccurate: false,
  };
}

/* ------------------------------------------------------------------ *
 * Entry point
 * ------------------------------------------------------------------ */

export async function exportFilm(project: Project, options: ExportOptions): Promise<ExportResult> {
  // Encoders reject odd dimensions.
  const width = options.width % 2 ? options.width + 1 : options.width;
  const height = options.height % 2 ? options.height + 1 : options.height;
  const opts: ExportOptions = { ...options, width, height };

  opts.onProgress?.(0, 'preparing');
  const renderer = new FilmRenderer(project);
  await renderer.preload();
  if (opts.signal?.cancelled) throw new ExportCancelled();

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('2D canvas is unavailable in this browser.');

  // Soundtrack: looped to the film's length, with its fades applied.
  opts.onProgress?.(0.05, 'soundtrack');
  let bed: AudioBuffer | null = null;
  const track = await loadTrack(project.musicPath);
  if (track) {
    bed = await renderMusicBed(track, renderer.total, musicSettings(project), AUDIO_SAMPLE_RATE);
  }
  if (opts.signal?.cancelled) throw new ExportCancelled();

  if (hasWebCodecs()) {
    try {
      const plan = await planEncoding(width, height, opts.fps, opts.bitrate, bed);
      if (plan) {
        const audio = bed && plan.audioCodec ? await encodeAudio(bed, plan.audioCodec) : null;
        if (opts.signal?.cancelled) throw new ExportCancelled();
        opts.onProgress?.(0.15, 'rendering');
        const channels = audio ? bed!.numberOfChannels : null;
        const container =
          plan.container === 'mp4'
            ? mp4Container(width, height, opts.fps, channels)
            : webmContainer(plan.videoCodec, width, height, opts.fps, channels);
        return await encodeFilm(renderer, canvas, ctx, container, plan.videoCodec, audio, opts);
      }
    } catch (e) {
      if (e instanceof ExportCancelled) throw e;
      console.warn('Frame-accurate encoding failed; capturing the film live instead.', e);
    }
  }

  opts.onProgress?.(0.15, 'rendering');
  return captureFilm(renderer, canvas, ctx, bed, opts);
}

interface Plan {
  container: 'mp4' | 'webm';
  videoCodec: string;
  audioCodec: string | null;
}

// MP4 with AAC plays everywhere, so it wins when the browser can produce it.
// Otherwise a WebM with Opus keeps the music rather than dropping it.
async function planEncoding(
  width: number,
  height: number,
  fps: number,
  bitrate: number,
  bed: AudioBuffer | null,
): Promise<Plan | null> {
  const channels = bed?.numberOfChannels ?? 2;
  const avc = await firstSupportedVideo(AVC_CANDIDATES, width, height, fps, bitrate);
  const aac = bed ? await audioSupported('mp4a.40.2', channels) : false;

  if (avc && (!bed || aac)) {
    return { container: 'mp4', videoCodec: avc, audioCodec: bed ? 'mp4a.40.2' : null };
  }

  const vpx = await firstSupportedVideo(VP9_CANDIDATES, width, height, fps, bitrate);
  const opus = bed ? await audioSupported('opus', channels) : false;
  if (vpx && (!bed || opus)) {
    return { container: 'webm', videoCodec: vpx, audioCodec: bed ? 'opus' : null };
  }

  // Video-only MP4 beats no export at all, but only once we know audio is
  // impossible in every container.
  if (avc) return { container: 'mp4', videoCodec: avc, audioCodec: null };
  if (vpx) return { container: 'webm', videoCodec: vpx, audioCodec: null };
  return null;
}

export const supportsFrameAccurateExport = hasWebCodecs;
