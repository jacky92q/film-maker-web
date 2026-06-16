import type { PhotoLayer, Slide, StickerLayer, TextLayer } from '../domain/models';
import { FILTER_CSS, FONT_FAMILY, SHADOW_CSS, TEXT_COLOR_HEX } from '../domain/enums';
import { getCachedImage } from '../lib/imageStore';
import { stickerUrl, stickerAspect } from '../domain/stickers';
import { computeAnim } from './anim';
import { drawAmbient } from './ambient';
import { pathForShape, roundRect, drawImageCover } from './shapes';

const stickerImgCache = new Map<string, HTMLImageElement>();
function getSticker(kind: string): HTMLImageElement | null {
  const cached = stickerImgCache.get(kind);
  if (cached) return cached.complete && cached.naturalWidth ? cached : null;
  const img = new Image();
  img.src = stickerUrl(kind);
  stickerImgCache.set(kind, img);
  return null;
}

export interface DrawOpts {
  localMs: number; // ms since slide became current (animations)
  selectionId?: string | null;
  editor?: boolean;
}

export function drawSlide(
  ctx: CanvasRenderingContext2D,
  slide: Slide,
  w: number,
  h: number,
  opts: DrawOpts,
) {
  ctx.save();
  ctx.clearRect(0, 0, w, h);

  // 1. Background colour
  ctx.fillStyle = slide.backgroundColor || '#000000';
  ctx.fillRect(0, 0, w, h);

  // 2. Background photo (single layout)
  if (slide.imagePath) {
    const img = getCachedImage(slide.imagePath);
    if (img) drawBackgroundPhoto(ctx, slide, img, w, h, opts.localMs);
  }

  // 3. Dim gradient
  drawDim(ctx, slide, w, h);

  // 4. Static overlay
  drawOverlay(ctx, slide, w, h);

  // 5. Ordered layers (text + photo + sticker share the z space)
  const layers: Array<
    | { t: 'text'; z: number; l: TextLayer }
    | { t: 'photo'; z: number; l: PhotoLayer }
    | { t: 'sticker'; z: number; l: StickerLayer }
  > = [
    ...slide.photoLayers.map((l) => ({ t: 'photo' as const, z: l.zOrder, l })),
    ...slide.textLayers.map((l) => ({ t: 'text' as const, z: l.zOrder, l })),
    ...slide.stickerLayers.map((l) => ({ t: 'sticker' as const, z: l.zOrder, l })),
  ].sort((a, b) => a.z - b.z);

  for (const item of layers) {
    if (item.t === 'photo') drawPhotoLayer(ctx, item.l, w, h, opts.localMs);
    else if (item.t === 'text') drawTextLayer(ctx, item.l, w, h, opts.localMs);
    else drawSticker(ctx, item.l, w, h);
  }

  // 6. Decorative frame
  drawFrame(ctx, slide, w, h);

  // 7. Ambient effect
  drawAmbient(ctx, slide.ambientEffect, w, h, opts.localMs);

  ctx.restore();
}

function drawBackgroundPhoto(
  ctx: CanvasRenderingContext2D,
  slide: Slide,
  img: HTMLImageElement,
  w: number,
  h: number,
  localMs: number,
) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (!iw || !ih) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.clip();
  ctx.filter = FILTER_CSS[slide.photoFilter] ?? 'none';

  let scale = slide.photoScale;
  let panX = slide.photoOffsetX;
  const panY = slide.photoOffsetY;
  if (slide.transition === 'kenBurns') {
    const p = Math.min(1, localMs / Math.max(1, slide.durationSeconds * 1000));
    scale *= 1 + 0.1 * p;
    panX += (p - 0.5) * 0.04;
  }

  // contain fit then scale
  const base = Math.min(w / iw, h / ih);
  const dw = iw * base * scale;
  const dh = ih * base * scale;
  const dx = (w - dw) / 2 + panX * w;
  const dy = (h - dh) / 2 + panY * h;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function drawDim(ctx: CanvasRenderingContext2D, slide: Slide, w: number, h: number) {
  if (slide.dimDirection === 'none') return;
  const a = slide.dimOpacity;
  ctx.save();
  let grad: CanvasGradient;
  switch (slide.dimDirection) {
    case 'bottom':
      grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, `rgba(0,0,0,${a})`);
      break;
    case 'top':
      grad = ctx.createLinearGradient(0, h, 0, 0);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, `rgba(0,0,0,${a})`);
      break;
    case 'left':
      grad = ctx.createLinearGradient(w, 0, 0, 0);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, `rgba(0,0,0,${a})`);
      break;
    case 'right':
      grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, `rgba(0,0,0,${a})`);
      break;
    case 'radial':
    default:
      grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, `rgba(0,0,0,${a})`);
      break;
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

let grainPattern: CanvasPattern | null = null;
function getGrain(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (grainPattern) return grainPattern;
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  if (!g) return null;
  const imgData = g.createImageData(size, size);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const v = Math.random() * 255;
    imgData.data[i] = imgData.data[i + 1] = imgData.data[i + 2] = v;
    imgData.data[i + 3] = Math.random() * 40;
  }
  g.putImageData(imgData, 0, 0);
  grainPattern = ctx.createPattern(c, 'repeat');
  return grainPattern;
}

