import { create } from 'zustand';
import {
  cloneSlideFresh, newPhotoLayer, newSlide, newStickerLayer, newTextLayer,
  type PhotoLayer, type Project, type Slide, type StickerLayer, type TextLayer,
} from '../domain/models';
import { slideFromTemplate } from '../domain/templates';
import type { SlideTemplate } from '../domain/enums';
import type { StrKey } from '../i18n/strings';
import { useProjects } from './projects';

export type SelKind = 'none' | 'text' | 'photo' | 'sticker' | 'bgphoto';
export interface Selection {
  kind: SelKind;
  id?: string;
}

// History remembers where you were, not just what the film looked like, so
// undo puts the layer back *and* re-selects it.
interface Snapshot {
  project: Project;
  slideIndex: number;
  selection: Selection;
}

interface EditorState {
  project: Project | null;
  slideIndex: number;
  selection: Selection;
  cropMode: boolean;
  dirty: boolean;
  undoStack: Snapshot[];
  redoStack: Snapshot[];

  init: (project: Project) => void;
  save: () => void;
  setTitle: (title: string) => void;
  setSlideIndex: (i: number) => void;
  select: (sel: Selection) => void;
  setCropMode: (v: boolean) => void;

  // slides
  currentSlide: () => Slide | null;
  addSlide: (tpl: SlideTemplate, t: (k: StrKey) => string) => void;
  deleteSlide: (id: string) => void;
  duplicateSlide: (id: string) => void;
  reorderSlides: (from: number, to: number) => void;
  patchSlide: (patch: Partial<Slide>, history?: boolean) => void;

  // text
  addText: (isSubtitle: boolean, t: (k: StrKey) => string) => void;
  patchText: (id: string, patch: Partial<TextLayer>, history?: boolean) => void;
  deleteLayer: () => void;

  // photo
  addPhotoLayer: (imagePath: string) => void;
  patchPhoto: (id: string, patch: Partial<PhotoLayer>, history?: boolean) => void;
  setBackgroundPhoto: (imagePath: string) => void;
  removeBackgroundPhoto: () => void;

  // sticker
  addSticker: (kind: string) => void;
  patchSticker: (id: string, patch: Partial<StickerLayer>, history?: boolean) => void;

  // z-order
  bringToFront: () => void;
  sendToBack: () => void;

  // photos in bulk
  addPhotoSlides: (paths: string[]) => void;

  // music
  setMusic: (name: string | null, path: string | null) => void;
  setMusicSettings: (patch: { musicVolume?: number; musicFadeIn?: number; musicFadeOut?: number }, history?: boolean) => void;

  undo: () => void;
  redo: () => void;
}

const MAX_HISTORY = 60;
const AUTOSAVE_MS = 700;

