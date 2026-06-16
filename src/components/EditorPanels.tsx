import { useState } from 'react';
import {
  Crop, FlipHorizontal, FlipVertical, Trash2, ArrowUpToLine, ArrowDownToLine,
  ImagePlus, RotateCw, Plus, Music2,
} from 'lucide-react';
import { useEditor } from '../store/editor';
import { useT } from '../i18n';
import { useEnumLabel } from '../i18n/enumLabels';
import { pickImage } from '../lib/imagePick';
import {
  TRANSITIONS, DIM_DIRECTIONS, PHOTO_FILTERS, OVERLAYS, SLIDE_FRAMES, AMBIENT_EFFECTS,
  PHOTO_SHAPES, PHOTO_FRAMES, FONT_STYLES, TEXT_BGS, TEXT_ANIMATIONS, PHOTO_ANIMATIONS,
  type SlideTextColor,
} from '../domain/enums';
import { Section, Slider, ChipRow, ColorRow, Segmented, IconBtn, PanelEmpty } from './controls';
import type { Slide, TextLayer, PhotoLayer, StickerLayer } from '../domain/models';

function Tabs({ tabs, active, onChange }: { tabs: string[]; active: number; onChange: (i: number) => void }) {
  return (
    <div className="mb-4 flex gap-1 rounded-xl bg-dark-surface-2 p-1">
      {tabs.map((tName, i) => (
        <button
          key={tName}
          onClick={() => onChange(i)}
          className={`flex-1 rounded-lg py-1.5 text-[12px] font-bold transition-all ${active === i ? 'bg-gold text-black' : 'text-dark-text'}`}
        >
          {tName}
        </button>
      ))}
    </div>
  );
}

/* ---------------- SLIDE ---------------- */
export function SlidePanel({ slide }: { slide: Slide }) {
  const { t } = useT();
  const el = useEnumLabel();
  const patch = useEditor((s) => s.patchSlide);
  const [tab, setTab] = useState(0);

  return (
    <div>
      <Tabs tabs={[t('tabCanvas'), t('tabStyle'), t('tabTiming')]} active={tab} onChange={setTab} />
      {tab === 0 && (
        <>
          <Section title={t('secBackground')}>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={slide.backgroundColor}
                onChange={(e) => patch({ backgroundColor: e.target.value }, false)}
                onBlur={() => patch({}, true)}
                className="h-10 w-16 cursor-pointer rounded-lg bg-transparent"
              />
              <BgPhotoButtons slide={slide} />
            </div>
          </Section>
          <Section title={t('secDim')}>
            <ChipRow options={DIM_DIRECTIONS} value={slide.dimDirection} onChange={(v) => patch({ dimDirection: v })} label={(v) => el('dim', v)} />
            {slide.dimDirection !== 'none' && (
              <div className="mt-2">
                <Slider value={slide.dimOpacity} min={0} max={1} step={0.05} onChange={(v) => patch({ dimOpacity: v }, false)} onCommit={() => patch({}, true)} label={`${Math.round(slide.dimOpacity * 100)}%`} />
              </div>
            )}
          </Section>
          {slide.imagePath && (
            <Section title={t('secPhotoZoom')} right={<button className="text-[11px] text-gold" onClick={() => patch({ photoScale: 1, photoOffsetX: 0, photoOffsetY: 0 })}>{t('reset')}</button>}>
              <Slider value={slide.photoScale} min={0.5} max={4} step={0.05} onChange={(v) => patch({ photoScale: v }, false)} onCommit={() => patch({}, true)} label={`${slide.photoScale.toFixed(1)}×`} />
            </Section>
          )}
        </>
      )}
      {tab === 1 && (
        <>
          <Section title={t('secFilter')}>
            <ChipRow options={PHOTO_FILTERS} value={slide.photoFilter} onChange={(v) => patch({ photoFilter: v })} label={(v) => el('filter', v)} />
          </Section>
          <Section title={t('secOverlay')}>
            <ChipRow options={OVERLAYS} value={slide.overlay} onChange={(v) => patch({ overlay: v })} label={(v) => el('overlay', v)} />
          </Section>
          <Section title={t('secFrameStyle')}>
            <ChipRow options={SLIDE_FRAMES} value={slide.frame} onChange={(v) => patch({ frame: v })} label={(v) => el('frame', v)} />
            {slide.frame !== 'none' && (
              <div className="mt-2">
                <ColorRow value={slide.frameColor} custom={slide.customFrameColor} onPreset={(c) => patch({ frameColor: c, customFrameColor: null })} onCustom={(hex) => patch({ customFrameColor: hex })} />
              </div>
            )}
          </Section>
          <Section title={t('secAmbient')}>
            <ChipRow options={AMBIENT_EFFECTS} value={slide.ambientEffect} onChange={(v) => patch({ ambientEffect: v })} label={(v) => el('ambient', v)} />
          </Section>
        </>
      )}
      {tab === 2 && (
        <>
          <Section title={t('secTransition')}>
            <ChipRow options={TRANSITIONS} value={slide.transition} onChange={(v) => patch({ transition: v })} label={(v) => el('transition', v)} />
          </Section>
          <Section title={t('secDuration')}>
            <Slider value={slide.durationSeconds} min={2} max={10} step={1} onChange={(v) => patch({ durationSeconds: v }, false)} onCommit={() => patch({}, true)} label={`${slide.durationSeconds}s`} />
          </Section>
        </>
      )}
    </div>
  );
}

