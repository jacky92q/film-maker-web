import { motion, AnimatePresence } from 'framer-motion';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { X } from 'lucide-react';

type Variant = 'solid' | 'outline' | 'quiet' | 'danger';

const VARIANTS: Record<Variant, string> = {
  solid: 'bg-ink text-paper hover:bg-[#332C24] active:translate-y-px',
  outline: 'border border-line bg-card text-ink hover:border-ink/30 hover:bg-paper active:translate-y-px',
  quiet: 'text-ink-2 hover:bg-ink/[0.05] active:translate-y-px',
  danger: 'border border-clay/35 text-clay hover:bg-clay/[0.07] active:translate-y-px',
};

export function Button({
  children,
  variant = 'solid',
  size = 'md',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }) {
  const pad = size === 'sm' ? 'h-9 px-3.5 text-[13px]' : 'h-11 px-5 text-[14px]';
  return (
    <button
      className={`inline-flex select-none items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 ${pad} ${VARIANTS[variant]} ${className}`}
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
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors duration-150 disabled:pointer-events-none disabled:opacity-30 ${
        active ? 'bg-ink text-paper' : 'text-ink-2 hover:bg-ink/[0.06] hover:text-ink'
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

/** A hairline rule with an optional caption sitting on it. */
export function Rule({ children }: { children?: ReactNode }) {
  if (!children) return <div className="h-px w-full bg-line" />;
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-line" />
      <span className="label">{children}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export function Page({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
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
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-line bg-card p-6 shadow-panel sm:rounded-2xl"
            style={{ maxWidth: width }}
            initial={{ y: 24, opacity: 0, scale: 0.99 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-[22px] leading-tight text-ink">{title}</h2>
                {subtitle && <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-ink/[0.06] hover:text-ink"
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
