import type { Lang } from './strings';
import { useLangStore } from './index';

type Pair = [string, string]; // [en, ko]

const MAPS: Record<string, Record<string, Pair>> = {
  transition: {
    fade: ['Fade', '페이드'], slideLeft: ['Slide ←', '슬라이드 ←'], slideRight: ['Slide →', '슬라이드 →'],
    zoomIn: ['Zoom', '줌'], kenBurns: ['Ken Burns', '켄 번스'], blurDissolve: ['Blur', '블러'],
    wipeLeft: ['Wipe ←', '와이프 ←'], wipeRight: ['Wipe →', '와이프 →'], pushUp: ['Push ↑', '밀기 ↑'],
    pushDown: ['Push ↓', '밀기 ↓'], circleReveal: ['Circle', '원형'],
  },
  font: {
    serif: ['Serif', '세리프'], sans: ['Sans', '산세리프'], script: ['Script', '필기체'],
    display: ['Display', '디스플레이'], elegant: ['Elegant', '우아한'], modern: ['Modern', '모던'],
  },
  filter: {
    none: ['None', '없음'], warm: ['Warm', '따뜻하게'], cool: ['Cool', '차갑게'],
    blackAndWhite: ['B&W', '흑백'], vintage: ['Vintage', '빈티지'], dramatic: ['Dramatic', '드라마틱'],
  },
  shape: {
    none: ['None', '없음'], rounded: ['Rounded', '둥글게'], circle: ['Circle', '원형'],
    heart: ['Heart', '하트'], arch: ['Arch', '아치'],
  },
  photoFrame: {
    none: ['None', '없음'], white: ['White', '화이트'], gold: ['Gold', '골드'], polaroid: ['Polaroid', '폴라로이드'],
  },
  layout: { single: ['Single', '단일'], strip2: ['2 Photos', '사진 2장'], strip3: ['3 Photos', '사진 3장'] },
  anim: {
    none: ['None', '없음'], typewriter: ['Typewriter', '타자기'], slideUp: ['Slide Up', '위로'],
    slideIn: ['Slide In', '슬라이드 인'], fadeStagger: ['Fade In', '페이드 인'], float: ['Float', '떠오르기'],
    zoomPulse: ['Zoom Pulse', '줌 펄스'], wipeReveal: ['Wipe', '와이프'], handwriting: ['Handwriting', '필기'],
    shimmer: ['Shimmer', '반짝임'], driftZoom: ['Drift Zoom', '드리프트 줌'],
  },
  overlay: { none: ['None', '없음'], vignette: ['Vignette', '비네트'], filmGrain: ['Grain', '그레인'] },
  dim: {
    none: ['None', '없음'], bottom: ['Bottom', '아래'], top: ['Top', '위'], left: ['Left', '왼쪽'],
    right: ['Right', '오른쪽'], radial: ['Radial', '원형'],
  },
  textBg: { none: ['None', '없음'], pill: ['Pill', '알약'], box: ['Box', '박스'] },
  frame: {
    none: ['None', '없음'], thinBorder: ['Thin', '얇은 선'], doubleBorder: ['Double', '이중 선'],
    cornerBrackets: ['Brackets', '모서리'], editorialTicks: ['Editorial', '에디토리얼'],
    insetLine: ['Inset', '안쪽 선'], dashedBorder: ['Dashed', '점선'], ornateCorners: ['Ornate', '장식'],
  },
  ambient: {
    none: ['None', '없음'], petalFall: ['Petals', '꽃잎'], sparkleRise: ['Sparkle', '반짝임'],
    snowFall: ['Snow', '눈송이'], heartFloat: ['Hearts', '하트'], goldDust: ['Gold Dust', '골드 더스트'],
    confettiFall: ['Confetti', '컨페티'], bokeFloat: ['Bokeh', '보케'], starTwinkle: ['Stars', '별'],
    ribbonStream: ['Ribbons', '리본'], lightRays: ['Light Rays', '빛 줄기'],
  },
  template: {
    blank: ['Blank', '빈 슬라이드'], opening: ['Opening', '오프닝'], memory: ['Memory', '추억'],
    loveNote: ['Love Note', '러브 노트'], closing: ['Closing', '엔딩'],
  },
};

function humanize(v: string): string {
  return v.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

export function enumLabel(group: string, value: string, lang?: Lang): string {
  const l = lang ?? useLangStore.getState().lang;
  const pair = MAPS[group]?.[value];
  if (!pair) return humanize(value);
  return l === 'ko' ? pair[1] : pair[0];
}

export function useEnumLabel() {
  const lang = useLangStore((s) => s.lang);
  return (group: string, value: string) => enumLabel(group, value, lang);
}
