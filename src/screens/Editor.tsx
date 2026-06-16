import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Save, Play, Download, Undo2, Redo2, Plus, Image as ImageIcon,
  Type, Sticker, Music, Layers, Trash2, Copy, Pencil, Check,
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

type Section = 'slide' | 'photo' | 'text' | 'sticker' | 'music';

const TEMPLATE_DESC: Record<SlideTemplate, 'templateBlankDesc' | 'templateOpeningDesc' | 'templateMemoryDesc' | 'templateLoveNoteDesc' | 'templateClosingDesc'> = {
  blank: 'templateBlankDesc', opening: 'templateOpeningDesc', memory: 'templateMemoryDesc',
  loveNote: 'templateLoveNoteDesc', closing: 'templateClosingDesc',
};

const TOOLS: { key: Section; icon: typeof Layers; labelKey: 'tabSlide' | 'tabPhoto' | 'tabText' | 'tabSticker' | 'tabMusic' }[] = [
  { key: 'slide', icon: Layers, labelKey: 'tabSlide' },
  { key: 'photo', icon: ImageIcon, labelKey: 'tabPhoto' },
  { key: 'text', icon: Type, labelKey: 'tabText' },
  { key: 'sticker', icon: Sticker, labelKey: 'tabSticker' },
  { key: 'music', icon: Music, labelKey: 'tabMusic' },
];

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
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const p = getById(id!);
    if (p) init(p);
    else nav('/projects');
  }, [id, getById, init, nav]);

  useEffect(() => {
    const map: Record<SelKind, Section | null> = { text: 'text', photo: 'photo', sticker: 'sticker', bgphoto: 'slide', none: null };
    const target = map[selection.kind];
    if (target) setSection(target);
  }, [selection.kind]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selection.kind !== 'none') { e.preventDefault(); del(); }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, del, selection.kind]);

  if (!project) {
    return <div className="grid h-screen place-items-center bg-dark-bg text-dark-text">…</div>;
  }
  const slide = project.slides[Math.min(slideIndex, project.slides.length - 1)];

  function doSave() { save(); setSaved(true); setTimeout(() => setSaved(false), 1500); }
  function goPreview() { save(); nav(`/preview/${id}`); }
  function goExport() { save(); nav(`/export/${id}`); }

  async function handleAdd() {
    if (section === 'photo') { const p = await pickImage(); if (p) addPhotoLayer(p); }
    else if (section === 'text') addText(false, t);
    else if (section === 'sticker') setStickerOpen(true);
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-dark-bg text-cream">
      {/* Top bar */}
      <header className="relative z-20 flex h-14 shrink-0 items-center gap-2 border-b border-dark-line bg-dark-surface px-3">
        <button onClick={() => nav('/projects')} className="grid h-9 w-9 place-items-center rounded-lg text-cream hover:bg-white/10" title={t('myFilms')}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        {editingTitle ? (
          <input
            autoFocus
            defaultValue={project.title}
            onBlur={(e) => { setTitle(e.target.value || t('untitledFilm')); setEditingTitle(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            className="min-w-0 flex-1 rounded-lg bg-dark-surface-2 px-3 py-1.5 font-serif text-[16px] text-cream outline-none ring-1 ring-gold/40"
          />
        ) : (
          <button onClick={() => setEditingTitle(true)} className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
            <span className="truncate font-serif text-[16px] font-bold">{project.title || t('untitledFilm')}</span>
            <Pencil className="h-3.5 w-3.5 shrink-0 text-dark-text" />
          </button>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button onClick={undo} className="grid h-9 w-9 place-items-center rounded-lg text-dark-text hover:bg-white/10" title="Undo"><Undo2 className="h-[18px] w-[18px]" /></button>
          <button onClick={redo} className="grid h-9 w-9 place-items-center rounded-lg text-dark-text hover:bg-white/10" title="Redo"><Redo2 className="h-[18px] w-[18px]" /></button>
          <button onClick={doSave} className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-cream hover:bg-white/10 sm:flex">
            {saved ? <Check className="h-4 w-4 text-emerald-400" /> : <Save className={`h-4 w-4 ${dirty ? 'text-gold' : 'text-dark-text'}`} />}
            {saved ? t('done') : t('save')}
          </button>
          <button onClick={goPreview} className="hidden items-center gap-1.5 rounded-lg border border-dark-line px-3 py-2 text-sm font-semibold text-cream hover:bg-white/10 sm:flex">
            <Play className="h-4 w-4" /> {t('preview')}
          </button>
          <button onClick={goExport} className="flex items-center gap-1.5 rounded-lg bg-gold px-3.5 py-2 text-sm font-bold text-black hover:brightness-105">
            <Download className="h-4 w-4" /> {t('export')}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Left tool rail (desktop) */}
        <nav className="hidden w-20 shrink-0 flex-col items-center gap-1 border-r border-dark-line bg-dark-surface py-3 lg:flex">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const active = section === tool.key;
            return (
              <button
                key={tool.key}
                onClick={() => setSection(tool.key)}
                className={`flex w-16 flex-col items-center gap-1 rounded-xl py-2.5 text-[10px] font-semibold transition ${active ? 'bg-gold/15 text-gold' : 'text-dark-text hover:bg-white/5 hover:text-cream'}`}
              >
                <Icon className="h-5 w-5" />
                {t(tool.labelKey)}
              </button>
            );
          })}
        </nav>

        {/* Center: stage + timeline */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-[34vh] flex-1 items-center justify-center bg-[#0a0a0a] p-3 sm:p-6">
            <EditorCanvas orientation={project.orientation} />
          </div>

          {/* Timeline */}
          <div className="flex shrink-0 items-center gap-2 border-t border-dark-line bg-dark-surface px-3 py-2.5">
            <div className="no-scrollbar flex flex-1 items-center gap-2 overflow-x-auto">
              {project.slides.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setSlideIndex(i)}
                  className={`relative h-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${i === slideIndex ? 'border-gold' : 'border-transparent hover:border-white/20'}`}
                  style={{ aspectRatio: project.orientation === 'portrait' ? '9/16' : '16/9' }}
                >
                  <SlideThumb slide={s} orientation={project.orientation} />
                  <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[9px] text-white">{i + 1}</span>
                </button>
              ))}
              <button onClick={() => setTemplateOpen(true)} className="grid h-16 w-12 shrink-0 place-items-center rounded-lg border-2 border-dashed border-dark-line text-dark-text hover:border-gold hover:text-gold" title={t('addSlide')}>
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <div className="flex shrink-0 gap-1">
              <button onClick={() => duplicateSlide(slide.id)} className="grid h-9 w-9 place-items-center rounded-lg bg-dark-surface-2 text-dark-text hover:bg-white/10" title={t('duplicate')}><Copy className="h-4 w-4" /></button>
              <button onClick={() => deleteSlide(slide.id)} disabled={project.slides.length <= 1} className="grid h-9 w-9 place-items-center rounded-lg bg-dark-surface-2 text-dark-text hover:bg-danger/20 hover:text-danger disabled:opacity-30" title={t('delete')}><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <aside className="flex max-h-[44vh] shrink-0 flex-col border-t border-dark-line bg-dark-surface lg:max-h-none lg:w-[360px] lg:border-l lg:border-t-0">
          {/* Mobile tool tabs */}
          <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-dark-line p-2 lg:hidden">
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              const active = section === tool.key;
              return (
                <button key={tool.key} onClick={() => setSection(tool.key)} className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold ${active ? 'bg-gold/15 text-gold' : 'text-dark-text'}`}>
                  <Icon className="h-4 w-4" /> {t(tool.labelKey)}
                </button>
              );
            })}
          </div>

          {/* Panel header with Add */}
          <div className="flex items-center justify-between border-b border-dark-line px-4 py-3">
            <h3 className="font-serif text-base font-bold text-cream">{t(TOOLS.find((x) => x.key === section)!.labelKey)}</h3>
            {(section === 'photo' || section === 'text' || section === 'sticker') && (
              <button onClick={handleAdd} className="flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-[12px] font-bold text-black hover:brightness-105">
                <Plus className="h-3.5 w-3.5" /> {section === 'text' ? t('addTitleBtn') : t('create')}
              </button>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {section === 'slide' && <SlidePanel slide={slide} />}
            {section === 'photo' && (selection.kind === 'photo' && slide.photoLayers.find((l) => l.id === selection.id) ? <PhotoPanel layer={slide.photoLayers.find((l) => l.id === selection.id)!} /> : <EmptyPhoto />)}
            {section === 'text' && (selection.kind === 'text' && slide.textLayers.find((l) => l.id === selection.id) ? <TextPanel layer={slide.textLayers.find((l) => l.id === selection.id)!} /> : <EmptyText />)}
            {section === 'sticker' && (selection.kind === 'sticker' && slide.stickerLayers.find((l) => l.id === selection.id) ? <StickerPanel layer={slide.stickerLayers.find((l) => l.id === selection.id)!} /> : (
              <div className="flex flex-col items-center py-10 text-center">
                <p className="text-sm font-semibold text-dark-text">{t('stickerPickPrompt')}</p>
                <button onClick={() => setStickerOpen(true)} className="mt-4 flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-[13px] font-bold text-black"><Plus className="h-4 w-4" /> {t('tabSticker')}</button>
              </div>
            ))}
            {section === 'music' && <MusicPanel />}
          </div>
        </aside>
      </div>

      <StickerPicker open={stickerOpen} onClose={() => setStickerOpen(false)} onPick={addSticker} />

      {/* Template picker */}
      <AnimatePresence>
        {templateOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setTemplateOpen(false)}>
            <motion.div className="w-full max-w-md rounded-3xl bg-dark-surface p-5 shadow-elevated" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <h3 className="font-serif text-lg font-bold text-cream">{t('chooseTemplate')}</h3>
              <p className="mb-4 text-[13px] text-dark-text">{t('templateSub')}</p>
              <div className="grid grid-cols-1 gap-2">
                {SLIDE_TEMPLATES.map((tpl) => (
                  <button key={tpl} onClick={() => { addSlideAction(tpl, t); setTemplateOpen(false); }} className="flex items-center gap-3 rounded-xl bg-dark-surface-2 p-3 text-left hover:bg-white/10">
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
