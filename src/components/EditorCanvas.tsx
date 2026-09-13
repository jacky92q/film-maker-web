import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useEditor, type SelKind } from '../store/editor';
import { drawSlide } from '../render/drawSlide';
import { FONT_FAMILY, ORIENTATION_DIMS, type VideoOrientation } from '../domain/enums';
import { stickerAspect } from '../domain/stickers';
import type { PhotoLayer, Slide, StickerLayer, TextLayer } from '../domain/models';

const measure = document.createElement('canvas').getContext('2d')!;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const SNAP = 0.012; // how close to the centre line before it grabs

interface Box {
  x: number; // centre, 0..1 of canvas width
  y: number;
  w: number; // 0..1 of canvas width
  h: number; // 0..1 of canvas height
  rot: number;
}

function textBox(l: TextLayer, dims: { w: number; h: number }): Box {
  measure.font = `${l.fontSize}px ${FONT_FAMILY[l.fontStyle]}`;
  const lines = (l.text || ' ').split('\n');
  let widest = 0;
  for (const line of lines) widest = Math.max(widest, measure.measureText(line || ' ').width);
  const w = widest + l.fontSize * 0.4 + Math.abs(l.letterSpacing) * lines[0].length * 0.2;
  const h = lines.length * l.fontSize * 1.2 + l.fontSize * 0.3;
  return { x: l.x, y: l.y, w: w / dims.w, h: h / dims.h, rot: l.rotation };
}

function boxFor(slide: Slide, kind: SelKind, id: string | undefined, dims: { w: number; h: number }): Box | null {
  if (!id) return null;
  if (kind === 'text') {
    const l = slide.textLayers.find((x) => x.id === id);
    return l ? textBox(l, dims) : null;
  }
  if (kind === 'photo') {
    const l = slide.photoLayers.find((x) => x.id === id);
    return l ? { x: l.x, y: l.y, w: l.widthFraction, h: l.heightFraction, rot: l.rotation } : null;
  }
  if (kind === 'sticker') {
    const l = slide.stickerLayers.find((x) => x.id === id);
    if (!l) return null;
    const h = ((l.widthFraction * dims.w) / stickerAspect(l.kind)) / dims.h;
    return { x: l.x, y: l.y, w: l.widthFraction, h, rot: l.rotation };
  }
  return null;
}

function inBox(px: number, py: number, box: Box, dims: { w: number; h: number }): boolean {
  // Work in square-ish space so rotation maths is not skewed by the aspect.
  const dx = (px - box.x) * dims.w;
  const dy = (py - box.y) * dims.h;
  const a = (-box.rot * Math.PI) / 180;
  const rx = dx * Math.cos(a) - dy * Math.sin(a);
  const ry = dx * Math.sin(a) + dy * Math.cos(a);
  const pad = dims.w * 0.008;
  return Math.abs(rx) <= (box.w * dims.w) / 2 + pad && Math.abs(ry) <= (box.h * dims.h) / 2 + pad;
}

type HandleId = 'nw' | 'ne' | 'sw' | 'se' | 'rotate';
const CORNERS: { id: HandleId; sx: number; sy: number; cursor: string }[] = [
  { id: 'nw', sx: -1, sy: -1, cursor: 'nwse-resize' },
  { id: 'ne', sx: 1, sy: -1, cursor: 'nesw-resize' },
  { id: 'sw', sx: -1, sy: 1, cursor: 'nesw-resize' },
  { id: 'se', sx: 1, sy: 1, cursor: 'nwse-resize' },
];

