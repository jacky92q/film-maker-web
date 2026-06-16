import { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Film, Clock, Music, Check, Download, AlertCircle, Layers, Images,
} from 'lucide-react';
import { useProjects } from '../store/projects';
import { useT } from '../i18n';
import { totalDuration } from '../domain/models';
import { ORIENTATION_DIMS } from '../domain/enums';
import { exportFilm } from '../render/exporter';
import { drawSlide } from '../render/drawSlide';
import { loadImage } from '../lib/imageStore';
import { Button, Center, PageFade } from '../components/ui';

type Status = 'idle' | 'exporting' | 'done' | 'error';

interface Res {
  key: string;
  label: string;
  scale: number;
  bitrate: number;
  descKey: 'resHdDesc' | 'resFullHdDesc' | 'res4kDesc';
  recommended?: boolean;
}
const RESOLUTIONS: Res[] = [
  { key: '720p', label: '720p HD', scale: 1, bitrate: 4_000_000, descKey: 'resHdDesc' },
  { key: '1080p', label: '1080p Full HD', scale: 1.5, bitrate: 8_000_000, descKey: 'resFullHdDesc', recommended: true },
  { key: '4k', label: '4K Ultra HD', scale: 3, bitrate: 20_000_000, descKey: 'res4kDesc' },
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
  const signal = useRef({ cancelled: false });

  const duration = useMemo(() => (project ? totalDuration(project) : 0), [project]);
  if (!project) return null;

  async function runExport() {
    if (!project) return;
    if (project.slides.length === 0) {
      setError(t('noSlidesToExport'));
      setStatus('error');
      return;
    }
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
      if (signal.current.cancelled) {
        setStatus('idle');
        return;
      }
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitize(project.title)}.${result.ext}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
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
    canvas.width = canon.w;
    canvas.height = canon.h;
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
        a.href = url;
        a.download = `${sanitize(project.title)}_${String(i + 1).padStart(2, '0')}.png`;
        a.click();
        await new Promise((r) => setTimeout(r, 250));
        URL.revokeObjectURL(url);
      }
    }
  }

  const phase =
    progress < 0.1 ? t('phaseCapturing') :
    progress < 0.75 ? t('phaseCompositing') :
    progress < 0.98 ? t('phaseEncoding') : t('phaseSaving');

  return (
    <PageFade className="min-h-screen bg-bg pb-16">
      <Center max={560}>
        <header className="flex items-center gap-3 py-4">
          <button onClick={() => nav(-1)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-black/5">
            <ArrowLeft className="h-5 w-5 text-text-dark" />
          </button>
          <h1 className="font-serif text-xl font-bold text-text-dark">{t('exportFilm')}</h1>
        </header>

        {status === 'idle' && (
          <>
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/12 text-primary">
                  <Film className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-text-dark">{project.title}</div>
                  <div className="text-xs text-text-mid">{t('readyToExport')}</div>
                </div>
              </div>
              <div className="my-4 h-px bg-line" />
              <div className="flex flex-wrap gap-2">
                <Chip icon={<Layers className="h-3.5 w-3.5" />}>{f.slidesCount(lang, project.slides.length)}</Chip>
                <Chip icon={<Clock className="h-3.5 w-3.5" />}>{f.duration(lang, duration)}</Chip>
                {project.musicName && <Chip icon={<Music className="h-3.5 w-3.5" />}>{project.musicName}</Chip>}
              </div>
            </div>

            <h2 className="mb-1 mt-6 text-[15px] font-bold text-text-dark">{t('outputQuality')}</h2>
            <p className="mb-3 text-[13px] text-text-mid">{t('outputQualitySub')}</p>
            <div className="space-y-2.5">
              {RESOLUTIONS.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRes(r.key)}
                  className={`flex w-full items-center gap-3 rounded-[14px] border p-4 text-left transition-all ${
                    res === r.key ? 'border-primary bg-primary/[0.07]' : 'border-line bg-surface'
                  }`}
                >
                  <span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${res === r.key ? 'border-primary' : 'border-line'}`}>
                    {res === r.key && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                  </span>
                  <span className="flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-bold text-text-dark">{r.label}</span>
                      {r.recommended && (
                        <span className="rounded-md bg-primary/12 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{t('recommended')}</span>
                      )}
                    </span>
                    <span className="block text-xs text-text-mid">{t(r.descKey)}</span>
                  </span>
                </button>
              ))}
            </div>

            <Button onClick={runExport} className="mt-6 h-[56px] w-full">
              <Film className="h-5 w-5" /> {t('exportToMp4')}
            </Button>
            <Button variant="outline" onClick={exportSlideImages} className="mt-3 h-[52px] w-full">
              <Images className="h-5 w-5" /> {t('exportSlideImages')}
            </Button>

            <div className="mt-4 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/[0.06] p-3 text-[12px] leading-relaxed text-text-mid">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{t('webExportNote')}<br />{t('savedNote')}</span>
            </div>
          </>
        )}

        {status === 'exporting' && (
          <div className="flex flex-col items-center py-16">
            <div className="relative h-36 w-36">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="44" fill="none" stroke="#ECE0D4" strokeWidth="7" />
                <circle
                  cx="50" cy="50" r="44" fill="none" stroke="#C07842" strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 44}
                  strokeDashoffset={2 * Math.PI * 44 * (1 - progress)}
                  style={{ transition: 'stroke-dashoffset 0.2s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-text-dark">{Math.round(progress * 100)}%</span>
                <span className="text-xs text-text-mid">{t('doneLabel')}</span>
              </div>
            </div>
            <h2 className="mt-6 font-serif text-xl font-bold text-text-dark">{t('renderingTitle')}</h2>
            <p className="mt-1 text-sm text-text-mid">{phase}</p>
            <Button
              variant="ghost"
              className="mt-6"
              onClick={() => { signal.current.cancelled = true; setStatus('idle'); }}
            >
              {t('cancelExport')}
            </Button>
          </div>
        )}

        {status === 'done' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-16 text-center">
            <div className="grid h-22 w-22 place-items-center rounded-full border-2 border-primary/35 bg-primary/12 p-6 text-primary">
              <Check className="h-11 w-11" />
            </div>
            <h2 className="mt-5 font-serif text-2xl font-extrabold text-text-dark">{t('exportComplete')}</h2>
            <p className="mt-2 text-sm text-text-mid">{t('exportCompleteSub')}</p>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" onClick={runExport}><Download className="h-5 w-5" /> {t('exportAgain')}</Button>
              <Button onClick={() => nav(-1)}><Check className="h-5 w-5" /> {t('doneButton')}</Button>
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full border-2 border-danger/30 bg-danger/10 p-5 text-danger">
              <AlertCircle className="h-10 w-10" />
            </div>
            <h2 className="mt-5 font-serif text-lg font-bold text-text-dark">{t('exportFailed')}</h2>
            <p className="mt-2 text-sm text-text-mid">{error}</p>
            <Button className="mt-6" onClick={() => setStatus('idle')}>{t('tryAgain')}</Button>
          </div>
        )}
      </Center>
    </PageFade>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 py-1.5 text-xs text-text-mid">
      {icon} {children}
    </span>
  );
}

function sanitize(s: string): string {
  return s.replace(/[^a-z0-9_\-가-힣]/gi, '_').slice(0, 40) || 'film';
}
