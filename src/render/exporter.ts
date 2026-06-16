import type { Project, Slide } from '../domain/models';
import { ORIENTATION_DIMS } from '../domain/enums';
import { easeInOutCubic } from './anim';
import { drawSlide } from './drawSlide';
import { compositeTransition, TRANSITION_MS } from './transitions';
import { loadImage } from '../lib/imageStore';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

export interface ExportOptions {
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  onProgress?: (p: number) => void;
  signal?: { cancelled: boolean };
}

export interface ExportResult {
  blob: Blob;
  ext: string;
  mime: string;
}

interface FrameRenderer {
  render: (t: number) => void;
  canvas: HTMLCanvasElement;
  total: number;
}

// Build a deterministic frame renderer that composites the film at any time t.
async function buildRenderer(project: Project, width: number, height: number): Promise<FrameRenderer> {
  const canon = ORIENTATION_DIMS[project.orientation];
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const ctx = out.getContext('2d')!;

  const main = document.createElement('canvas');
  main.width = canon.w; main.height = canon.h;
  const mainCtx = main.getContext('2d')!;
  const prevC = document.createElement('canvas');
  prevC.width = canon.w; prevC.height = canon.h;
  const prevCtx = prevC.getContext('2d')!;
  const curC = document.createElement('canvas');
  curC.width = canon.w; curC.height = canon.h;
  const curCtx = curC.getContext('2d')!;

  const slides = project.slides;
  const starts: number[] = [];
  let acc = 0;
  for (const s of slides) { starts.push(acc); acc += s.durationSeconds; }
  const total = acc;

  const paths = new Set<string>();
  for (const s of slides) {
    if (s.imagePath) paths.add(s.imagePath);
    s.photoLayers.forEach((l) => l.imagePath && paths.add(l.imagePath));
  }
  await Promise.all([...paths].map((p) => loadImage(p)));

  const slideIndexAt = (t: number) => {
    for (let i = slides.length - 1; i >= 0; i--) if (t >= starts[i] - 1e-6) return i;
    return 0;
  };

  const render = (t: number) => {
    const idx = slideIndexAt(t);
    const slide: Slide = slides[idx];
    const localMs = (t - starts[idx]) * 1000;
    if (idx > 0 && localMs < TRANSITION_MS) {
      const prev = slides[idx - 1];
      const prevLocalMs = (starts[idx] - starts[idx - 1]) * 1000 + localMs;
      drawSlide(prevCtx, prev, canon.w, canon.h, { localMs: prevLocalMs });
      drawSlide(curCtx, slide, canon.w, canon.h, { localMs });
      const p = easeInOutCubic(localMs / TRANSITION_MS);
      compositeTransition(mainCtx, prevC, curC, slide.transition, p, canon.w, canon.h);
    } else {
      drawSlide(mainCtx, slide, canon.w, canon.h, { localMs });
    }
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(main, 0, 0, width, height);
  };

  return { render, canvas: out, total };
}

function supportsWebCodecs(): boolean {
  return typeof window !== 'undefined' && 'VideoEncoder' in window && 'VideoFrame' in window;
}

async function pickAvcCodec(width: number, height: number, fps: number, bitrate: number): Promise<string | null> {
  const candidates = ['avc1.640034', 'avc1.640033', 'avc1.4d0032', 'avc1.4d0028', 'avc1.42E01E'];
  for (const codec of candidates) {
    try {
      const res = await VideoEncoder.isConfigSupported({ codec, width, height, bitrate, framerate: fps });
      if (res?.supported) return codec;
    } catch { /* keep trying */ }
  }
  return null;
}

// Frame-accurate MP4 via WebCodecs + mp4-muxer (seekable, correct duration).
async function exportWithWebCodecs(r: FrameRenderer, opts: ExportOptions): Promise<ExportResult | null> {
  const { width, height, fps, bitrate } = opts;
  const codec = await pickAvcCodec(width, height, fps, bitrate);
  if (!codec) return null;

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width, height },
    fastStart: 'in-memory',
  });

  let encoderError: unknown = null;
  const encoder = new VideoEncoder({
    output: (chunk: EncodedVideoChunk, meta?: EncodedVideoChunkMetadata) => muxer.addVideoChunk(chunk, meta),
    error: (e: unknown) => { encoderError = e; },
  });
  encoder.configure({ codec, width, height, bitrate, framerate: fps, latencyMode: 'quality' });

  const totalFrames = Math.max(1, Math.round(r.total * fps));
  const frameDurUs = 1_000_000 / fps;

  for (let i = 0; i < totalFrames; i++) {
    if (opts.signal?.cancelled) { encoder.close(); return null; }
    if (encoderError) throw encoderError;
    const t = i / fps;
    r.render(t);
    const frame = new VideoFrame(r.canvas, { timestamp: Math.round(i * frameDurUs), duration: Math.round(frameDurUs) });
    encoder.encode(frame, { keyFrame: i % fps === 0 });
    frame.close();
    // Avoid unbounded queue + let the UI breathe.
    if (encoder.encodeQueueSize > 8) {
      await new Promise<void>((res) => setTimeout(res, 0));
    }
    if (i % 3 === 0) opts.onProgress?.(Math.min(0.98, i / totalFrames));
  }

  await encoder.flush();
  encoder.close();
  if (encoderError) throw encoderError;
  muxer.finalize();
  opts.onProgress?.(1);
  const { buffer } = muxer.target as ArrayBufferTarget;
  return { blob: new Blob([buffer], { type: 'video/mp4' }), ext: 'mp4', mime: 'video/mp4' };
}

// Fallback: real-time MediaRecorder capture (less seekable, but widely supported).
async function exportWithMediaRecorder(r: FrameRenderer, opts: ExportOptions): Promise<ExportResult> {
  const candidates = [
    { mime: 'video/webm;codecs=vp9', ext: 'webm' },
    { mime: 'video/webm', ext: 'webm' },
  ];
  let chosen = candidates[candidates.length - 1];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c.mime)) { chosen = c; break; }
  }
  const stream = r.canvas.captureStream(opts.fps);
  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(stream, { mimeType: chosen.mime, videoBitsPerSecond: opts.bitrate });
  recorder.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
  const stopped = new Promise<void>((res) => { recorder.onstop = () => res(); });
  recorder.start(200);

  await new Promise<void>((resolve) => {
    const startWall = performance.now();
    const step = () => {
      if (opts.signal?.cancelled) return resolve();
      const t = (performance.now() - startWall) / 1000;
      r.render(Math.min(t, r.total));
      opts.onProgress?.(Math.min(0.99, t / r.total));
      if (t >= r.total) return resolve();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  recorder.stop();
  await stopped;
  opts.onProgress?.(1);
  return { blob: new Blob(chunks, { type: chosen.mime }), ext: chosen.ext, mime: chosen.mime };
}

export async function exportFilm(project: Project, opts: ExportOptions): Promise<ExportResult> {
  // Ensure even dimensions for the encoder.
  const width = opts.width % 2 ? opts.width + 1 : opts.width;
  const height = opts.height % 2 ? opts.height + 1 : opts.height;
  const o = { ...opts, width, height };
  const r = await buildRenderer(project, width, height);

  if (supportsWebCodecs()) {
    try {
      const res = await exportWithWebCodecs(r, o);
      if (res) return res;
    } catch (e) {
      console.warn('WebCodecs export failed, falling back to MediaRecorder', e);
    }
  }
  return exportWithMediaRecorder(r, o);
}

export const exportSupportsMp4 = () => supportsWebCodecs();