export default function EditorCanvas({
  orientation,
  emptyHint,
}: {
  orientation: VideoOrientation;
  /** Shown over an untouched slide so a blank frame is not a dead end. */
  emptyHint?: React.ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<Slide | null>(null);
  const dims = ORIENTATION_DIMS[orientation];

  const slide = useEditor((s) => s.currentSlide());
  const selection = useEditor((s) => s.selection);
  const slideIndex = useEditor((s) => s.slideIndex);
  slideRef.current = slide;

  const [rect, setRect] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [guides, setGuides] = useState({ x: false, y: false });

  /* ---- live canvas ---- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = dims.w;
    canvas.height = dims.h;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    let raf = 0;
    const start = performance.now();
    const loop = () => {
      const s = slideRef.current;
      if (s) drawSlide(ctx, s, dims.w, dims.h, { localMs: performance.now() - start });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // Restarting on slide change replays that slide's animations, which is
    // exactly what you want while you are styling them.
  }, [dims.w, dims.h, slideIndex]);

  /* ---- where the canvas actually sits inside the stage ---- */
  const syncRect = useCallback(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const w = wrap.getBoundingClientRect();
    const c = canvas.getBoundingClientRect();
    setRect({ left: c.left - w.left, top: c.top - w.top, width: c.width, height: c.height });
  }, []);

  useLayoutEffect(() => {
    syncRect();
    const ro = new ResizeObserver(syncRect);
    if (wrapRef.current) ro.observe(wrapRef.current);
    if (canvasRef.current) ro.observe(canvasRef.current);
    window.addEventListener('resize', syncRect);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', syncRect);
    };
  }, [syncRect]);

  /* ---- pointer interaction ---- */
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const pointers = new Map<number, { x: number; y: number }>();
    let mode: 'none' | 'move' | 'bg' | 'handle' | 'pinch' = 'none';
    let handle: HandleId | null = null;
    let startPoint = { x: 0, y: 0 };
    let startBox: Box | null = null;
    let startFontSize = 0;
    let startOffset = { x: 0, y: 0 };
    let pinchStartDist = 0;
    let pinchStartAngle = 0;
    let pinchStartSize = 0;
    let pinchStartRot = 0;
    let moved = false;

    function toNorm(e: PointerEvent) {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0.5, y: 0.5 };
      const r = canvas.getBoundingClientRect();
      if (r.width < 2) return { x: 0.5, y: 0.5 };
      return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
    }

    function currentBox(): Box | null {
      const s = slideRef.current;
      const sel = useEditor.getState().selection;
      return s ? boxFor(s, sel.kind, sel.id, dims) : null;
    }

    function hitTest(nx: number, ny: number): { kind: SelKind; id: string; z: number } | null {
      const s = slideRef.current;
      if (!s) return null;
      const hits: { kind: SelKind; id: string; z: number }[] = [];
      for (const l of s.textLayers) {
        if (inBox(nx, ny, textBox(l, dims), dims)) hits.push({ kind: 'text', id: l.id, z: l.zOrder });
      }
      for (const l of s.photoLayers) {
        const box = { x: l.x, y: l.y, w: l.widthFraction, h: l.heightFraction, rot: l.rotation };
        if (inBox(nx, ny, box, dims)) hits.push({ kind: 'photo', id: l.id, z: l.zOrder });
      }
      for (const l of s.stickerLayers) {
        const h = ((l.widthFraction * dims.w) / stickerAspect(l.kind)) / dims.h;
        if (inBox(nx, ny, { x: l.x, y: l.y, w: l.widthFraction, h, rot: l.rotation }, dims)) {
          hits.push({ kind: 'sticker', id: l.id, z: l.zOrder });
        }
      }
      if (!hits.length) return null;
      hits.sort((a, b) => b.z - a.z);
      return hits[0];
    }

    function beginHandle(e: PointerEvent, id: HandleId) {
      const ed = useEditor.getState();
      const s = slideRef.current;
      if (!s || !ed.selection.id) return;
      mode = 'handle';
      handle = id;
      startPoint = toNorm(e);
      startBox = currentBox();
      if (ed.selection.kind === 'text') {
        startFontSize = s.textLayers.find((l) => l.id === ed.selection.id)?.fontSize ?? 64;
      }
    }

    function onDown(e: PointerEvent) {
      const target = e.target as HTMLElement;
      // Buttons layered over the canvas keep their own clicks: calling
      // preventDefault here would stop the click from ever firing on touch.
      if (target.closest?.('[data-canvas-ui]')) return;
      const handleId = target.dataset?.handle as HandleId | undefined;
      e.preventDefault();
      try { wrap!.setPointerCapture(e.pointerId); } catch { /* not fatal */ }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = false;

      if (pointers.size === 2) {
        const pts = [...pointers.values()];
        pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        pinchStartAngle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
        const ed = useEditor.getState();
        const s = slideRef.current;
        if (s && ed.selection.id) {
          const sel = ed.selection;
          if (sel.kind === 'text') {
            const l = s.textLayers.find((x) => x.id === sel.id);
            pinchStartSize = l?.fontSize ?? 64;
            pinchStartRot = l?.rotation ?? 0;
          } else if (sel.kind === 'photo') {
            const l = s.photoLayers.find((x) => x.id === sel.id);
            pinchStartSize = l?.widthFraction ?? 0.4;
            pinchStartRot = l?.rotation ?? 0;
          } else if (sel.kind === 'sticker') {
            const l = s.stickerLayers.find((x) => x.id === sel.id);
            pinchStartSize = l?.widthFraction ?? 0.2;
            pinchStartRot = l?.rotation ?? 0;
          }
          mode = 'pinch';
        }
        return;
      }

      if (handleId) {
        beginHandle(e, handleId);
        return;
      }

      const n = toNorm(e);
      const ed = useEditor.getState();
      const hit = hitTest(n.x, n.y);
      if (hit) {
        ed.select({ kind: hit.kind, id: hit.id });
        mode = 'move';
        startPoint = n;
        startBox = boxFor(slideRef.current!, hit.kind, hit.id, dims);
      } else {
        ed.select({ kind: 'none' });
        const s = slideRef.current;
        if (s?.imagePath) {
          mode = 'bg';
          startPoint = n;
          startOffset = { x: s.photoOffsetX, y: s.photoOffsetY };
        } else {
          mode = 'none';
        }
      }
    }

    function onMove(e: PointerEvent) {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const ed = useEditor.getState();
      const sel = ed.selection;

      if (mode === 'pinch' && pointers.size === 2 && sel.id) {
        const pts = [...pointers.values()];
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const angle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
        const ratio = pinchStartDist > 0 ? dist / pinchStartDist : 1;
        const rot = pinchStartRot + ((angle - pinchStartAngle) * 180) / Math.PI;
        moved = true;
        if (sel.kind === 'text') ed.patchText(sel.id, { fontSize: clamp(pinchStartSize * ratio, 12, 400), rotation: rot }, false);
        else if (sel.kind === 'photo') ed.patchPhoto(sel.id, { widthFraction: clamp(pinchStartSize * ratio, 0.05, 1.6), rotation: rot }, false);
        else if (sel.kind === 'sticker') ed.patchSticker(sel.id, { widthFraction: clamp(pinchStartSize * ratio, 0.03, 1.6), rotation: rot }, false);
        return;
      }

      if (mode === 'none') return;
      const n = toNorm(e);

      if (mode === 'bg') {
        moved = true;
        ed.patchSlide(
          {
            photoOffsetX: clamp(startOffset.x + (n.x - startPoint.x), -0.6, 0.6),
            photoOffsetY: clamp(startOffset.y + (n.y - startPoint.y), -0.6, 0.6),
          },
          false,
        );
        return;
      }

      if (mode === 'handle' && startBox && sel.id) {
        moved = true;
        const dx = (n.x - startBox.x) * dims.w;
        const dy = (n.y - startBox.y) * dims.h;

        if (handle === 'rotate') {
          const deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
          const snapped = Math.abs(deg % 15) < 3 ? Math.round(deg / 15) * 15 : deg;
          const rotation = ((snapped + 540) % 360) - 180;
          if (sel.kind === 'text') ed.patchText(sel.id, { rotation }, false);
          else if (sel.kind === 'photo') ed.patchPhoto(sel.id, { rotation }, false);
          else ed.patchSticker(sel.id, { rotation }, false);
          return;
        }

        // Distance from the centre, measured in the layer's own frame.
        const a = (-startBox.rot * Math.PI) / 180;
        const rx = Math.abs(dx * Math.cos(a) - dy * Math.sin(a));
        const ry = Math.abs(dx * Math.sin(a) + dy * Math.cos(a));
        const startHalfW = (startBox.w * dims.w) / 2;
        const startHalfH = (startBox.h * dims.h) / 2;

        if (sel.kind === 'text') {
          const ratio = Math.max(rx / Math.max(startHalfW, 1), ry / Math.max(startHalfH, 1));
          ed.patchText(sel.id, { fontSize: clamp(startFontSize * ratio, 12, 400) }, false);
        } else if (sel.kind === 'photo') {
          ed.patchPhoto(sel.id, {
            widthFraction: clamp((rx * 2) / dims.w, 0.05, 1.6),
            heightFraction: clamp((ry * 2) / dims.h, 0.05, 1.6),
          }, false);
        } else if (sel.kind === 'sticker') {
          const ratio = Math.max(rx / Math.max(startHalfW, 1), ry / Math.max(startHalfH, 1));
          ed.patchSticker(sel.id, { widthFraction: clamp(startBox.w * ratio, 0.03, 1.6) }, false);
        }
        return;
      }

      if (mode === 'move' && startBox && sel.id) {
        const dx = n.x - startPoint.x;
        const dy = n.y - startPoint.y;
        if (Math.abs(dx) > 0.002 || Math.abs(dy) > 0.002) moved = true;
        let x = clamp(startBox.x + dx, -0.2, 1.2);
        let y = clamp(startBox.y + dy, -0.2, 1.2);
        // Snap to the centre lines — the guides show when it bites.
        const snapX = Math.abs(x - 0.5) < SNAP;
        const snapY = Math.abs(y - 0.5) < SNAP;
        if (snapX) x = 0.5;
        if (snapY) y = 0.5;
        setGuides({ x: snapX, y: snapY });

        if (sel.kind === 'text') ed.patchText(sel.id, { x, y }, false);
        else if (sel.kind === 'photo') ed.patchPhoto(sel.id, { x, y }, false);
        else if (sel.kind === 'sticker') ed.patchSticker(sel.id, { x, y }, false);
      }
    }

    function onUp(e: PointerEvent) {
      pointers.delete(e.pointerId);
      if (moved) useEditor.getState().patchSlide({}, true); // one undo step per gesture
      setGuides({ x: false, y: false });
      if (pointers.size === 0) {
        mode = 'none';
        handle = null;
        startBox = null;
        moved = false;
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
  }, [dims.w, dims.h, dims]);

  const box = slide ? boxFor(slide, selection.kind, selection.id, dims) : null;
  const showOverlay = !!box && rect.width > 4;
  const blank =
    !!slide && !slide.imagePath && !slide.textLayers.length && !slide.photoLayers.length && !slide.stickerLayers.length;

  return (
    <div ref={wrapRef} className="relative flex h-full w-full touch-none select-none items-center justify-center" style={{ touchAction: 'none' }}>
      <canvas
        ref={canvasRef}
        className="max-h-full max-w-full rounded-[4px] shadow-frame"
        style={{ aspectRatio: `${dims.w}/${dims.h}` }}
      />

      {blank && emptyHint && rect.width > 4 && (
        <div
          className="pointer-events-none absolute grid place-items-center"
          style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
        >
          <div data-canvas-ui className="pointer-events-auto text-center">{emptyHint}</div>
        </div>
      )}

      {/* Centre guides, only while a drag is snapping. */}
      {guides.x && (
        <span className="pointer-events-none absolute bg-gold/70" style={{ left: rect.left + rect.width / 2, top: rect.top, width: 1, height: rect.height }} />
      )}
      {guides.y && (
        <span className="pointer-events-none absolute bg-gold/70" style={{ left: rect.left, top: rect.top + rect.height / 2, width: rect.width, height: 1 }} />
      )}

      {showOverlay && (
        <div
          className="pointer-events-none absolute"
          style={{
            left: rect.left + box!.x * rect.width,
            top: rect.top + box!.y * rect.height,
            width: Math.max(12, box!.w * rect.width),
            height: Math.max(12, box!.h * rect.height),
            transform: `translate(-50%,-50%) rotate(${box!.rot}deg)`,
          }}
        >
          <div className="absolute inset-0 rounded-[2px] outline outline-1 outline-offset-0 outline-gold/90" />
          {CORNERS.map((c) => (
            <span
              key={c.id}
              data-handle={c.id}
              className="pointer-events-auto absolute h-3.5 w-3.5 rounded-full bg-white shadow-[0_0_0_1.5px_rgba(0,0,0,0.55),0_2px_6px_rgba(0,0,0,0.5)]"
              style={{
                left: c.sx < 0 ? -7 : undefined,
                right: c.sx > 0 ? -7 : undefined,
                top: c.sy < 0 ? -7 : undefined,
                bottom: c.sy > 0 ? -7 : undefined,
                cursor: c.cursor,
              }}
            />
          ))}
          <span
            data-handle="rotate"
            className="pointer-events-auto absolute h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-gold shadow-[0_0_0_1.5px_rgba(0,0,0,0.55),0_0_14px_rgba(232,192,138,0.8)]"
            style={{ left: '50%', top: -30, cursor: 'grab' }}
          />
          <span className="absolute left-1/2 h-[22px] w-px -translate-x-1/2 bg-gold/70" style={{ top: -22 }} />
        </div>
      )}
    </div>
  );
}
