import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Copy, Music2, Plus, Trash2 } from 'lucide-react';
import { useProjects } from '../store/projects';
import { useT } from '../i18n';
import { slideCount, totalDuration, type Project } from '../domain/models';
import { Button, Label, Modal, Page } from '../components/ui';
import Masthead from '../components/Masthead';
import SlideThumb from '../components/SlideThumb';
import NewFilmDialog from '../components/NewFilmDialog';
import type { VideoOrientation } from '../domain/enums';

export default function Library() {
  const { t, f, lang } = useT();
  const nav = useNavigate();
  const projects = useProjects((s) => s.projects);
  const create = useProjects((s) => s.create);
  const remove = useProjects((s) => s.remove);
  const duplicate = useProjects((s) => s.duplicate);

  const [dialog, setDialog] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);

  function handleCreate(title: string, orientation: VideoOrientation) {
    const p = create(title, orientation);
    setDialog(false);
    nav(`/film/${p.id}`);
  }

  function edited(iso: string): string {
    const date = new Date(iso);
    const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
    if (days <= 0) return t('today');
    if (days === 1) return t('yesterday');
    if (days < 30) return f.daysAgo(lang, days);
    return date.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-GB');
  }

  return (
    <Page className="min-h-screen bg-paper">
      <Masthead />

      <main className="mx-auto max-w-[1120px] px-6 pb-24">
        <div className="flex flex-wrap items-end justify-between gap-6 pb-8 pt-14">
          <div>
            <h1 className="font-display text-[40px] leading-[1.05] text-ink sm:text-[52px]">{t('libraryTitle')}</h1>
            <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-ink-3">{t('libraryIntro')}</p>
          </div>
          <Button onClick={() => setDialog(true)}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            {t('newFilm')}
          </Button>
        </div>

        <div className="h-px w-full bg-ink/15" />

        {projects.length === 0 ? (
          <EmptyState onStart={() => setDialog(true)} />
        ) : (
          <ul className="grid grid-cols-1 gap-x-7 gap-y-10 pt-10 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, i) => (
              <motion.li
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.24), duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <FilmCard
                  project={project}
                  meta={`${f.slidesCount(lang, slideCount(project))} · ${f.duration(lang, totalDuration(project))}`}
                  edited={edited(project.updatedAt)}
                  onOpen={() => nav(`/film/${project.id}`)}
                  onDuplicate={() => duplicate(project.id, t('copyLabel'))}
                  onDelete={() => setPendingDelete(project)}
                  duplicateLabel={t('duplicate')}
                  deleteLabel={t('delete')}
                />
              </motion.li>
            ))}
          </ul>
        )}
      </main>

      <NewFilmDialog open={dialog} onClose={() => setDialog(false)} onCreate={handleCreate} />

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title={t('deleteFilmTitle')}
        subtitle={pendingDelete ? f.deleteFilmConfirm(lang, pendingDelete.title) : undefined}
        width={400}
      >
        <div className="flex justify-end gap-2">
          <Button variant="quiet" onClick={() => setPendingDelete(null)}>
            {t('cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (pendingDelete) remove(pendingDelete.id);
              setPendingDelete(null);
            }}
          >
            {t('delete')}
          </Button>
        </div>
      </Modal>
    </Page>
  );
}

function FilmCard({
  project,
  meta,
  edited,
  onOpen,
  onDuplicate,
  onDelete,
  duplicateLabel,
  deleteLabel,
}: {
  project: Project;
  meta: string;
  edited: string;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  duplicateLabel: string;
  deleteLabel: string;
}) {
  return (
    <article className="group">
      <button
        onClick={onOpen}
        className="relative block w-full overflow-hidden rounded-lg border border-line bg-stage shadow-card transition-shadow duration-300 group-hover:shadow-lift"
        style={{ aspectRatio: '3 / 2' }}
      >
        <span className="absolute inset-0 grid place-items-center">
          <span
            className="block h-full"
            style={{ aspectRatio: project.orientation === 'portrait' ? '9 / 16' : '16 / 9' }}
          >
            <SlideThumb slide={project.slides[0]} orientation={project.orientation} />
          </span>
        </span>
        <span className="pointer-events-none absolute inset-0 bg-ink/0 transition-colors duration-300 group-hover:bg-ink/10" />
        <span className="absolute left-3 top-3 rounded bg-black/45 px-1.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white/90 backdrop-blur-sm">
          {project.orientation === 'portrait' ? '9:16' : '16:9'}
        </span>
        {project.musicPath && (
          <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded bg-black/45 text-white/90 backdrop-blur-sm">
            <Music2 className="h-3 w-3" />
          </span>
        )}
      </button>

      <div className="mt-3.5 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <button onClick={onOpen} className="block max-w-full truncate text-left font-display text-[19px] leading-snug text-ink hover:text-gold-deep">
            {project.title}
          </button>
          <p className="mt-1 truncate text-[12px] text-ink-3">{meta}</p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 opacity-60 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100 sm:opacity-0">
          <button
            onClick={onDuplicate}
            title={duplicateLabel}
            aria-label={duplicateLabel}
            className="grid h-10 w-10 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-ink/[0.06] hover:text-ink"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            title={deleteLabel}
            aria-label={deleteLabel}
            className="grid h-10 w-10 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-clay/10 hover:text-clay"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="mt-1 text-[11px] text-ink-3/70">{edited}</p>
    </article>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  const { t } = useT();
  return (
    <div className="mt-10 border border-line bg-card px-6 py-16 text-center sm:py-20">
      <div className="mx-auto max-w-sm">
        <Label>{t('appName')}</Label>
        <h2 className="mt-4 font-display text-[28px] leading-tight text-ink">{t('emptyTitle')}</h2>
        <p className="mt-3 text-[13.5px] leading-relaxed text-ink-3">{t('emptyBody')}</p>
        <Button className="mt-7" onClick={onStart}>
          <Plus className="h-4 w-4" />
          {t('emptyAction')}
        </Button>
      </div>
    </div>
  );
}
