import { stickerUrl } from '../domain/stickers';

const cache = new Map<string, HTMLImageElement>();
const pending = new Map<string, Promise<HTMLImageElement | null>>();

function isReady(img: HTMLImageElement): boolean {
  return img.complete && img.naturalWidth > 0;
}

export function loadSticker(kind: string): Promise<HTMLImageElement | null> {
  const cached = cache.get(kind);
  if (cached && isReady(cached)) return Promise.resolve(cached);
  const inflight = pending.get(kind);
  if (inflight) return inflight;

  const url = stickerUrl(kind);
  if (!url) return Promise.resolve(null);
  const p = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => {
      cache.set(kind, img);
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  }).finally(() => pending.delete(kind));
  pending.set(kind, p);
  return p;
}

// Synchronous accessor for the draw loop; kicks off a load on a miss.
export function getStickerImage(kind: string): HTMLImageElement | null {
  const cached = cache.get(kind);
  if (cached && isReady(cached)) return cached;
  void loadSticker(kind);
  return null;
}

export function preloadStickers(kinds: Iterable<string>): Promise<unknown> {
  return Promise.all([...new Set(kinds)].map(loadSticker));
}