function BgPhotoButtons({ slide }: { slide: Slide }) {
  const { t } = useT();
  const setBg = useEditor((s) => s.setBackgroundPhoto);
  const removeBg = useEditor((s) => s.removeBackgroundPhoto);
  return (
    <div className="flex flex-wrap gap-2">
      <IconBtn onClick={async () => { const p = await pickImage(); if (p) setBg(p); }}>
        <ImagePlus className="h-4 w-4" /> {slide.imagePath ? t('replacePhoto') : t('backgroundPhoto')}
      </IconBtn>
      {slide.imagePath && <IconBtn danger onClick={removeBg}><Trash2 className="h-4 w-4" /></IconBtn>}
    </div>
  );
}

/* ---------------- PHOTO ---------------- */
export function PhotoPanel({ layer }: { layer: PhotoLayer }) {
  const { t } = useT();
  const el = useEnumLabel();
  const patch = useEditor((s) => s.patchPhoto);
  const setCrop = useEditor((s) => s.setCropMode);
  const cropMode = useEditor((s) => s.cropMode);
  const front = useEditor((s) => s.bringToFront);
  const back = useEditor((s) => s.sendToBack);
  const del = useEditor((s) => s.deleteLayer);
  const [tab, setTab] = useState(0);

  return (
    <div>
      <Tabs tabs={[t('tabAdjust'), t('tabStyle'), t('tabMotion')]} active={tab} onChange={setTab} />
      {tab === 0 && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <IconBtn onClick={front}><ArrowUpToLine className="h-4 w-4" /></IconBtn>
            <IconBtn onClick={back}><ArrowDownToLine className="h-4 w-4" /></IconBtn>
            <IconBtn active={cropMode} onClick={() => setCrop(!cropMode)}><Crop className="h-4 w-4" /> {t('crop')}</IconBtn>
            <IconBtn onClick={async () => { const p = await pickImage(); if (p) patch(layer.id, { imagePath: p }); }}><ImagePlus className="h-4 w-4" /> {t('changePhoto')}</IconBtn>
          </div>
          {cropMode ? (
            <Section title={t('zoom')} right={<button className="text-[11px] text-gold" onClick={() => patch(layer.id, { cropScale: 1, cropOffsetX: 0, cropOffsetY: 0 })}>{t('reset')}</button>}>
              <Slider value={layer.cropScale} min={1} max={4} step={0.05} onChange={(v) => patch(layer.id, { cropScale: v }, false)} onCommit={() => patch(layer.id, {}, true)} label={`${layer.cropScale.toFixed(1)}×`} />
            </Section>
          ) : (
            <>
              <Section title={t('secWidth')}>
                <Slider value={layer.widthFraction} min={0.1} max={1} step={0.01} onChange={(v) => patch(layer.id, { widthFraction: v }, false)} onCommit={() => patch(layer.id, {}, true)} label={`${Math.round(layer.widthFraction * 100)}%`} />
              </Section>
              <Section title={t('secHeight')}>
                <Slider value={layer.heightFraction} min={0.1} max={1} step={0.01} onChange={(v) => patch(layer.id, { heightFraction: v }, false)} onCommit={() => patch(layer.id, {}, true)} label={`${Math.round(layer.heightFraction * 100)}%`} />
              </Section>
              <Section title={t('secRotation')}>
                <Slider value={layer.rotation} min={-180} max={180} step={1} onChange={(v) => patch(layer.id, { rotation: v }, false)} onCommit={() => patch(layer.id, {}, true)} label={`${Math.round(layer.rotation)}°`} />
              </Section>
              <div className="mb-4 flex gap-2">
                <IconBtn onClick={() => patch(layer.id, { x: 0.5 })}><FlipHorizontal className="h-4 w-4" /> {t('alignCenterH')}</IconBtn>
                <IconBtn onClick={() => patch(layer.id, { y: 0.5 })}><FlipVertical className="h-4 w-4" /> {t('alignCenterV')}</IconBtn>
              </div>
            </>
          )}
          <IconBtn danger onClick={del}><Trash2 className="h-4 w-4" /> {t('deleteLayer')}</IconBtn>
        </>
      )}
      {tab === 1 && (
        <>
          <Section title={t('secPhotoShape')}><ChipRow options={PHOTO_SHAPES} value={layer.shape} onChange={(v) => patch(layer.id, { shape: v })} label={(v) => el('shape', v)} /></Section>
          <Section title={t('secPhotoFrame')}><ChipRow options={PHOTO_FRAMES} value={layer.frame} onChange={(v) => patch(layer.id, { frame: v })} label={(v) => el('photoFrame', v)} /></Section>
          <Section title={t('secFilter')}><ChipRow options={PHOTO_FILTERS} value={layer.filter} onChange={(v) => patch(layer.id, { filter: v })} label={(v) => el('filter', v)} /></Section>
        </>
      )}
      {tab === 2 && (
        <Section title={t('secAnimation')}>
          <ChipRow options={PHOTO_ANIMATIONS} value={layer.contentAnimation} onChange={(v) => patch(layer.id, { contentAnimation: v })} label={(v) => el('anim', v)} />
        </Section>
      )}
    </div>
  );
}

