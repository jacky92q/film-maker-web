import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clapperboard, Plus, Globe, ChevronDown, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../store/auth';
import { useLangStore, useT } from '../i18n';

export default function Navbar({ onNewFilm }: { onNewFilm?: () => void }) {
  const { t } = useT();
  const nav = useNavigate();
  const loc = useLocation();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const [menu, setMenu] = useState(false);

  const links: { to: string; label: string }[] = [
    { to: '/home', label: 'Home' },
    { to: '/projects', label: t('myFilms') },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
        <Link to="/home" className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-dark shadow-sm">
            <Clapperboard className="h-5 w-5 text-white" />
          </div>
          <span className="font-serif text-lg font-extrabold tracking-tight text-text-dark">Film Maker</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = loc.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${active ? 'text-primary' : 'text-text-mid hover:text-text-dark'}`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setLang(lang === 'en' ? 'ko' : 'en')}
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-text-mid hover:bg-black/5 sm:flex"
            title="Language"
          >
            <Globe className="h-4 w-4" /> {lang.toUpperCase()}
          </button>

          <button
            onClick={() => (onNewFilm ? onNewFilm() : nav('/projects'))}
            className="hidden items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:brightness-105 active:scale-95 sm:flex"
          >
            <Plus className="h-4 w-4" /> {t('newFilm')}
          </button>

          <div className="relative">
            <button onClick={() => setMenu(!menu)} className="flex items-center gap-1 rounded-full pl-1 pr-2 hover:bg-black/5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                {user?.name?.[0]?.toUpperCase() ?? 'G'}
              </span>
              <ChevronDown className="h-4 w-4 text-text-mid" />
            </button>
            <AnimatePresence>
              {menu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-elevated"
                  >
                    <div className="px-3 py-2">
                      <div className="text-sm font-bold text-text-dark">{user?.name}</div>
                      {user?.email && <div className="truncate text-xs text-text-mid">{user.email}</div>}
                    </div>
                    <div className="my-1 h-px bg-line" />
                    <MenuRow icon={<SettingsIcon className="h-4 w-4" />} label={t('settings')} onClick={() => { setMenu(false); nav('/settings'); }} />
                    <MenuRow icon={<Globe className="h-4 w-4" />} label={lang === 'en' ? '한국어' : 'English'} onClick={() => setLang(lang === 'en' ? 'ko' : 'en')} />
                    <MenuRow icon={<LogOut className="h-4 w-4" />} label={t('signOut')} onClick={() => { logout(); nav('/login'); }} />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}

function MenuRow({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-text-dark hover:bg-surface-2">
      {icon} {label}
    </button>
  );
}
