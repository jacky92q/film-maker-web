import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Save, Play, Download, Undo2, Redo2, Plus, Image as ImageIcon,
  Type, Sticker, Music, Layers, Trash2, Copy, Pencil,
} from 'lucide-react';
import { useProjects } from '../store/projects';
import { useEditor, type SelKind } from '../store/editor';
import { useT } from '../i18n';
import { useEnumLabel } from '../i18n/enumLabels';
import { pickImage } from '../lib/imagePick';
import { SLIDE_TEMPLATES, type SlideTemplate } from '../domain/enums';
import EditorCanvas from '../components/EditorCanvas';
import SlideThumb from '../components/SlideThumb';
import StickerPicker from '../components/StickerPicker';
import {
  SlidePanel, PhotoPanel, TextPanel, StickerPanel, MusicPanel, EmptyPhoto, EmptyText,
} from '../components/EditorPanels';
import { IconBtn } from '../components/controls';

type Section = 'slide' | 'photo' | 'text' | 'sticker' | 'music';

const TEMPLATE_DESC: Record<SlideTemplate, 'templateBlankDesc' | 'templateOpeningDesc' | 'templateMemoryDesc' | 'templateLoveNoteDesc' | 'templateClosingDesc'> = {
  blank: 'templateBlankDesc', opening: 'templateOpeningDesc', memory: 'templateMemoryDesc',
  loveNote: 'templateLoveNoteDesc', closing: 'templateClosingDesc',
};