/* ---------------- TEXT ---------------- */
export function TextPanel({ layer }: { layer: TextLayer }) {
  const { t } = useT();
  const el = useEnumLabel();
  const patch = useEditor((s) => s.patchText);
  const front = useEditor((s) => s.bringToFront);
  const back = useEditor((s) => s.sendToBack);
  const del = useEditor((s) => s.deleteLayer);
  const [tab, setTab] = useState(0);

  return (
    <div>
      <Tabs tabs={[t('tabText'), t('tabStyle'), t('tabMotion')]} active={tab} onChange={setTab} />
      {tab === 0 && (
        <>
          <textarea
            value={layer.text}
            onChange={(e) => patch(layer.id, { text: e.target.value }, false)}
            onBlur={() => patch(layer.id, {}, true)}
            rows={2}
            placeholder={t('enterText')}
            className="mb-4 w-full resize-none rounded-xl border border-dark-line bg-dark-surface-2 p-3 text-cream outline-none focus:border-gold"
          />
          <Section title={t('secType')}>
            <Segmented
              value={layer.isSubtitle ? 'sub' : 'main'}
              onChange={(v) => patch(layer.id, { isSubtitle: v === 'sub' })}
              options={[{ value: 'main', label: t('typeMain') }, { value: 'sub', label: t('typeSubtitle') }]}
            />
          </Section>
          <div className="mb-4 flex gap-2">
            <IconBtn onClick={front}><ArrowUpToLine className="h-4 w-4" /></IconBtn>
            <IconBtn onClick={back}><ArrowDownToLine className="h-4 w-4" /></IconBtn>
          </div>
          <IconBtn danger onClick={del}><Trash2 className="h-4 w-4" /> {t('deleteLayer')}</IconBtn>
        </>
      )}
      {tab === 1 && (
        <>
          <Section title={t('secFont')}><ChipRow options={FONT_STYLES} value={layer.fontStyle} onChange={(v) => patch(layer.id, { fontStyle: v })} label={(v) => el('font', v)} /></Section>
          <Section title={t('secSize')}>
            <Slider value={layer.fontSize} min={12} max={300} step={1} onChange={(v) => patch(layer.id, { fontSize: v }, false)} onCommit={() => patch(layer.id, {}, true)} label={`${Math.round(layer.fontSize)}px`} />
          </Section>
          <Section title={t('secTextColor')}>
            <ColorRow value={layer.color} custom={layer.customColor} onPreset={(c) => patch(layer.id, { color: c, customColor: null })} onCustom={(hex) => patch(layer.id, { customColor: hex })} />
          </Section>
          {layer.isSubtitle && (
            <Section title={t('secBarColor')}>
              <ColorRow value={layer.barColor} custom={layer.customBarColor} onPreset={(c: SlideTextColor) => patch(layer.id, { barColor: c, customBarColor: null })} onCustom={(hex) => patch(layer.id, { customBarColor: hex })} />
            </Section>
          )}
          <Section title={t('secTextBg')}><ChipRow options={TEXT_BGS} value={layer.textBg} onChange={(v) => patch(layer.id, { textBg: v })} label={(v) => el('textBg', v)} /></Section>
          <Section title={t('secOutline')}>
            <Segmented value={String(layer.strokeWidth)} onChange={(v) => patch(layer.id, { strokeWidth: Number(v) })} options={[{ value: '0', label: 'Off' }, { value: '1', label: 'Thin' }, { value: '2', label: 'Med' }, { value: '3', label: 'Bold' }]} />
          </Section>
          <Section title={t('secShadow')}>
            <Segmented value={layer.shadowLevel} onChange={(v) => patch(layer.id, { shadowLevel: v as TextLayer['shadowLevel'] })} options={[{ value: 'none', label: 'None' }, { value: 'soft', label: 'Soft' }, { value: 'medium', label: 'Med' }, { value: 'strong', label: 'Strong' }]} />
          </Section>
          <Section title={t('secSpacing')}>
            <Segmented value={String(layer.letterSpacing)} onChange={(v) => patch(layer.id, { letterSpacing: Number(v) })} options={[{ value: '0', label: 'A' }, { value: '1', label: 'A·' }, { value: '3', label: 'A··' }, { value: '6', label: 'A···' }]} />
          </Section>
          <Section title={t('secRotation')}>
            <Slider value={layer.rotation} min={-180} max={180} step={1} onChange={(v) => patch(layer.id, { rotation: v }, false)} onCommit={() => patch(layer.id, {}, true)} label={`${Math.round(layer.rotation)}°`} />
          </Section>
          <div className="flex gap-2">
            <IconBtn onClick={() => patch(layer.id, { x: 0.5 })}><FlipHorizontal className="h-4 w-4" /> {t('alignCenterH')}</IconBtn>
            <IconBtn onClick={() => patch(layer.id, { y: 0.5 })}><FlipVertical className="h-4 w-4" /> {t('alignCenterV')}</IconBtn>
          </div>
        </>
      )}
      {tab === 2 && (
        <Section title={t('secAnimation')}>
          <ChipRow options={TEXT_ANIMATIONS} value={layer.contentAnimation} onChange={(v) => patch(layer.id, { contentAnimation: v })} label={(v) => el('anim', v)} />
        </Section>
      )}
    </div>
  );
}

