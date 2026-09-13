import { useEffect, useState } from 'react';
import { useT } from '../i18n';
import { Button, Label, Modal } from './ui';
import type { VideoOrientation } from '../domain/enums';

export default function NewFilmDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (title: string, orientation: VideoOrientation) => void;
}) {
  const { t } = useT();
  const [title, setTitle] = useState('');
  const [orientation, setOrientation] = useState<VideoOrientation>('landscape');

  useEffect(() => {
    if (open) {
      setTitle('');
      setOrientation('landscape');
    }
  }, [open]);

  const submit = () => onCreate(title.trim() || t('untitled'), orientation);

  return (
    <Modal open={open} onClose={onClose} title={t('newFilmTitle')} subtitle={t('newFilmBody')}>
      <Label>{t('filmNameLabel')}</Label>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder={t('filmNameHint')}
        className="mt-3 w-full border-b border-hair-2 bg-transparent pb-3 font-display text-[26px] text-text outline-none transition-colors placeholder:text-text-3/50 focus:border-gold"
      />

      <Label className="mt-8 block">{t('formatLabel')}</Label>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <FormatCard
          active={orientation === 'landscape'}
          onClick={() => setOrientation('landscape')}
          title={t('formatLandscape')}
          desc={t('formatLandscapeDesc')}
          ratio="16 / 9"
        />
        <FormatCard
          active={orientation === 'portrait'}
          onClick={() => setOrientation('portrait')}
          title={t('formatPortrait')}
          desc={t('formatPortraitDesc')}
          ratio="9 / 16"
        />
      </div>

      <div className="mt-8 flex justify-end gap-2">
        <Button variant="quiet" onClick={onClose}>
          {t('cancel')}
        </Button>
        <Button onClick={submit}>{t('create')}</Button>
      </div>
    </Modal>
  );
}

function FormatCard({
  active,
  onClick,
  title,
  desc,
  ratio,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
  ratio: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-[10px] border p-4 text-left transition-all duration-200 ${
        active ? 'border-gold/60 bg-gold/[0.07]' : 'border-hair bg-surface-2 hover:border-hair-2'
      }`}
    >
      {/* The shape of the screen, drawn to scale. */}
      <span className="grid h-[52px] place-items-center">
        <span
          className={`block max-h-[52px] w-full max-w-[62px] rounded-[3px] border transition-colors ${
            active ? 'border-gold/70 bg-gold/15' : 'border-hair-2 bg-black/40'
          }`}
          style={{ aspectRatio: ratio }}
        />
      </span>
      <span className={`mt-3.5 block text-[14px] font-semibold ${active ? 'text-gold' : 'text-text'}`}>{title}</span>
      <span className="mt-1 block text-[11.5px] leading-snug text-text-3">{desc}</span>
    </button>
  );
}
