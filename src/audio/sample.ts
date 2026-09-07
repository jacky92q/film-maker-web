// A built-in sample track, synthesised in the browser with Web Audio.
//
// Generating it (rather than shipping an MP3) keeps the repository light and
// sidesteps any licensing question: the piece below is written here, in code.
// It is rendered once, cached, and folded so that the reverb tail wraps back
// into the head — the buffer therefore loops without a seam.

export const SAMPLE_TRACK_PATH = 'sample:vow';
export const SAMPLE_TRACK_NAME = 'Vow';

const SR = 44100;
const BEAT = 1.0; // 60 BPM — unhurried, ceremony pace
const BAR = 4 * BEAT;
const BARS = 8;
const LOOP = BARS * BAR; // 32s
const TAIL = 4.0; // rendered past the loop, then folded back into the head

// D major: I – V – vi – IV, the progression every processional leans on.
interface Chord {
  bass: number;
  tones: number[]; // arpeggio pool, low → high
  top: number; // melody note for the bar
}

const PROGRESSION: Chord[] = [
  { bass: 38, tones: [57, 62, 66, 69, 74], top: 78 }, // D
  { bass: 45, tones: [57, 61, 64, 69, 73], top: 76 }, // A/C#
  { bass: 47, tones: [59, 62, 66, 71, 74], top: 78 }, // Bm
  { bass: 43, tones: [55, 59, 62, 67, 71], top: 74 }, // G
  { bass: 38, tones: [57, 62, 66, 69, 74], top: 81 }, // D
  { bass: 45, tones: [57, 61, 64, 69, 73], top: 80 }, // A/C#
  { bass: 47, tones: [59, 62, 66, 71, 74], top: 78 }, // Bm
  { bass: 43, tones: [55, 59, 62, 67, 71], top: 76 }, // G
];

// Eighth-note arpeggio index into the chord's tone pool, per bar.
const FIGURE = [0, 2, 3, 4, 3, 2, 1, 2];

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

function impulseResponse(ctx: BaseAudioContext, seconds: number, decay: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
    }
  }
  return ir;
}

// A struck-string voice: three partials under one exponential envelope.
function pluck(ctx: BaseAudioContext, dest: AudioNode, midi: number, at: number, level: number, decay: number) {
  const f = hz(midi);
  const partials: [number, number][] = [[1, 1], [2, 0.28], [3, 0.09], [4.2, 0.04]];
  for (const [mult, amp] of partials) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f * mult;
    // A touch of inharmonicity keeps it from sounding like a test tone.
    osc.detune.value = (mult - 1) * 4;

    const g = ctx.createGain();
    const peak = level * amp;
    const d = decay / Math.sqrt(mult);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + d);

    osc.connect(g).connect(dest);
    osc.start(at);
    osc.stop(at + d + 0.05);
  }
}

// A slow, breathing string pad.
function pad(ctx: BaseAudioContext, dest: AudioNode, midi: number, at: number, dur: number, level: number) {
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(520, at);
  filter.frequency.linearRampToValueAtTime(900, at + dur * 0.5);
  filter.frequency.linearRampToValueAtTime(520, at + dur);
  filter.Q.value = 0.7;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.linearRampToValueAtTime(level, at + dur * 0.35);
  g.gain.linearRampToValueAtTime(0.0001, at + dur);
  filter.connect(g).connect(dest);

  for (const cents of [-6, 6]) {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = hz(midi);
    osc.detune.value = cents;
    osc.connect(filter);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }
}

function bass(ctx: BaseAudioContext, dest: AudioNode, midi: number, at: number, dur: number, level: number) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = hz(midi);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.linearRampToValueAtTime(level, at + 0.08);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g).connect(dest);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

let cached: Promise<AudioBuffer> | null = null;

export function renderSampleTrack(): Promise<AudioBuffer> {
  if (!cached) cached = build();
  return cached;
}

async function build(): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(2, Math.ceil((LOOP + TAIL) * SR), SR);

  const master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(ctx.destination);

  const dry = ctx.createGain();
  dry.gain.value = 0.82;
  dry.connect(master);

  const reverb = ctx.createConvolver();
  reverb.buffer = impulseResponse(ctx, 3.2, 2.4);
  const wet = ctx.createGain();
  wet.gain.value = 0.42;
  reverb.connect(wet).connect(master);

  const send = ctx.createGain();
  send.connect(dry);
  send.connect(reverb);

  for (let bar = 0; bar < BARS; bar++) {
    const chord = PROGRESSION[bar % PROGRESSION.length];
    const barAt = bar * BAR;

    bass(ctx, send, chord.bass, barAt, BAR * 0.98, 0.20);
    pad(ctx, send, chord.bass + 12, barAt, BAR, 0.055);
    pad(ctx, send, chord.tones[2], barAt, BAR, 0.045);

    for (let i = 0; i < 8; i++) {
      const at = barAt + i * (BEAT / 2);
      const midi = chord.tones[FIGURE[i]];
      // Lean on the downbeat, breathe on the offbeats.
      const level = i % 2 === 0 ? 0.15 : 0.095;
      pluck(ctx, send, midi, at, level, 2.4);
    }

    // Melody: one held note per bar, entering on the second half.
    pluck(ctx, send, chord.top, barAt + BEAT * 1.5, 0.13, 3.2);
    if (bar % 2 === 1) pluck(ctx, send, chord.top - 3, barAt + BEAT * 3, 0.10, 2.6);
  }

  const rendered = await ctx.startRendering();

  // Fold the tail back over the head so the buffer loops seamlessly.
  const loopLen = Math.round(LOOP * SR);
  const out = new AudioBuffer({ length: loopLen, numberOfChannels: 2, sampleRate: SR });
  const overhang = Math.min(rendered.length - loopLen, loopLen);
  for (let ch = 0; ch < 2; ch++) {
    const src = rendered.getChannelData(ch);
    const dst = out.getChannelData(ch);
    dst.set(src.subarray(0, loopLen));
    for (let i = 0; i < overhang; i++) dst[i] += src[loopLen + i];
  }
  return out;
}
