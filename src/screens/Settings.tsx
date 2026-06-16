import { Check, Globe, Info, Palette } from 'lucide-react';
import { useLangStore, useT } from '../i18n';
import { PageFade } from '../components/ui';
import Navbar from '../components/Navbar';
import type { Lang } from '../i18n';

const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
];

export default function Settings() {
  const { t } = useT();
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);

  return (
    <PageFade className="min-h-screen bg-bg">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 py-8">
        <h1 className="mb-6 font-serif text-3xl font-bold text-text-dark">{t('settingsTitle')}</h1>

        <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
          <div className="mb-1 flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-text-dark">{t('language')}</h2>
          </div>
          <p className="mb-4 text-sm text-text-mid">{t('languageSubtitle')}</p>
          <div className="grid grid-cols-2 gap-3">
            {LANGS.map((l) => (
              <button key={l.code} onClick={() => setLang(l.code)} className={`flex items-center justify-between rounded-xl border-2 px-4 py-3.5 text-left transition ${lang === l.code ? 'border-primary bg-primary/[0.06]' : 'border-line hover:border-primary/30'}`}>
                <span className={`text-[15px] ${lang === l.code ? 'font-bold text-text-dark' : 'text-text-mid'}`}>{l.label}</span>
                {lang === l.code ? <Check className="h-5 w-5 text-primary" /> : <span className="h-5 w-5 rounded-full border-2 border-line" />}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-line bg-surface p-6 shadow-soft">
          <div className="mb-1 flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-text-dark">{t('theme')}</h2>
          </div>
          <p className="text-sm text-text-mid">Light · warm cinematic</p>
        </div>

        <div className="mt-5 rounded-2xl border border-line bg-surface p-6 shadow-soft">
          <div className="mb-1 flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-text-dark">{t('aboutApp')}</h2>
          </div>
          <p className="text-sm leading-relaxed text-text-mid">{t('aboutText')}</p>
          <p className="mt-2 text-[11px] text-text-mid/60">v1.0.0</p>
        </div>
      </main>
    </PageFade>
  );
}
