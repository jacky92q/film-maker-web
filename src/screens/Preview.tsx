import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { useProjects } from '../store/projects';
import { FilmPlayer } from '../render/FilmPlayer';

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function Preview() {
  const { id } = useParams();
  const nav = useNavigate();
  const project = useProjects((s) => s.getById(id!));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<FilmPlayer | null>(null);

  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [total, setTotal] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<number>();

  const poke = useCallback(() => {
    setShowControls(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    if (!project || !canvasRef.current) return;
    const player = new FilmPlayer(canvasRef.current, project, {
      onTick: (e, tot, idx) => {
        setElapsed(e);
        setTotal(tot);
        setSlideIdx(idx);
      },
      onEnded: () => setPlaying(false),
    });
    playerRef.current = player;
    setTotal(player.total);
    const start = setTimeout(() => {
      player.play();
      setPlaying(true);
      poke();
    }, 350);
    return () => {
      clearTimeout(start);
      player.dispose();
    };
  }, [project, poke]);

  if (!project) return null;
  const slideCount = project.slides.length;

  function toggle() {
    const p = playerRef.current;
    if (!p) return;
    p.toggle();
    setPlaying(p.playing);
    poke();
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black" onMouseMove={poke} onClick={poke}>
      <div className="relative flex h-full w-full items-center justify-center">
        <canvas
          ref={canvasRef}
          className="max-h-full max-w-full"
          style={{ aspectRatio: project.orientation === 'portrait' ? '9/16' : '16/9' }}
        />
      </div>

      <AnimatePresence>
        {showControls && (
          <>
            {/* top bar */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/75 to-transparent px-4 pb-8 pt-[calc(env(safe-area-inset-top)+10px)]"
            >
              <button
                onClick={(e) => { e.stopPropagation(); nav(-1); }}
                className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <span className="truncate px-4 font-serif text-[15px] font-semibold tracking-wide text-gold">{project.title}</span>
              <span className="w-10" />
            </motion.div>

            {/* center controls */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center gap-8"
            >
              <CtrlBtn onClick={(e) => { e.stopPropagation(); playerRef.current?.prevSlide(); poke(); }} disabled={slideIdx === 0}>
                <SkipBack className="h-6 w-6" />
              </CtrlBtn>
              <button
                onClick={(e) => { e.stopPropagation(); toggle(); }}
                className="grid h-[72px] w-[72px] place-items-center rounded-full border border-gold/60 bg-black/45 text-gold shadow-[0_0_24px_rgba(201,168,76,0.4)] active:scale-95"
              >
                {playing ? <Pause className="h-9 w-9" /> : <Play className="ml-1 h-9 w-9" />}
              </button>
              <CtrlBtn onClick={(e) => { e.stopPropagation(); playerRef.current?.nextSlide(); poke(); }} disabled={slideIdx >= slideCount - 1}>
                <SkipForward className="h-6 w-6" />
              </CtrlBtn>
            </motion.div>

            {/* bottom bar */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-center gap-1.5">
                {project.slides.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => { playerRef.current?.seekSlide(i); poke(); }}
                    className="h-1 rounded-full transition-all"
                    style={{ width: i === slideIdx ? 24 : 6, background: i === slideIdx ? '#C9A84C' : 'rgba(255,255,255,0.35)' }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="w-10 text-right text-[11px] text-white/65">{fmtTime(elapsed)}</span>
                <input
                  type="range"
                  min={0}
                  max={total}
                  step={0.01}
                  value={elapsed}
                  onChange={(e) => { playerRef.current?.seek(Number(e.target.value)); setElapsed(Number(e.target.value)); poke(); }}
                  className="range-dark flex-1"
                />
                <span className="w-10 text-[11px] text-white/65">{fmtTime(total)}</span>
              </div>
              <div className="mt-1 text-center text-[11px] tracking-wide text-white/40">
                {slideIdx + 1} / {slideCount}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function CtrlBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: (e: React.MouseEvent) => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="grid h-11 w-11 place-items-center rounded-full border border-white/30 text-white/90 disabled:border-white/10 disabled:text-white/25"
    >
      {children}
    </button>
  );
}
