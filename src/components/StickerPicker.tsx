import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { STICKERS, stickerUrl } from '../domain/stickers';
import { STICKER_CATEGORIES, type StickerCategory } from '../domain/enums';
import { useT } from '../i18n';

const CAT_LABEL: Record<StickerCategory, 'stickerCatCharms' | 'stickerCatHearts' | 'stickerCatKeepsakes' | 'stickerCatWedding'> = {
  charms: 'stickerCatCharms', hearts: 'stickerCatHearts', keepsakes: 'stickerCatKeepsakes', wedding: 'stickerCatWedding',
};

export default function StickerPicker({
  open, onClose, onPick,
}: { open: boolean; onClose: () => void; onPick: (kind: string) => void }) {
  const { t } = useT();
  const [cat, setCat] = useState<StickerCategory>('charms');
  const list = STICKERS.filter((s) => s.category === cat);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className="w-full max-w-xl rounded-t-3xl bg-surface p-4 pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-elevated sm:rounded-3xl"
            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-text-dark">{t('stickerPickPrompt')}</h3>
              <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-text-mid hover:bg-surface-2"><X className="h-5 w-5" /></button>
            </div>
            <div className="mb-3 flex gap-2">
              {STICKER_CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${cat === c ? 'bg-primary text-white shadow-sm' : 'bg-surface-2 text-text-mid hover:bg-black/5'}`}>
                  {t(CAT_LABEL[c])}
                </button>
              ))}
            </div>
            <div className="grid max-h-[50vh] grid-cols-5 gap-2 overflow-y-auto sm:grid-cols-6">
              {list.map((s) => (
                <button key={s.kind} onClick={() => { onPick(s.kind); onClose(); }} className="grid aspect-square place-items-center rounded-xl bg-surface-2 p-2 transition hover:scale-105 hover:bg-primary/10">
                  <img src={stickerUrl(s.kind)} alt={s.kind} className="max-h-full max-w-full object-contain" loading="lazy" />
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
