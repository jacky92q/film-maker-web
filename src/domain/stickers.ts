import type { StickerCategory } from './enums';

export interface StickerDef {
  kind: string;
  asset: string; // file name under /stickers/
  aspect: number; // width / height of the trimmed PNG
  category: StickerCategory;
}

// kind -> definition. Asset file names are the snake_case form.
export const STICKERS: StickerDef[] = [
  // Charms
  { kind: 'star', asset: 'star.png', aspect: 1.0, category: 'charms' },
  { kind: 'moon', asset: 'moon.png', aspect: 0.841, category: 'charms' },
  { kind: 'cloud', asset: 'cloud.png', aspect: 1.413, category: 'charms' },
  { kind: 'diamond', asset: 'diamond.png', aspect: 1.285, category: 'charms' },
  { kind: 'clover', asset: 'clover.png', aspect: 0.971, category: 'charms' },
  { kind: 'shell', asset: 'shell.png', aspect: 1.066, category: 'charms' },
  { kind: 'key', asset: 'key.png', aspect: 0.437, category: 'charms' },
  { kind: 'crystalBall', asset: 'crystal_ball.png', aspect: 0.982, category: 'charms' },
  { kind: 'paperPlane', asset: 'paper_plane.png', aspect: 1.131, category: 'charms' },
  { kind: 'balloon', asset: 'balloon.png', aspect: 0.713, category: 'charms' },
  { kind: 'featherGray', asset: 'feather_gray.png', aspect: 0.6, category: 'charms' },
  { kind: 'starSilver', asset: 'star_silver.png', aspect: 0.989, category: 'charms' },
  { kind: 'leafSprig', asset: 'leaf_sprig.png', aspect: 0.828, category: 'charms' },
  { kind: 'tag', asset: 'tag.png', aspect: 0.934, category: 'charms' },
  { kind: 'daisy', asset: 'daisy.png', aspect: 0.979, category: 'charms' },
  { kind: 'button', asset: 'button.png', aspect: 0.988, category: 'charms' },
  { kind: 'puzzle', asset: 'puzzle.png', aspect: 1.0, category: 'charms' },
  { kind: 'paperclip', asset: 'paperclip.png', aspect: 0.574, category: 'charms' },
  { kind: 'house', asset: 'house.png', aspect: 0.751, category: 'charms' },
  { kind: 'sun', asset: 'sun.png', aspect: 0.984, category: 'charms' },
  // Hearts
  { kind: 'heartWhite', asset: 'heart_white.png', aspect: 1.069, category: 'hearts' },
  { kind: 'heartCrystal', asset: 'heart_crystal.png', aspect: 1.056, category: 'hearts' },
  { kind: 'bowPink', asset: 'bow_pink.png', aspect: 0.811, category: 'hearts' },
  { kind: 'heartGoldOutline', asset: 'heart_gold_outline.png', aspect: 1.106, category: 'hearts' },
  { kind: 'heartPink', asset: 'heart_pink.png', aspect: 1.01, category: 'hearts' },
  { kind: 'heartGold', asset: 'heart_gold.png', aspect: 1.13, category: 'hearts' },
  { kind: 'heartCloud', asset: 'heart_cloud.png', aspect: 1.163, category: 'hearts' },
  { kind: 'heartGlass', asset: 'heart_glass.png', aspect: 1.092, category: 'hearts' },
  { kind: 'heartPearl', asset: 'heart_pearl.png', aspect: 1.085, category: 'hearts' },
  { kind: 'heartYarn', asset: 'heart_yarn.png', aspect: 1.164, category: 'hearts' },
  { kind: 'heartCandle', asset: 'heart_candle.png', aspect: 1.03, category: 'hearts' },
  { kind: 'heartLock', asset: 'heart_lock.png', aspect: 0.75, category: 'hearts' },
  { kind: 'heartFoil', asset: 'heart_foil.png', aspect: 1.03, category: 'hearts' },
  { kind: 'heartWreath', asset: 'heart_wreath.png', aspect: 1.083, category: 'hearts' },
  { kind: 'heartOrigami', asset: 'heart_origami.png', aspect: 1.062, category: 'hearts' },
  { kind: 'heartChoco', asset: 'heart_choco.png', aspect: 1.097, category: 'hearts' },
  // Keepsakes
  { kind: 'camera', asset: 'camera.png', aspect: 1.434, category: 'keepsakes' },
  { kind: 'teddyBear', asset: 'teddy_bear.png', aspect: 0.936, category: 'keepsakes' },
  { kind: 'tulips', asset: 'tulips.png', aspect: 0.758, category: 'keepsakes' },
  { kind: 'books', asset: 'books.png', aspect: 1.213, category: 'keepsakes' },
  { kind: 'mug', asset: 'mug.png', aspect: 1.08, category: 'keepsakes' },
  { kind: 'memoryJar', asset: 'memory_jar.png', aspect: 0.683, category: 'keepsakes' },
  { kind: 'plant', asset: 'plant.png', aspect: 0.978, category: 'keepsakes' },
  { kind: 'alarmClock', asset: 'alarm_clock.png', aspect: 0.709, category: 'keepsakes' },
  { kind: 'basket', asset: 'basket.png', aspect: 1.097, category: 'keepsakes' },
  { kind: 'calendar', asset: 'calendar.png', aspect: 0.982, category: 'keepsakes' },
  { kind: 'lantern', asset: 'lantern.png', aspect: 0.498, category: 'keepsakes' },
  { kind: 'puppy', asset: 'puppy.png', aspect: 0.824, category: 'keepsakes' },
  { kind: 'teaCup', asset: 'tea_cup.png', aspect: 1.475, category: 'keepsakes' },
  { kind: 'violin', asset: 'violin.png', aspect: 0.715, category: 'keepsakes' },
  { kind: 'driedFlowers', asset: 'dried_flowers.png', aspect: 0.764, category: 'keepsakes' },
  { kind: 'strawHat', asset: 'straw_hat.png', aspect: 1.386, category: 'keepsakes' },
  // Wedding
  { kind: 'bowSilver', asset: 'bow_silver.png', aspect: 1.146, category: 'wedding' },
  { kind: 'rose', asset: 'rose.png', aspect: 0.873, category: 'wedding' },
  { kind: 'pearlEarrings', asset: 'pearl_earrings.png', aspect: 2.862, category: 'wedding' },
  { kind: 'candle', asset: 'candle.png', aspect: 0.947, category: 'wedding' },
  { kind: 'bouquet', asset: 'bouquet.png', aspect: 0.914, category: 'wedding' },
  { kind: 'giftBox', asset: 'gift_box.png', aspect: 1.004, category: 'wedding' },
  { kind: 'envelope', asset: 'envelope.png', aspect: 1.194, category: 'wedding' },
  { kind: 'featherWhite', asset: 'feather_white.png', aspect: 0.807, category: 'wedding' },
  { kind: 'rings', asset: 'rings.png', aspect: 1.4, category: 'wedding' },
  { kind: 'perfume', asset: 'perfume.png', aspect: 0.601, category: 'wedding' },
  { kind: 'pearlBracelet', asset: 'pearl_bracelet.png', aspect: 1.191, category: 'wedding' },
  { kind: 'champagne', asset: 'champagne.png', aspect: 0.844, category: 'wedding' },
  { kind: 'cake', asset: 'cake.png', aspect: 0.909, category: 'wedding' },
  { kind: 'goblet', asset: 'goblet.png', aspect: 0.536, category: 'wedding' },
  { kind: 'heels', asset: 'heels.png', aspect: 1.125, category: 'wedding' },
  { kind: 'frame', asset: 'frame.png', aspect: 0.865, category: 'wedding' },
];

export const STICKER_BY_KIND: Record<string, StickerDef> = Object.fromEntries(
  STICKERS.map((s) => [s.kind, s]),
);

import { BASE_URL } from '../lib/paths';
export const stickerUrl = (kind: string): string => {
  const def = STICKER_BY_KIND[kind];
  return def ? `${BASE_URL}stickers/${def.asset}` : '';
};

export const stickerAspect = (kind: string): number => STICKER_BY_KIND[kind]?.aspect ?? 1;
