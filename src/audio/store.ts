// Audio lives in IndexedDB alongside the photos: project JSON only carries a
// lightweight `web_audio://<id>` reference. Decoded AudioBuffers are cached in
// memory so preview and export share one decode.

import { v4 as uuid } from 'uuid';
import { renderSampleTrack, SAMPLE_TRACK_NAME, SAMPLE_TRACK_PATH } from './sample';

const DB_NAME = 'film_maker_audio';
const STORE = 'tracks';
const PREFIX = 'web_audio://';

export { SAMPLE_TRACK_NAME, SAMPLE_TRACK_PATH };

export const isSampleTrack = (path: string | null): boolean => path === SAMPLE_TRACK_PATH;
export const isStoredTrack = (path: string | null): path is string => !!path && path.startsWith(PREFIX);
export const isPlayableTrack = (path: string | null): path is string =>
  isSampleTrack(path) || isStoredTrack(path);

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

export async function putAudioFile(file: File): Promise<string> {
  const db = await openDb();
  const id = uuid();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(file, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return PREFIX + id;
}

async function getBlob(path: string): Promise<Blob | null> {
  if (!isStoredTrack(path)) return null;
  const id = path.slice(PREFIX.length);
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as Blob) ?? null);
    req.onerror = () => reject(req.error);
  });
}

// A throwaway context used only for decodeAudioData (no user gesture needed).
let decoder: OfflineAudioContext | null = null;
function getDecoder(): OfflineAudioContext {
  if (!decoder) decoder = new OfflineAudioContext(1, 1, 44100);
  return decoder;
}

const bufferCache = new Map<string, Promise<AudioBuffer | null>>();

export function loadTrack(path: string | null): Promise<AudioBuffer | null> {
  if (!isPlayableTrack(path)) return Promise.resolve(null);
  const hit = bufferCache.get(path);
  if (hit) return hit;
  const p = (async (): Promise<AudioBuffer | null> => {
    try {
      if (isSampleTrack(path)) return await renderSampleTrack();
      const blob = await getBlob(path);
      if (!blob) return null;
      return await getDecoder().decodeAudioData(await blob.arrayBuffer());
    } catch (e) {
      console.warn('Could not decode the music track', e);
      return null;
    }
  })();
  bufferCache.set(path, p);
  return p;
}

export async function deleteTrack(path: string | null): Promise<void> {
  if (!isStoredTrack(path)) return;
  bufferCache.delete(path);
  const id = path.slice(PREFIX.length);
  const db = await openDb();
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export const ACCEPTED_AUDIO = 'audio/*,.mp3,.m4a,.aac,.wav,.ogg,.flac';

// Opens the file picker and stores the chosen track. Resolves to null if the
// user cancels or the file cannot be decoded.
export function pickAudio(): Promise<{ path: string; name: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ACCEPTED_AUDIO;
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const path = await putAudioFile(file);
      const buffer = await loadTrack(path);
      if (!buffer) {
        await deleteTrack(path);
        return resolve(null);
      }
      resolve({ path, name: file.name.replace(/\.[^.]+$/, '') });
    };
    input.click();
  });
}
