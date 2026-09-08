import { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Check, Clock, Download, Film, Images, Layers, Music2 } from 'lucide-react';
import { useProjects } from '../store/projects';
import { useT } from '../i18n';
import { totalDuration } from '../domain/models';
import { ORIENTATION_DIMS } from '../domain/enums';
import {
  exportFilm, ExportCancelled, supportsFrameAccurateExport,
  type ExportPhase, type ExportResult,
} from '../render/exporter';
import { FilmRenderer } from '../render/FilmRenderer';
import { drawSlide } from '../render/drawSlide';
import { saveFile, isMobile } from '../lib/download';
import { Button, Label, Page, Spinner } from '../components/ui';
import type { StrKey } from '../i18n/strings';

type Status = 'idle' | 'working' | 'done' | 'error';

interface Preset {
  key: string;
  label: StrKey;
  desc: StrKey;
  scale: number;
  bitrate: number;
  recommended?: boolean;
}

const PRESETS: Preset[] = [
  { key: '720p', label: 'res720', desc: 'res720Desc', scale: 1, bitrate: 6_000_000 },
  { key: '1080p', label: 'res1080', desc: 'res1080Desc', scale: 1.5, bitrate: 12_000_000, recommended: true },
  { key: '4k', label: 'res4k', desc: 'res4kDesc', scale: 3, bitrate: 40_000_000 },
];

const PHASE_KEY: Record<ExportPhase, StrKey> = {
  preparing: 'phasePreparing',
  soundtrack: 'phaseSoundtrack',
  rendering: 'phaseRendering',
  finishing: 'phaseFinishing',
};