function drawOverlay(ctx: CanvasRenderingContext2D, slide: Slide, w: number, h: number) {
  if (slide.overlay === 'none') return;
  ctx.save();
  if (slide.overlay === 'vignette') {
    const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (slide.overlay === 'filmGrain') {
    const pat = getGrain(ctx);
    if (pat) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, w, h);
    }
  }
  ctx.restore();
}

function drawPhotoLayer(ctx: CanvasRenderingContext2D, l: PhotoLayer, w: number, h: number, localMs: number) {
  const anim = computeAnim(l.contentAnimation, localMs, w, h);
  const cw = l.widthFraction * w;
  const ch = l.heightFraction * h;
  const cx = l.x * w + anim.dx;
  const cy = l.y * h + anim.dy;

  ctx.save();
  ctx.globalAlpha = anim.alpha;
  ctx.translate(cx, cy);
  ctx.rotate((l.rotation * Math.PI) / 180);
  ctx.scale(anim.scale, anim.scale);

  const x = -cw / 2;
  const y = -ch / 2;

  // polaroid frame padding
  const isPolaroid = l.frame === 'polaroid';
  const fw = l.frameWidth;

  // frame background
  if (l.frame === 'white' || l.frame === 'gold' || isPolaroid) {
    ctx.save();
    pathForShape(ctx, isPolaroid ? 'none' : l.shape, x - fw, y - fw, cw + fw * 2, ch + fw * (isPolaroid ? 7.5 : 2));
    ctx.fillStyle = l.frame === 'gold' ? '#D4AF37' : '#FFFFFF';
    ctx.fill();
    ctx.restore();
  }

  // clip to shape and draw image
  ctx.save();
  pathForShape(ctx, l.shape, x, y, cw, ch);
  ctx.clip();
  const img = l.imagePath ? getCachedImage(l.imagePath) : null;
  if (img) {
    ctx.filter = FILTER_CSS[l.filter] ?? 'none';
    drawImageCover(ctx, img, x, y, cw, ch, l.cropScale, l.cropOffsetX, l.cropOffsetY);
    ctx.filter = 'none';
  } else {
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(x, y, cw, ch);
    ctx.fillStyle = '#6a6a6a';
    ctx.font = `${Math.min(cw, ch) * 0.2}px Lato`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', 0, 0);
  }
  ctx.restore();

  ctx.restore();
}

function resolveColor(preset: string, custom: string | null): string {
  if (custom) return custom;
  return TEXT_COLOR_HEX[preset as keyof typeof TEXT_COLOR_HEX] ?? '#ffffff';
}

function drawTextLayer(ctx: CanvasRenderingContext2D, l: TextLayer, w: number, h: number, localMs: number) {
  const anim = computeAnim(l.contentAnimation, localMs, w, h);
  let text = l.text || '';
  if (anim.textFraction < 1) {
    const n = Math.round(text.length * anim.textFraction);
    text = text.slice(0, n);
  }
  const lines = text.split('\n');
  const color = resolveColor(l.color, l.customColor);
  const fontSize = l.fontSize;
  const lineHeight = fontSize * 1.2;
  const cx = l.x * w + anim.dx;
  const cy = l.y * h + anim.dy;

  ctx.save();
  ctx.globalAlpha = anim.alpha;
  ctx.translate(cx, cy);
  ctx.rotate((l.rotation * Math.PI) / 180);
  ctx.scale(anim.scale, anim.scale);

  ctx.font = `${fontSize}px ${FONT_FAMILY[l.fontStyle]}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // letterSpacing (modern browsers)
  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${l.letterSpacing}px`;
  } catch { /* ignore */ }

  const totalH = lines.length * lineHeight;
  const startY = -totalH / 2 + lineHeight / 2;

  // measure max width for backgrounds / subtitle bar
  let maxW = 0;
  for (const ln of lines) maxW = Math.max(maxW, ctx.measureText(ln).width);

  // text background
  if (l.textBg !== 'none' && maxW > 0) {
    const padX = fontSize * 0.3;
    const padY = fontSize * 0.18;
    const bw = maxW + padX * 2;
    const bh = totalH + padY * 2;
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, -bw / 2, -bh / 2, bw, bh, l.textBg === 'pill' ? bh / 2 : fontSize * 0.12);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fill();
    ctx.restore();
  }

  // subtitle bar (gold stripe under)
  if (l.isSubtitle) {
    const barColor = resolveColor(l.barColor, l.customBarColor);
    const barW = Math.min(maxW * 0.5, fontSize * 3);
    ctx.save();
    ctx.fillStyle = barColor;
    ctx.beginPath();
    roundRect(ctx, -barW / 2, totalH / 2 + fontSize * 0.18, barW, Math.max(2, fontSize * 0.05), fontSize * 0.03);
    ctx.fill();
    ctx.restore();
  }

  // wipe reveal clip
  if (anim.reveal < 1) {
    ctx.beginPath();
    ctx.rect(-maxW / 2 - 4, -totalH, (maxW + 8) * anim.reveal, totalH * 2);
    ctx.clip();
  }

  // shadow
  const sh = SHADOW_CSS[l.shadowLevel];
  if (sh.blur > 0) {
    ctx.shadowColor = `rgba(0,0,0,${sh.alpha})`;
    ctx.shadowBlur = sh.blur;
    ctx.shadowOffsetY = sh.blur * 0.25;
  }

  lines.forEach((ln, i) => {
    const y = startY + i * lineHeight;
    if (l.strokeWidth > 0) {
      ctx.lineWidth = l.strokeWidth * fontSize * 0.035;
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.lineJoin = 'round';
      ctx.strokeText(ln, 0, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(ln, 0, y);
  });

  // shimmer sweep
  if (anim.shimmer >= 0 && maxW > 0) {
    ctx.shadowBlur = 0;
    const grad = ctx.createLinearGradient(-maxW / 2, 0, maxW / 2, 0);
    const p = anim.shimmer;
    const lo = Math.max(0, p - 0.18);
    const hi = Math.min(1, p + 0.18);
    grad.addColorStop(0, 'rgba(255,244,208,0)');
    if (lo > 0) grad.addColorStop(lo, 'rgba(255,244,208,0)');
    grad.addColorStop(Math.min(Math.max(p, 0.001), 0.999), 'rgba(255,244,208,0.85)');
    if (hi < 1) grad.addColorStop(hi, 'rgba(255,244,208,0)');
    grad.addColorStop(1, 'rgba(255,244,208,0)');
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = grad;
    lines.forEach((ln, i) => ctx.fillText(ln, 0, startY + i * lineHeight));
    ctx.globalCompositeOperation = 'source-over';
  }

  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0px';
  } catch { /* ignore */ }
  ctx.restore();
}

