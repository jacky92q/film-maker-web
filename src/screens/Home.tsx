import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Film, Plus, Layers, ArrowRight, Wand2, Sparkles, Clapperboard, Clock,
} from 'lucide-react';
import { useAuth } from '../store/auth';
import { useProjects } from '../store/projects';
import { useT } from '../i18n';
import { slideCount, projectThumb, totalDuration, type Project } from '../domain/models';
import { useImageUrl } from '../lib/useImageUrl';
import { PageFade } from '../components/ui';
import Navbar from '../components/Navbar';
import NewFilmDialog from '../components/NewFilmDialog';
import type { VideoOrientation } from '../domain/enums';

export default function Home() {
  const { t, f, lang } = useT();
  const nav = useNavigate();
  const user = useAuth((s) => s.user);
  const projects = useProjects((s) => s.projects);
  const create = useProjects((s) => s.create);
  const [dialog, setDialog] = useState(false);

  const totalSlides = projects.reduce((a, p) => a + slideCount(p), 0);
  const recent = projects.slice(0, 4);

  function handleCreate(title: string, orientation: VideoOrientation) {
    const p = create(title, orientation);
    setDialog(false);
    nav(`/editor/${p.id}`);
  }

  return (
    <PageFade className="min-h-screen bg-bg">
      <Navbar onNewFilm={() => setDialog(true)} />

      <main className="mx-auto max-w-6xl px-5 pb-20">
        {/* Hero */}
        <section className="relative mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#2A1408] via-[#7B3F18] to-primary px-8 py-14 text-white shadow-elevated md:px-14 md:py-20">
          <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_15%_20%,white_1.5px,transparent_1.5px)] [background-size:30px_30px]" />
          <Film className="absolute -right-12 -top-12 h-72 w-72 text-white/[0.06]" />
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> {t('welcomeBack')}, {user?.name}
            </span>
            <h1 className="mt-5 font-serif text-4xl font-bold leading-[1.1] md:text-6xl">
              {t('appTagline')}
            </h1>
            <p className="mt-4 max-w-lg text-base text-white/75 md:text-lg">
              {t('filmTitlePrompt')}. {t('myFilmsSub')}.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => setDialog(true)} className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-primary-dark shadow-lg transition hover:bg-white/90 active:scale-95">
                <Plus className="h-4 w-4" /> {t('newFilm')}
              </button>
              <Link to="/projects" className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20">
                {t('myFilms')} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
          <Stat icon={<Film className="h-5 w-5" />} value={projects.length} label={t('statFilms')} />
          <Stat icon={<Layers className="h-5 w-5" />} value={totalSlides} label={t('statSlides')} />
          <Stat icon={<Clock className="h-5 w-5" />} value={`${Math.round(projects.reduce((a, p) => a + totalDuration(p), 0))}s`} label="Total" className="hidden md:flex" />
        </section>

        {/* Recent films */}
        <section className="mt-12">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="font-serif text-2xl font-bold text-text-dark">{t('myFilms')}</h2>
            {projects.length > 0 && (
              <Link to="/projects" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:gap-2 transition-all">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {projects.length === 0 ? (
            <button onClick={() => setDialog(true)} className="flex w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-line bg-surface/60 py-20 transition hover:border-primary/40 hover:bg-surface">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
                <Plus className="h-8 w-8" />
              </div>
              <p className="mt-4 font-serif text-xl font-bold text-text-dark">{t('noFilmsYet')}</p>
              <p className="mt-1 text-sm text-text-mid">{t('newFilmSub')}</p>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <button onClick={() => setDialog(true)} className="group flex aspect-video flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-surface/60 transition hover:border-primary/50 hover:bg-surface">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary transition group-hover:scale-110">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="mt-2 text-sm font-semibold text-text-mid">{t('newFilm')}</span>
              </button>
              {recent.map((p) => (
                <RecentCard key={p.id} project={p} slides={f.slidesCount(lang, slideCount(p))} onClick={() => nav(`/editor/${p.id}`)} />
              ))}
            </div>
          )}
        </section>

        {/* Features */}
        <section className="mt-16">
          <h2 className="text-center font-serif text-2xl font-bold text-text-dark">Everything you need to tell your story</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <FeatureCard color="from-primary to-primary-dark" icon={<Wand2 className="h-6 w-6" />} title="Powerful editor" text="Photos, text, stickers, filters and frames on an infinite canvas." />
            <FeatureCard color="from-teal to-[#0E7A68]" icon={<Sparkles className="h-6 w-6" />} title="Cinematic motion" text="11 transitions, animated text and ambient particle effects." />
            <FeatureCard color="from-violet to-[#4B3FC4]" icon={<Clapperboard className="h-6 w-6" />} title="Export anywhere" text="Render a seekable MP4 in 720p, 1080p or 4K — right in your browser." />
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-8 text-center text-sm text-text-mid">
        Film Maker · {t('appTagline')}
      </footer>

      <NewFilmDialog open={dialog} onClose={() => setDialog(false)} onCreate={handleCreate} />
    </PageFade>
  );
}

function Stat({ icon, value, label, className = '' }: { icon: React.ReactNode; value: number | string; label: string; className?: string }) {
  return (
    <div className={`flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-soft ${className}`}>
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</div>
      <div>
        <div className="text-2xl font-extrabold text-text-dark">{value}</div>
        <div className="text-sm text-text-mid">{label}</div>
      </div>
    </div>
  );
}

function RecentCard({ project, slides, onClick }: { project: Project; slides: string; onClick: () => void }) {
  const thumb = useImageUrl(projectThumb(project));
  return (
    <motion.button
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="group overflow-hidden rounded-2xl border border-line bg-surface text-left shadow-card"
    >
      <div className="relative aspect-video overflow-hidden">
        {thumb ? (
          <img src={thumb} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[#3B1F0A] to-primary">
            <Film className="h-10 w-10 text-white/25" />
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="truncate text-sm font-bold text-text-dark">{project.title}</div>
        <div className="mt-0.5 text-xs text-text-mid">{slides}</div>
      </div>
    </motion.button>
  );
}

function FeatureCard({ color, icon, title, text }: { color: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
      <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${color} text-white`}>{icon}</div>
      <h3 className="mt-4 text-lg font-bold text-text-dark">{title}</h3>
      <p className="mt-1.5 text-sm text-text-mid">{text}</p>
    </div>
  );
}
