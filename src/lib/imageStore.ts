// IndexedDB-backed image storage. Project JSON only stores lightweight
// `web_img://<id>` references; the binary blobs live in IndexedDB so we don't
// blow the small localStorage quota. Mirrors the Flutter web image storage.

import { v4 as uuid } from 'uuid';

const DB_NAME = 'film_maker_images';
const STORE = 'images';
const PREFIX = 'web_img://';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export function isStoredImage(path: string | null): path is string {
  return !!path && path.startsWith(PREFIX);
}

export async function putImageBlob(blob: Blob): Promise<string> {
  const db = await openDb();
  const id = uuid();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return PREFIX + id;
}

export async function putImageFile(file: File): Promise<string> {
  return putImageBlob(file);
}

async function getBlob(path: string): Promise<Blob | null> {
  if (!isStoredImage(path)) return null;
  const id = path.slice(PREFIX.length);
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as Blob) ?? null);
    req.onerror = () => reject(req.error);
  });
}

// ---- Object URL + HTMLImageElement cache ----

const urlCache = new Map<string, string>();
const imgCache = new Map<string, HTMLImageElement>();
const imgPending = new Map<string, Promise<HTMLImageElement | null>>();

export async function resolveUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (!isStoredImage(path)) return path; // already a data/blob/http url
  if (urlCache.has(path)) return urlCache.get(path)!;
  const blob = await getBlob(path);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urlCache.set(path, url);
  return url;
}

export function loadImage(path: string | null): Promise<HTMLImageElement | null> {
  if (!path) return Promise.resolve(null);
  if (imgCache.has(path)) return Promise.resolve(imgCache.get(path)!);
  if (imgPending.has(path)) return imgPending.get(path)!;
  const p = (async () => {
    const url = await resolveUrl(path);
    if (!url) return null;
    return new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imgCache.set(path, img);
        resolve(img);
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  })();
  imgPending.set(path, p);
  return p;
}

// Synchronous accessor for the render loop (returns cached image if ready).
export function getCachedImage(path: string | null): HTMLImageElement | null {
  if (!path) return null;
  const cached = imgCache.get(path);
  if (cached) return cached;
  // Kick off async load; subsequent frames will pick it up.
  void loadImage(path);
  return null;
}
