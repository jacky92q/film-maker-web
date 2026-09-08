import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Download, Pause, Play, RotateCcw, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useProjects } from '../store/projects';
import { useT } from '../i18n';
import { FilmPlayer } from '../render/FilmPlayer';
import { musicSettings } from '../domain/models';
import { Spinner } from '../components/ui';

const HIDE_AFTER_MS = 2600;

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
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [total, setTotal] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);
  const [muted, setMuted] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);

  // Chrome stays out of the way while the film runs, and comes back on a tap.
  const showChrome = useCallback((sticky = false) => {
    setChromeVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (!sticky) {
      hideTimer.current = setTimeout(() => {
        if (playerRef.current?.playing) setChromeVisible(false);
      }, HIDE_AFTER_MS);
    }
  }, []);

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
        setChromeVisible(true);
      },
      onReady: () => setReady(true),
    });
    playerRef.current = player;
    setTotal(player.total);
    return () => {
      player.dispose();
      playerRef.current = null;
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [project]);

  const toggle = useCallback(() => {
    const p = playerRef.current;
    if (!p || !ready) return;
    if (p.elapsed >= p.total - 0.01) {
      p.seek(0);
      setEnded(false);
    }
    p.toggle();
    setPlaying(p.playing);
    setEnded(false);
    showChrome(!p.playing);
  }, [ready, showChrome]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'ArrowRight') {
        playerRef.current?.nextSlide();
        showChrome();
      } else if (e.key === 'ArrowLeft') {
        playerRef.current?.prevSlide();
        showChrome();
      } else if (e.key === 'Escape') {
        nav(`/film/${id}`);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, showChrome, nav, id]);

  if (!project) return null;

  const starts = project.slides.reduce<number[]>((acc, _s, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + Math.max(0.5, project.slides[i - 1].durationSeconds));
    return acc;
  }, []);

  function scrub(clientX: number, el: HTMLElement) {
    const r = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const at = ratio * total;
    playerRef.current?.seek(at);
    setElapsed(at);
    setEnded(false);
    showChrome();
  }

  function toggleMute() {
    const p = playerRef.current;
    if (!p || !project) return;
    const next = !muted;
    setMuted(next);
    const s = musicSettings(project);
    p.music.update({ ...s, volume: next ? 0 : s.volume }, p.total);
    p.music.tick(p.elapsed);
    showChrome();
  }

  // A tap on the film shows the chrome; a second tap plays or pauses.
  function onStageTap() {
    if (!chromeVisible) {
      showChrome();
      return;
    }
    toggle();
  }

  const hasMusic = !!project.musicPath;

  return (
    <div className="fixed inset-0 select-none overflow-hidden bg-black text-white">
      {/* The film fills the screen; everything else floats above it. */}
      <button
        onClick={onStageTap}
        className="absolute inset-0 cursor-default"
        aria-label={playing ? t('pause') : t('play')}
      >
        {/* Positioned rather than sized in percentages: a canvas carries its
            own intrinsic ratio, and `height: 100%` loses to it inside a grid.
            object-contain then letterboxes the film to whatever the screen is. */}
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-contain" />
      </button>

      {/* Loading / replay affordance */}
      <AnimatePresence>
        {(!ready || ended) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute inset-0 grid place-items-center"
          >
            <div className="pointer-events-auto flex flex-col items-center">
              <button
                onClick={ready ? toggle : undefined}
                disabled={!ready}
                aria-label={ended ? t('replay') : t('play')}
                className="grid h-[74px] w-[74px] place-items-center rounded-full bg-white/95 text-ink shadow-frame transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                {ready ? <RotateCcw className="h-7 w-7" strokeWidth={1.6} /> : <Spinner size={22} />}
              </button>
              {!ready && <p className="mt-4 text-[12px] text-white/60">{t('previewLoading')}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top chrome */}
      <AnimatePresence>
        {chromeVisible && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/75 via-black/35 to-transparent pb-10"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            <div className="flex items-center gap-3 px-3 py-2.5 sm:px-5">
              <button
                onClick={() => nav(`/film/${id}`)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white/85 transition-colors hover:bg-white/15 active:bg-white/25"
                aria-label={t('backToEditor')}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="label text-white/45">{t('previewTitle')}</p>
                <p className="truncate font-display text-[15px] leading-tight text-white">{project.title}</p>
              </div>
              <button
                onClick={() => nav(`/film/${id}/export`)}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-[13px] font-semibold text-ink transition-transform hover:scale-[1.03] active:scale-95"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">{t('export')}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom chrome */}
      <AnimatePresence>
        {chromeVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent pt-12"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 10px)' }}
          >
            <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
              {/* One scrub bar, split into chapters — drag anywhere to seek. */}
              <div className="flex items-center gap-3">
                <span className="w-10 shrink-0 text-right text-[12px] font-medium tabular-nums text-white/70">
                  {clock(elapsed)}
                </span>
                <div
                  role="slider"
                  aria-label={t('previewTitle')}
                  aria-valuemin={0}
                  aria-valuemax={Math.round(total)}
                  aria-valuenow={Math.round(elapsed)}
                  tabIndex={0}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                    scrub(e.clientX, e.currentTarget as HTMLElement);
                  }}
                  onPointerMove={(e) => {
                    if (e.buttons === 1) scrub(e.clientX, e.currentTarget as HTMLElement);
                  }}
                  className="flex flex-1 cursor-pointer touch-none items-center gap-[3px] py-3"
                >
                  {project.slides.map((s, i) => {
                    const span = Math.max(0.5, s.durationSeconds);
                    const fill = Math.max(0, Math.min(1, (elapsed - starts[i]) / span));
                    return (
                      <span
                        key={s.id}
                        className="h-[3px] overflow-hidden rounded-full bg-white/25"
                        style={{ flexGrow: span, flexBasis: 0 }}
                      >
                        <span className="block h-full bg-gold" style={{ width: `${fill * 100}%` }} />
                      </span>
                    );
                  })}
                </div>
                <span className="w-10 shrink-0 text-[12px] font-medium tabular-nums text-white/70">{clock(total)}</span>
              </div>

              <div className="relative mt-1 flex items-center justify-center gap-2">
                <Control label={t('previousSlide')} onClick={() => { playerRef.current?.prevSlide(); showChrome(); }}>
                  <SkipBack className="h-5 w-5" />
                </Control>
                <button
                  onClick={toggle}
                  disabled={!ready}
                  aria-label={playing ? t('pause') : t('play')}
                  className="grid h-14 w-14 place-items-center rounded-full bg-white text-ink transition-transform duration-150 hover:scale-105 active:scale-95 disabled:opacity-40"
                >
                  {ended ? (
                    <RotateCcw className="h-6 w-6" />
                  ) : playing ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="ml-0.5 h-6 w-6" />
                  )}
                </button>
                <Control label={t('nextSlide')} onClick={() => { playerRef.current?.nextSlide(); showChrome(); }}>
                  <SkipForward className="h-5 w-5" />
                </Control>

                {hasMusic && (
                  <div className="absolute right-0 flex items-center gap-2">
                    <span className="hidden max-w-[120px] truncate text-[11px] text-white/45 sm:block">
                      {project.musicName}
                    </span>
                    <Control label={muted ? t('play') : t('musicStop')} onClick={toggleMute}>
                      {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Control>
                  </div>
                )}
                <span className="absolute left-0 text-[12px] font-medium tabular-nums text-white/45">
                  {slideIdx + 1}/{project.slides.length}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Control({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="grid h-11 w-11 place-items-center rounded-full text-white/75 transition-colors hover:bg-white/15 hover:text-white active:bg-white/25"
    >
      {children}
    </button>
  );
}