/* ---------------- STICKER ---------------- */
export function StickerPanel({ layer }: { layer: StickerLayer }) {
  const { t } = useT();
  const patch = useEditor((s) => s.patchSticker);
  const front = useEditor((s) => s.bringToFront);
  const back = useEditor((s) => s.sendToBack);
  const del = useEditor((s) => s.deleteLayer);
  return (
    <div>
      <Section title={t('secSize')}>
        <Slider value={layer.widthFraction} min={0.04} max={1.2} step={0.01} onChange={(v) => patch(layer.id, { widthFraction: v }, false)} onCommit={() => patch(layer.id, {}, true)} label={`${Math.round(layer.widthFraction * 100)}%`} />
      </Section>
      <Section title={t('secRotation')}>
        <Slider value={layer.rotation} min={-180} max={180} step={1} onChange={(v) => patch(layer.id, { rotation: v }, false)} onCommit={() => patch(layer.id, {}, true)} label={`${Math.round(layer.rotation)}°`} />
      </Section>
      <Section title={t('secOpacity')}>
        <Slider value={layer.opacity} min={0} max={1} step={0.05} onChange={(v) => patch(layer.id, { opacity: v }, false)} onCommit={() => patch(layer.id, {}, true)} label={`${Math.round(layer.opacity * 100)}%`} />
      </Section>
      <div className="mb-4 flex gap-2">
        <IconBtn onClick={front}><ArrowUpToLine className="h-4 w-4" /></IconBtn>
        <IconBtn onClick={back}><ArrowDownToLine className="h-4 w-4" /></IconBtn>
      </div>
      <IconBtn danger onClick={del}><Trash2 className="h-4 w-4" /> {t('deleteLayer')}</IconBtn>
    </div>
  );
}

