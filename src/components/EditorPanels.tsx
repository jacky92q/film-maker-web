import { useState } from 'react';
import {
  AlignCenterHorizontal, AlignCenterVertical, ArrowDownToLine, ArrowUpToLine,
  Crop, ImagePlus, Plus, Trash2,
} from 'lucide-react';
import { useEditor } from '../store/editor';
import { useT } from '../i18n';
import { useEnumLabel } from '../i18n/enumLabels';
import { pickImage } from '../lib/imagePick';
import {
  AMBIENT_EFFECTS, DIM_DIRECTIONS, FONT_STYLES, OVERLAYS, PHOTO_ANIMATIONS, PHOTO_FILTERS,
  PHOTO_FITS, PHOTO_FRAMES, PHOTO_SHAPES, SLIDE_FRAMES, TEXT_ANIMATIONS, TEXT_BGS, TRANSITIONS,
  type SlideTextColor,
} from '../domain/enums';
import { ChipRow, ColorRow, PanelEmpty, Section, Segmented, Slider, ToolButton } from './controls';
import type { PhotoLayer, Slide, StickerLayer, TextLayer } from '../domain/models';

function Tabs({ tabs, active, onChange }: { tabs: string[]; active: number; onChange: (i: number) => void }) {
  return (
    <div className="mb-7 flex gap-6 border-b border-hair">
      {tabs.map((name, i) => (
        <button
          key={name}
          onClick={() => onChange(i)}
          className={`-mb-px border-b pb-3 text-[13px] font-semibold transition-colors duration-200 ${
            active === i ? 'border-gold text-gold' : 'border-transparent text-text-3 hover:text-text'
          }`}
        >
          {name}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Slide ---------------- */

export function SlidePanel({ slide }: { slide: Slide }) {
  const { t } = useT();
  const el = useEnumLabel();
  const patch = useEditor((s) => s.patchSlide);
  const setBg = useEditor((s) => s.setBackgroundPhoto);
  const removeBg = useEditor((s) => s.removeBackgroundPhoto);
  const [tab, setTab] = useState(0);

  return (
    <div>
      <Tabs tabs={[t('tabCanvas'), t('tabStyle'), t('tabTiming')]} active={tab} onChange={setTab} />

      {tab === 0 && (
        <>
          <Section title={t('secBackground')}>
            <div className="flex flex-wrap gap-2">
              <ToolButton onClick={async () => { const p = await pickImage(); if (p) setBg(p); }}>
                <ImagePlus className="h-4 w-4" />
                {slide.imagePath ? t('replacePhoto') : t('backgroundPhoto')}
              </ToolButton>
              {slide.imagePath && (
                <ToolButton danger onClick={removeBg}>
                  <Trash2 className="h-4 w-4" /> {t('removePhoto')}
                </ToolButton>
              )}
            </div>
            <label className="mt-2.5 flex h-11 cursor-pointer items-center gap-3 rounded-full border border-hair bg-surface-2 px-4 text-[12.5px] font-semibold text-text-2 transition-colors hover:border-hair-2 hover:text-text">
              <input
                type="color"
                value={slide.backgroundColor}
                onChange={(e) => patch({ backgroundColor: e.target.value }, false)}
                onBlur={() => patch({}, true)}
                className="h-6 w-6 rounded-full ring-1 ring-inset ring-white/20"
              />
              {t('secBackgroundColour')}
              <span className="ml-auto text-[11.5px] uppercase tracking-wide tabular-nums text-text-3">
                {slide.backgroundColor}
              </span>
            </label>
          </Section>

          {slide.imagePath && (
            <>
              <Section title={t('secPhotoFit')}>
                <ChipRow options={PHOTO_FITS} value={slide.photoFit} onChange={(v) => patch({ photoFit: v })} label={(v) => el('fit', v)} />
              </Section>
              <Section
                title={t('secPhotoZoom')}
                right={
                  <button
                    className="text-[11px] font-semibold text-gold transition-opacity hover:opacity-70"
                    onClick={() => patch({ photoScale: 1, photoOffsetX: 0, photoOffsetY: 0 })}
                  >
                    {t('reset')}
                  </button>
                }
              >
                <Slider
                  value={slide.photoScale}
                  min={0.5}
                  max={4}
                  step={0.05}
                  onChange={(v) => patch({ photoScale: v }, false)}
                  onCommit={() => patch({}, true)}
                  label={`${slide.photoScale.toFixed(1)}×`}
                />
              </Section>
            </>
          )}

          <Section title={t('secDim')}>
            <ChipRow options={DIM_DIRECTIONS} value={slide.dimDirection} onChange={(v) => patch({ dimDirection: v })} label={(v) => el('dim', v)} />
            {slide.dimDirection !== 'none' && (
              <div className="mt-3">
                <Slider
                  value={slide.dimOpacity}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => patch({ dimOpacity: v }, false)}
                  onCommit={() => patch({}, true)}
                  label={`${Math.round(slide.dimOpacity * 100)}%`}
                />
              </div>
            )}
          </Section>
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
              <div className="mt-3">
                <ColorRow
                  value={slide.frameColor}
                  custom={slide.customFrameColor}
                  onPreset={(c) => patch({ frameColor: c, customFrameColor: null })}
                  onCustom={(hex) => patch({ customFrameColor: hex })}
                />
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
            <Slider
              value={slide.durationSeconds}
              min={1}
              max={15}
              step={0.5}
              onChange={(v) => patch({ durationSeconds: v }, false)}
              onCommit={() => patch({}, true)}
              label={`${slide.durationSeconds}s`}
            />
          </Section>
        </>
      )}
    </div>
  );
}

/* ---------------- Photo ---------------- */

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
          <div className="mb-6 flex flex-wrap gap-2">
            <ToolButton onClick={front} title={t('bringForward')}><ArrowUpToLine className="h-4 w-4" /> {t('bringForward')}</ToolButton>
            <ToolButton onClick={back} title={t('sendBackward')}><ArrowDownToLine className="h-4 w-4" /> {t('sendBackward')}</ToolButton>
            <ToolButton active={cropMode} onClick={() => setCrop(!cropMode)}><Crop className="h-4 w-4" /> {t('crop')}</ToolButton>
            <ToolButton onClick={async () => { const p = await pickImage(); if (p) patch(layer.id, { imagePath: p }); }}>
              <ImagePlus className="h-4 w-4" /> {t('changePhoto')}
            </ToolButton>
          </div>

          {cropMode ? (
            <Section
              title={t('zoom')}
              right={
                <button
                  className="text-[11px] font-semibold text-gold transition-opacity hover:opacity-70"
                  onClick={() => patch(layer.id, { cropScale: 1, cropOffsetX: 0, cropOffsetY: 0 })}
                >
                  {t('reset')}
                </button>
              }
            >
              <Slider
                value={layer.cropScale}
                min={1}
                max={4}
                step={0.05}
                onChange={(v) => patch(layer.id, { cropScale: v }, false)}
                onCommit={() => patch(layer.id, {}, true)}
                label={`${layer.cropScale.toFixed(1)}×`}
              />
            </Section>
          ) : (
            <>
              <Section title={t('secWidth')}>
                <Slider value={layer.widthFraction} min={0.1} max={1} step={0.01} label={`${Math.round(layer.widthFraction * 100)}%`}
                  onChange={(v) => patch(layer.id, { widthFraction: v }, false)} onCommit={() => patch(layer.id, {}, true)} />
              </Section>
              <Section title={t('secHeight')}>
                <Slider value={layer.heightFraction} min={0.1} max={1} step={0.01} label={`${Math.round(layer.heightFraction * 100)}%`}
                  onChange={(v) => patch(layer.id, { heightFraction: v }, false)} onCommit={() => patch(layer.id, {}, true)} />
              </Section>
              <Section title={t('secRotation')}>
                <Slider value={layer.rotation} min={-180} max={180} step={1} label={`${Math.round(layer.rotation)}°`}
                  onChange={(v) => patch(layer.id, { rotation: v }, false)} onCommit={() => patch(layer.id, {}, true)} />
              </Section>
              <div className="mb-6 flex gap-2">
                <ToolButton onClick={() => patch(layer.id, { x: 0.5 })}><AlignCenterVertical className="h-4 w-4" /> {t('centreH')}</ToolButton>
                <ToolButton onClick={() => patch(layer.id, { y: 0.5 })}><AlignCenterHorizontal className="h-4 w-4" /> {t('centreV')}</ToolButton>
              </div>
            </>
          )}

          <ToolButton danger onClick={del}><Trash2 className="h-4 w-4" /> {t('deleteLayer')}</ToolButton>
        </>
      )}

      {tab === 1 && (
        <>
          <Section title={t('secPhotoShape')}>
            <ChipRow options={PHOTO_SHAPES} value={layer.shape} onChange={(v) => patch(layer.id, { shape: v })} label={(v) => el('shape', v)} />
          </Section>
          <Section title={t('secPhotoFrame')}>
            <ChipRow options={PHOTO_FRAMES} value={layer.frame} onChange={(v) => patch(layer.id, { frame: v })} label={(v) => el('photoFrame', v)} />
          </Section>
          <Section title={t('secFilter')}>
            <ChipRow options={PHOTO_FILTERS} value={layer.filter} onChange={(v) => patch(layer.id, { filter: v })} label={(v) => el('filter', v)} />
          </Section>
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

/* ---------------- Text ---------------- */

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
            rows={3}
            placeholder={t('enterText')}
            className="mb-7 w-full resize-none rounded-[12px] border border-hair bg-surface-2 p-4 font-display text-[18px] leading-relaxed text-text outline-none transition-colors placeholder:text-text-3/45 focus:border-gold/60"
          />
          <Section title={t('secType')}>
            <Segmented
              value={layer.isSubtitle ? 'sub' : 'main'}
              onChange={(v) => patch(layer.id, { isSubtitle: v === 'sub' })}
              options={[{ value: 'main', label: t('typeMain') }, { value: 'sub', label: t('typeSubtitle') }]}
            />
          </Section>
          <div className="mb-6 flex gap-2">
            <ToolButton onClick={front} title={t('bringForward')}><ArrowUpToLine className="h-4 w-4" /> {t('bringForward')}</ToolButton>
            <ToolButton onClick={back} title={t('sendBackward')}><ArrowDownToLine className="h-4 w-4" /> {t('sendBackward')}</ToolButton>
            <ToolButton onClick={() => patch(layer.id, { x: 0.5 })}><AlignCenterVertical className="h-4 w-4" /> {t('centreH')}</ToolButton>
            <ToolButton onClick={() => patch(layer.id, { y: 0.5 })}><AlignCenterHorizontal className="h-4 w-4" /> {t('centreV')}</ToolButton>
          </div>
          <ToolButton danger onClick={del}><Trash2 className="h-4 w-4" /> {t('deleteLayer')}</ToolButton>
        </>
      )}

      {tab === 1 && (
        <>
          <Section title={t('secFont')}>
            <ChipRow options={FONT_STYLES} value={layer.fontStyle} onChange={(v) => patch(layer.id, { fontStyle: v })} label={(v) => el('font', v)} />
          </Section>
          <Section title={t('secSize')}>
            <Slider value={layer.fontSize} min={16} max={280} step={1} label={`${Math.round(layer.fontSize)}`}
              onChange={(v) => patch(layer.id, { fontSize: v }, false)} onCommit={() => patch(layer.id, {}, true)} />
          </Section>
          <Section title={t('secTextColor')}>
            <ColorRow value={layer.color} custom={layer.customColor}
              onPreset={(c) => patch(layer.id, { color: c, customColor: null })}
              onCustom={(hex) => patch(layer.id, { customColor: hex })} />
          </Section>
          {layer.isSubtitle && (
            <Section title={t('secBarColor')}>
              <ColorRow value={layer.barColor} custom={layer.customBarColor}
                onPreset={(c: SlideTextColor) => patch(layer.id, { barColor: c, customBarColor: null })}
                onCustom={(hex) => patch(layer.id, { customBarColor: hex })} />
            </Section>
          )}
          <Section title={t('secTextBg')}>
            <ChipRow options={TEXT_BGS} value={layer.textBg} onChange={(v) => patch(layer.id, { textBg: v })} label={(v) => el('textBg', v)} />
          </Section>
          <Section title={t('secOutline')}>
            <Segmented value={String(layer.strokeWidth)} onChange={(v) => patch(layer.id, { strokeWidth: Number(v) })}
              options={[
                { value: '0', label: t('outlineOff') }, { value: '1', label: t('outlineThin') },
                { value: '2', label: t('outlineMedium') }, { value: '3', label: t('outlineBold') },
              ]} />
          </Section>
          <Section title={t('secShadow')}>
            <Segmented value={layer.shadowLevel} onChange={(v) => patch(layer.id, { shadowLevel: v as TextLayer['shadowLevel'] })}
              options={[
                { value: 'none', label: t('shadowNone') }, { value: 'soft', label: t('shadowSoft') },
                { value: 'medium', label: t('shadowMedium') }, { value: 'strong', label: t('shadowStrong') },
              ]} />
          </Section>
          <Section title={t('secSpacing')}>
            <Slider value={layer.letterSpacing} min={-4} max={24} step={1} label={`${layer.letterSpacing}`}
              onChange={(v) => patch(layer.id, { letterSpacing: v }, false)} onCommit={() => patch(layer.id, {}, true)} />
          </Section>
          <Section title={t('secRotation')}>
            <Slider value={layer.rotation} min={-180} max={180} step={1} label={`${Math.round(layer.rotation)}°`}
              onChange={(v) => patch(layer.id, { rotation: v }, false)} onCommit={() => patch(layer.id, {}, true)} />
          </Section>
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

/* ---------------- Sticker ---------------- */

export function StickerPanel({ layer }: { layer: StickerLayer }) {
  const { t } = useT();
  const patch = useEditor((s) => s.patchSticker);
  const front = useEditor((s) => s.bringToFront);
  const back = useEditor((s) => s.sendToBack);
  const del = useEditor((s) => s.deleteLayer);

  return (
    <div>
      <Section title={t('secSize')}>
        <Slider value={layer.widthFraction} min={0.04} max={1.2} step={0.01} label={`${Math.round(layer.widthFraction * 100)}%`}
          onChange={(v) => patch(layer.id, { widthFraction: v }, false)} onCommit={() => patch(layer.id, {}, true)} />
      </Section>
      <Section title={t('secRotation')}>
        <Slider value={layer.rotation} min={-180} max={180} step={1} label={`${Math.round(layer.rotation)}°`}
          onChange={(v) => patch(layer.id, { rotation: v }, false)} onCommit={() => patch(layer.id, {}, true)} />
      </Section>
      <Section title={t('secOpacity')}>
        <Slider value={layer.opacity} min={0.05} max={1} step={0.05} label={`${Math.round(layer.opacity * 100)}%`}
          onChange={(v) => patch(layer.id, { opacity: v }, false)} onCommit={() => patch(layer.id, {}, true)} />
      </Section>
      <div className="mb-6 flex gap-2">
        <ToolButton onClick={front} title={t('bringForward')}><ArrowUpToLine className="h-4 w-4" /> {t('bringForward')}</ToolButton>
        <ToolButton onClick={back} title={t('sendBackward')}><ArrowDownToLine className="h-4 w-4" /> {t('sendBackward')}</ToolButton>
      </div>
      <ToolButton danger onClick={del}><Trash2 className="h-4 w-4" /> {t('deleteLayer')}</ToolButton>
    </div>
  );
}

/* ---------------- Empty states ---------------- */

export function EmptyPhoto() {
  const { t } = useT();
  const add = useEditor((s) => s.addPhotoLayer);
  return (
    <PanelEmpty
      title={t('noPhotoSelected')}
      hint={t('noPhotoHint')}
      action={
        <ToolButton onClick={async () => { const p = await pickImage(); if (p) add(p); }}>
          <Plus className="h-4 w-4" /> {t('addPhoto')}
        </ToolButton>
      }
    />
  );
}

export function EmptyText() {
  const { t } = useT();
  const add = useEditor((s) => s.addText);
  return (
    <PanelEmpty
      title={t('noTextSelected')}
      hint={t('noTextHint')}
      action={
        <>
          <ToolButton onClick={() => add(false, t)}><Plus className="h-4 w-4" /> {t('addTitle')}</ToolButton>
          <ToolButton onClick={() => add(true, t)}><Plus className="h-4 w-4" /> {t('addCaption')}</ToolButton>
        </>
      }
    />
  );
}