export default function Editor() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t } = useT();
  const el = useEnumLabel();
  const getById = useProjects((s) => s.getById);

  const project = useEditor((s) => s.project);
  const slideIndex = useEditor((s) => s.slideIndex);
  const selection = useEditor((s) => s.selection);
  const dirty = useEditor((s) => s.dirty);
  const init = useEditor((s) => s.init);
  const save = useEditor((s) => s.save);
  const setSlideIndex = useEditor((s) => s.setSlideIndex);
  const addSlideAction = useEditor((s) => s.addSlide);
  const deleteSlide = useEditor((s) => s.deleteSlide);
  const duplicateSlide = useEditor((s) => s.duplicateSlide);
  const addSticker = useEditor((s) => s.addSticker);
  const addPhotoLayer = useEditor((s) => s.addPhotoLayer);
  const addText = useEditor((s) => s.addText);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const del = useEditor((s) => s.deleteLayer);
  const setTitle = useEditor((s) => s.setTitle);

  const [section, setSection] = useState<Section>('slide');
  const [stickerOpen, setStickerOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);

  // load project
  useEffect(() => {
    const p = getById(id!);
    if (p) init(p);
    else nav('/projects');
  }, [id, getById, init, nav]);

  // auto-switch the panel section when a layer gets selected
  useEffect(() => {
    const map: Record<SelKind, Section | null> = { text: 'text', photo: 'photo', sticker: 'sticker', bgphoto: 'slide', none: null };
    const target = map[selection.kind];
    if (target) setSection(target);
  }, [selection.kind]);

  // keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selection.kind !== 'none') {
          e.preventDefault();
          del();
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, del, selection.kind]);

  if (!project) {
    return <div className="grid min-h-screen place-items-center bg-dark-bg text-dark-text">…</div>;
  }
  const slide = project.slides[Math.min(slideIndex, project.slides.length - 1)];

  function goPreview() {
    save();
    nav(`/preview/${id}`);
  }
  function goExport() {
    save();
    nav(`/export/${id}`);
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-dark-bg text-cream">
      {/* Top bar */}
      <header className="flex items-center gap-2 border-b border-dark-line px-3 py-2.5">
        <button onClick={() => nav('/projects')} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10">
          <ArrowLeft className="h-5 w-5" />
        </button>
        {editingTitle ? (
          <input
            autoFocus
            defaultValue={project.title}
            onBlur={(e) => { setTitle(e.target.value || t('untitledFilm')); setEditingTitle(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            className="flex-1 rounded-lg bg-dark-surface-2 px-2 py-1 font-serif text-[17px] text-cream outline-none"
          />
        ) : (
          <button onClick={() => setEditingTitle(true)} className="flex flex-1 items-center gap-1.5 truncate text-left">
            <span className="truncate font-serif text-[17px] font-bold">{project.title || t('untitledFilm')}</span>
            <Pencil className="h-3.5 w-3.5 text-dark-text" />
          </button>
        )}
        <button onClick={undo} className="grid h-9 w-9 place-items-center rounded-full text-dark-text hover:bg-white/10"><Undo2 className="h-[18px] w-[18px]" /></button>
        <button onClick={redo} className="grid h-9 w-9 place-items-center rounded-full text-dark-text hover:bg-white/10"><Redo2 className="h-[18px] w-[18px]" /></button>
        <button onClick={save} className={`grid h-9 w-9 place-items-center rounded-full ${dirty ? 'text-gold' : 'text-dark-text/40'} hover:bg-white/10`}><Save className="h-[18px] w-[18px]" /></button>
        <button onClick={goPreview} className="hidden rounded-lg px-3 py-1.5 text-sm font-semibold text-gold hover:bg-white/10 sm:flex"><Play className="mr-1 h-4 w-4" />{t('preview')}</button>
        <button onClick={goExport} className="rounded-lg bg-gold px-3 py-1.5 text-sm font-bold text-black"><Download className="mr-1 inline h-4 w-4" />{t('export')}</button>
      </header>

      {/* Main: responsive */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Canvas + timeline */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 items-center justify-center bg-[#0a0a0a] p-3">
            <EditorCanvas orientation={project.orientation} />
          </div>
          {/* Timeline */}
          <div className="flex items-center gap-2 border-t border-dark-line bg-dark-surface px-3 py-2.5">
            <button onClick={() => (section === 'music' ? setSection('slide') : setSection('music'))} className={`grid h-[68px] w-12 shrink-0 place-items-center rounded-lg ${project.musicName ? 'bg-gold/20 text-gold' : 'bg-dark-surface-2 text-dark-text'}`}>
              <Music className="h-5 w-5" />
            </button>
            <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
              {project.slides.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setSlideIndex(i)}
                  className={`relative h-[68px] shrink-0 overflow-hidden rounded-lg border-2 ${i === slideIndex ? 'border-gold' : 'border-transparent'}`}
                  style={{ aspectRatio: project.orientation === 'portrait' ? '9/16' : '16/9' }}
                >
                  <SlideThumb slide={s} orientation={project.orientation} />
                  <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[9px] text-white">{i + 1}</span>
                </button>
              ))}
              <button onClick={() => setTemplateOpen(true)} className="grid h-[68px] w-12 shrink-0 place-items-center rounded-lg bg-dark-surface-2 text-dark-text hover:bg-white/10">
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <div className="flex shrink-0 gap-1">
              <button onClick={() => duplicateSlide(slide.id)} className="grid h-8 w-8 place-items-center rounded-lg bg-dark-surface-2 text-dark-text hover:bg-white/10"><Copy className="h-4 w-4" /></button>
              <button onClick={() => deleteSlide(slide.id)} disabled={project.slides.length <= 1} className="grid h-8 w-8 place-items-center rounded-lg bg-dark-surface-2 text-dark-text hover:bg-danger/20 hover:text-danger disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        {/* Sidebar / bottom panel */}
        <div className="flex min-h-0 shrink-0 flex-col border-t border-dark-line bg-dark-surface lg:w-[340px] lg:border-l lg:border-t-0">
          {/* add-content bar */}
          <div className="flex gap-1.5 border-b border-dark-line p-2.5">
            <AddBtn icon={<ImageIcon className="h-4 w-4" />} label={t('tabPhoto')} onClick={async () => { const p = await pickImage(); if (p) addPhotoLayer(p); }} />
            <AddBtn icon={<Type className="h-4 w-4" />} label={t('tabText')} onClick={() => addText(false, t)} />
            <AddBtn icon={<Sticker className="h-4 w-4" />} label={t('tabSticker')} onClick={() => setStickerOpen(true)} />
          </div>

          {/* section tabs */}
          <div className="flex gap-1 px-2.5 pt-2.5">
            {([
              ['slide', t('tabSlide'), <Layers className="h-4 w-4" key="l" />],
              ['photo', t('tabPhoto'), <ImageIcon className="h-4 w-4" key="p" />],
              ['text', t('tabText'), <Type className="h-4 w-4" key="t" />],
              ['sticker', t('tabSticker'), <Sticker className="h-4 w-4" key="s" />],
            ] as [Section, string, React.ReactNode][]).map(([key, label, icon]) => (
              <button
                key={key}
                onClick={() => setSection(key)}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-[10px] font-semibold ${section === key ? 'bg-gold/15 text-gold' : 'text-dark-text hover:bg-white/5'}`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {section === 'slide' && <SlidePanel slide={slide} />}
            {section === 'photo' && (selection.kind === 'photo' ? <PhotoPanel layer={slide.photoLayers.find((l) => l.id === selection.id)!} /> : <EmptyPhoto />)}
            {section === 'text' && (selection.kind === 'text' ? <TextPanel layer={slide.textLayers.find((l) => l.id === selection.id)!} /> : <EmptyText />)}
            {section === 'sticker' && (selection.kind === 'sticker' && slide.stickerLayers.find((l) => l.id === selection.id)
              ? <StickerPanel layer={slide.stickerLayers.find((l) => l.id === selection.id)!} />
              : <div className="py-8 text-center"><IconBtn onClick={() => setStickerOpen(true)}><Plus className="h-4 w-4" /> {t('stickerPickPrompt')}</IconBtn></div>)}
            {section === 'music' && <MusicPanel />}
          </div>
        </div>
      </div>

      <StickerPicker open={stickerOpen} onClose={() => setStickerOpen(false)} onPick={addSticker} />

      {/* Template picker */}
      <AnimatePresence>
        {templateOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setTemplateOpen(false)}>
            <motion.div
              className="w-full max-w-md rounded-t-3xl bg-dark-surface p-5 pb-[calc(env(safe-area-inset-bottom)+20px)] sm:rounded-3xl"
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-serif text-lg font-bold text-cream">{t('chooseTemplate')}</h3>
              <p className="mb-4 text-[13px] text-dark-text">{t('templateSub')}</p>
              <div className="grid grid-cols-1 gap-2">
                {SLIDE_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl}
                    onClick={() => { addSlideAction(tpl, t); setTemplateOpen(false); }}
                    className="flex items-center gap-3 rounded-xl bg-dark-surface-2 p-3 text-left hover:bg-white/10"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-gold/15 text-gold"><Plus className="h-4 w-4" /></span>
                    <span>
                      <span className="block text-sm font-bold text-cream">{el('template', tpl)}</span>
                      <span className="block text-[11px] text-dark-text">{t(TEMPLATE_DESC[tpl])}</span>
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-dark-surface-2 py-2.5 text-[12px] font-semibold text-cream hover:bg-white/10">
      {icon} {label}
    </button>
  );
}
