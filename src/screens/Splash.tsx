import { motion } from 'framer-motion';
import { Clapperboard } from 'lucide-react';
import { useT } from '../i18n';

export default function Splash() {
  const { t } = useT();
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-dark-bg text-cream">
      <motion.div
        initial={{ opacity: 0, scale: 0.78 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex flex-col items-center"
      >
        <div className="grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-primary to-primary-dark shadow-elevated">
          <Clapperboard className="h-12 w-12 text-white" strokeWidth={1.6} />
        </div>
        <h1 className="mt-6 font-serif text-3xl font-bold tracking-[0.18em] text-gold">FILM MAKER</h1>
        <p className="mt-2 text-[13px] tracking-wide text-dark-text">{t('appTagline')}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="absolute bottom-12"
      >
        <span className="inline-block h-1 w-24 overflow-hidden rounded-full bg-white/10">
          <motion.span
            className="block h-full w-1/2 rounded-full bg-gold"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
          />
        </span>
      </motion.div>
    </div>
  );
}
