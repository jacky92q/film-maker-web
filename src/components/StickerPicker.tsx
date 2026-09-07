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
            className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors duration-150 ${
              category === c ? 'border-ink bg-ink text-paper' : 'border-line bg-card text-ink-2 hover:border-ink/25'
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
            className="grid aspect-square place-items-center rounded-lg border border-transparent bg-paper p-2 transition-colors duration-150 hover:border-line hover:bg-gold-wash"
          >
            <img src={stickerUrl(s.kind)} alt={s.kind} loading="lazy" className="max-h-full max-w-full object-contain" />
          </button>
        ))}
      </div>
    </Modal>
  );
}
