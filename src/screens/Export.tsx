import { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Film, Clock, Music, Check, Download, AlertCircle, Layers, Images, Sparkles,
} from 'lucide-react';
import { useProjects } from '../store/projects';
import { useT } from '../i18n';
import { totalDuration } from '../domain/models';
import { ORIENTATION_DIMS } from '../domain/enums';
import { exportFilm } from '../render/exporter';
import { drawSlide } from '../render/drawSlide';
import { loadImage } from '../lib/imageStore';
import { Button } from '../components/ui';

type Status = 'idle' | 'exporting' | 'done' | 'error';

interface Res {
  key: string; label: string; scale: number; bitrate: number;
  descKey: 'resHdDesc' | 'resFullHdDesc' | 'res4kDesc'; recommended?: boolean;
}
const RESOLUTIONS: Res[] = [
  { key: '720p', label: '720p HD', scale: 1, bitrate: 6_000_000, descKey: 'resHdDesc' },
  { key: '1080p', label: '1080p Full HD', scale: 1.5, bitrate: 12_000_000, descKey: 'resFullHdDesc', recommended: true },
  { key: '4k', label: '4K Ultra HD', scale: 3, bitrate: 40_000_000, descKey: 'res4kDesc' },
];

export default function ExportScreen() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t, f, lang } = useT();
  const project = useProjects((s) => s.getById(id!));
  const [res, setRes] = useState('1080p');
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultExt, setResultExt] = useState('mp4');
  const signal = useRef({ cancelled: false });

  const duration = useMemo(() => (project ? totalDuration(project) : 0), [project]);
  if (!project) return null;

  async function runExport() {
    if (!project) return;
    if (project.slides.length === 0) { setError(t('noSlidesToExport')); setStatus('error'); return; }
    const chosen = RESOLUTIONS.find((r) => r.key === res)!;
    const canon = ORIENTATION_DIMS[project.orientation];
    signal.current = { cancelled: false };
    setStatus('exporting');
    setProgress(0);
    try {
      const result = await exportFilm(project, {
        width: Math.round(canon.w * chosen.scale),
        height: Math.round(canon.h * chosen.scale),
        fps: 30,
        bitrate: chosen.bitrate,
        onProgress: setProgress,
        signal: signal.current,
      });
      if (signal.current.cancelled) { setStatus('idle'); return; }
      const url = URL.createObjectURL(result.blob);
      setResultUrl(url);
      setResultExt(result.ext);
      // trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitize(project.title)}.${result.ext}`;
      a.click();
      setStatus('done');
    } catch (e) {
      console.error(e);
      setError(t('exportFailedDefault'));
      setStatus('error');
    }
  }

  async function exportSlideImages() {
    if (!project) return;
    const canon = ORIENTATION_DIMS[project.orientation];
    const canvas = document.createElement('canvas');
    canvas.width = canon.w; canvas.height = canon.h;
    const ctx = canvas.getContext('2d')!;
    for (let i = 0; i < project.slides.length; i++) {
      const s = project.slides[i];
      const paths = [s.imagePath, ...s.photoLayers.map((l) => l.imagePath)].filter(Boolean) as string[];
      await Promise.all(paths.map((p) => loadImage(p)));
      drawSlide(ctx, s, canon.w, canon.h, { localMs: 99999 });
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${sanitize(project.title)}_${String(i + 1).padStart(2, '0')}.png`;
        a.click();
        await new Promise((r) => setTimeout(r, 200));
        URL.revokeObjectURL(url);
      }
    }
  }

  const phase =
    progress < 0.1 ? t('phaseCapturing') :
    progress < 0.85 ? t('phaseEncoding') : t('phaseSaving');

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-5">
          <button onClick={() => nav(`/editor/${id}`)} className="grid h-10 w-10 place-items-center rounded-lg hover:bg-black/5">
            <ArrowLeft className="h-5 w-5 text-text-dark" />
          </button>
          <h1 className="font-serif text-xl font-bold text-text-dark">{t('exportFilm')}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        {status === 'idle' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/12 text-primary"><Film className="h-6 w-6" /></div>
                <div>
                  <div className="text-lg font-bold text-text-dark">{project.title}</div>
                  <div className="text-sm text-text-mid">{t('readyToExport')}</div>
                </div>
              </div>
              <div className="my-4 h-px bg-line" />
              <div className="flex flex-wrap gap-2">
                <Chip icon={<Layers className="h-3.5 w-3.5" />}>{f.slidesCount(lang, project.slides.length)}</Chip>
                <Chip icon={<Clock className="h-3.5 w-3.5" />}>{f.duration(lang, duration)}</Chip>
                {project.musicName && <Chip icon={<Music className="h-3.5 w-3.5" />}>{project.musicName}</Chip>}
              </div>
            </div>

            <h2 className="mb-1 mt-8 text-lg font-bold text-text-dark">{t('outputQuality')}</h2>
            <p className="mb-4 text-sm text-text-mid">{t('outputQualitySub')}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {RESOLUTIONS.map((r) => (
                <button key={r.key} onClick={() => setRes(r.key)} className={`rounded-2xl border-2 p-4 text-left transition-all ${res === r.key ? 'border-primary bg-primary/[0.06]' : 'border-line bg-surface hover:border-primary/30'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text-dark">{r.label}</span>
                    <span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${res === r.key ? 'border-primary' : 'border-line'}`}>
                      {res === r.key && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                    </span>
                  </div>
                  {r.recommended && <span className="mt-1 inline-block rounded-md bg-primary/12 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{t('recommended')}</span>}
                  <p className="mt-1.5 text-xs text-text-mid">{t(r.descKey)}</p>
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button onClick={runExport} className="h-[52px] flex-1"><Film className="h-5 w-5" /> {t('exportToMp4')}</Button>
              <Button variant="outline" onClick={exportSlideImages} className="h-[52px] flex-1"><Images className="h-5 w-5" /> {t('exportSlideImages')}</Button>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/[0.06] p-3 text-[12px] leading-relaxed text-text-mid">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{t('webExportNote')}<br />{t('savedNote')}</span>
            </div>
          </motion.div>
        )}

        {status === 'exporting' && (
          <div className="flex flex-col items-center py-20">
            <div className="relative h-40 w-40">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="44" fill="none" stroke="#ECE0D4" strokeWidth="7" />
                <circle cx="50" cy="50" r="44" fill="none" stroke="#C07842" strokeWidth="7" strokeLinecap="round" strokeDasharray={2 * Math.PI * 44} strokeDashoffset={2 * Math.PI * 44 * (1 - progress)} style={{ transition: 'stroke-dashoffset 0.15s linear' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold text-text-dark">{Math.round(progress * 100)}%</span>
                <span className="text-xs text-text-mid">{t('doneLabel')}</span>
              </div>
            </div>
            <h2 className="mt-6 font-serif text-xl font-bold text-text-dark">{t('renderingTitle')}</h2>
            <p className="mt-1 text-sm text-text-mid">{phase}</p>
            <Button variant="ghost" className="mt-6" onClick={() => { signal.current.cancelled = true; setStatus('idle'); }}>{t('cancelExport')}</Button>
          </div>
        )}

        {status === 'done' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-10 text-center">
            <div className="mb-5 flex items-center gap-2 text-primary">
              <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-primary/35 bg-primary/12"><Check className="h-6 w-6" /></div>
            </div>
            <h2 className="font-serif text-2xl font-extrabold text-text-dark">{t('exportComplete')}</h2>
            <p className="mt-2 text-sm text-text-mid">{t('exportCompleteSub')}</p>
            {resultUrl && (
              <video src={resultUrl} controls playsInline className="mt-6 w-full max-w-xl rounded-2xl border border-line bg-black shadow-card" style={{ aspectRatio: project.orientation === 'portrait' ? '9/16' : '16/9' }} />
            )}
            <div className="mt-6 flex gap-2">
              {resultUrl && (
                <a href={resultUrl} download={`${sanitize(project.title)}.${resultExt}`} className="inline-flex items-center gap-2 rounded-[14px] bg-primary px-6 py-3 text-sm font-bold text-white hover:brightness-105">
                  <Download className="h-5 w-5" /> {t('doneButton')}
                </a>
              )}
              <Button variant="outline" onClick={() => { setStatus('idle'); setResultUrl(null); }}>{t('exportAgain')}</Button>
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full border-2 border-danger/30 bg-danger/10 text-danger"><AlertCircle className="h-10 w-10" /></div>
            <h2 className="mt-5 font-serif text-lg font-bold text-text-dark">{t('exportFailed')}</h2>
            <p className="mt-2 text-sm text-text-mid">{error}</p>
            <Button className="mt-6" onClick={() => setStatus('idle')}>{t('tryAgain')}</Button>
          </div>
        )}
      </main>
    </div>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 py-1.5 text-xs text-text-mid">{icon} {children}</span>;
}

function sanitize(s: string): string {
  return s.replace(/[^a-z0-9_\-가-힣]/gi, '_').slice(0, 40) || 'film';
}
