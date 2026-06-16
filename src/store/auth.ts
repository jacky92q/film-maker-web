import { create } from 'zustand';

export interface User {
  name: string;
  email: string;
  guest?: boolean;
  provider?: 'email' | 'google' | 'guest';
}

const LS_KEY = 'fm_user';

function load(): User | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function save(u: User | null) {
  if (u) localStorage.setItem(LS_KEY, JSON.stringify(u));
  else localStorage.removeItem(LS_KEY);
}

interface AuthState {
  user: User | null;
  login: (email: string, name?: string) => void;
  loginWithGoogle: () => void;
  guest: () => void;
  logout: () => void;
}

// Local mock auth — there is no backend on GitHub Pages, so accounts live in
// localStorage. Any email/password is accepted; this is a personal creative tool.
export const useAuth = create<AuthState>((set) => ({
  user: load(),
  login: (email, name) => {
    const u: User = { email, name: name || nameFromEmail(email), provider: 'email' };
    save(u);
    set({ user: u });
  },
  loginWithGoogle: () => {
    // Demo Google account (no real OAuth available on a static host).
    const u: User = { email: 'you@gmail.com', name: 'Google User', provider: 'google' };
    save(u);
    set({ user: u });
  },
  guest: () => {
    const u: User = { email: '', name: 'Guest', guest: true, provider: 'guest' };
    save(u);
    set({ user: u });
  },
  logout: () => {
    save(null);
    set({ user: null });
  },
}));

function nameFromEmail(email: string): string {
  const base = email.split('@')[0] || 'Friend';
  return base.charAt(0).toUpperCase() + base.slice(1);
}
