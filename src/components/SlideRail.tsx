import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Copy, Plus, Trash2 } from 'lucide-react';
import { useEditor } from '../store/editor';
import { useT } from '../i18n';
import SlideThumb from './SlideThumb';
import type { Project } from '../domain/models';

const LONG_PRESS_MS = 400;
const SCROLL_SLOP = 10; // movement before the long press gives way to a scroll

// The strip of slides under the stage.
//
// Scrolling comes first: a swipe always scrolls the rail. Reordering is on a
// long press (and on the arrow buttons, which is the whole feature for anyone
// who cannot hold a drag).
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
  const press = useRef<{
    from: number;
    startX: number;
    startY: number;
    timer: ReturnType<typeof setTimeout> | null;
    dragging: boolean;
    pointerId: number;
    el: HTMLElement;
  } | null>(null);

  const dragging = dragFrom !== null;

  // The slide you are over is the slot you land in.
  function targetIndex(clientX: number): number {
    const list = listRef.current;
    if (!list) return 0;
    const thumbs = [...list.querySelectorAll<HTMLElement>('[data-slide-index]')];
    if (!thumbs.length) return 0;
    for (let i = 0; i < thumbs.length; i++) {
      if (clientX < thumbs[i].getBoundingClientRect().right) return i;
    }
    return thumbs.length - 1;
  }

  function cancelPress() {
    const p = press.current;
    if (p?.timer) clearTimeout(p.timer);
    press.current = null;
    setDragFrom(null);
    setDragTo(null);
  }

  function onPointerDown(e: React.PointerEvent, i: number) {
    const el = e.currentTarget as HTMLElement;
    const p = {
      from: i,
      startX: e.clientX,
      startY: e.clientY,
      timer: null as ReturnType<typeof setTimeout> | null,
      dragging: false,
      pointerId: e.pointerId,
      el,
    };
    p.timer = setTimeout(() => {
      // Still pressed and still in place: take over as a drag.
      if (press.current !== p) return;
      p.dragging = true;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* capture is a nicety, not a requirement */
      }
      setDragFrom(i);
      setDragTo(i);
      navigator.vibrate?.(12);
    }, LONG_PRESS_MS);
    press.current = p;
  }

  function onPointerMove(e: React.PointerEvent) {
    const p = press.current;
    if (!p) return;
    if (!p.dragging) {
      // Moved before the long press landed — that was a scroll, not a drag.
      if (Math.abs(e.clientX - p.startX) > SCROLL_SLOP || Math.abs(e.clientY - p.startY) > SCROLL_SLOP) {
        cancelPress();
      }
      return;
    }
    e.preventDefault();
    setDragTo(targetIndex(e.clientX));
  }

  function onPointerUp(e: React.PointerEvent, i: number) {
    const p = press.current;
    if (p?.dragging) {
      const to = targetIndex(e.clientX);
      if (to !== p.from) reorder(p.from, to);
      else setSlideIndex(p.from);
    } else if (p) {
      // A plain tap selects; a swipe already cancelled the press.
      const moved = Math.abs(e.clientX - p.startX) > SCROLL_SLOP || Math.abs(e.clientY - p.startY) > SCROLL_SLOP;
      if (!moved) setSlideIndex(i);
    }
    cancelPress();
  }

  const ratio = project.orientation === 'portrait' ? '9 / 16' : '16 / 9';
  const last = project.slides.length - 1;

  return (
    // On a phone the actions sit under the rail: sharing the row left the
    // slides barely 180px to scroll in.
    <div className="flex shrink-0 flex-col gap-1.5 border-t border-stage-line bg-stage px-2 py-2 sm:flex-row sm:items-center sm:gap-3 sm:px-3 sm:py-2.5">
      <div
        ref={listRef}
        className="no-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto overscroll-x-contain"
        style={{ touchAction: dragging ? 'none' : 'pan-x' }}
      >
        {project.slides.map((slide, i) => {
          const active = i === index;
          const isDragging = dragFrom === i;
          const dropHere = dragging && dragTo === i && dragFrom !== i;
          return (
            <button
              key={slide.id}
              data-slide-index={i}
              onPointerDown={(e) => onPointerDown(e, i)}
              onPointerMove={onPointerMove}
              onPointerUp={(e) => onPointerUp(e, i)}
              onPointerCancel={cancelPress}
              onContextMenu={(e) => e.preventDefault()}
              title={`${t('slide')} ${i + 1} · ${t('holdToReorder')}`}
              className={`relative h-[58px] shrink-0 overflow-hidden rounded-[3px] transition-transform duration-150 sm:h-[68px] ${
                isDragging ? 'scale-105 opacity-60' : ''
              }`}
              style={{
                aspectRatio: ratio,
                boxShadow: dropHere
                  ? '0 0 0 2px #A6813C'
                  : active
                    ? '0 0 0 2px #A6813C'
                    : '0 0 0 1px rgba(255,255,255,0.14)',
              }}
            >
              <SlideThumb slide={slide} orientation={project.orientation} scale={0.2} />
              <span className="pointer-events-none absolute bottom-0 left-0 bg-black/55 px-1 py-0.5 text-[10px] font-semibold leading-none tabular-nums text-white/85">
                {i + 1}
              </span>
            </button>
          );
        })}

        <button
          onClick={onAdd}
          title={t('addSlide')}
          aria-label={t('addSlide')}
          className="grid h-[58px] w-11 shrink-0 place-items-center rounded-[3px] border border-dashed border-white/25 text-white/45 transition-colors hover:border-gold hover:text-gold sm:h-[68px]"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-0.5 sm:border-l sm:border-stage-line sm:pl-3">
        <span className="mr-auto pl-1 text-[10.5px] text-white/35 sm:hidden">
          {index + 1} / {project.slides.length} · {t('holdToReorder')}
        </span>
        <RailAction
          label={t('moveSlideLeft')}
          onClick={() => reorder(index, index - 1)}
          disabled={index <= 0}
        >
          <ChevronLeft className="h-[18px] w-[18px]" />
        </RailAction>
        <RailAction
          label={t('moveSlideRight')}
          onClick={() => reorder(index, index + 1)}
          disabled={index >= last}
        >
          <ChevronRight className="h-[18px] w-[18px]" />
        </RailAction>
        <span className="mx-0.5 h-5 w-px bg-stage-line" />
        <RailAction label={t('duplicateSlide')} onClick={() => duplicateSlide(project.slides[index].id)}>
          <Copy className="h-[17px] w-[17px]" />
        </RailAction>
        <RailAction
          label={t('deleteSlide')}
          onClick={() => deleteSlide(project.slides[index].id)}
          disabled={project.slides.length <= 1}
          danger
        >
          <Trash2 className="h-[17px] w-[17px]" />
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
      className={`grid h-9 w-9 place-items-center rounded-lg text-white/65 transition-colors disabled:opacity-25 sm:h-10 sm:w-10 ${
        danger ? 'hover:bg-clay/25 hover:text-white' : 'hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}
