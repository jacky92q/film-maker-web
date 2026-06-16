import { motion } from 'framer-motion';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function Button({
  children,
  variant = 'filled',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'filled' | 'outline' | 'ghost' | 'danger';
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-bold rounded-[14px] px-6 py-3 text-[15px] transition-all disabled:opacity-50 disabled:pointer-events-none';
  const styles: Record<string, string> = {
    filled: 'bg-primary text-white hover:brightness-105 active:scale-[0.98] shadow-soft',
    outline: 'border border-primary text-primary hover:bg-primary/5 active:scale-[0.98]',
    ghost: 'text-text-mid hover:bg-black/5',
    danger: 'bg-danger text-white hover:brightness-105 active:scale-[0.98]',
  };
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`spin inline-block rounded-full border-2 border-current border-t-transparent ${className}`}
      style={{ width: 18, height: 18 }}
    />
  );
}

export function PageFade({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Center({ children, max = 760, className = '' }: { children: ReactNode; max?: number; className?: string }) {
  return (
    <div className={`mx-auto w-full px-4 ${className}`} style={{ maxWidth: max }}>
      {children}
    </div>
  );
}
