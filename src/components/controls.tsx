import type { ReactNode } from 'react';
import { TEXT_COLORS, TEXT_COLOR_HEX, type SlideTextColor } from '../domain/enums';

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="mb-6">
      <div className="mb-2.5 flex items-center justify-between gap-3">
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
    <div className="flex items-center gap-3">
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
        <span className="w-12 shrink-0 text-right font-display text-[13px] tabular-nums text-ink-2">{label}</span>
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
          className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors duration-150 ${
            value === o
              ? 'border-ink bg-ink text-paper'
              : 'border-line bg-card text-ink-2 hover:border-ink/25 hover:text-ink'
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
    <div className="flex overflow-hidden rounded-lg border border-line">
      {options.map((o, i) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 px-2 py-2 text-[12px] font-semibold transition-colors duration-150 ${
            i > 0 ? 'border-l border-line' : ''
          } ${value === o.value ? 'bg-ink text-paper' : 'bg-card text-ink-2 hover:bg-paper'}`}
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
    <div className="no-scrollbar fade-right -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
      <label
        className={`relative grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-full ring-1 ring-inset ring-line ${
          custom ? 'outline outline-2 outline-offset-2 outline-ink' : ''
        }`}
        style={{ background: custom ?? 'conic-gradient(#e8b4b8,#c9a84c,#8faf8f,#88a8c0,#b090c8,#e8b4b8)' }}
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
            className={`h-7 w-7 shrink-0 rounded-full ring-1 ring-inset ring-black/10 transition-transform duration-150 ${
              selected ? 'outline outline-2 outline-offset-2 outline-ink' : 'hover:scale-105'
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
    ? 'border-clay/35 text-clay hover:bg-clay/[0.07]'
    : active
      ? 'border-ink bg-ink text-paper'
      : 'border-line bg-card text-ink-2 hover:border-ink/25 hover:text-ink';
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 ${tone}`}
    >
      {children}
    </button>
  );
}

export function PanelEmpty({ title, hint, action }: { title: string; hint: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-4 py-14 text-center">
      <p className="font-display text-[17px] text-ink">{title}</p>
      <p className="mt-2 max-w-[240px] text-[12.5px] leading-relaxed text-ink-3">{hint}</p>
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
