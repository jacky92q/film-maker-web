import { Link } from 'react-router-dom';
import { useLangStore, useT } from '../i18n';

// The only chrome the library shares: a letterspaced wordmark on a hairline,
// and the language switch. Nothing else competes with the films.
export default function Masthead({ right }: { right?: React.ReactNode }) {
  const { t } = useT();
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);

  return (
    <header className="border-b border-hair">
      <div className="mx-auto flex h-[72px] max-w-[1180px] items-center gap-5 px-6">
        <Link to="/" className="group flex items-center gap-3">
          <span className="font-wordmark text-[15px] uppercase tracking-wordmark text-text transition-colors group-hover:text-gold">
            Film&nbsp;Maker
          </span>
          <span className="hidden h-3 w-px bg-hair-2 sm:block" />
          <span className="hidden text-[11.5px] text-text-3 sm:block">{t('appTagline')}</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {right}
          <div className="flex items-center rounded-full border border-hair p-0.5">
            {(['ko', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`rounded-full px-2.5 py-1.5 text-[10.5px] font-bold uppercase tracking-widest transition-colors ${
                  lang === l ? 'bg-gold text-[#17120E]' : 'text-text-3 hover:text-text'
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