export default function Export() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t, f, lang } = useT();
  const project = useProjects((s) => (id ? s.getById(id) : undefined));

  const [preset, setPreset] = useState('1080p');
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<ExportPhase>('preparing');
  const [error, setError] = useState('');
  const [result, setResult] = useState<ExportResult | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [stillsBusy, setStillsBusy] = useState(false);
  const cancel = useRef({ cancelled: false });

  const duration = useMemo(() => (project ? totalDuration(project) : 0), [project]);
  const frameAccurate = supportsFrameAccurateExport();
  // A rough guard on the biggest setting: the file is assembled in memory, so
  // a very large one is worth warning about before the render starts.
  const estimatedMb = ((PRESETS.find((p) => p.key === preset)?.bitrate ?? 0) * duration) / 8 / 1_000_000;
  const heavy = estimatedMb > 220;

  if (!project) return null;

  async function run() {
    if (!project) return;
    if (!project.slides.length) {
      setError(t('exportNoSlides'));
      setStatus('error');
      return;
    }
    const chosen = PRESETS.find((p) => p.key === preset)!;
    const canon = ORIENTATION_DIMS[project.orientation];
    cancel.current = { cancelled: false };
    setStatus('working');
    setProgress(0);
    setPhase('preparing');
    setError('');

    try {
      const out = await exportFilm(project, {
        width: Math.round(canon.w * chosen.scale),
        height: Math.round(canon.h * chosen.scale),
        fps: 30,
        bitrate: chosen.bitrate,
        onProgress: (p, ph) => {
          setProgress(p);
          setPhase(ph);
        },
        signal: cancel.current,
      });
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResult(out);
      setResultUrl(URL.createObjectURL(out.blob));
      setStatus('done');
      // Desktop can start the download straight away; on mobile the save has
      // to happen inside a tap so the share sheet is allowed to open.
      if (!isMobile()) {
        void saveFile(out.blob, filename(project.title, out.ext), project.title);
      }
    } catch (e) {
      if (e instanceof ExportCancelled) {
        setStatus('idle');
        return;
      }
      console.error(e);
      setError(t('exportFailedBody'));
      setStatus('error');
    }
  }

  async function exportStills() {
    if (!project) return;
    setStillsBusy(true);
    try {
      const canon = ORIENTATION_DIMS[project.orientation];
      const renderer = new FilmRenderer(project);
      await renderer.preload();
      const canvas = document.createElement('canvas');
      canvas.width = canon.w;
      canvas.height = canon.h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      for (let i = 0; i < project.slides.length; i++) {
        drawSlide(ctx, project.slides[i], canon.w, canon.h, { localMs: 100_000 });
        const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
        if (!blob) continue;
        await saveFile(blob, `${filename(project.title, 'png').replace(/\.png$/, '')}_${String(i + 1).padStart(2, '0')}.png`);
        await new Promise((r) => setTimeout(r, 220));
      }
    } finally {
      setStillsBusy(false);
    }
  }

  return (
    <Page className="min-h-[100dvh] bg-paper">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-6">
          <button
            onClick={() => nav(`/film/${id}`)}
            className="grid h-9 w-9 place-items-center rounded-lg text-ink-2 transition-colors hover:bg-ink/[0.06]"
            aria-label={t('back')}
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </button>
          <div>
            <p className="label">{t('exportTitle')}</p>
            <h1 className="truncate font-display text-[17px] leading-tight text-ink">{project.title}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {status === 'idle' && (
          <>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line pb-6">
              <Fact icon={<Layers className="h-3.5 w-3.5" />}>{f.slidesCount(lang, project.slides.length)}</Fact>
              <Fact icon={<Clock className="h-3.5 w-3.5" />}>{f.duration(lang, duration)}</Fact>
              <Fact icon={<Film className="h-3.5 w-3.5" />}>
                {project.orientation === 'portrait' ? '9:16' : '16:9'}
              </Fact>
              {project.musicName && <Fact icon={<Music2 className="h-3.5 w-3.5" />}>{project.musicName}</Fact>}
            </div>

            <Label className="mt-8 block">{t('exportQuality')}</Label>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
              {PRESETS.map((p) => {
                const selected = preset === p.key;
                const dims = ORIENTATION_DIMS[project.orientation];
                const w = Math.round(dims.w * p.scale);
                const h = Math.round(dims.h * p.scale);
                const mb = (p.bitrate * duration) / 8 / 1_000_000;
                return (
                  <button
                    key={p.key}
                    onClick={() => setPreset(p.key)}
                    aria-pressed={selected}
                    className={`relative rounded-xl border-2 p-4 text-left transition-colors duration-150 ${
                      selected ? 'border-ink bg-card' : 'border-line bg-card/50 hover:border-ink/25'
                    }`}
                  >
                    <span
                      className={`absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full border transition-colors ${
                        selected ? 'border-ink bg-ink text-paper' : 'border-line'
                      }`}
                      aria-hidden
                    >
                      {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <span className="block text-[19px] font-bold leading-none tracking-tight text-ink">{t(p.label)}</span>
                    {p.recommended && (
                      <span className="mt-2 block text-[10px] uppercase tracking-label text-gold-deep">
                        {t('recommended')}
                      </span>
                    )}
                    <p className="mt-2 text-[12px] leading-snug text-ink-3">{t(p.desc)}</p>
                    <p className="mt-2 text-[11.5px] font-medium tabular-nums text-ink-3/80">
                      {w}×{h} · ~{mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB
                    </p>
                  </button>
                );
              })}
            </div>

            {heavy && (
              <p className="mt-3 flex gap-2.5 rounded-lg border border-gold/30 bg-gold-wash/60 px-3.5 py-3 text-[12px] leading-relaxed text-gold-deep">
                <AlertCircle className="mt-px h-4 w-4 shrink-0" />
                {t('exportHeavyWarning')}
              </p>
            )}

            <div className="mt-8 space-y-2.5">
              <Button size="lg" className="w-full" onClick={run}>
                <Film className="h-[18px] w-[18px]" /> {t('exportStart')}
              </Button>
              <Button size="lg" variant="outline" className="w-full" onClick={exportStills} disabled={stillsBusy}>
                {stillsBusy ? <Spinner size={17} /> : <Images className="h-[18px] w-[18px]" />} {t('exportStills')}
              </Button>
            </div>

            <ul className="mt-7 space-y-2 border-t border-line pt-6 text-[12.5px] leading-relaxed text-ink-3">
              <li className="flex gap-2.5">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-gold" />
                {frameAccurate ? t('exportNoteFast') : t('exportNoteSlow')}
              </li>
              {project.musicPath && (
                <li className="flex gap-2.5">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-gold" />
                  {t('exportNoteAudio')}
                </li>
              )}
            </ul>
          </>
        )}

        {status === 'working' && (
          <div className="flex flex-col items-center py-20">
            <div className="relative h-36 w-36">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#E3DCD0" strokeWidth="2" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#A6813C"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 45}
                  strokeDashoffset={2 * Math.PI * 45 * (1 - progress)}
                  style={{ transition: 'stroke-dashoffset 0.2s linear' }}
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <span className="text-[32px] font-bold tabular-nums tracking-tight text-ink">{Math.round(progress * 100)}<span className="text-[16px] text-ink-3">%</span></span>
              </div>
            </div>
            <p className="mt-7 font-display text-[19px] text-ink">{t(PHASE_KEY[phase])}</p>
            <p className="mt-1.5 text-[12.5px] text-ink-3">
              {frameAccurate ? t('exportNoteFast') : t('exportNoteSlow')}
            </p>
            <Button
              variant="quiet"
              className="mt-8"
              onClick={() => {
                cancel.current.cancelled = true;
              }}
            >
              {t('exportCancel')}
            </Button>
          </div>
        )}

        {status === 'done' && result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-gold/40 text-gold">
              <Check className="h-5 w-5" />
            </span>
            <h2 className="mt-5 font-display text-[28px] text-ink">{t('exportDone')}</h2>
            <p className="mt-2 text-[13px] text-ink-3">{t('exportDoneSub')}</p>

            {resultUrl && (
              <video
                src={resultUrl}
                poster={result.poster}
                controls
                playsInline
                className="mt-7 w-full max-w-xl rounded-[3px] border border-line bg-black shadow-card"
                style={{ aspectRatio: project.orientation === 'portrait' ? '9/16' : '16/9' }}
              />
            )}

            <div className="mt-7 flex w-full max-w-sm flex-col gap-2.5 sm:max-w-xl sm:flex-row">
              <Button
                size="lg"
                className="flex-1"
                onClick={() => saveFile(result.blob, filename(project.title, result.ext), project.title)}
              >
                <Download className="h-[18px] w-[18px]" /> {t('exportSave')}
              </Button>
              <Button size="lg" variant="outline" className="flex-1" onClick={() => setStatus('idle')}>
                {t('exportAgain')}
              </Button>
            </div>

            <div className="mt-5 space-y-1 text-[11.5px] text-ink-3">
              <p>
                {result.ext.toUpperCase()} · {(result.blob.size / 1_048_576).toFixed(1)} MB
              </p>
              {result.ext === 'webm' && <p>{t('exportWebmNote')}</p>}
              {project.musicPath && !result.hasAudio && <p className="text-clay">{t('exportNoAudioNote')}</p>}
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center py-20 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-clay/40 text-clay">
              <AlertCircle className="h-5 w-5" />
            </span>
            <h2 className="mt-5 font-display text-[22px] text-ink">{t('exportFailed')}</h2>
            <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-ink-3">{error}</p>
            <Button className="mt-7" onClick={() => setStatus('idle')}>
              {t('tryAgain')}
            </Button>
          </div>
        )}
      </main>
    </Page>
  );
}

function Fact({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[12.5px] text-ink-2">
      <span className="text-ink-3">{icon}</span>
      {children}
    </span>
  );
}

function filename(title: string, ext: string): string {
  const base = title.replace(/[^\p{L}\p{N}_-]+/gu, '_').replace(/^_+|_+$/g, '').slice(0, 48);
  return `${base || 'film'}.${ext}`;
}
