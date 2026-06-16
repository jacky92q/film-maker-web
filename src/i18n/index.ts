import { create } from 'zustand';
import { STR, fmt, type Lang, type StrKey } from './strings';

const LS_KEY = 'fm_language';

function detectInitial(): Lang {
  const saved = localStorage.getItem(LS_KEY);
  if (saved === 'en' || saved === 'ko') return saved;
  const nav = navigator.language?.toLowerCase() ?? 'en';
  return nav.startsWith('ko') ? 'ko' : 'en';
}

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
}

export const useLangStore = create<LangState>((set) => ({
  lang: detectInitial(),
  setLang: (l) => {
    localStorage.setItem(LS_KEY, l);
    set({ lang: l });
  },
}));

export function useT() {
  const lang = useLangStore((s) => s.lang);
  const t = (key: StrKey): string => STR[lang][key] ?? STR.en[key] ?? key;
  return { t, lang, f: fmt };
}

// Non-hook accessor (for canvas / non-React modules)
export const tn = (key: StrKey): string => {
  const lang = useLangStore.getState().lang;
  return STR[lang][key] ?? STR.en[key] ?? key;
};

export type { Lang };
