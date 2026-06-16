import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Trash2, Copy, Film, MonitorPlay, Smartphone, Music,
} from 'lucide-react';
import { useProjects } from '../store/projects';
import { useT } from '../i18n';
import { slideCount, projectThumb, type Project } from '../domain/models';
import { useImageUrl } from '../lib/useImageUrl';
import { Button, Center, PageFade } from '../components/ui';
import NewFilmDialog from '../components/NewFilmDialog';
import type { VideoOrientation } from '../domain/enums';

const GRADIENTS = [
  'from-[#3B1F0A] to-primary',
  'from-[#0A2A1F] to-teal',
  'from-[#1A0A2A] to-violet',
  'from-[#2A1A0A] to-[#E8963C]',
];

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
    <PageFade className="min-h-screen bg-bg pb-28">
      <Center max={1100}>
        <header className="flex items-center gap-3 py-4">
          <button onClick={() => nav('/home')} className="grid h-10 w-10 place-items-center rounded-full hover:bg-black/5">
            <ArrowLeft className="h-5 w-5 text-text-dark" />
          </button>
          <h1 className="font-serif text-xl font-bold text-text-dark">{t('myWeddingFilms')}</h1>
        </header>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="grid h-22 w-22 place-items-center rounded-full bg-primary/10 p-6 text-primary">
              <Film className="h-10 w-10" />
            </div>
            <h2 className="mt-5 font-serif text-xl font-bold text-text-dark">{t('noFilmsYet')}</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-text-mid">{t('noFilmsSub')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {projects.map((p, i) => (
              <ProjectCard
                key={p.id}
                project={p}
                gradient={GRADIENTS[i % GRADIENTS.length]}
                slides={f.slidesCount(lang, slideCount(p))}
                date={relDate(p.updatedAt)}
                onOpen={() => nav(`/editor/${p.id}`)}
                onDelete={() => setConfirmDel(p)}
                onDuplicate={() => duplicate(p.id)}
              />
            ))}
          </div>
        )}
      </Center>

      {/* FAB */}
      <button
        onClick={() => setDialog(true)}
        className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-6 py-3.5 font-bold text-white shadow-elevated active:scale-95"
      >
        <Plus className="h-5 w-5" /> {t('newFilm')}
      </button>

      <NewFilmDialog open={dialog} onClose={() => setDialog(false)} onCreate={handleCreate} />

      <AnimatePresence>
        {confirmDel && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setConfirmDel(null)}
          >
            <motion.div
              className="w-full max-w-sm rounded-3xl bg-surface p-6 shadow-elevated"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
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
  project, gradient, slides, date, onOpen, onDelete, onDuplicate,
}: {
  project: Project;
  gradient: string;
  slides: string;
  date: string;
  onOpen: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const thumb = useImageUrl(projectThumb(project));
  const portrait = project.orientation === 'portrait';
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-card"
    >
      <button onClick={onOpen} className="relative block aspect-video w-full overflow-hidden">
        {thumb ? (
          <img src={thumb} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className={`grid h-full w-full place-items-center bg-gradient-to-br ${gradient}`}>
            <Film className="h-10 w-10 text-white/25" />
          </div>
        )}
        <div className="absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-md bg-black/50 text-white">
          {portrait ? <Smartphone className="h-3.5 w-3.5" /> : <MonitorPlay className="h-3.5 w-3.5" />}
        </div>
        {project.musicName && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5 text-[9px] text-white/80">
            <Music className="h-2.5 w-2.5" /> Music
          </div>
        )}
      </button>
      <div className="flex items-start justify-between gap-1 p-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-text-dark">{project.title}</div>
          <div className="mt-0.5 text-[11px] text-text-mid">{slides}</div>
          <div className="text-[10px] text-text-mid/70">{date}</div>
        </div>
        <div className="flex shrink-0 gap-0.5">
          <button onClick={onDuplicate} className="grid h-7 w-7 place-items-center rounded-md text-text-mid hover:bg-surface-2">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="grid h-7 w-7 place-items-center rounded-md text-text-mid hover:bg-danger/10 hover:text-danger">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
