import { useEffect, useRef, useState } from 'react';
import { Music2, Pause, Play, Trash2, Upload } from 'lucide-react';
import { useEditor } from '../store/editor';
import { useT } from '../i18n';
import { totalDuration, musicSettings } from '../domain/models';
import { loadTrack, pickAudio, SAMPLE_TRACK_PATH } from '../audio/store';
import { MusicPlayer } from '../audio/player';
import { Section, Slider, ToolButton } from './controls';
import { Spinner } from './ui';

function mmss(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function MusicPanel() {
  const { t, f, lang } = useT();
  const project = useEditor((s) => s.project);
  const setMusic = useEditor((s) => s.setMusic);
  const setMusicSettings = useEditor((s) => s.setMusicSettings);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [trackSeconds, setTrackSeconds] = useState(0);
  const [auditioning, setAuditioning] = useState(false);
  const player = useRef<MusicPlayer | null>(null);

  const path = project?.musicPath ?? null;
  const filmSeconds = project ? totalDuration(project) : 0;

  // Stop any audition when the panel goes away or the track changes.
  useEffect(() => {
    return () => {
      player.current?.dispose();
      player.current = null;
    };
  }, []);

  useEffect(() => {
    setAuditioning(false);
    player.current?.dispose();
    player.current = null;
    if (!path) {
      setTrackSeconds(0);
      return;
    }
    let live = true;
    setBusy(true);
    void loadTrack(path).then((buffer) => {
      if (!live) return;
      setBusy(false);
      setTrackSeconds(buffer?.duration ?? 0);
    });
    return () => {
      live = false;
    };
  }, [path]);

  if (!project) return null;
  const settings = musicSettings(project);

  async function audition() {
    if (!project || !path) return;
    if (auditioning) {
      player.current?.pause();
      setAuditioning(false);
      return;
    }
    if (!player.current) {
      player.current = new MusicPlayer(settings, Math.max(filmSeconds, 1));
      const ok = await player.current.load(path);
      if (!ok) {
        setError(t('musicUploadFailed'));
        return;
      }
    }
    player.current.update(settings, Math.max(filmSeconds, 1));
    player.current.play(settings.fadeIn);
    setAuditioning(true);
  }

  async function chooseFile() {
    setError('');
    setBusy(true);
    const picked = await pickAudio();
    setBusy(false);
    if (!picked) {
      setError(t('musicUploadFailed'));
      return;
    }
    setMusic(picked.name, picked.path);
  }

  const repeats = trackSeconds > 0 ? Math.max(1, Math.ceil(filmSeconds / trackSeconds)) : 0;

  return (
    <div>
      <p className="mb-5 text-[12.5px] leading-relaxed text-ink-3">{t('musicIntro')}</p>

      <Section title={t('musicTitle')}>
        <div className="space-y-2">
          <TrackOption
            selected={path === SAMPLE_TRACK_PATH}
            title={t('musicSampleName')}
            note={t('musicSample')}
            desc={t('musicSampleDesc')}
            onClick={() => setMusic(t('musicSampleName'), SAMPLE_TRACK_PATH)}
          />
          <TrackOption
            selected={!!path && path !== SAMPLE_TRACK_PATH}
            title={path && path !== SAMPLE_TRACK_PATH ? (project.musicName ?? t('musicUpload')) : t('musicUpload')}
            note={t('musicOwnFile')}
            desc={t('musicUploadHint')}
            icon={<Upload className="h-4 w-4" strokeWidth={1.6} />}
            onClick={chooseFile}
          />
        </div>
        {error && <p className="mt-3 text-[12px] text-clay">{error}</p>}
      </Section>

      {path && (
        <>
          <div className="mb-6 rounded-xl border border-line bg-paper px-4 py-3.5">
            <div className="flex items-center gap-3">
              <button
                onClick={audition}
                disabled={busy}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-paper transition-transform duration-150 hover:scale-[1.04] disabled:opacity-40"
                aria-label={auditioning ? t('musicStop') : t('musicPreview')}
              >
                {busy ? <Spinner size={15} /> : auditioning ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold text-ink">{project.musicName}</p>
                <p className="mt-0.5 text-[11.5px] text-ink-3">
                  {busy ? t('musicLoading') : `${t('musicLength')} ${mmss(trackSeconds)} · ${t('musicFilmLength')} ${mmss(filmSeconds)}`}
                </p>
              </div>
              <button
                onClick={() => setMusic(null, null)}
                title={t('musicNone')}
                aria-label={t('musicNone')}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-clay/10 hover:text-clay"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {repeats > 1 && (
              <p className="mt-3 flex items-center gap-1.5 border-t border-line-soft pt-3 text-[11.5px] text-gold-deep">
                <Music2 className="h-3.5 w-3.5" />
                {t('musicLoops')} · {f.loopCount(lang, repeats)}
              </p>
            )}
          </div>

          <Section title={t('musicVolume')}>
            <Slider
              value={settings.volume}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => setMusicSettings({ musicVolume: v })}
              onCommit={() => player.current?.update(musicSettings(project), Math.max(filmSeconds, 1))}
              label={`${Math.round(settings.volume * 100)}%`}
            />
          </Section>
          <Section title={t('musicFadeIn')}>
            <Slider
              value={settings.fadeIn}
              min={0}
              max={6}
              step={0.1}
              onChange={(v) => setMusicSettings({ musicFadeIn: v })}
              label={`${settings.fadeIn.toFixed(1)}s`}
            />
          </Section>
          <Section title={t('musicFadeOut')}>
            <Slider
              value={settings.fadeOut}
              min={0}
              max={8}
              step={0.1}
              onChange={(v) => setMusicSettings({ musicFadeOut: v })}
              label={`${settings.fadeOut.toFixed(1)}s`}
            />
          </Section>

          <ToolButton onClick={() => setMusic(null, null)} danger>
            <Trash2 className="h-3.5 w-3.5" /> {t('musicNone')}
          </ToolButton>
        </>
      )}
    </div>
  );
}

function TrackOption({
  selected,
  title,
  note,
  desc,
  icon,
  onClick,
}: {
  selected: boolean;
  title: string;
  note: string;
  desc: string;
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors duration-150 ${
        selected ? 'border-ink bg-paper' : 'border-line bg-card hover:border-ink/25'
      }`}
    >
      <span
        className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
          selected ? 'bg-ink text-paper' : 'bg-paper-2 text-ink-3'
        }`}
      >
        {icon ?? <Music2 className="h-4 w-4" strokeWidth={1.6} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="label block">{note}</span>
        <span className="mt-1 block truncate text-[13.5px] font-semibold text-ink">{title}</span>
        <span className="mt-1 block text-[11.5px] leading-snug text-ink-3">{desc}</span>
      </span>
    </button>
  );
}
