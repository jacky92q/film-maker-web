import { useRef, useState } from 'react';
import { Copy, Plus, Trash2 } from 'lucide-react';
import { useEditor } from '../store/editor';
import { useT } from '../i18n';
import SlideThumb from './SlideThumb';
import type { Project } from '../domain/models';

// The strip of slides under the stage. Tap to jump, drag to reorder.
export default function SlideRail({
  project,
  index,
  onAdd,
}: {
  project: Project;
  index: number;
  onAdd: () => void;
}) {
  const { t } = useT();
  const setSlideIndex = useEditor((s) => s.setSlideIndex);
  const reorder = useEditor((s) => s.reorderSlides);
  const duplicateSlide = useEditor((s) => s.duplicateSlide);
  const deleteSlide = useEditor((s) => s.deleteSlide);

  const listRef = useRef<HTMLDivElement>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragTo, setDragTo] = useState<number | null>(null);
  const drag = useRef<{ from: number; startX: number; active: boolean } | null>(null);

  // The slide you are hovering is the slot you will land in — simpler to aim
  // at than midpoint arithmetic on a rail this small.
  function targetIndex(clientX: number): number {
    const list = listRef.current;
    if (!list) return 0;
    const thumbs = [...list.querySelectorAll<HTMLElement>('[data-slide-index]')];
    if (!thumbs.length) return 0;
    for (let i = 0; i < thumbs.length; i++) {
      const r = thumbs[i].getBoundingClientRect();
      if (clientX < r.right) return i;
    }
    return thumbs.length - 1;
  }

  function onPointerDown(e: React.PointerEvent, i: number) {
    drag.current = { from: i, startX: e.clientX, active: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    if (!d.active && Math.abs(e.clientX - d.startX) > 8) {
      d.active = true;
      setDragFrom(d.from);
    }
    if (d.active) setDragTo(targetIndex(e.clientX));
  }

  function onPointerUp(e: React.PointerEvent, i: number) {
    const d = drag.current;
    drag.current = null;
    if (d?.active) {
      const to = targetIndex(e.clientX);
      if (to !== d.from) reorder(d.from, to);
      else setSlideIndex(d.from);
    } else {
      setSlideIndex(i);
    }
    setDragFrom(null);
    setDragTo(null);
  }

  const ratio = project.orientation === 'portrait' ? '9 / 16' : '16 / 9';

  return (
    <div className="flex shrink-0 items-center gap-3 border-t border-stage-line bg-stage px-3 py-3">
      <div ref={listRef} className="no-scrollbar flex flex-1 items-center gap-2 overflow-x-auto">
        {project.slides.map((slide, i) => {
          const active = i === index;
          const isDragging = dragFrom === i;
          const dropHere = dragFrom !== null && dragTo === i && dragFrom !== i;
          return (
            <button
              key={slide.id}
              data-slide-index={i}
              onPointerDown={(e) => onPointerDown(e, i)}
              onPointerMove={onPointerMove}
              onPointerUp={(e) => onPointerUp(e, i)}
              onPointerCancel={() => { drag.current = null; setDragFrom(null); setDragTo(null); }}
              title={`${t('slide')} ${i + 1} · ${t('dragToReorder')}`}
              className={`relative h-[68px] shrink-0 touch-none overflow-hidden rounded-[3px] transition-[opacity,box-shadow] duration-150 ${
                isDragging ? 'opacity-40' : 'opacity-100'
              } ${dropHere ? 'ring-2 ring-gold' : ''}`}
              style={{
                aspectRatio: ratio,
                boxShadow: active ? '0 0 0 2px #A6813C' : '0 0 0 1px rgba(255,255,255,0.12)',
              }}
            >
              <SlideThumb slide={slide} orientation={project.orientation} scale={0.2} />
              <span className="absolute bottom-0 left-0 bg-black/55 px-1 py-0.5 font-display text-[10px] leading-none text-white/85">
                {i + 1}
              </span>
            </button>
          );
        })}

        <button
          onClick={onAdd}
          title={t('addSlide')}
          className="grid h-[68px] w-11 shrink-0 place-items-center rounded-[3px] border border-dashed border-white/25 text-white/45 transition-colors hover:border-gold hover:text-gold"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex shrink-0 gap-1 border-l border-stage-line pl-3">
        <RailAction label={t('duplicateSlide')} onClick={() => duplicateSlide(project.slides[index].id)}>
          <Copy className="h-4 w-4" />
        </RailAction>
        <RailAction
          label={t('deleteSlide')}
          onClick={() => deleteSlide(project.slides[index].id)}
          disabled={project.slides.length <= 1}
          danger
        >
          <Trash2 className="h-4 w-4" />
        </RailAction>
      </div>
    </div>
  );
}

function RailAction({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`grid h-9 w-9 place-items-center rounded-lg text-white/60 transition-colors disabled:opacity-25 ${
        danger ? 'hover:bg-clay/25 hover:text-white' : 'hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}
