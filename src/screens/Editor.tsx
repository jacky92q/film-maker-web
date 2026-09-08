import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, Check, Images, Layers, Music, Play, Plus, Redo2, Sticker as StickerIcon,
  Type, Undo2, Image as ImageIcon, Download,
} from 'lucide-react';
import { useProjects } from '../store/projects';
import { useEditor, type SelKind } from '../store/editor';
import { useT } from '../i18n';
import { useEnumLabel } from '../i18n/enumLabels';
import { pickImage, pickImages } from '../lib/imagePick';
import { totalDuration } from '../domain/models';
import { SLIDE_TEMPLATES, type SlideTemplate } from '../domain/enums';
import EditorCanvas from '../components/EditorCanvas';
import SlideRail from '../components/SlideRail';
import StickerPicker from '../components/StickerPicker';
import MusicPanel from '../components/MusicPanel';
import { EmptyPhoto, EmptyText, PhotoPanel, SlidePanel, StickerPanel, TextPanel } from '../components/EditorPanels';
import { Button, IconButton, Modal, Spinner } from '../components/ui';
import type { StrKey } from '../i18n/strings';

type Section = 'slide' | 'photo' | 'text' | 'sticker' | 'music';

const TOOLS: { key: Section; icon: typeof Layers; label: StrKey }[] = [
  { key: 'slide', icon: Layers, label: 'tabSlide' },
  { key: 'photo', icon: ImageIcon, label: 'tabPhoto' },
  { key: 'text', icon: Type, label: 'tabText' },
  { key: 'sticker', icon: StickerIcon, label: 'tabSticker' },
  { key: 'music', icon: Music, label: 'tabMusic' },
];

const TEMPLATE_DESC: Record<SlideTemplate, StrKey> = {
  blank: 'templateBlankDesc',
  opening: 'templateOpeningDesc',
  memory: 'templateMemoryDesc',
  loveNote: 'templateLoveNoteDesc',
  closing: 'templateClosingDesc',
};

