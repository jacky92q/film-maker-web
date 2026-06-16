// All enums ported from the Flutter app's domain models.
// Values are kept identical to the Dart enum `.name` strings so that
// localStorage data stays compatible.

export type VideoOrientation = 'landscape' | 'portrait';

export const ORIENTATION_DIMS: Record<VideoOrientation, { w: number; h: number }> = {
  landscape: { w: 1280, h: 720 },
  portrait: { w: 720, h: 1280 },
};

export type TransitionEffect =
  | 'fade'
  | 'slideLeft'
  | 'slideRight'
  | 'zoomIn'
  | 'kenBurns'
  | 'blurDissolve'
  | 'wipeLeft'
  | 'wipeRight'
  | 'pushUp'
  | 'pushDown'
  | 'circleReveal';

export const TRANSITIONS: TransitionEffect[] = [
  'fade', 'slideLeft', 'slideRight', 'zoomIn', 'kenBurns', 'blurDissolve',
  'wipeLeft', 'wipeRight', 'pushUp', 'pushDown', 'circleReveal',
];

export type SlideTextColor =
  | 'white' | 'gold' | 'cream' | 'black' | 'rose' | 'silver' | 'champagne'
  | 'blush' | 'dustyBlue' | 'sage' | 'lavender' | 'warmGray' | 'coral';

export const TEXT_COLORS: SlideTextColor[] = [
  'white', 'gold', 'cream', 'black', 'rose', 'silver', 'champagne',
  'blush', 'dustyBlue', 'sage', 'lavender', 'warmGray', 'coral',
];

export const TEXT_COLOR_HEX: Record<SlideTextColor, string> = {
  white: '#FFFFFF',
  gold: '#C9A84C',
  cream: '#F5F0E8',
  black: '#0D0D0D',
  rose: '#E8B4B8',
  silver: '#C0C0C0',
  champagne: '#F7E7CE',
  blush: '#E8A0B0',
  dustyBlue: '#88A8C0',
  sage: '#8FAF8F',
  lavender: '#B090C8',
  warmGray: '#999080',
  coral: '#E88070',
};

export type SlideFontStyle = 'serif' | 'sans' | 'script' | 'display' | 'elegant' | 'modern';
export const FONT_STYLES: SlideFontStyle[] = ['serif', 'sans', 'script', 'display', 'elegant', 'modern'];

// Latin font with Korean fallback, matches Flutter fontFamilyFallback behavior.
export const FONT_FAMILY: Record<SlideFontStyle, string> = {
  serif: "'PlayfairDisplay','NotoSerifKR',serif",
  sans: "'Lato','NotoSansKR',sans-serif",
  script: "'DancingScript','Gaegu',cursive",
  display: "'Cinzel','BlackHanSans',serif",
  elegant: "'EBGaramond','GowunBatang',serif",
  modern: "'Montserrat','DoHyeon',sans-serif",
};

export type PhotoFilter = 'none' | 'warm' | 'cool' | 'blackAndWhite' | 'vintage' | 'dramatic';
export const PHOTO_FILTERS: PhotoFilter[] = ['none', 'warm', 'cool', 'blackAndWhite', 'vintage', 'dramatic'];

// CSS filter strings approximating the Flutter colour matrices.
export const FILTER_CSS: Record<PhotoFilter, string> = {
  none: 'none',
  warm: 'saturate(1.15) sepia(0.18) brightness(1.03) contrast(1.02)',
  cool: 'saturate(1.05) hue-rotate(-12deg) brightness(1.02) contrast(1.02)',
  blackAndWhite: 'grayscale(1) contrast(1.05)',
  vintage: 'sepia(0.45) saturate(0.85) contrast(0.92) brightness(1.05)',
  dramatic: 'contrast(1.35) saturate(1.2) brightness(0.96)',
};

