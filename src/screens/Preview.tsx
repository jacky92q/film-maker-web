import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Download, Pause, Play, RotateCcw, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useProjects } from '../store/projects';
import { useT } from '../i18n';
import { FilmPlayer } from '../render/FilmPlayer';
import { Spinner } from '../components/ui';

function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function Preview() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t } = useT();
  const project = useProjects((s) => (id ? s.getById(id) : undefined));

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<FilmPlayer | null>(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [total, setTotal] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (!project || !canvasRef.current) return;
    const player = new FilmPlayer(canvasRef.current, project, {
      onTick: (e, tot, idx) => {
        setElapsed(e);
        setTotal(tot);
        setSlideIdx(idx);
      },
      onEnded: () => {
        setPlaying(false);
        setEnded(true);
      },
      onReady: () => setReady(true),
    });
    playerRef.current = player;
    setTotal(player.total);
    return () => {
      player.dispose();
      playerRef.current = null;
    };
  }, [project]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'ArrowRight') playerRef.current?.nextSlide();
      else if (e.key === 'ArrowLeft') playerRef.current?.prevSlide();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!project) return null;

  function toggle() {
    const p = playerRef.current;
    if (!p || !ready) return;
    setEnded(false);
    p.toggle();
    setPlaying(p.playing);
  }

  function restart() {
    const p = playerRef.current;
    if (!p) return;
    p.seek(0);
    setEnded(false);
    p.play();
    setPlaying(true);
  }

  function scrub(clientX: number, el: HTMLElement) {
    const r = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const at = ratio * total;
    playerRef.current?.seek(at);
    setElapsed(at);
    setEnded(false);
  }

  function toggleMute() {
    const p = playerRef.current;
    if (!p) return;
    const next = !muted;
    setMuted(next);
    p.music.update(
      {
        volume: next ? 0 : (project!.musicVolume ?? 0.8),
        fadeIn: project!.musicFadeIn ?? 1.2,
        fadeOut: project!.musicFadeOut ?? 2.5,
      },
      p.total,
    );
    p.music.tick(p.elapsed);
  }

  const starts = project.slides.reduce<number[]>((acc, s, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + Math.max(0.5, project.slides[i - 1].durationSeconds));
    return acc;
  }, []);

  return (
    <div className="flex h-[100dvh] flex-col bg-stage text-paper">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-stage-line px-4">
        <button
          onClick={() => nav(`/film/${id}`)}
          className="grid h-9 w-9 place-items-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label={t('backToEditor')}
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </button>
        <div className="min-w-0">
          <p className="label text-white/40">{t('previewTitle')}</p>
          <p className="truncate font-display text-[15px] leading-tight text-white/90">{project.title}</p>
        </div>
        <button
          onClick={() => nav(`/film/${id}/export`)}
          className="ml-auto inline-flex h-9 items-center gap-2 rounded-lg bg-paper px-3.5 text-[13px] font-semibold text-ink transition-transform hover:scale-[1.02]"
        >
          <Download className="h-3.5 w-3.5" /> {t('export')}
        </button>
      </header>

      <div className="relative flex min-h-0 flex-1 items-center justify-center p-4 sm:p-10">
        <div className="relative flex h-full w-full items-center justify-center">
          <canvas
            ref={canvasRef}
            onClick={toggle}
            className="max-h-full max-w-full cursor-pointer rounded-[3px] shadow-frame"
            style={{ aspectRatio: project.orientation === 'portrait' ? '9/16' : '16/9' }}
          />

          <AnimatePresence>
            {(!ready || !playing || ended) && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={ended ? restart : toggle}
                className="absolute inset-0 grid place-items-center"
                aria-label={ended ? t('replay') : t('play')}
              >
                <span className="grid h-[72px] w-[72px] place-items-center rounded-full bg-paper/95 text-ink shadow-frame backdrop-blur-sm transition-transform duration-200 hover:scale-105">
                  {!ready ? (
                    <Spinner size={22} />
                  ) : ended ? (
                    <RotateCcw className="h-7 w-7" strokeWidth={1.6} />
                  ) : (
                    <Play className="ml-1 h-8 w-8" strokeWidth={1.6} />
                  )}
                </span>
                {!ready && (
                  <span className="absolute bottom-[38%] text-[12px] text-white/70">{t('previewLoading')}</span>
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="shrink-0 border-t border-stage-line px-4 py-4 sm:px-10">
        <div className="mx-auto max-w-3xl">
          {/* One scrub bar, divided into chapters — drag anywhere to seek. */}
          <div className="flex items-center gap-4">
            <span className="w-11 shrink-0 text-right font-display text-[12px] tabular-nums text-white/55">{clock(elapsed)}</span>
            <div
              role="slider"
              aria-label={t('previewTitle')}
              aria-valuemin={0}
              aria-valuemax={Math.round(total)}
              aria-valuenow={Math.round(elapsed)}
              tabIndex={0}
              onPointerDown={(e) => {
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                scrub(e.clientX, e.currentTarget as HTMLElement);
              }}
              onPointerMove={(e) => {
                if (e.buttons === 1) scrub(e.clientX, e.currentTarget as HTMLElement);
              }}
              className="flex flex-1 cursor-pointer items-center gap-[3px] py-3"
            >
              {project.slides.map((s, i) => {
                const span = Math.max(0.5, s.durationSeconds);
                const fill = Math.max(0, Math.min(1, (elapsed - starts[i]) / span));
                return (
                  <span
                    key={s.id}
                    className="h-[3px] overflow-hidden rounded-full bg-white/20 transition-[height] duration-150"
                    style={{ flexGrow: span, flexBasis: 0 }}
                  >
                    <span className="block h-full bg-gold" style={{ width: `${fill * 100}%` }} />
                  </span>
                );
              })}
            </div>
            <span className="w-11 shrink-0 font-display text-[12px] tabular-nums text-white/55">{clock(total)}</span>
          </div>

          <div className="mt-4 flex items-center justify-center gap-3">
            <ControlButton label={t('previousSlide')} onClick={() => playerRef.current?.prevSlide()}>
              <SkipBack className="h-[18px] w-[18px]" />
            </ControlButton>
            <button
              onClick={ended ? restart : toggle}
              disabled={!ready}
              aria-label={playing ? t('pause') : t('play')}
              className="grid h-12 w-12 place-items-center rounded-full bg-paper text-ink transition-transform duration-150 hover:scale-105 active:scale-95 disabled:opacity-40"
            >
              {ended ? <RotateCcw className="h-5 w-5" /> : playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
            </button>
            <ControlButton label={t('nextSlide')} onClick={() => playerRef.current?.nextSlide()}>
              <SkipForward className="h-[18px] w-[18px]" />
            </ControlButton>
            {project.musicPath && (
              <ControlButton label={project.musicName ?? ''} onClick={toggleMute}>
                {muted ? <VolumeX className="h-[18px] w-[18px]" /> : <Volume2 className="h-[18px] w-[18px]" />}
              </ControlButton>
            )}
          </div>

          <p className="mt-3 text-center text-[11px] text-white/35">
            {slideIdx + 1} / {project.slides.length}
            {project.musicPath && ` · ${project.musicName}`}
          </p>
        </div>
      </div>
    </div>
  );
}

function ControlButton({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="grid h-10 w-10 place-items-center rounded-full text-white/65 transition-colors hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  );
}