function drawSticker(ctx: CanvasRenderingContext2D, l: StickerLayer, w: number, h: number) {
  const img = getSticker(l.kind);
  const sw = l.widthFraction * w;
  const sh = sw / stickerAspect(l.kind);
  ctx.save();
  ctx.globalAlpha = l.opacity;
  ctx.translate(l.x * w, l.y * h);
  ctx.rotate((l.rotation * Math.PI) / 180);
  if (img) {
    ctx.drawImage(img, -sw / 2, -sh / 2, sw, sh);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    roundRect(ctx, -sw / 2, -sh / 2, sw, sh, 8);
    ctx.fill();
  }
  ctx.restore();
}

function drawFrame(ctx: CanvasRenderingContext2D, slide: Slide, w: number, h: number) {
  if (slide.frame === 'none') return;
  const unit = Math.min(w, h);
  const color = slide.customFrameColor || TEXT_COLOR_HEX[slide.frameColor] || '#ffffff';
  const lw = Math.max(1, unit * 0.004);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lw;
  const inset = unit * 0.045;

  switch (slide.frame) {
    case 'thinBorder':
      ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
      break;
    case 'doubleBorder': {
      ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
      const g = unit * 0.018;
      ctx.lineWidth = lw * 0.6;
      ctx.strokeRect(inset + g, inset + g, w - (inset + g) * 2, h - (inset + g) * 2);
      break;
    }
    case 'insetLine': {
      const i2 = unit * 0.085;
      ctx.lineWidth = lw * 0.8;
      ctx.strokeRect(i2, i2, w - i2 * 2, h - i2 * 2);
      break;
    }
    case 'dashedBorder':
      ctx.setLineDash([unit * 0.022, unit * 0.014]);
      ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
      ctx.setLineDash([]);
      break;
    case 'cornerBrackets':
    case 'ornateCorners': {
      const len = unit * 0.1;
      const corners = [
        [inset, inset, 1, 1],
        [w - inset, inset, -1, 1],
        [inset, h - inset, 1, -1],
        [w - inset, h - inset, -1, -1],
      ];
      for (const [px, py, sx, sy] of corners) {
        ctx.beginPath();
        ctx.moveTo(px, py + sy * len);
        ctx.lineTo(px, py);
        ctx.lineTo(px + sx * len, py);
        ctx.stroke();
      }
      if (slide.frame === 'ornateCorners') {
        ctx.strokeRect(inset * 1.6, inset * 1.6, w - inset * 3.2, h - inset * 3.2);
      }
      break;
    }
    case 'editorialTicks': {
      ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
      const tick = unit * 0.04;
      ctx.beginPath();
      ctx.moveTo(w / 2, inset - tick / 2);
      ctx.lineTo(w / 2, inset + tick / 2);
      ctx.moveTo(w / 2, h - inset - tick / 2);
      ctx.lineTo(w / 2, h - inset + tick / 2);
      ctx.moveTo(inset - tick / 2, h / 2);
      ctx.lineTo(inset + tick / 2, h / 2);
      ctx.moveTo(w - inset - tick / 2, h / 2);
      ctx.lineTo(w - inset + tick / 2, h / 2);
      ctx.stroke();
      break;
    }
  }
  ctx.restore();
}
