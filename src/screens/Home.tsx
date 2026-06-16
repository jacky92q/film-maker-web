import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clapperboard, Film, Plus, Settings as SettingsIcon, LogOut, Camera,
  Music, Sparkles, Layers, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../store/auth';
import { useProjects } from '../store/projects';
import { useT } from '../i18n';
import { slideCount } from '../domain/models';
import { Button, Center, PageFade } from '../components/ui';
import NewFilmDialog from '../components/NewFilmDialog';
import type { VideoOrientation } from '../domain/enums';

export default function Home() {
  const { t } = useT();
  const nav = useNavigate();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const projects = useProjects((s) => s.projects);
  const create = useProjects((s) => s.create);
  const [dialog, setDialog] = useState(false);
  const [menu, setMenu] = useState(false);

  const totalSlides = projects.reduce((a, p) => a + slideCount(p), 0);

  function handleCreate(title: string, orientation: VideoOrientation) {
    const p = create(title, orientation);
    setDialog(false);
    nav(`/editor/${p.id}`);
  }

  return (
    <PageFade className="min-h-screen bg-bg pb-16">
      <Center>
        {/* App bar */}
        <header className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-primary">
              <Clapperboard className="h-5 w-5 text-white" />
            </div>
            <span className="font-serif text-xl font-extrabold text-text-dark">Film Maker</span>
          </div>
          <div className="relative">
            <button
              onClick={() => setMenu(!menu)}
              className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 font-bold text-primary"
            >
              {user?.name?.[0]?.toUpperCase() ?? 'G'}
            </button>
            {menu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-line bg-surface shadow-card"
                >
                  <MenuItem icon={<SettingsIcon className="h-4 w-4" />} label={t('settings')} onClick={() => { setMenu(false); nav('/settings'); }} />
                  <MenuItem icon={<LogOut className="h-4 w-4" />} label={t('signOut')} onClick={() => { logout(); nav('/login'); }} />
                </motion.div>
              </>
            )}
          </div>
        </header>

        {/* Hero banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl2 bg-gradient-to-br from-[#3B1F0A] via-[#7B3F18] to-primary p-6 text-white shadow-elevated"
        >
          <Film className="absolute -right-6 -top-6 h-44 w-44 text-white/[0.08]" />
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium backdrop-blur">
            {t('welcomeBack')}
          </span>
          <h1 className="mt-3 font-serif text-[26px] font-bold">{user?.name ?? 'Friend'}</h1>
          <p className="mt-1 text-[13px] text-white/75">{t('appTagline')}</p>
          <button
            onClick={() => setDialog(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-white px-4 py-2.5 text-sm font-bold text-primary-dark active:scale-95"
          >
            <Plus className="h-4 w-4" /> {t('newFilm')}
          </button>
        </motion.div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <StatCard icon={<Film className="h-5 w-5" />} value={projects.length} label={t('statFilms')} />
          <StatCard icon={<Layers className="h-5 w-5" />} value={totalSlides} label={t('statSlides')} />
        </div>

        {/* Quick actions */}
        <h2 className="mb-3 mt-7 text-sm font-bold text-text-dark">{t('quickActions')}</h2>
        <div className="grid grid-cols-2 gap-3">
          <ActionCard
            color="from-primary to-primary-dark shadow-[0_8px_20px_rgba(192,120,66,0.35)]"
            icon={<Film className="h-6 w-6" />}
            title={t('myFilms')}
            sub={t('myFilmsSub')}
            onClick={() => nav('/projects')}
          />
          <ActionCard
            color="from-teal to-[#0E7A68] shadow-[0_8px_20px_rgba(26,163,140,0.35)]"
            icon={<Plus className="h-6 w-6" />}
            title={t('newFilm')}
            sub={t('newFilmSub')}
            onClick={() => setDialog(true)}
          />
        </div>

        {/* Tips */}
        <div className="mt-7 rounded-2xl border border-line bg-surface p-5 shadow-soft">
          <h3 className="mb-3 text-sm font-bold text-text-dark">{t('tipsTitle')}</h3>
          <Tip icon={<Camera className="h-4 w-4 text-primary" />} text={t('tip1')} />
          <div className="my-3 h-px bg-line" />
          <Tip icon={<Music className="h-4 w-4 text-teal" />} text={t('tip2')} />
          <div className="my-3 h-px bg-line" />
          <Tip icon={<Sparkles className="h-4 w-4 text-violet" />} text={t('tip3')} />
        </div>
      </Center>

      <NewFilmDialog open={dialog} onClose={() => setDialog(false)} onCreate={handleCreate} />
    </PageFade>
  );
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text-dark hover:bg-surface-2">
      {icon} {label}
    </button>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-soft">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</div>
      <div>
        <div className="text-xl font-extrabold text-text-dark">{value}</div>
        <div className="text-xs text-text-mid">{label}</div>
      </div>
    </div>
  );
}

function ActionCard({
  color, icon, title, sub, onClick,
}: { color: string; icon: React.ReactNode; title: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-start gap-2 rounded-2xl bg-gradient-to-br ${color} p-4 text-left text-white active:scale-[0.98]`}>
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/20">{icon}</div>
      <div className="text-[15px] font-bold">{title}</div>
      <div className="flex items-center gap-1 text-[11px] text-white/80">{sub} <ChevronRight className="h-3 w-3" /></div>
    </button>
  );
}

function Tip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2">{icon}</div>
      <span className="text-[13px] text-text-mid">{text}</span>
    </div>
  );
}
