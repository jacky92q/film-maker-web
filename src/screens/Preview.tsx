import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Download } from 'lucide-react';
import { useProjects } from '../store/projects';
import { useT } from '../i18n';
import { FilmPlayer } from '../render/FilmPlayer';

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function Preview() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t } = useT();
  const project = useProjects((s) => s.getById(id!));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<FilmPlayer | null>(null);

  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [total, setTotal] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    if (!project || !canvasRef.current) return;
    const player = new FilmPlayer(canvasRef.current, project, {
      onTick: (e, tot, idx) => { setElapsed(e); setTotal(tot); setSlideIdx(idx); },
      onEnded: () => setPlaying(false),
    });
    playerRef.current = player;
    setTotal(player.total);
    const start = setTimeout(() => { player.play(); setPlaying(true); }, 300);
    return () => { clearTimeout(start); player.dispose(); };
  }, [project]);

  if (!project) return null;
  const slideCount = project.slides.length;

  function toggle() {
    const p = playerRef.current;
    if (!p) return;
    p.toggle();
    setPlaying(p.playing);
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-[#0a0a0a] text-cream">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 px-4">
        <button onClick={() => nav(`/editor/${id}`)} className="grid h-9 w-9 place-items-center rounded-lg text-cream hover:bg-white/10">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="truncate font-serif text-base font-semibold tracking-wide text-gold">{project.title}</span>
        <button onClick={() => nav(`/export/${id}`)} className="ml-auto flex items-center gap-1.5 rounded-lg bg-gold px-3.5 py-2 text-sm font-bold text-black hover:brightness-105">
          <Download className="h-4 w-4" /> {t('export')}
        </button>
      </header>

      {/* Stage */}
      <div className="flex min-h-0 flex-1 items-center justify-center p-4 sm:p-8">
        <div className="relative w-full max-w-5xl">
          <canvas
            ref={canvasRef}
            onClick={toggle}
            className="mx-auto max-h-[68vh] w-auto cursor-pointer rounded-xl shadow-2xl"
            style={{ aspectRatio: project.orientation === 'portrait' ? '9/16' : '16/9', maxWidth: '100%' }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="shrink-0 border-t border-white/10 bg-dark-surface px-4 py-4 sm:px-8">
        <div className="mx-auto max-w-3xl">
          {/* slide dots */}
          <div className="mb-3 flex items-center justify-center gap-1.5">
            {project.slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => playerRef.current?.seekSlide(i)}
                className="h-1.5 rounded-full transition-all"
                style={{ width: i === slideIdx ? 28 : 8, background: i === slideIdx ? '#C9A84C' : 'rgba(255,255,255,0.25)' }}
              />
            ))}
          </div>
          <div className="flex items-center gap-4">
            <span className="w-10 text-right text-xs text-white/60">{fmtTime(elapsed)}</span>
            <input
              type="range" min={0} max={total || 1} step={0.01} value={elapsed}
              onChange={(e) => { playerRef.current?.seek(Number(e.target.value)); setElapsed(Number(e.target.value)); }}
              className="range-dark flex-1"
            />
            <span className="w-10 text-xs text-white/60">{fmtTime(total)}</span>
          </div>
          <div className="mt-3 flex items-center justify-center gap-4">
            <button onClick={() => playerRef.current?.prevSlide()} disabled={slideIdx === 0} className="grid h-10 w-10 place-items-center rounded-full text-white/80 hover:bg-white/10 disabled:opacity-30">
              <SkipBack className="h-5 w-5" />
            </button>
            <button onClick={toggle} className="grid h-14 w-14 place-items-center rounded-full bg-gold text-black shadow-lg transition hover:brightness-105 active:scale-95">
              {playing ? <Pause className="h-7 w-7" /> : <Play className="ml-0.5 h-7 w-7" />}
            </button>
            <button onClick={() => playerRef.current?.nextSlide()} disabled={slideIdx >= slideCount - 1} className="grid h-10 w-10 place-items-center rounded-full text-white/80 hover:bg-white/10 disabled:opacity-30">
              <SkipForward className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-2 text-center text-xs text-white/40">{slideIdx + 1} / {slideCount}</div>
        </div>
      </div>
    </div>
  );
}
