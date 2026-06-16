import type { ReactNode } from 'react';
import { TEXT_COLORS, TEXT_COLOR_HEX, type SlideTextColor } from '../domain/enums';

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold">{title}</h4>
        {right}
      </div>
      {children}
    </div>
  );
}

export function Slider({
  value, min, max, step = 1, onChange, onCommit, label,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  onCommit?: () => void;
  label?: string;
}) {
  return (
    <div>
      {label && <div className="mb-1 text-right text-[11px] text-dark-text">{label}</div>}
      <input
        type="range"
        className="range-dark w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
      />
    </div>
  );
}

export function ChipRow<T extends string>({
  options, value, onChange, label,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  label: (v: T) => string;
}) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all ${
            value === o
              ? 'bg-gold text-black shadow-[0_2px_8px_rgba(201,168,76,0.4)]'
              : 'bg-dark-surface-2 text-dark-text hover:bg-white/10'
          }`}
        >
          {label(o)}
        </button>
      ))}
    </div>
  );
}

export function Segmented<T extends string>({
  options, value, onChange,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-dark-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold transition-all ${
            value === o.value ? 'bg-gold text-black' : 'text-dark-text hover:bg-white/5'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ColorRow({
  value, custom, onPreset, onCustom,
}: {
  value: SlideTextColor;
  custom: string | null;
  onPreset: (c: SlideTextColor) => void;
  onCustom: (hex: string) => void;
}) {
  return (
    <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
      <label className="relative h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-white/30">
        <span
          className="block h-full w-full"
          style={{ background: 'conic-gradient(red,orange,yellow,lime,cyan,blue,magenta,red)' }}
        />
        <input
          type="color"
          value={custom ?? '#ffffff'}
          onChange={(e) => onCustom(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      {TEXT_COLORS.map((c) => (
        <button
          key={c}
          onClick={() => onPreset(c)}
          className={`h-7 w-7 shrink-0 rounded-full border-2 transition-transform ${
            !custom && value === c ? 'scale-110 border-gold' : 'border-white/20'
          }`}
          style={{ background: TEXT_COLOR_HEX[c] }}
        />
      ))}
    </div>
  );
}

export function IconBtn({
  children, onClick, active, danger, title,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  title?: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold transition-all ${
        danger
          ? 'border border-danger/40 text-danger hover:bg-danger/10'
          : active
            ? 'bg-gold text-black'
            : 'bg-dark-surface-2 text-dark-text hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

export function PanelEmpty({ title, hint, action }: { title: string; hint: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <p className="text-sm font-semibold text-dark-text">{title}</p>
      <p className="mt-1 text-[12px] text-dark-text/60">{hint}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
