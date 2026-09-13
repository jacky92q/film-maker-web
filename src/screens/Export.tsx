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
    <Page className="room min-h-[100dvh] bg-screen">
      <header className="border-b border-hair bg-surface">
        <div className="mx-auto flex h-[72px] max-w-3xl items-center gap-3 px-6">
          <button
            onClick={() => nav(`/film/${id}`)}
            className="-ml-2 grid h-10 w-10 shrink-0 place-items-center rounded-full text-text-2 transition-colors hover:bg-white/[0.07] hover:text-text"
            aria-label={t('back')}
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </button>
          <div className="min-w-0">
            <p className="label">{t('exportTitle')}</p>
            <h1 className="mt-1 truncate font-display text-[19px] leading-none text-text">{project.title}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {status === 'idle' && (
          <>
            <div className="flex flex-wrap items-center gap-x-7 gap-y-3 border-b border-hair pb-7">
              <Fact icon={<Layers className="h-3.5 w-3.5" />}>{f.slidesCount(lang, project.slides.length)}</Fact>
              <Fact icon={<Clock className="h-3.5 w-3.5" />}>{f.duration(lang, duration)}</Fact>
              <Fact icon={<Film className="h-3.5 w-3.5" />}>
                {project.orientation === 'portrait' ? '9:16' : '16:9'}
              </Fact>
              {project.musicName && <Fact icon={<Music2 className="h-3.5 w-3.5" />}>{project.musicName}</Fact>}
            </div>

            <Label className="mt-10 block">{t('exportQuality')}</Label>
            <div className="mt-4 space-y-2.5">
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
                    className={`relative flex w-full items-center gap-4 overflow-hidden rounded-[12px] border p-5 text-left transition-all duration-250 ${
                      selected
                        ? 'border-gold/55 bg-gold/[0.07]'
                        : 'border-hair bg-surface hover:border-hair-2'
                    }`}
                  >
                    {/* A lit edge marks the choice without shouting. */}
                    <span
                      className={`absolute inset-y-0 left-0 w-[3px] transition-colors duration-250 ${
                        selected ? 'bg-gold' : 'bg-transparent'
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-[21px] font-bold leading-none tracking-tight ${
                          selected ? 'text-gold' : 'text-text'
                        }`}
                      >
                        {t(p.label)}
                        {p.recommended && (
                          <span className="ml-3 align-middle text-[10px] font-semibold uppercase tracking-label text-gold/70">
                            {t('recommended')}
                          </span>
                        )}
                      </span>
                      <span className="mt-2 block text-[12.5px] text-text-2">{t(p.desc)}</span>
                      <span className="mt-1.5 block text-[11.5px] font-medium tabular-nums text-text-3">
                        {w}×{h} · ~{mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB
                      </span>
                    </span>
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors duration-250 ${
                        selected ? 'border-gold bg-gold text-[#17120E]' : 'border-hair-2'
                      }`}
                      aria-hidden
                    >
                      {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}
            </div>

            {heavy && (
              <p className="mt-4 flex gap-3 rounded-[10px] border border-gold/25 bg-gold/[0.06] px-4 py-3.5 text-[12px] leading-relaxed text-gold/90">
                <AlertCircle className="mt-px h-4 w-4 shrink-0" />
                {t('exportHeavyWarning')}
              </p>
            )}

            <div className="mt-10 space-y-2.5">
              <Button size="lg" className="w-full" onClick={run}>
                <Film className="h-[18px] w-[18px]" /> {t('exportStart')}
              </Button>
              <Button size="lg" variant="outline" className="w-full" onClick={exportStills} disabled={stillsBusy}>
                {stillsBusy ? <Spinner size={17} /> : <Images className="h-[18px] w-[18px]" />} {t('exportStills')}
              </Button>
            </div>

            <ul className="mt-10 space-y-3 border-t border-hair pt-8 text-[12.5px] leading-relaxed text-text-3">
              <li className="flex gap-3">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-gold/70" />
                {frameAccurate ? t('exportNoteFast') : t('exportNoteSlow')}
              </li>
              {project.musicPath && (
                <li className="flex gap-3">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-gold/70" />
                  {t('exportNoteAudio')}
                </li>
              )}
            </ul>
          </>
        )}

        {status === 'working' && (
          <div className="flex flex-col items-center py-24">
            <div className="relative h-40 w-40">
              {/* The ring glows as it fills — the room's one light source. */}
              <span
                className="absolute inset-4 rounded-full blur-2xl transition-opacity duration-500"
                style={{ background: 'rgba(232,192,138,0.28)', opacity: 0.25 + progress * 0.6 }}
              />
              <svg viewBox="0 0 100 100" className="relative h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#2B2523" strokeWidth="1.5" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#E8C08A"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 45}
                  strokeDashoffset={2 * Math.PI * 45 * (1 - progress)}
                  style={{ transition: 'stroke-dashoffset 0.25s linear' }}
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <span className="text-[34px] font-bold tabular-nums tracking-tight text-text">
                  {Math.round(progress * 100)}
                  <span className="text-[16px] text-text-3">%</span>
                </span>
              </div>
            </div>
            <p className="mt-9 font-display text-[21px] text-text">{t(PHASE_KEY[phase])}</p>
            <p className="mt-2.5 max-w-sm text-center text-[12.5px] leading-relaxed text-text-3">
              {frameAccurate ? t('exportNoteFast') : t('exportNoteSlow')}
            </p>
            <Button
              variant="quiet"
              className="mt-9"
              onClick={() => {
                cancel.current.cancelled = true;
              }}
            >
              {t('exportCancel')}
            </Button>
          </div>
        )}

        {status === 'done' && result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center text-center"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full border border-gold/45 text-gold shadow-glow">
              <Check className="h-5 w-5" />
            </span>
            <h2 className="mt-6 font-display text-[32px] leading-tight text-text">{t('exportDone')}</h2>
            <p className="mt-2.5 text-[13px] text-text-3">{t('exportDoneSub')}</p>

            {resultUrl && (
              <video
                src={resultUrl}
                poster={result.poster}
                controls
                playsInline
                className="mt-8 w-full max-w-xl rounded-[6px] bg-black ring-1 ring-hair-2"
                style={{ aspectRatio: project.orientation === 'portrait' ? '9/16' : '16/9' }}
              />
            )}

            <div className="mt-8 flex w-full max-w-sm flex-col gap-2.5 sm:max-w-xl sm:flex-row">
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

            <div className="mt-6 space-y-1.5 text-[11.5px] leading-relaxed text-text-3">
              <p className="font-medium tabular-nums">
                {result.ext.toUpperCase()} · {(result.blob.size / 1_048_576).toFixed(1)} MB
              </p>
              {result.ext === 'webm' && <p>{t('exportWebmNote')}</p>}
              {project.musicPath && !result.hasAudio && <p className="text-clay">{t('exportNoAudioNote')}</p>}
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center py-24 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full border border-clay/45 text-clay">
              <AlertCircle className="h-5 w-5" />
            </span>
            <h2 className="mt-6 font-display text-[24px] text-text">{t('exportFailed')}</h2>
            <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-text-3">{error}</p>
            <Button className="mt-8" onClick={() => setStatus('idle')}>
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
    <span className="inline-flex items-center gap-2.5 text-[12.5px] text-text-2">
      <span className="text-gold/70">{icon}</span>
      {children}
    </span>
  );
}

function filename(title: string, ext: string): string {
  const base = title.replace(/[^\p{L}\p{N}_-]+/gu, '_').replace(/^_+|_+$/g, '').slice(0, 48);
  return `${base || 'film'}.${ext}`;
}
