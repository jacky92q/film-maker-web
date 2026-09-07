import { useEffect, useState } from 'react';
import { MonitorPlay, Smartphone } from 'lucide-react';
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
        className="mt-2 w-full border-b border-line bg-transparent pb-2 font-display text-[22px] text-ink outline-none transition-colors placeholder:text-ink-3/45 focus:border-gold"
      />

      <Label className="mt-7 block">{t('formatLabel')}</Label>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <FormatCard
          active={orientation === 'landscape'}
          onClick={() => setOrientation('landscape')}
          icon={<MonitorPlay className="h-5 w-5" strokeWidth={1.5} />}
          title={t('formatLandscape')}
          desc={t('formatLandscapeDesc')}
          ratio="16 / 9"
        />
        <FormatCard
          active={orientation === 'portrait'}
          onClick={() => setOrientation('portrait')}
          icon={<Smartphone className="h-5 w-5" strokeWidth={1.5} />}
          title={t('formatPortrait')}
          desc={t('formatPortraitDesc')}
          ratio="9 / 16"
        />
      </div>

      <div className="mt-7 flex justify-end gap-2">
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
  icon,
  title,
  desc,
  ratio,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
  ratio: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-colors duration-150 ${
        active ? 'border-ink bg-paper' : 'border-line bg-card hover:border-ink/25'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={active ? 'text-ink' : 'text-ink-3'}>{icon}</span>
        <span className={`text-[14px] font-semibold ${active ? 'text-ink' : 'text-ink-2'}`}>{title}</span>
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span
          className={`block w-full max-w-[64px] rounded border ${active ? 'border-ink/30 bg-ink/[0.06]' : 'border-line bg-paper-2'}`}
          style={{ aspectRatio: ratio }}
        />
      </div>
      <p className="mt-3 text-[11.5px] leading-snug text-ink-3">{desc}</p>
    </button>
  );
}
