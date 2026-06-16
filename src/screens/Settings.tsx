import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Globe, Info } from 'lucide-react';
import { useLangStore, useT } from '../i18n';
import { Center, PageFade } from '../components/ui';
import type { Lang } from '../i18n';

const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
];

export default function Settings() {
  const { t } = useT();
  const nav = useNavigate();
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);

  return (
    <PageFade className="min-h-screen bg-bg">
      <Center max={560}>
        <header className="flex items-center gap-3 py-4">
          <button onClick={() => nav('/home')} className="grid h-10 w-10 place-items-center rounded-full hover:bg-black/5">
            <ArrowLeft className="h-5 w-5 text-text-dark" />
          </button>
          <h1 className="font-serif text-xl font-bold text-text-dark">{t('settingsTitle')}</h1>
        </header>

        <div className="mt-2 rounded-2xl border border-line bg-surface p-5 shadow-soft">
          <div className="mb-1 flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <h2 className="text-[15px] font-bold text-text-dark">{t('language')}</h2>
          </div>
          <p className="mb-3 text-[13px] text-text-mid">{t('languageSubtitle')}</p>
          <div className="overflow-hidden rounded-xl border border-line">
            {LANGS.map((l, i) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`flex w-full items-center justify-between px-4 py-3.5 text-left ${i > 0 ? 'border-t border-line' : ''} hover:bg-surface-2`}
              >
                <span className={`text-[15px] ${lang === l.code ? 'font-bold text-text-dark' : 'text-text-mid'}`}>{l.label}</span>
                {lang === l.code ? (
                  <Check className="h-5 w-5 text-primary" />
                ) : (
                  <span className="h-5 w-5 rounded-full border-2 border-line" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-line bg-surface p-5 shadow-soft">
          <div className="mb-1 flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <h2 className="text-[15px] font-bold text-text-dark">{t('aboutApp')}</h2>
          </div>
          <p className="text-[13px] leading-relaxed text-text-mid">{t('aboutText')}</p>
          <p className="mt-2 text-[11px] text-text-mid/60">v1.0.0</p>
        </div>
      </Center>
    </PageFade>
  );
}
