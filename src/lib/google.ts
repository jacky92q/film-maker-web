// Real Google Sign-In via Google Identity Services (GIS), fully client-side.
// Works on a static host (GitHub Pages) — no backend required — but needs an
// OAuth Client ID whose "Authorized JavaScript origins" include this site.
//
// Provide it at build time as VITE_GOOGLE_CLIENT_ID (e.g. a repo Actions secret),
// or paste it into FALLBACK_CLIENT_ID below.

const FALLBACK_CLIENT_ID = '';

export const GOOGLE_CLIENT_ID: string =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || FALLBACK_CLIENT_ID;

export const googleConfigured = () => GOOGLE_CLIENT_ID.length > 0;

export interface GoogleProfile {
  name: string;
  email: string;
  picture?: string;
}

let scriptPromise: Promise<void> | null = null;

export function loadGsi(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (typeof document === 'undefined') return reject(new Error('no document'));
    // @ts-expect-error GIS global
    if (window.google?.accounts?.id) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export function decodeJwt(token: string): GoogleProfile | null {
  try {
    const payload = token.split('.')[1];
    const json = JSON.parse(
      decodeURIComponent(
        atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      ),
    );
    return { name: json.name || json.email, email: json.email, picture: json.picture };
  } catch {
    return null;
  }
}

interface GsiId {
  initialize: (cfg: { client_id: string; callback: (resp: { credential: string }) => void; auto_select?: boolean }) => void;
  renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
  prompt: () => void;
}
export function gsi(): GsiId | null {
  // @ts-expect-error GIS global
  return window.google?.accounts?.id ?? null;
}
