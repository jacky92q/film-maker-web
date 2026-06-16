import { useEffect, useRef } from 'react';
import { drawSlide } from '../render/drawSlide';
import { loadImage } from '../lib/imageStore';
import { ORIENTATION_DIMS, type VideoOrientation } from '../domain/enums';
import type { Slide } from '../domain/models';

export default function SlideThumb({ slide, orientation }: { slide: Slide; orientation: VideoOrientation }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const dims = ORIENTATION_DIMS[orientation];

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = dims.w;
    canvas.height = dims.h;
    const ctx = canvas.getContext('2d')!;
    let done = false;
    const render = () => {
      if (!done) drawSlide(ctx, slide, dims.w, dims.h, { localMs: 99999 });
    };
    render();
    // redraw once images load
    const paths = [slide.imagePath, ...slide.photoLayers.map((l) => l.imagePath)].filter(Boolean) as string[];
    Promise.all(paths.map((p) => loadImage(p))).then(render);
    return () => { done = true; };
  }, [slide, dims.w, dims.h]);

  return <canvas ref={ref} className="h-full w-full object-cover" style={{ aspectRatio: `${dims.w}/${dims.h}` }} />;
}
