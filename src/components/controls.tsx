import type { ReactNode } from 'react';
import { TEXT_COLORS, TEXT_COLOR_HEX, type SlideTextColor } from '../domain/enums';

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="mb-7">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="label">{title}</h4>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  onCommit,
  label,
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
    <div className="flex items-center gap-3.5">
      <input
        type="range"
        className="flex-1"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
      />
      {label && (
        <span className="w-12 shrink-0 text-right text-[12px] font-semibold tabular-nums text-gold">{label}</span>
      )}
    </div>
  );
}

export function ChipRow<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  label: (v: T) => string;
}) {
  return (
    <div className="no-scrollbar fade-right -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`h-9 shrink-0 whitespace-nowrap rounded-full border px-3.5 text-[12.5px] font-medium transition-all duration-200 ${
            value === o
              ? 'border-gold bg-gold text-[#17120E]'
              : 'border-hair bg-surface-2 text-text-2 hover:border-hair-2 hover:text-text'
          }`}
        >
          {label(o)}
        </button>
      ))}
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-full border border-hair bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`h-9 flex-1 rounded-full px-2 text-[12.5px] font-semibold transition-all duration-200 ${
            value === o.value ? 'bg-gold text-[#17120E]' : 'text-text-2 hover:text-text'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ColorRow({
  value,
  custom,
  onPreset,
  onCustom,
}: {
  value: SlideTextColor;
  custom: string | null;
  onPreset: (c: SlideTextColor) => void;
  onCustom: (hex: string) => void;
}) {
  return (
    <div className="no-scrollbar fade-right -mx-1 flex items-center gap-2.5 overflow-x-auto px-1 py-1">
      <label
        className={`relative grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full ring-1 ring-inset ring-hair-2 ${
          custom ? 'outline outline-2 outline-offset-[3px] outline-gold' : ''
        }`}
        style={{ background: custom ?? 'conic-gradient(#e8b4b8,#e8c08a,#9faf9a,#88a8c0,#b090c8,#e8b4b8)' }}
        title="Custom colour"
      >
        <input
          type="color"
          value={custom ?? '#ffffff'}
          onChange={(e) => onCustom(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
      {TEXT_COLORS.map((c) => {
        const selected = !custom && value === c;
        return (
          <button
            key={c}
            onClick={() => onPreset(c)}
            title={c}
            className={`h-8 w-8 shrink-0 rounded-full ring-1 ring-inset ring-white/15 transition-transform duration-200 ${
              selected ? 'outline outline-2 outline-offset-[3px] outline-gold' : 'hover:scale-110'
            }`}
            style={{ background: TEXT_COLOR_HEX[c] }}
          />
        );
      })}
    </div>
  );
}

export function ToolButton({
  children,
  onClick,
  active,
  danger,
  title,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  title?: string;
  disabled?: boolean;
}) {
  const tone = danger
    ? 'border-clay/40 text-clay hover:bg-clay/10'
    : active
      ? 'border-gold bg-gold text-[#17120E]'
      : 'border-hair bg-surface-2 text-text-2 hover:border-hair-2 hover:text-text';
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-full border px-4 text-[12.5px] font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-35 ${tone}`}
    >
      {children}
    </button>
  );
}

export function PanelEmpty({ title, hint, action }: { title: string; hint: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-4 py-16 text-center">
      <p className="font-display text-[19px] text-text">{title}</p>
      <p className="mt-2.5 max-w-[250px] text-[12.5px] leading-relaxed text-text-3">{hint}</p>
      {action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