export default function Editor() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t, f, lang } = useT();
  const el = useEnumLabel();
  const getById = useProjects((s) => s.getById);

  const project = useEditor((s) => s.project);
  const slideIndex = useEditor((s) => s.slideIndex);
  const selection = useEditor((s) => s.selection);
  const dirty = useEditor((s) => s.dirty);
  const init = useEditor((s) => s.init);
  const save = useEditor((s) => s.save);
  const setTitle = useEditor((s) => s.setTitle);
  const addSlide = useEditor((s) => s.addSlide);
  const addSticker = useEditor((s) => s.addSticker);
  const addPhotoLayer = useEditor((s) => s.addPhotoLayer);
  const addPhotoSlides = useEditor((s) => s.addPhotoSlides);
  const addText = useEditor((s) => s.addText);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const deleteLayer = useEditor((s) => s.deleteLayer);
  const setSlideIndex = useEditor((s) => s.setSlideIndex);

  const [section, setSection] = useState<Section>('slide');
  const tabStrip = useRef<HTMLDivElement>(null);
  const [stickerOpen, setStickerOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const p = id ? getById(id) : undefined;
    if (p) init(p);
    else nav('/', { replace: true });
  }, [id, getById, init, nav]);

  // Selecting something on the canvas opens the panel that edits it.
  useEffect(() => {
    const map: Record<SelKind, Section | null> = {
      text: 'text', photo: 'photo', sticker: 'sticker', bgphoto: 'slide', none: null,
    };
    const target = map[selection.kind];
    if (target) setSection(target);
  }, [selection.kind]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (meta && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (useEditor.getState().selection.kind !== 'none') {
          e.preventDefault();
          deleteLayer();
        }
      } else if (e.key === 'ArrowRight') {
        setSlideIndex(useEditor.getState().slideIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        setSlideIndex(useEditor.getState().slideIndex - 1);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, deleteLayer, save, setSlideIndex]);

  // Keep the saved copy current if the tab goes away mid-edit.
  useEffect(() => {
    const flush = () => save();
    window.addEventListener('beforeunload', flush);
    return () => {
      window.removeEventListener('beforeunload', flush);
      flush();
    };
  }, [save]);

  // Centre the active tab so the strip's fade never sits over it.
  useEffect(() => {
    tabStrip.current
      ?.querySelector<HTMLElement>(`[data-tab="${section}"]`)
      ?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [section]);

  const duration = useMemo(() => (project ? totalDuration(project) : 0), [project]);

  if (!project) {
    return (
      <div className="grid h-[100dvh] place-items-center bg-paper text-ink-3">
        <Spinner size={22} />
      </div>
    );
  }

  const slide = project.slides[Math.min(slideIndex, project.slides.length - 1)];

  async function importPhotos() {
    setImporting(true);
    const paths = await pickImages();
    setImporting(false);
    if (!paths.length) return;
    addPhotoSlides(paths);
    setToast(f.photosAdded(lang, paths.length));
    setTimeout(() => setToast(''), 2600);
  }

  async function addFromPanel() {
    if (section === 'photo') {
      const p = await pickImage();
      if (p) addPhotoLayer(p);
    } else if (section === 'text') {
      addText(false, t);
    } else if (section === 'sticker') {
      setStickerOpen(true);
    }
  }

  const panelTitle = t(TOOLS.find((x) => x.key === section)!.label);
  const canAdd = section === 'photo' || section === 'text' || section === 'sticker';

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-paper text-ink">
      {/* ---- top bar ---- */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-card px-3">
        <IconButton label={t('back')} onClick={() => { save(); nav('/'); }}>
          <ArrowLeft className="h-[18px] w-[18px]" />
        </IconButton>

        <button
          onClick={() => setRenaming(true)}
          className="min-w-0 max-w-[30vw] truncate text-left font-display text-[17px] leading-none text-ink hover:text-gold-deep sm:max-w-[42vw]"
          title={t('renameFilm')}
          aria-label={t('renameFilm')}
        >
          {project.title || t('untitled')}
        </button>
        <span className="hidden shrink-0 items-center gap-1.5 text-[11px] text-ink-3 sm:flex">
          <span className="h-3 w-px bg-line" />
          {f.slidesCount(lang, project.slides.length)} · {f.duration(lang, duration)}
        </span>
        <span className="ml-1 flex shrink-0 items-center gap-1 text-[11px] text-ink-3">
          {dirty ? <Spinner size={11} /> : <Check className="h-3.5 w-3.5 text-gold" />}
          <span className="hidden sm:inline">{dirty ? t('saving') : t('saved')}</span>
        </span>

        <div className="ml-auto flex items-center gap-1">
          <IconButton label={t('undo')} onClick={undo} className="hidden xs:grid"><Undo2 className="h-[18px] w-[18px]" /></IconButton>
          <IconButton label={t('redo')} onClick={redo} className="hidden xs:grid"><Redo2 className="h-[18px] w-[18px]" /></IconButton>
          <span className="mx-1 hidden h-5 w-px bg-line xs:block" />
          <Button
            variant="outline"
            size="sm"
            aria-label={t('preview')}
            title={t('preview')}
            className="w-10 px-0 sm:w-auto sm:px-4"
            onClick={() => { save(); nav(`/film/${id}/preview`); }}
          >
            <Play className="h-4 w-4" />
            <span className="hidden sm:inline">{t('preview')}</span>
          </Button>
          <Button
            size="sm"
            aria-label={t('export')}
            title={t('export')}
            className="w-10 px-0 sm:w-auto sm:px-4"
            onClick={() => { save(); nav(`/film/${id}/export`); }}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{t('export')}</span>
          </Button>
        </div>
      </header>

      {/* ---- body ---- */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* tool rail */}
        <nav className="hidden w-[76px] shrink-0 flex-col items-center gap-0.5 border-r border-line bg-card py-3 lg:flex">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const active = section === tool.key;
            return (
              <button
                key={tool.key}
                onClick={() => setSection(tool.key)}
                className={`flex w-[60px] flex-col items-center gap-1.5 rounded-lg py-2.5 transition-colors duration-150 ${
                  active ? 'bg-ink text-paper' : 'text-ink-3 hover:bg-ink/[0.05] hover:text-ink'
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
                <span className="text-[10px] font-semibold tracking-wide">{t(tool.label)}</span>
              </button>
            );
          })}
          <span className="my-2 h-px w-8 bg-line" />
          <button
            onClick={importPhotos}
            title={t('addPhotosBulkHint')}
            className="flex w-[60px] flex-col items-center gap-1.5 rounded-lg py-2.5 text-ink-3 transition-colors hover:bg-ink/[0.05] hover:text-ink"
          >
            {importing ? <Spinner size={18} /> : <Images className="h-[18px] w-[18px]" strokeWidth={1.6} />}
            <span className="text-[10px] font-semibold tracking-wide">{t('addPhotosBulk')}</span>
          </button>
        </nav>

        {/* stage */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="stage flex min-h-[32vh] flex-1 items-center justify-center p-4 sm:p-8">
            <EditorCanvas
              orientation={project.orientation}
              emptyHint={
                <>
                  <p className="font-display text-[17px] text-white/70">{t('addPhotosBulk')}</p>
                  <p className="mx-auto mt-1.5 max-w-[240px] text-[12px] leading-relaxed text-white/40">
                    {t('addPhotosBulkHint')}
                  </p>
                  <button
                    onClick={importPhotos}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/25 px-4 py-2 text-[12.5px] font-semibold text-white/80 transition-colors hover:border-gold hover:text-gold"
                  >
                    {importing ? <Spinner size={14} /> : <Images className="h-3.5 w-3.5" />}
                    {t('addPhotosBulk')}
                  </button>
                </>
              }
            />
          </div>
          <SlideRail project={project} index={slideIndex} onAdd={() => setTemplateOpen(true)} />
        </div>

        {/* inspector */}
        <aside className="flex max-h-[46vh] shrink-0 flex-col border-t border-line bg-card lg:max-h-none lg:w-[364px] lg:border-l lg:border-t-0">
          <div ref={tabStrip} className="no-scrollbar fade-right flex gap-1.5 overflow-x-auto border-b border-line px-2 py-2 lg:hidden">
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              const active = section === tool.key;
              return (
                <button
                  key={tool.key}
                  data-tab={tool.key}
                  onClick={() => setSection(tool.key)}
                  className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold transition-colors ${
                    active ? 'bg-ink text-paper' : 'bg-paper text-ink-2'
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.7} /> {t(tool.label)}
                </button>
              );
            })}
            <button
              onClick={importPhotos}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-line px-3.5 pr-5 text-[12.5px] font-semibold text-ink-2"
            >
              {importing ? <Spinner size={15} /> : <Images className="h-4 w-4" strokeWidth={1.7} />} {t('addPhotosBulk')}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
            <h3 className="font-display text-[16px] text-ink">{panelTitle}</h3>
            {canAdd && (
              <Button size="sm" variant="outline" onClick={addFromPanel}>
                <Plus className="h-3.5 w-3.5" />
                {section === 'text' ? t('addTitle') : section === 'photo' ? t('addPhoto') : t('pickSticker')}
              </Button>
            )}
          </div>

          <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {section === 'slide' && <SlidePanel slide={slide} />}
            {section === 'photo' &&
              (selection.kind === 'photo' && slide.photoLayers.some((l) => l.id === selection.id) ? (
                <PhotoPanel layer={slide.photoLayers.find((l) => l.id === selection.id)!} />
              ) : (
                <EmptyPhoto />
              ))}
            {section === 'text' &&
              (selection.kind === 'text' && slide.textLayers.some((l) => l.id === selection.id) ? (
                <TextPanel layer={slide.textLayers.find((l) => l.id === selection.id)!} />
              ) : (
                <EmptyText />
              ))}
            {section === 'sticker' &&
              (selection.kind === 'sticker' && slide.stickerLayers.some((l) => l.id === selection.id) ? (
                <StickerPanel layer={slide.stickerLayers.find((l) => l.id === selection.id)!} />
              ) : (
                <div className="flex flex-col items-center px-4 py-14 text-center">
                  <p className="font-display text-[17px] text-ink">{t('pickSticker')}</p>
                  <p className="mt-2 max-w-[240px] text-[12.5px] leading-relaxed text-ink-3">{t('stickerHint')}</p>
                  <Button size="sm" variant="outline" className="mt-5" onClick={() => setStickerOpen(true)}>
                    <Plus className="h-3.5 w-3.5" /> {t('pickSticker')}
                  </Button>
                </div>
              ))}
            {section === 'music' && <MusicPanel />}
            <p className="mt-8 border-t border-line-soft pt-4 text-[11px] text-ink-3/80">{t('keyboardHint')}</p>
          </div>
        </aside>
      </div>

      <StickerPicker open={stickerOpen} onClose={() => setStickerOpen(false)} onPick={addSticker} />

      <Modal open={renaming} onClose={() => setRenaming(false)} title={t('renameFilm')} width={420}>
        <input
          autoFocus
          defaultValue={project.title}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setTitle((e.target as HTMLInputElement).value.trim() || t('untitled'));
              save();
              setRenaming(false);
            }
          }}
          onBlur={(e) => setTitle(e.target.value.trim() || t('untitled'))}
          className="w-full border-b border-line bg-transparent pb-2 font-display text-[22px] text-ink outline-none focus:border-gold"
        />
        <div className="mt-6 flex justify-end">
          <Button onClick={() => { save(); setRenaming(false); }}>{t('done')}</Button>
        </div>
      </Modal>

      <Modal open={templateOpen} onClose={() => setTemplateOpen(false)} title={t('chooseTemplate')} width={420}>
        <div className="space-y-2">
          {SLIDE_TEMPLATES.map((tpl) => (
            <button
              key={tpl}
              onClick={() => {
                addSlide(tpl, t);
                setTemplateOpen(false);
              }}
              className="flex w-full items-baseline gap-3 rounded-xl border border-line bg-card p-3.5 text-left transition-colors hover:border-ink/25 hover:bg-paper"
            >
              <span className="font-display text-[16px] text-ink">{el('template', tpl)}</span>
              <span className="text-[11.5px] text-ink-3">{t(TEMPLATE_DESC[tpl])}</span>
            </button>
          ))}
        </div>
      </Modal>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="pointer-events-none fixed left-1/2 top-[72px] z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-[12.5px] font-medium text-paper shadow-lift"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
