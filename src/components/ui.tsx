import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { X } from 'lucide-react';

type Variant = 'solid' | 'outline' | 'quiet' | 'danger';

// Solid is the candle: champagne on near-black. Everything else is a hairline.
const VARIANTS: Record<Variant, string> = {
  solid: 'bg-gold text-[#17120E] hover:bg-[#F0CE9E] active:translate-y-px',
  outline: 'border border-hair-2 text-text hover:border-gold/60 hover:text-gold active:translate-y-px',
  quiet: 'text-text-2 hover:bg-white/[0.06] hover:text-text active:translate-y-px',
  danger: 'border border-clay/40 text-clay hover:bg-clay/10 active:translate-y-px',
};

export function Button({
  children,
  variant = 'solid',
  size = 'md',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  const pad = {
    sm: 'h-10 px-3.5 text-[13px]',
    md: 'h-11 px-5 text-[14px]',
    // For the one action a screen is really about.
    lg: 'h-[54px] px-6 text-[15.5px]',
  }[size];
  return (
    <button
      className={`inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-35 ${pad} ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function IconButton({
  children,
  label,
  active,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }) {
  return (
    <button
      title={label}
      aria-label={label}
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors duration-200 disabled:pointer-events-none disabled:opacity-30 ${
        active ? 'bg-gold text-[#17120E]' : 'text-text-2 hover:bg-white/[0.07] hover:text-text'
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Spinner({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <span
      className={`spin inline-block shrink-0 rounded-full border-2 border-current border-t-transparent ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`label ${className}`}>{children}</span>;
}

/** A hairline rule, optionally with a caption resting on it. */
export function Rule({ children }: { children?: ReactNode }) {
  if (!children) return <div className="h-px w-full bg-hair" />;
  return (
    <div className="flex items-center gap-4">
      <span className="h-px flex-1 bg-hair" />
      <span className="label">{children}</span>
      <span className="h-px flex-1 bg-hair" />
    </div>
  );
}

export function Page({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 460,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  width?: number;
}) {
  // Escape closes the dialog, as any dialog should.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 backdrop-blur-[3px] sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className="thin-scroll max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] border border-hair bg-surface p-7 shadow-panel sm:rounded-[20px]"
            style={{ maxWidth: width }}
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-[24px] leading-tight text-text">{title}</h2>
                {subtitle && <p className="mt-2 text-[13px] leading-relaxed text-text-3">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="-mr-2 -mt-2 grid h-9 w-9 shrink-0 place-items-center rounded-full text-text-3 transition-colors hover:bg-white/[0.07] hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
