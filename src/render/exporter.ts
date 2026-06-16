import type { Project, Slide } from '../domain/models';
import { ORIENTATION_DIMS } from '../domain/enums';
import { easeInOutCubic } from './anim';
import { drawSlide } from './drawSlide';
import { compositeTransition, TRANSITION_MS } from './transitions';
import { loadImage } from '../lib/imageStore';

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

function pickMime(): { mime: string; ext: string } {
  const candidates = [
    { mime: 'video/mp4;codecs=avc1.42E01E', ext: 'mp4' },
    { mime: 'video/mp4', ext: 'mp4' },
    { mime: 'video/webm;codecs=vp9', ext: 'webm' },
    { mime: 'video/webm;codecs=vp8', ext: 'webm' },
    { mime: 'video/webm', ext: 'webm' },
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c.mime)) return c;
  }
  return { mime: 'video/webm', ext: 'webm' };
}

export async function exportFilm(project: Project, opts: ExportOptions): Promise<ExportResult> {
  const canon = ORIENTATION_DIMS[project.orientation];
  const { width, height, fps, bitrate } = opts;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // canonical offscreen buffers for transition compositing
  const main = document.createElement('canvas');
  main.width = canon.w;
  main.height = canon.h;
  const mainCtx = main.getContext('2d')!;
  const prevC = document.createElement('canvas');
  prevC.width = canon.w;
  prevC.height = canon.h;
  const prevCtx = prevC.getContext('2d')!;
  const curC = document.createElement('canvas');
  curC.width = canon.w;
  curC.height = canon.h;
  const curCtx = curC.getContext('2d')!;

  const slides = project.slides;
  const starts: number[] = [];
  let acc = 0;
  for (const s of slides) {
    starts.push(acc);
    acc += s.durationSeconds;
  }
  const total = acc;

  // preload all images
  const paths = new Set<string>();
  for (const s of slides) {
    if (s.imagePath) paths.add(s.imagePath);
    s.photoLayers.forEach((l) => l.imagePath && paths.add(l.imagePath));
  }
  await Promise.all([...paths].map((p) => loadImage(p)));

  function slideIndexAt(t: number): number {
    for (let i = slides.length - 1; i >= 0; i--) if (t >= starts[i] - 1e-6) return i;
    return 0;
  }

  function renderCanonical(t: number) {
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
    // scale canonical onto output canvas
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(main, 0, 0, width, height);
  }

  const { mime, ext } = pickMime();
  const stream = canvas.captureStream(fps);
  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bitrate });
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const done = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  recorder.start(200);

  // Real-time render loop
  await new Promise<void>((resolve) => {
    const startWall = performance.now();
    const step = () => {
      if (opts.signal?.cancelled) {
        resolve();
        return;
      }
      const t = (performance.now() - startWall) / 1000;
      const clamped = Math.min(t, total);
      renderCanonical(clamped);
      opts.onProgress?.(Math.min(0.99, clamped / total));
      if (t >= total) {
        resolve();
        return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  recorder.stop();
  await done;
  opts.onProgress?.(1);

  const blob = new Blob(chunks, { type: mime });
  return { blob, ext, mime };
}
