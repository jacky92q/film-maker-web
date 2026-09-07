// Canvas text silently falls back to a system font when a webfont has not been
// fetched yet, which is how a preview and its export end up looking different.
// So: load exactly the families a project uses, and wait for them.

import { FONT_FAMILY, type SlideFontStyle } from '../domain/enums';
import type { Project } from '../domain/models';

// The families behind each style, in the order the canvas will try them.
const FAMILIES: Record<SlideFontStyle, string[]> = {
  serif: ['PlayfairDisplay', 'NotoSerifKR'],
  sans: ['Lato', 'NotoSansKR'],
  script: ['DancingScript', 'Gaegu'],
  display: ['Cinzel', 'BlackHanSans'],
  elegant: ['EBGaramond', 'GowunBatang'],
  modern: ['Montserrat', 'DoHyeon'],
};

const HANGUL = /[ᄀ-ᇿ㄰-㆏가-힯]/;

const requested = new Set<string>();

function loadFamily(family: string): Promise<unknown> {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve(null);
  return document.fonts.load(`400 64px '${family}'`).catch(() => null);
}

// Kick off a load without waiting — used while editing so the canvas catches up.
export function warmFontStyle(style: SlideFontStyle, text: string) {
  const families = FAMILIES[style] ?? [];
  const needed = HANGUL.test(text) ? families : families.slice(0, 1);
  for (const family of needed) {
    if (requested.has(family)) continue;
    requested.add(family);
    void loadFamily(family);
  }
}

// Await every family the project's text actually needs. Called before preview
// playback and before an export, so the first frame is already correct.
export async function loadProjectFonts(project: Project): Promise<void> {
  const wanted = new Set<string>();
  for (const slide of project.slides) {
    for (const layer of slide.textLayers) {
      const families = FAMILIES[layer.fontStyle] ?? [];
      wanted.add(families[0]);
      if (HANGUL.test(layer.text)) families.slice(1).forEach((f) => wanted.add(f));
    }
  }
  wanted.delete(undefined as unknown as string);
  if (!wanted.size) return;
  wanted.forEach((f) => requested.add(f));
  await Promise.all([...wanted].map(loadFamily));
}

export { FONT_FAMILY };
