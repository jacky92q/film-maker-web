// Clip-path builders matching the Flutter PhotoShape options.
export function pathForShape(
  ctx: CanvasRenderingContext2D,
  shape: string,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.beginPath();
  switch (shape) {
    case 'rounded': {
      const r = Math.min(w, h) * 0.12;
      roundRect(ctx, x, y, w, h, r);
      break;
    }
    case 'circle': {
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      break;
    }
    case 'heart': {
      const cx = x + w / 2;
      const s = Math.min(w, h);
      const top = y + h * 0.06;
      ctx.moveTo(cx, y + h * 0.95);
      ctx.bezierCurveTo(x - w * 0.05, y + h * 0.42, x + w * 0.18, top, cx, y + h * 0.28);
      ctx.bezierCurveTo(x + w * 0.82, top, x + w * 1.05, y + h * 0.42, cx, y + h * 0.95);
      void s;
      break;
    }
    case 'arch': {
      const r = w / 2;
      ctx.moveTo(x, y + h);
      ctx.lineTo(x, y + r);
      ctx.arc(x + r, y + r, r, Math.PI, 0, false);
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
      break;
    }
    default: {
      ctx.rect(x, y, w, h);
    }
  }
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// Draw an image with object-fit: cover into the dest rect, honoring crop zoom/pan.
export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  scale = 1,
  offX = 0,
  offY = 0,
) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (!iw || !ih) return;
  const base = Math.max(dw / iw, dh / ih);
  const s = base * scale;
  const sw = dw / s;
  const sh = dh / s;
  let sx = (iw - sw) / 2 - offX * sw;
  let sy = (ih - sh) / 2 - offY * sh;
  sx = Math.max(0, Math.min(sx, iw - sw));
  sy = Math.max(0, Math.min(sy, ih - sh));
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

// Draw an image with object-fit: contain into the dest rect.
export function drawImageContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (!iw || !ih) return;
  const s = Math.min(dw / iw, dh / ih);
  const w = iw * s;
  const h = ih * s;
  ctx.drawImage(img, dx + (dw - w) / 2, dy + (dh - h) / 2, w, h);
}
