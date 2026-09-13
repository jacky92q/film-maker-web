import { useState } from 'react';
import { STICKERS, stickerUrl } from '../domain/stickers';
import { STICKER_CATEGORIES, type StickerCategory } from '../domain/enums';
import { useT } from '../i18n';
import { useEnumLabel } from '../i18n/enumLabels';
import { Modal } from './ui';

export default function StickerPicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (kind: string) => void;
}) {
  const { t } = useT();
  const el = useEnumLabel();
  const [category, setCategory] = useState<StickerCategory>('wedding');
  const list = STICKERS.filter((s) => s.category === category);

  return (
    <Modal open={open} onClose={onClose} title={t('pickSticker')} width={560}>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {STICKER_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`h-9 rounded-full border px-3.5 text-[12.5px] font-medium transition-all duration-200 ${
              category === c
                ? 'border-gold bg-gold text-[#17120E]'
                : 'border-hair bg-surface-2 text-text-2 hover:border-hair-2 hover:text-text'
            }`}
          >
            {el('stickerCat', c)}
          </button>
        ))}
      </div>
      <div className="thin-scroll grid max-h-[52vh] grid-cols-5 gap-2 overflow-y-auto pr-1 sm:grid-cols-7">
        {list.map((s) => (
          <button
            key={s.kind}
            onClick={() => {
              onPick(s.kind);
              onClose();
            }}
            className="grid aspect-square place-items-center rounded-[10px] border border-transparent bg-surface-2 p-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/40 hover:bg-gold/[0.07]"
          >
            <img src={stickerUrl(s.kind)} alt={s.kind} loading="lazy" className="max-h-full max-w-full object-contain" />
          </button>
        ))}
      </div>
    </Modal>
  );
}