export const useEditor = create<EditorState>((set, get) => {
  // Nothing is ever lost to a closed tab: every edit schedules a save.
  let autosave: ReturnType<typeof setTimeout> | null = null;
  function scheduleSave() {
    if (autosave) clearTimeout(autosave);
    autosave = setTimeout(() => {
      autosave = null;
      get().save();
    }, AUTOSAVE_MS);
  }

  // Update the current slide via a producer; optionally record undo history.
  function snapshot(): Snapshot {
    const { project, slideIndex, selection } = get();
    return { project: project!, slideIndex, selection };
  }

  function updateProject(producer: (p: Project) => Project, history = true) {
    const cur = get().project;
    if (!cur) return;
    const undoStack = history ? [...get().undoStack, snapshot()].slice(-MAX_HISTORY) : get().undoStack;
    const next = producer(structuredClone(cur));
    set({ project: next, dirty: true, undoStack, redoStack: history ? [] : get().redoStack });
    scheduleSave();
  }

  function restore(from: Snapshot) {
    const slideIndex = Math.min(from.slideIndex, from.project.slides.length - 1);
    return {
      project: from.project,
      slideIndex,
      selection: keepSelection(from.project, slideIndex, from.selection),
      dirty: true,
    };
  }

  function mapCurrentSlide(p: Project, fn: (s: Slide) => Slide): Project {
    const idx = get().slideIndex;
    return { ...p, slides: p.slides.map((s, i) => (i === idx ? fn(s) : s)) };
  }

  return {
    project: null,
    slideIndex: 0,
    selection: { kind: 'none' },
    cropMode: false,
    dirty: false,
    undoStack: [],
    redoStack: [],

    init: (project) =>
      set({
        project: structuredClone(project),
        slideIndex: 0,
        selection: { kind: 'none' },
        cropMode: false,
        dirty: false,
        undoStack: [],
        redoStack: [],
      }),

    save: () => {
      if (autosave) {
        clearTimeout(autosave);
        autosave = null;
      }
      const p = get().project;
      if (!p) return;
      useProjects.getState().upsert(p);
      set({ dirty: false });
    },

    setTitle: (title) => updateProject((p) => ({ ...p, title }), false),

    setSlideIndex: (i) => {
      const p = get().project;
      if (!p) return;
      const clamped = Math.max(0, Math.min(i, p.slides.length - 1));
      set({ slideIndex: clamped, selection: { kind: 'none' }, cropMode: false });
    },

    select: (sel) => set({ selection: sel, cropMode: false }),
    setCropMode: (v) => set({ cropMode: v }),

    currentSlide: () => {
      const p = get().project;
      if (!p) return null;
      return p.slides[get().slideIndex] ?? null;
    },

    addSlide: (tpl, t) =>
      updateProject((p) => {
        const slide = slideFromTemplate(tpl, t);
        const slides = [...p.slides];
        slides.splice(get().slideIndex + 1, 0, slide);
        queueMicrotask(() => set({ slideIndex: Math.min(get().slideIndex + 1, slides.length - 1) }));
        return { ...p, slides };
      }),

    deleteSlide: (id) =>
      updateProject((p) => {
        if (p.slides.length <= 1) return p;
        const slides = p.slides.filter((s) => s.id !== id);
        queueMicrotask(() => set({ slideIndex: Math.min(get().slideIndex, slides.length - 1), selection: { kind: 'none' } }));
        return { ...p, slides };
      }),

    duplicateSlide: (id) =>
      updateProject((p) => {
        const idx = p.slides.findIndex((s) => s.id === id);
        if (idx < 0) return p;
        const copy = cloneSlideFresh(p.slides[idx]);
        const slides = [...p.slides];
        slides.splice(idx + 1, 0, copy);
        queueMicrotask(() => set({ slideIndex: idx + 1, selection: { kind: 'none' } }));
        return { ...p, slides };
      }),

    reorderSlides: (from, to) =>
      updateProject((p) => {
        const slides = [...p.slides];
        const [moved] = slides.splice(from, 1);
        slides.splice(to, 0, moved);
        queueMicrotask(() => set({ slideIndex: to }));
        return { ...p, slides };
      }),

    patchSlide: (patch, history = true) =>
      updateProject((p) => mapCurrentSlide(p, (s) => ({ ...s, ...patch })), history),

    addText: (isSubtitle, t) =>
      updateProject((p) =>
        mapCurrentSlide(p, (s) => {
          const maxZ = Math.max(0, ...s.textLayers.map((l) => l.zOrder), ...s.photoLayers.map((l) => l.zOrder));
          const layer = isSubtitle
            ? newTextLayer({ text: t('typeSubtitle'), isSubtitle: true, x: 0.5, y: 0.7, fontSize: 56, color: 'gold', barColor: 'gold', zOrder: maxZ + 1 })
            : newTextLayer({ text: t('typeMain'), x: 0.5, y: 0.5, fontSize: 96, zOrder: maxZ + 1 });
          queueMicrotask(() => set({ selection: { kind: 'text', id: layer.id } }));
          return { ...s, textLayers: [...s.textLayers, layer] };
        }),
      ),

    patchText: (id, patch, history = true) =>
      updateProject((p) => mapCurrentSlide(p, (s) => ({
        ...s,
        textLayers: s.textLayers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      })), history),

    deleteLayer: () => {
      const sel = get().selection;
      if (sel.kind === 'none' || !sel.id) return;
      updateProject((p) => mapCurrentSlide(p, (s) => {
        if (sel.kind === 'text') return { ...s, textLayers: s.textLayers.filter((l) => l.id !== sel.id) };
        if (sel.kind === 'photo') return { ...s, photoLayers: s.photoLayers.filter((l) => l.id !== sel.id) };
        if (sel.kind === 'sticker') return { ...s, stickerLayers: s.stickerLayers.filter((l) => l.id !== sel.id) };
        return s;
      }));
      set({ selection: { kind: 'none' } });
    },

    addPhotoLayer: (imagePath) =>
      updateProject((p) =>
        mapCurrentSlide(p, (s) => {
          const maxZ = Math.max(0, ...s.textLayers.map((l) => l.zOrder), ...s.photoLayers.map((l) => l.zOrder));
          const layer = newPhotoLayer({ imagePath, zOrder: maxZ + 1 });
          queueMicrotask(() => set({ selection: { kind: 'photo', id: layer.id } }));
          return { ...s, photoLayers: [...s.photoLayers, layer] };
        }),
      ),

    patchPhoto: (id, patch, history = true) =>
      updateProject((p) => mapCurrentSlide(p, (s) => ({
        ...s,
        photoLayers: s.photoLayers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      })), history),

    setBackgroundPhoto: (imagePath) =>
      updateProject((p) => mapCurrentSlide(p, (s) => ({ ...s, imagePath }))),

    removeBackgroundPhoto: () =>
      updateProject((p) => mapCurrentSlide(p, (s) => ({ ...s, imagePath: null }))),

    addSticker: (kind) =>
      updateProject((p) =>
        mapCurrentSlide(p, (s) => {
          const maxZ = Math.max(0, ...s.stickerLayers.map((l) => l.zOrder));
          const layer = newStickerLayer(kind, { zOrder: maxZ + 1, widthFraction: 0.24 });
          queueMicrotask(() => set({ selection: { kind: 'sticker', id: layer.id } }));
          return { ...s, stickerLayers: [...s.stickerLayers, layer] };
        }),
      ),

    // Several photos at once: one slide each, appended after the current one.
    addPhotoSlides: (paths) =>
      updateProject((p) => {
        if (!paths.length) return p;
        const at = get().slideIndex;
        const current = p.slides[at];
        // An untouched blank first slide is filled rather than pushed along.
        const fillsCurrent =
          !!current && !current.imagePath && !current.textLayers.length &&
          !current.photoLayers.length && !current.stickerLayers.length;

        const made = paths.map((imagePath) => newSlide({ imagePath, transition: 'fade' }));
        const slides = [...p.slides];
        if (fillsCurrent) {
          slides.splice(at, 1, ...made);
        } else {
          slides.splice(at + 1, 0, ...made);
        }
        const landing = fillsCurrent ? at : at + 1;
        queueMicrotask(() => set({ slideIndex: landing, selection: { kind: 'none' } }));
        return { ...p, slides };
      }),

    patchSticker: (id, patch, history = true) =>
      updateProject((p) => mapCurrentSlide(p, (s) => ({
        ...s,
        stickerLayers: s.stickerLayers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      })), history),

    bringToFront: () => {
      const sel = get().selection;
      if (!sel.id) return;
      updateProject((p) => mapCurrentSlide(p, (s) => {
        const allZ = [...s.textLayers, ...s.photoLayers, ...s.stickerLayers].map((l) => l.zOrder);
        const top = Math.max(0, ...allZ) + 1;
        return bumpZ(s, sel, top);
      }));
    },
    sendToBack: () => {
      const sel = get().selection;
      if (!sel.id) return;
      updateProject((p) => mapCurrentSlide(p, (s) => {
        const allZ = [...s.textLayers, ...s.photoLayers, ...s.stickerLayers].map((l) => l.zOrder);
        const bottom = Math.min(0, ...allZ) - 1;
        return bumpZ(s, sel, bottom);
      }));
    },

    setMusic: (name, path) => updateProject((p) => ({ ...p, musicName: name, musicPath: path }), false),

    setMusicSettings: (patch, history = false) => updateProject((p) => ({ ...p, ...patch }), history),

    undo: () => {
      const { undoStack, project } = get();
      if (!undoStack.length || !project) return;
      set({
        ...restore(undoStack[undoStack.length - 1]),
        undoStack: undoStack.slice(0, -1),
        redoStack: [...get().redoStack, snapshot()].slice(-MAX_HISTORY),
      });
      scheduleSave();
    },

    redo: () => {
      const { redoStack, project } = get();
      if (!redoStack.length || !project) return;
      set({
        ...restore(redoStack[redoStack.length - 1]),
        redoStack: redoStack.slice(0, -1),
        undoStack: [...get().undoStack, snapshot()].slice(-MAX_HISTORY),
      });
      scheduleSave();
    },
  };
});

function bumpZ(s: Slide, sel: Selection, z: number): Slide {
  if (sel.kind === 'text') return { ...s, textLayers: s.textLayers.map((l) => (l.id === sel.id ? { ...l, zOrder: z } : l)) };
  if (sel.kind === 'photo') return { ...s, photoLayers: s.photoLayers.map((l) => (l.id === sel.id ? { ...l, zOrder: z } : l)) };
  if (sel.kind === 'sticker') return { ...s, stickerLayers: s.stickerLayers.map((l) => (l.id === sel.id ? { ...l, zOrder: z } : l)) };
  return s;
}

// Undo should not also deselect: hold onto the selection when the layer it
// points at still exists in the restored state.
function keepSelection(project: Project, slideIndex: number, selection: Selection): Selection {
  const slide = project.slides[slideIndex];
  if (!slide || !selection.id) return { kind: 'none' };
  const pools: Record<string, { id: string }[]> = {
    text: slide.textLayers,
    photo: slide.photoLayers,
    sticker: slide.stickerLayers,
  };
  const pool = pools[selection.kind];
  return pool?.some((l) => l.id === selection.id) ? selection : { kind: 'none' };
}
