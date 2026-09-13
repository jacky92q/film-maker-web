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
    <Page className="room min-h-screen bg-screen">
      <Masthead />

      <main className="mx-auto max-w-[1180px] px-6 pb-28">
        {/* Masthead block: a title, a rule, and the one action. */}
        <section className="pt-16 sm:pt-20">
          <Label>{t('libraryKicker')}</Label>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
            <h1 className="font-display text-[46px] leading-[0.98] tracking-tight text-text sm:text-[62px]">
              {t('libraryTitle')}
            </h1>
            <Button onClick={() => setDialog(true)}>
              <Plus className="h-4 w-4" strokeWidth={2.2} />
              {t('newFilm')}
            </Button>
          </div>
          <div className="mt-7 flex items-center gap-5">
            <span className="h-px flex-1 bg-gradient-to-r from-gold/70 via-hair to-transparent" />
            <span className="label shrink-0">
              {projects.length > 0
                ? `${projects.length} ${lang === 'ko' ? '편' : projects.length === 1 ? 'film' : 'films'}`
                : t('libraryIntro')}
            </span>
          </div>
        </section>

        {projects.length === 0 ? (
          <EmptyState onStart={() => setDialog(true)} />
        ) : (
          <ul className="grid grid-cols-1 gap-x-8 gap-y-14 pt-14 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project, i) => (
              <motion.li
                key={project.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.3), duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <FilmCard
                  index={i + 1}
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

        <p className="mt-24 text-center text-[11.5px] text-text-3">{t('libraryIntro')}</p>
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
  index,
  project,
  meta,
  edited,
  onOpen,
  onDuplicate,
  onDelete,
  duplicateLabel,
  deleteLabel,
}: {
  index: number;
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
        className="relative block w-full overflow-hidden rounded-[6px] bg-black ring-1 ring-hair transition-all duration-500 group-hover:ring-gold/45"
        style={{ aspectRatio: '3 / 2' }}
      >
        {/* A blurred copy fills the card so a portrait film is not half black,
            the same trick the editor offers for photos. */}
        <span className="absolute inset-0 scale-[1.3] opacity-40 blur-2xl" aria-hidden>
          <SlideThumb slide={project.slides[0]} orientation={project.orientation} scale={0.1} />
        </span>
        {/* The still is the real first frame, and it breathes on hover. */}
        <span className="absolute inset-0 grid place-items-center transition-transform duration-[900ms] ease-out group-hover:scale-[1.045]">
          <span
            className="block h-full"
            style={{ aspectRatio: project.orientation === 'portrait' ? '9 / 16' : '16 / 9' }}
          >
            <SlideThumb slide={project.slides[0]} orientation={project.orientation} />
          </span>
        </span>
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/15" />
        <span className="absolute left-4 top-3.5 text-[10px] font-semibold uppercase tracking-label text-white/55">
          {project.orientation === 'portrait' ? '9:16' : '16:9'}
        </span>
        {project.musicPath && (
          <span className="absolute right-4 top-3.5 text-white/55">
            <Music2 className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      <div className="mt-5 flex items-start gap-4">
        <span className="mt-1 w-8 shrink-0 text-[11px] font-semibold tabular-nums tracking-widest text-text-3/70 transition-colors duration-300 group-hover:text-gold">
          {String(index).padStart(2, '0')}
        </span>
        <div className="min-w-0 flex-1">
          <button onClick={onOpen} className="block max-w-full text-left">
            <span className="block truncate font-display text-[22px] leading-snug text-text transition-colors duration-300 group-hover:text-gold">
              {project.title}
            </span>
            {/* A champagne rule draws itself under the title on hover. */}
            <span className="mt-2 block h-px w-full origin-left scale-x-0 bg-gold/60 transition-transform duration-500 ease-out group-hover:scale-x-100" />
          </button>
          <p className="mt-2.5 truncate text-[12px] text-text-3">
            {meta} <span className="text-text-3/50">· {edited}</span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 opacity-70 transition-opacity duration-300 focus-within:opacity-100 group-hover:opacity-100 sm:opacity-0">
          <button
            onClick={onDuplicate}
            title={duplicateLabel}
            aria-label={duplicateLabel}
            className="grid h-9 w-9 place-items-center rounded-full text-text-3 transition-colors hover:bg-white/[0.07] hover:text-text"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            title={deleteLabel}
            aria-label={deleteLabel}
            className="grid h-9 w-9 place-items-center rounded-full text-text-3 transition-colors hover:bg-clay/15 hover:text-clay"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  const { t } = useT();
  return (
    <div className="relative mt-16 overflow-hidden rounded-[6px] border border-hair px-6 py-24 text-center">
      {/* A single candle behind the invitation. */}
      <span className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.09] blur-[70px]" />
      <div className="relative mx-auto max-w-sm">
        <h2 className="font-display text-[32px] leading-tight text-text">{t('emptyTitle')}</h2>
        <p className="mt-4 text-[13.5px] leading-relaxed text-text-3">{t('emptyBody')}</p>
        <Button className="mt-8" onClick={onStart}>
          <Plus className="h-4 w-4" />
          {t('emptyAction')}
        </Button>
      </div>
    </div>
  );
}
