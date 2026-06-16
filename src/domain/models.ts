import { v4 as uuid } from 'uuid';
import type {
  DimDirection, PhotoFilter, PhotoFrame, PhotoShape, SlideAmbientEffect,
  SlideContentAnimation, SlideFontStyle, SlideFrame, SlideLayout, SlideOverlay,
  SlideTextBg, SlideTextColor, TextShadowLevel, TransitionEffect, VideoOrientation,
} from './enums';

export interface TextLayer {
  id: string;
  text: string;
  isSubtitle: boolean;
  x: number;
  y: number;
  rotation: number;
  fontSize: number;
  fontStyle: SlideFontStyle;
  color: SlideTextColor;
  barColor: SlideTextColor;
  textBg: SlideTextBg;
  strokeWidth: number;
  letterSpacing: number;
  shadowLevel: TextShadowLevel;
  zOrder: number;
  contentAnimation: SlideContentAnimation;
  customColor: string | null;
  customBarColor: string | null;
}

export interface PhotoLayer {
  id: string;
  imagePath: string | null;
  x: number;
  y: number;
  widthFraction: number;
  heightFraction: number;
  rotation: number;
  shape: PhotoShape;
  frame: PhotoFrame;
  filter: PhotoFilter;
  frameWidth: number;
  cropScale: number;
  cropOffsetX: number;
  cropOffsetY: number;
  zOrder: number;
  contentAnimation: SlideContentAnimation;
}

export interface StickerLayer {
  id: string;
  kind: string;
  x: number;
  y: number;
  widthFraction: number;
  rotation: number;
  opacity: number;
  zOrder: number;
}

export interface Slide {
  id: string;
  layout: SlideLayout;
  imagePath: string | null;
  imagePath2: string | null;
  imagePath3: string | null;
  textLayers: TextLayer[];
  photoLayers: PhotoLayer[];
  stickerLayers: StickerLayer[];
  durationSeconds: number;
  transition: TransitionEffect;
  photoFilter: PhotoFilter;
  photoScale: number;
  photoOffsetX: number;
  photoOffsetY: number;
  photoShape: PhotoShape;
  photoFrame: PhotoFrame;
  backgroundColor: string; // hex
  overlay: SlideOverlay;
  contentAnimation: SlideContentAnimation;
  dimDirection: DimDirection;
  dimOpacity: number;
  ambientEffect: SlideAmbientEffect;
  frame: SlideFrame;
  frameColor: SlideTextColor;
  customFrameColor: string | null;
}

export interface Project {
  id: string;
  title: string;
  slides: Slide[];
  orientation: VideoOrientation;
  musicPath: string | null;
  musicName: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------- Factories ----------

export function newTextLayer(partial: Partial<TextLayer> = {}): TextLayer {
  return {
    id: uuid(),
    text: 'Your text',
    isSubtitle: false,
    x: 0.5,
    y: 0.75,
    rotation: 0,
    fontSize: 96,
    fontStyle: 'serif',
    color: 'white',
    barColor: 'gold',
    textBg: 'none',
    strokeWidth: 0,
    letterSpacing: 0,
    shadowLevel: 'medium',
    zOrder: 0,
    contentAnimation: 'none',
    customColor: null,
    customBarColor: null,
    ...partial,
  };
}

export function newPhotoLayer(partial: Partial<PhotoLayer> = {}): PhotoLayer {
  return {
    id: uuid(),
    imagePath: null,
    x: 0.5,
    y: 0.5,
    widthFraction: 0.45,
    heightFraction: 0.55,
    rotation: 0,
    shape: 'none',
    frame: 'none',
    filter: 'none',
    frameWidth: 16,
    cropScale: 1,
    cropOffsetX: 0,
    cropOffsetY: 0,
    zOrder: 0,
    contentAnimation: 'none',
    ...partial,
  };
}

export function newStickerLayer(kind: string, partial: Partial<StickerLayer> = {}): StickerLayer {
  return {
    id: uuid(),
    kind,
    x: 0.5,
    y: 0.5,
    widthFraction: 0.22,
    rotation: 0,
    opacity: 1,
    zOrder: 0,
    ...partial,
  };
}

export function newSlide(partial: Partial<Slide> = {}): Slide {
  return {
    id: uuid(),
    layout: 'single',
    imagePath: null,
    imagePath2: null,
    imagePath3: null,
    textLayers: [],
    photoLayers: [],
    stickerLayers: [],
    durationSeconds: 4,
    transition: 'fade',
    photoFilter: 'none',
    photoScale: 1,
    photoOffsetX: 0,
    photoOffsetY: 0,
    photoShape: 'none',
    photoFrame: 'none',
    backgroundColor: '#000000',
    overlay: 'none',
    contentAnimation: 'none',
    dimDirection: 'none',
    dimOpacity: 0.5,
    ambientEffect: 'none',
    frame: 'none',
    frameColor: 'white',
    customFrameColor: null,
    ...partial,
  };
}

export function newProject(title: string, orientation: VideoOrientation): Project {
  const now = new Date().toISOString();
  return {
    id: uuid(),
    title,
    slides: [newSlide()],
    orientation,
    musicPath: null,
    musicName: null,
    createdAt: now,
    updatedAt: now,
  };
}

// ---------- Derived ----------

export const slideCount = (p: Project) => p.slides.length;
export const totalDuration = (p: Project) =>
  p.slides.reduce((acc, s) => acc + s.durationSeconds, 0);
export const projectThumb = (p: Project): string | null => {
  for (const s of p.slides) {
    if (s.imagePath) return s.imagePath;
    const pl = s.photoLayers.find((l) => l.imagePath);
    if (pl?.imagePath) return pl.imagePath;
  }
  return null;
};

// ---------- Deep clone with fresh ids (duplicate) ----------

export function cloneSlideFresh(slide: Slide): Slide {
  return {
    ...slide,
    id: uuid(),
    textLayers: slide.textLayers.map((l) => ({ ...l, id: uuid() })),
    photoLayers: slide.photoLayers.map((l) => ({ ...l, id: uuid() })),
    stickerLayers: slide.stickerLayers.map((l) => ({ ...l, id: uuid() })),
  };
}