export type PhotoShape = 'none' | 'rounded' | 'circle' | 'heart' | 'arch';
export const PHOTO_SHAPES: PhotoShape[] = ['none', 'rounded', 'circle', 'heart', 'arch'];

export type PhotoFrame = 'none' | 'white' | 'gold' | 'polaroid';
export const PHOTO_FRAMES: PhotoFrame[] = ['none', 'white', 'gold', 'polaroid'];

export type SlideLayout = 'single' | 'strip2' | 'strip3';
export const SLIDE_LAYOUTS: SlideLayout[] = ['single', 'strip2', 'strip3'];

export type SlideContentAnimation =
  | 'none' | 'typewriter' | 'slideUp' | 'slideIn' | 'fadeStagger' | 'float'
  | 'zoomPulse' | 'wipeReveal' | 'handwriting' | 'shimmer' | 'driftZoom';

export const TEXT_ANIMATIONS: SlideContentAnimation[] = [
  'none', 'typewriter', 'slideUp', 'slideIn', 'fadeStagger', 'float', 'wipeReveal', 'handwriting', 'shimmer',
];
export const PHOTO_ANIMATIONS: SlideContentAnimation[] = [
  'none', 'slideUp', 'slideIn', 'fadeStagger', 'float', 'zoomPulse', 'driftZoom',
];

export type SlideOverlay = 'none' | 'vignette' | 'filmGrain' | 'lightLeak' | 'bokeh';
export const OVERLAYS: SlideOverlay[] = ['none', 'vignette', 'filmGrain'];

export type DimDirection = 'none' | 'bottom' | 'top' | 'left' | 'right' | 'radial';
export const DIM_DIRECTIONS: DimDirection[] = ['none', 'bottom', 'top', 'left', 'right', 'radial'];

export type SlideTextBg = 'none' | 'pill' | 'box';
export const TEXT_BGS: SlideTextBg[] = ['none', 'pill', 'box'];

export type TextShadowLevel = 'none' | 'soft' | 'medium' | 'strong';
export const SHADOW_LEVELS: TextShadowLevel[] = ['none', 'soft', 'medium', 'strong'];

export const SHADOW_CSS: Record<TextShadowLevel, { blur: number; alpha: number }> = {
  none: { blur: 0, alpha: 0 },
  soft: { blur: 6, alpha: 0.4 },
  medium: { blur: 10, alpha: 0.72 },
  strong: { blur: 18, alpha: 0.9 },
};

export type SlideFrame =
  | 'none' | 'thinBorder' | 'doubleBorder' | 'cornerBrackets' | 'editorialTicks'
  | 'insetLine' | 'dashedBorder' | 'ornateCorners';
export const SLIDE_FRAMES: SlideFrame[] = [
  'none', 'thinBorder', 'doubleBorder', 'cornerBrackets', 'editorialTicks', 'insetLine', 'dashedBorder', 'ornateCorners',
];

export type SlideAmbientEffect =
  | 'none' | 'petalFall' | 'sparkleRise' | 'snowFall' | 'heartFloat' | 'goldDust'
  | 'confettiFall' | 'bokeFloat' | 'starTwinkle' | 'ribbonStream' | 'lightRays';
export const AMBIENT_EFFECTS: SlideAmbientEffect[] = [
  'none', 'petalFall', 'sparkleRise', 'snowFall', 'heartFloat', 'goldDust',
  'confettiFall', 'bokeFloat', 'starTwinkle', 'ribbonStream', 'lightRays',
];

export type SlideTemplate = 'blank' | 'opening' | 'memory' | 'loveNote' | 'closing';
export const SLIDE_TEMPLATES: SlideTemplate[] = ['blank', 'opening', 'memory', 'loveNote', 'closing'];

export type StickerCategory = 'charms' | 'hearts' | 'keepsakes' | 'wedding';
export const STICKER_CATEGORIES: StickerCategory[] = ['charms', 'hearts', 'keepsakes', 'wedding'];
