import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Copy, Film, MonitorPlay, Smartphone, Music, Clock, Layers } from 'lucide-react';
import { useProjects } from '../store/projects';
import { useT } from '../i18n';
import { slideCount, projectThumb, totalDuration, type Project } from '../domain/models';
import { useImageUrl } from '../lib/useImageUrl';
import { Button, PageFade } from '../components/ui';
import Navbar from '../components/Navbar';
import NewFilmDialog from '../components/NewFilmDialog';
import type { VideoOrientation } from '../domain/enums';

export default function Projects() {
  const { t, f, lang } = useT();
  const nav = useNavigate();
  const projects = useProjects((s) => s.projects);
  const create = useProjects((s) => s.create);
  const remove = useProjects((s) => s.remove);
  const duplicate = useProjects((s) => s.duplicate);
  const [dialog, setDialog] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Project | null>(null);

  function handleCreate(title: string, orientation: VideoOrientation) {
    const p = create(title, orientation);
    setDialog(false);
    nav(`/editor/${p.id}`);
  }

  function relDate(iso: string): string {
    const d = new Date(iso);
    const days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (days <= 0) return t('today');
    if (days === 1) return t('yesterday');
    if (days < 30) return f.daysAgo(lang, days);
    return d.toLocaleDateString();
  }

  return (
    <PageFade className="min-h-screen bg-bg">
      <Navbar onNewFilm={() => setDialog(true)} />

      <main className="mx-auto max-w-6xl px-5 pb-24">
        <div className="flex flex-wrap items-end justify-between gap-4 py-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-text-dark">{t('myWeddingFilms')}</h1>
            <p className="mt-1 text-sm text-text-mid">{f.slidesCount(lang, projects.reduce((a, p) => a + slideCount(p), 0))} · {projects.length} {t('statFilms')}</p>
          </div>
          <Button onClick={() => setDialog(true)}><Plus className="h-5 w-5" /> {t('newFilm')}</Button>
        </div>

        {projects.length === 0 ? (
          <button onClick={() => setDialog(true)} className="flex w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-line bg-surface/60 py-24 transition hover:border-primary/40 hover:bg-surface">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-primary">
              <Film className="h-9 w-9" />
            </div>
            <h2 className="mt-5 font-serif text-2xl font-bold text-text-dark">{t('noFilmsYet')}</h2>
            <p className="mt-2 whitespace-pre-line text-center text-sm text-text-mid">{t('noFilmsSub')}</p>
          </button>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                slides={f.slidesCount(lang, slideCount(p))}
                duration={f.duration(lang, totalDuration(p))}
                date={relDate(p.updatedAt)}
                onOpen={() => nav(`/editor/${p.id}`)}
                onDelete={() => setConfirmDel(p)}
                onDuplicate={() => duplicate(p.id)}
              />
            ))}
          </div>
        )}
      </main>

      <NewFilmDialog open={dialog} onClose={() => setDialog(false)} onCreate={handleCreate} />

      <AnimatePresence>
        {confirmDel && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmDel(null)}>
            <motion.div className="w-full max-w-sm rounded-3xl bg-surface p-6 shadow-elevated" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <h3 className="font-serif text-lg font-bold text-text-dark">{t('deleteFilmTitle')}</h3>
              <p className="mt-2 text-sm text-text-mid">{f.deleteFilmConfirm(lang, confirmDel.title)}</p>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setConfirmDel(null)}>{t('cancel')}</Button>
                <Button variant="danger" onClick={() => { remove(confirmDel.id); setConfirmDel(null); }}>{t('delete')}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageFade>
  );
}

function ProjectCard({
  project, slides, duration, date, onOpen, onDelete, onDuplicate,
}: {
  project: Project;
  slides: string;
  duration: string;
  date: string;
  onOpen: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const thumb = useImageUrl(projectThumb(project));
  const portrait = project.orientation === 'portrait';
  return (
    <motion.div whileHover={{ y: -4 }} className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <button onClick={onOpen} className="relative block aspect-video w-full overflow-hidden">
        {thumb ? (
          <img src={thumb} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[#3B1F0A] to-primary">
            <Film className="h-12 w-12 text-white/25" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1 text-[11px] font-medium text-white backdrop-blur">
          {portrait ? <Smartphone className="h-3 w-3" /> : <MonitorPlay className="h-3 w-3" />}
          {portrait ? '9:16' : '16:9'}
        </div>
        {project.musicName && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1 text-[10px] text-white backdrop-blur">
            <Music className="h-3 w-3" /> {project.musicName}
          </div>
        )}
      </button>
      <div className="flex items-start justify-between gap-2 p-4">
        <div className="min-w-0">
          <div className="truncate font-bold text-text-dark">{project.title}</div>
          <div className="mt-1 flex items-center gap-3 text-xs text-text-mid">
            <span className="inline-flex items-center gap-1"><Layers className="h-3 w-3" /> {slides}</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {duration}</span>
          </div>
          <div className="mt-0.5 text-[11px] text-text-mid/70">{date}</div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button onClick={onDuplicate} title="Duplicate" className="grid h-8 w-8 place-items-center rounded-lg text-text-mid hover:bg-surface-2"><Copy className="h-4 w-4" /></button>
          <button onClick={onDelete} title="Delete" className="grid h-8 w-8 place-items-center rounded-lg text-text-mid hover:bg-danger/10 hover:text-danger"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
    </motion.div>
  );
}
