import { useEffect, useRef } from 'react';
import { useEditor } from '../store/editor';
import { drawSlide } from '../render/drawSlide';
import { ORIENTATION_DIMS, FONT_FAMILY } from '../domain/enums';
import { stickerAspect } from '../domain/stickers';
import type { Slide, TextLayer, PhotoLayer, StickerLayer } from '../domain/models';
import type { VideoOrientation } from '../domain/enums';

const measureCtx = document.createElement('canvas').getContext('2d')!;

function textBox(l: TextLayer): { w: number; h: number } {
  measureCtx.font = `${l.fontSize}px ${FONT_FAMILY[l.fontStyle]}`;
  const lines = (l.text || ' ').split('\n');
  let max = 0;
  for (const ln of lines) max = Math.max(max, measureCtx.measureText(ln || ' ').width);
  return { w: max + l.fontSize * 0.4, h: lines.length * l.fontSize * 1.2 + l.fontSize * 0.3 };
}

interface Hit {
  kind: 'text' | 'photo' | 'sticker';
  id: string;
  z: number;
}

export default function EditorCanvas({ orientation }: { orientation: VideoOrientation }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<Slide | null>(null);
  const dims = ORIENTATION_DIMS[orientation];

  const slide = useEditor((s) => s.currentSlide());
  const selection = useEditor((s) => s.selection);
  slideRef.current = slide;

  // live render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = dims.w;
    canvas.height = dims.h;
    const ctx = canvas.getContext('2d')!;
    const start = performance.now();
    let raf = 0;
    const loop = () => {
      const s = slideRef.current;
      if (s) drawSlide(ctx, s, dims.w, dims.h, { localMs: performance.now() - start });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [dims.w, dims.h]);

  // ----- interaction -----
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const pointers = new Map<number, { x: number; y: number }>();
    let dragKind: Hit['kind'] | 'bg' | null = null;
    let dragId: string | null = null;
    let startNorm = { x: 0, y: 0 };
    let startLayer: { x: number; y: number; offX: number; offY: number } = { x: 0, y: 0, offX: 0, offY: 0 };
    let pinchStartDist = 0;
    let pinchStartAngle = 0;
    let pinchStartSize = 0;
    let pinchStartRot = 0;
    let moved = false;

    function rectNorm(e: PointerEvent) {
      const r = wrap!.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return { x: 0.5, y: 0.5 };
      // canvas is letterboxed inside wrap via object-contain
      const scale = Math.min(r.width / dims.w, r.height / dims.h);
      const dispW = dims.w * scale;
      const dispH = dims.h * scale;
      const ox = (r.width - dispW) / 2;
      const oy = (r.height - dispH) / 2;
      const x = (e.clientX - r.left - ox) / dispW;
      const y = (e.clientY - r.top - oy) / dispH;
      return { x, y };
    }

    function hitTest(nx: number, ny: number): Hit | null {
      const s = slideRef.current;
      if (!s) return null;
      const hits: Hit[] = [];
      for (const l of s.textLayers) {
        const b = textBox(l);
        if (inBox(nx, ny, l.x, l.y, b.w / dims.w, b.h / dims.h, l.rotation)) hits.push({ kind: 'text', id: l.id, z: l.zOrder });
      }
      for (const l of s.photoLayers) {
        if (inBox(nx, ny, l.x, l.y, l.widthFraction, l.heightFraction, l.rotation)) hits.push({ kind: 'photo', id: l.id, z: l.zOrder });
      }
      for (const l of s.stickerLayers) {
        const h = l.widthFraction / stickerAspect(l.kind) * (dims.w / dims.h);
        if (inBox(nx, ny, l.x, l.y, l.widthFraction, h, l.rotation)) hits.push({ kind: 'sticker', id: l.id, z: l.zOrder });
      }
      if (!hits.length) return null;
      hits.sort((a, b) => b.z - a.z);
      return hits[0];
    }

    function findLayer(s: Slide, kind: Hit['kind'], id: string): TextLayer | PhotoLayer | StickerLayer | undefined {
      if (kind === 'text') return s.textLayers.find((l) => l.id === id);
      if (kind === 'photo') return s.photoLayers.find((l) => l.id === id);
      return s.stickerLayers.find((l) => l.id === id);
    }

    function onDown(e: PointerEvent) {
      e.preventDefault();
      try { wrap!.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const n = rectNorm(e);
      moved = false;

      if (pointers.size === 2) {
        // begin pinch on selected layer
        const pts = [...pointers.values()];
        pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        pinchStartAngle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
        const sel = useEditor.getState().selection;
        const s = slideRef.current;
        if (s && sel.id) {
          const layer = findLayer(s, sel.kind as Hit['kind'], sel.id);
          if (layer) {
            pinchStartSize = sel.kind === 'text' ? (layer as TextLayer).fontSize : (layer as PhotoLayer | StickerLayer).widthFraction;
            pinchStartRot = (layer as PhotoLayer | StickerLayer).rotation ?? 0;
          }
        }
        return;
      }

      const hit = hitTest(n.x, n.y);
      const ed = useEditor.getState();
      if (hit) {
        ed.select({ kind: hit.kind, id: hit.id });
        dragKind = hit.kind;
        dragId = hit.id;
        const s = slideRef.current!;
        const layer = findLayer(s, hit.kind, hit.id) as { x: number; y: number };
        startLayer = { x: layer.x, y: layer.y, offX: 0, offY: 0 };
        startNorm = n;
      } else {
        ed.select({ kind: 'none' });
        const s = slideRef.current;
        if (s?.imagePath && s.layout === 'single') {
          dragKind = 'bg';
          startLayer = { x: 0, y: 0, offX: s.photoOffsetX, offY: s.photoOffsetY };
          startNorm = n;
        }
      }
    }

    function onMove(e: PointerEvent) {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const ed = useEditor.getState();
      const sel = ed.selection;

      if (pointers.size === 2 && sel.id && pinchStartDist > 0) {
        const pts = [...pointers.values()];
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const ang = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
        const ratio = dist / pinchStartDist;
        const rotDeg = pinchStartRot + ((ang - pinchStartAngle) * 180) / Math.PI;
        if (sel.kind === 'text') {
          ed.patchText(sel.id, { fontSize: clamp(pinchStartSize * ratio, 12, 300), rotation: rotDeg }, false);
        } else if (sel.kind === 'photo') {
          ed.patchPhoto(sel.id, { widthFraction: clamp(pinchStartSize * ratio, 0.1, 1), rotation: rotDeg }, false);
        } else if (sel.kind === 'sticker') {
          ed.patchSticker(sel.id, { widthFraction: clamp(pinchStartSize * ratio, 0.04, 1.2), rotation: rotDeg }, false);
        }
        return;
      }

      if (!dragKind) return;
      const n = rectNorm(e);
      const dx = n.x - startNorm.x;
      const dy = n.y - startNorm.y;
      if (Math.abs(dx) > 0.003 || Math.abs(dy) > 0.003) moved = true;
      if (dragKind === 'bg') {
        ed.patchSlide({ photoOffsetX: clamp(startLayer.offX + dx, -0.5, 0.5), photoOffsetY: clamp(startLayer.offY + dy, -0.5, 0.5) }, false);
        return;
      }
      const nx = clamp(startLayer.x + dx, 0, 1);
      const ny = clamp(startLayer.y + dy, 0, 1);
      if (dragKind === 'text' && dragId) ed.patchText(dragId, { x: nx, y: ny }, false);
      else if (dragKind === 'photo' && dragId) ed.patchPhoto(dragId, { x: nx, y: ny }, false);
      else if (dragKind === 'sticker' && dragId) ed.patchSticker(dragId, { x: nx, y: ny }, false);
    }

    function onUp(e: PointerEvent) {
      pointers.delete(e.pointerId);
      if (moved && dragKind) {
        // commit a history checkpoint
        const ed = useEditor.getState();
        ed.patchSlide({}, true);
      }
      if (pointers.size < 2) {
        pinchStartDist = 0;
      }
      if (pointers.size === 0) {
        dragKind = null;
        dragId = null;
      }
    }

    wrap.addEventListener('pointerdown', onDown);
    wrap.addEventListener('pointermove', onMove);
    wrap.addEventListener('pointerup', onUp);
    wrap.addEventListener('pointercancel', onUp);
    return () => {
      wrap.removeEventListener('pointerdown', onDown);
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerup', onUp);
      wrap.removeEventListener('pointercancel', onUp);
    };
  }, [dims.w, dims.h]);

  // selection overlay box
  const selBox = computeSelBox(canvasRef.current, slide, selection, dims);

  return (
    <div
      ref={wrapRef}
      className="relative flex h-full w-full touch-none items-center justify-center"
      style={{ touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        className="max-h-full max-w-full rounded-lg shadow-2xl"
        style={{ aspectRatio: `${dims.w}/${dims.h}` }}
      />
      {selBox && (
        <div
          className="pointer-events-none absolute border-2 border-gold"
          style={{
            left: `calc(50% + ${selBox.cx}px)`,
            top: `calc(50% + ${selBox.cy}px)`,
            width: selBox.w,
            height: selBox.h,
            transform: `translate(-50%,-50%) rotate(${selBox.rot}deg)`,
            borderRadius: 4,
          }}
        />
      )}
    </div>
  );
}

function computeSelBox(
  canvas: HTMLCanvasElement | null,
  slide: Slide | null,
  selection: { kind: string; id?: string },
  dims: { w: number; h: number },
) {
  if (!canvas || !slide || !selection.id || selection.kind === 'none') return null;
  const r = canvas.getBoundingClientRect();
  const scale = r.width / dims.w;
  if (selection.kind === 'text') {
    const l = slide.textLayers.find((t) => t.id === selection.id);
    if (!l) return null;
    const b = textBox(l);
    return { cx: (l.x - 0.5) * r.width, cy: (l.y - 0.5) * r.height, w: b.w * scale, h: b.h * scale, rot: l.rotation };
  }
  if (selection.kind === 'photo') {
    const l = slide.photoLayers.find((t) => t.id === selection.id);
    if (!l) return null;
    return { cx: (l.x - 0.5) * r.width, cy: (l.y - 0.5) * r.height, w: l.widthFraction * r.width, h: l.heightFraction * r.height, rot: l.rotation };
  }
  const l = slide.stickerLayers.find((t) => t.id === selection.id);
  if (!l) return null;
  const h = (l.widthFraction * dims.w) / stickerAspect(l.kind);
  return { cx: (l.x - 0.5) * r.width, cy: (l.y - 0.5) * r.height, w: l.widthFraction * r.width, h: h * scale, rot: l.rotation };
}

function inBox(px: number, py: number, cx: number, cy: number, w: number, h: number, rotDeg: number): boolean {
  const dx = px - cx;
  const dy = py - cy;
  const a = (-rotDeg * Math.PI) / 180;
  const rx = dx * Math.cos(a) - dy * Math.sin(a);
  const ry = dx * Math.sin(a) + dy * Math.cos(a);
  const pad = 0.01;
  return Math.abs(rx) <= w / 2 + pad && Math.abs(ry) <= h / 2 + pad;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