/* ---------------- MUSIC ---------------- */
const MOODS = ['Romantic', 'Cinematic', 'Upbeat', 'Nostalgic', 'Acoustic', 'Dreamy'];
export function MusicPanel() {
  const { t } = useT();
  const project = useEditor((s) => s.project);
  const setMusic = useEditor((s) => s.setMusic);
  return (
    <div>
      <Section title={t('tabMusic')}>
        <p className="mb-3 text-[12px] text-dark-text/70">{t('tip2')}</p>
        <div className="grid grid-cols-2 gap-2">
          {MOODS.map((m) => (
            <button
              key={m}
              onClick={() => setMusic(m, `mood:${m}`)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold ${project?.musicName === m ? 'bg-gold text-black' : 'bg-dark-surface-2 text-dark-text'}`}
            >
              <Music2 className="h-4 w-4" /> {m}
            </button>
          ))}
        </div>
        {project?.musicName && (
          <button onClick={() => setMusic(null, null)} className="mt-3 text-[12px] text-danger">{t('removePhoto')}</button>
        )}
      </Section>
    </div>
  );
}

/* ---------------- empty helpers ---------------- */
export function EmptyPhoto() {
  const { t } = useT();
  const add = useEditor((s) => s.addPhotoLayer);
  return (
    <PanelEmpty
      title={t('noPhotoSelected')}
      hint={t('tapPhotoHint')}
      action={<IconBtn onClick={async () => { const p = await pickImage(); if (p) add(p); }}><Plus className="h-4 w-4" /> {t('addPhotoBtn')}</IconBtn>}
    />
  );
}

export function EmptyText() {
  const { t } = useT();
  const add = useEditor((s) => s.addText);
  return (
    <PanelEmpty
      title={t('noTextSelected')}
      hint={t('tapTextHint')}
      action={
        <div className="flex gap-2">
          <IconBtn onClick={() => add(false, t)}><Plus className="h-4 w-4" /> {t('addTitleBtn')}</IconBtn>
          <IconBtn onClick={() => add(true, t)}><Plus className="h-4 w-4" /> {t('addSubtitleBtn')}</IconBtn>
        </div>
      }
    />
  );
}
