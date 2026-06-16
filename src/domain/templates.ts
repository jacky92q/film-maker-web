import type { SlideTemplate } from './enums';
import { newSlide, newTextLayer, type Slide } from './models';
import type { StrKey } from '../i18n/strings';

type T = (key: StrKey) => string;

export function slideFromTemplate(tpl: SlideTemplate, t: T): Slide {
  switch (tpl) {
    case 'opening':
      return newSlide({
        transition: 'fade',
        durationSeconds: 5,
        textLayers: [
          newTextLayer({ text: t('tplOurStory'), x: 0.5, y: 0.5, fontSize: 110, fontStyle: 'serif', color: 'cream', contentAnimation: 'slideUp' }),
          newTextLayer({ text: t('tplAWeddingFilm'), isSubtitle: true, x: 0.5, y: 0.66, fontSize: 56, color: 'gold', barColor: 'gold', contentAnimation: 'fadeStagger' }),
        ],
      });
    case 'memory':
      return newSlide({
        transition: 'kenBurns',
        durationSeconds: 5,
        textLayers: [
          newTextLayer({ text: t('tplCherishedMoment'), isSubtitle: true, x: 0.5, y: 0.86, fontSize: 56, color: 'cream', barColor: 'cream', contentAnimation: 'slideUp' }),
        ],
      });
    case 'loveNote':
      return newSlide({
        transition: 'fade',
        durationSeconds: 6,
        backgroundColor: '#1a1216',
        textLayers: [
          newTextLayer({ text: t('tplLoveQuote'), x: 0.5, y: 0.5, fontSize: 84, fontStyle: 'script', color: 'gold', contentAnimation: 'handwriting' }),
        ],
      });
    case 'closing':
      return newSlide({
        transition: 'fade',
        durationSeconds: 5,
        textLayers: [
          newTextLayer({ text: t('tplForeverAlways'), x: 0.5, y: 0.46, fontSize: 96, fontStyle: 'serif', color: 'gold', contentAnimation: 'shimmer' }),
          newTextLayer({ text: '2026', isSubtitle: true, x: 0.5, y: 0.62, fontSize: 56, color: 'gold', barColor: 'gold', contentAnimation: 'fadeStagger' }),
        ],
      });
    case 'blank':
    default:
      return newSlide();
  }
}
