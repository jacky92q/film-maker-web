import { useEffect, useRef } from 'react';
import { drawSlide } from '../render/drawSlide';
import { loadImage } from '../lib/imageStore';
import { preloadStickers } from '../render/stickerImages';
import { ORIENTATION_DIMS, type VideoOrientation } from '../domain/enums';
import type { Slide } from '../domain/models';

// A still of one slide, drawn with the real renderer so a thumbnail never
// lies about what the film looks like.
export default function SlideThumb({
  slide,
  orientation,
  scale = 0.35,
  className = '',
}: {
  slide: Slide;
  orientation: VideoOrientation;
  scale?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const dims = ORIENTATION_DIMS[orientation];

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const w = Math.round(dims.w * scale);
    const h = Math.round(dims.h * scale);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let live = true;
    // Draw at the end of the slide's timeline so animations are settled.
    const paint = () => {
      if (!live) return;
      ctx.save();
      ctx.scale(w / dims.w, h / dims.h);
      drawSlide(ctx, slide, dims.w, dims.h, { localMs: 100_000 });
      ctx.restore();
    };
    paint();

    const photos = [slide.imagePath, ...slide.photoLayers.map((l) => l.imagePath)].filter(Boolean) as string[];
    void Promise.all([
      ...photos.map((p) => loadImage(p)),
      preloadStickers(slide.stickerLayers.map((l) => l.kind)),
      document.fonts?.ready,
    ]).then(paint);

    return () => {
      live = false;
    };
  }, [slide, dims.w, dims.h, scale]);

  return <canvas ref={ref} className={`h-full w-full ${className}`} />;
}
