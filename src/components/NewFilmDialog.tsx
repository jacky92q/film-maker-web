import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MonitorPlay, Smartphone, Clapperboard } from 'lucide-react';
import { useT } from '../i18n';
import { Button } from './ui';
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-[420px] rounded-3xl bg-surface p-6 shadow-elevated"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center gap-2">
              <Clapperboard className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-xl font-bold text-text-dark">{t('newWeddingFilm')}</h2>
            </div>
            <p className="mb-4 text-[13px] text-text-mid">{t('filmTitlePrompt')}</p>

            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('filmTitleHint')}
              className="w-full rounded-[14px] border border-line bg-surface-2 px-4 py-3.5 text-text-dark outline-none focus:border-primary"
            />

            <p className="mb-2 mt-5 text-xs font-semibold text-text-mid">{t('videoFormat')}</p>
            <div className="grid grid-cols-2 gap-3">
              <FormatCard
                active={orientation === 'landscape'}
                onClick={() => setOrientation('landscape')}
                icon={<MonitorPlay className="h-7 w-7" />}
                title={t('formatLandscape')}
                desc={t('formatLandscapeDesc')}
              />
              <FormatCard
                active={orientation === 'portrait'}
                onClick={() => setOrientation('portrait')}
                icon={<Smartphone className="h-7 w-7" />}
                title={t('formatPortrait')}
                desc={t('formatPortraitDesc')}
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>
                {t('cancel')}
              </Button>
              <Button
                onClick={() => {
                  if (!title.trim()) return;
                  onCreate(title.trim(), orientation);
                }}
                disabled={!title.trim()}
              >
                {t('create')}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FormatCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-2xl border p-4 text-center transition-all ${
        active ? 'border-primary bg-primary/[0.07]' : 'border-line bg-surface'
      }`}
    >
      <span className={active ? 'text-primary' : 'text-text-mid'}>{icon}</span>
      <span className={`text-sm ${active ? 'font-bold text-text-dark' : 'font-semibold text-text-mid'}`}>{title}</span>
      <span className="text-[10.5px] text-text-mid">{desc}</span>
    </button>
  );
}
