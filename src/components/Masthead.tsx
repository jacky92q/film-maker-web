import { Link } from 'react-router-dom';
import { useLangStore, useT } from '../i18n';

// The one piece of chrome the library screens share: a wordmark and the
// language switch. Deliberately quiet — the films are the content.
export default function Masthead({ right }: { right?: React.ReactNode }) {
  const { t } = useT();
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-16 max-w-[1120px] items-center gap-4 px-6">
        <Link to="/" className="group flex items-baseline gap-2.5">
          <span className="font-display text-[19px] leading-none text-ink">Film Maker</span>
          <span className="hidden text-[11.5px] text-ink-3 transition-colors group-hover:text-gold sm:block">
            {t('appTagline')}
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {right}
          <div className="flex overflow-hidden rounded-lg border border-line">
            {(['ko', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                  lang === l ? 'bg-ink text-paper' : 'text-ink-3 hover:bg-ink/[0.05]'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
