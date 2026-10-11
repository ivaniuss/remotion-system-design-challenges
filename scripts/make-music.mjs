#!/usr/bin/env node
// Generates the background music track by synthesis: no samples, no dependencies, no
// licenses. Deterministic (same output on every run).
//   node scripts/make-music.mjs            writes public/music/ambient.wav (64 s, seamless loop)
//   node scripts/make-music.mjs --out dir  writes dir/music/ambient.wav instead
// Then set "music": {"file": "music/ambient.wav", "volume": 0.12} in video.config.json.
// (The sound effects live in public/sfx, made by scripts/make-sfx.sh.)

import fs from 'node:fs';
import path from 'node:path';


const SR = 44100;
const args = process.argv.slice(2);
const outDir = args.includes('--out') ? args[args.indexOf('--out') + 1] : 'public';

// ---------- utilities ----------
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const buf = (sec) => new Float64Array(Math.ceil(sec * SR));
const TAU = Math.PI * 2;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// State-variable filter (Chamberlin): fc may change sample by sample.
function svf(x, fcOf, q = 1.0, mode = 'lp') {
  const out = new Float64Array(x.length);
  let low = 0;
  let band = 0;
  for (let i = 0; i < x.length; i++) {
    const f = 2 * Math.sin((Math.PI * clamp(fcOf(i / SR), 20, 7000)) / SR);
    low += f * band;
    const high = x[i] - low - band / q;
    band += f * high;
    out[i] = mode === 'lp' ? low : mode === 'bp' ? band : high;
  }
  return out;
}
const lp = (x, fc, q = 0.8) => svf(x, () => fc, q, 'lp');
const hp = (x, fc, q = 0.8) => svf(x, () => fc, q, 'hp');

function noise(sec, seed) {
  const r = rng(seed);
  const b = buf(sec);
  for (let i = 0; i < b.length; i++) b[i] = r() * 2 - 1;
  return b;
}

// Schroeder reverb (4 damped combs + 2 all-pass). Returns the wet part only.
function reverb(x, {room = 0.82, damp = 0.35, spread = 0} = {}) {
  const combs = [1557, 1617, 1491, 1422].map((d) => d + spread);
  const wet = new Float64Array(x.length);
  for (const D of combs) {
    const line = new Float64Array(D);
    let idx = 0;
    let store = 0;
    for (let i = 0; i < x.length; i++) {
      const y = line[idx];
      store = y * (1 - damp) + store * damp;
      line[idx] = x[i] + store * room;
      idx = (idx + 1) % D;
      wet[i] += y * 0.25;
    }
  }
  let sig = wet;
  for (const D of [225 + spread, 556 + spread]) {
    const line = new Float64Array(D);
    let idx = 0;
    const o = new Float64Array(sig.length);
    for (let i = 0; i < sig.length; i++) {
      const d = line[idx];
      const v = sig[i] + d * 0.5;
      line[idx] = v;
      o[i] = d - v * 0.5;
      idx = (idx + 1) % D;
    }
    sig = o;
  }
  return sig;
}

function mixInto(dst, src, at = 0, gain = 1) {
  const start = Math.round(at * SR);
  for (let i = 0; i < src.length && start + i < dst.length; i++) if (start + i >= 0) dst[start + i] += src[i] * gain;
}

function normalize(x, peak = 0.85) {
  let m = 0;
  for (const v of x) m = Math.max(m, Math.abs(v));
  if (m === 0) return x;
  const g = peak / m;
  for (let i = 0; i < x.length; i++) x[i] *= g;
  return x;
}

// Short fade in/out to avoid clicks.
function edges(x, inMs = 3, outMs = 12) {
  const a = Math.round((inMs / 1000) * SR);
  const b = Math.round((outMs / 1000) * SR);
  for (let i = 0; i < a && i < x.length; i++) x[i] *= i / a;
  for (let i = 0; i < b && i < x.length; i++) x[x.length - 1 - i] *= i / b;
  return x;
}

function writeWav(file, channels, sampleRate = SR) {
  const n = channels[0].length;
  const ch = channels.length;
  const data = Buffer.alloc(n * ch * 2);
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < ch; c++) {
      const v = clamp(channels[c][i], -1, 1);
      data.writeInt16LE(Math.round(v * 32767), (i * ch + c) * 2);
    }
  }
  const head = Buffer.alloc(44);
  head.write('RIFF', 0);
  head.writeUInt32LE(36 + data.length, 4);
  head.write('WAVEfmt ', 8);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20);
  head.writeUInt16LE(ch, 22);
  head.writeUInt32LE(sampleRate, 24);
  head.writeUInt32LE(sampleRate * ch * 2, 28);
  head.writeUInt16LE(ch * 2, 32);
  head.writeUInt16LE(16, 34);
  head.write('data', 36);
  head.writeUInt32LE(data.length, 40);
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, Buffer.concat([head, data]));
}

// Tone with an exponential envelope. partials: [[multiple, amplitude], ...]
function tone(freq, sec, {tau = 0.2, attack = 0.004, partials = [[1, 1]], sweep = null} = {}) {
  const b = buf(sec);
  let phase = 0;
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    const f = sweep ? sweep(t) : freq;
    phase += (TAU * f) / SR;
    let s = 0;
    for (const [m, a] of partials) s += Math.sin(phase * m) * a;
    b[i] = s * Math.min(1, t / attack) * Math.exp(-t / tau);
  }
  return b;
}

// bell: soft inharmonic partials
const bell = (freq, sec, tau) =>
  tone(freq, sec, {tau, attack: 0.002, partials: [[1, 1], [2.0, 0.45], [2.76, 0.25], [4.07, 0.12], [5.4, 0.06]]});

// ---------- music ----------
// 90 bpm, 24 bars = 64 s, progression Am7 - Fmaj7 - Cmaj7 - G6 (2 bars each, x3).
function music() {
  const BPM = 90;
  const beat = 60 / BPM;
  const bar = beat * 4;
  const BARS = 24;
  const dur = BARS * bar; // exactly 64 s
  const tail = 4;
  const N = Math.ceil((dur + tail) * SR);
  const L = new Float64Array(N);
  const R = new Float64Array(N);
  const padSend = new Float64Array(N);
  const pluckSend = new Float64Array(N);
  const r = rng(7);

  const chords = [
    {root: 45, pad: [52, 55, 60, 64], arp: [69, 72, 76, 79]}, // Am7
    {root: 41, pad: [48, 52, 57, 60], arp: [65, 69, 72, 76]}, // Fmaj7
    {root: 48, pad: [55, 59, 64, 67], arp: [67, 71, 72, 76]}, // Cmaj7
    {root: 43, pad: [50, 55, 59, 64], arp: [67, 71, 74, 79]}, // G6
  ];

  const addStereo = (sig, at, pan, gain, sendBus, sendGain) => {
    const gl = Math.cos((pan + 1) * (Math.PI / 4)) * gain;
    const gr = Math.sin((pan + 1) * (Math.PI / 4)) * gain;
    const s = Math.round(at * SR);
    for (let i = 0; i < sig.length && s + i < N; i++) {
      L[s + i] += sig[i] * gl;
      R[s + i] += sig[i] * gr;
      if (sendBus) sendBus[s + i] += sig[i] * sendGain;
    }
  };

  // pad: soft voices with three detunings, slow attack
  const padNote = (midi, sec) => {
    const b = buf(sec + 1.4);
    const detunes = [-7, 0, 7];
    for (const cents of detunes) {
      const f = mtof(midi) * Math.pow(2, cents / 1200);
      let ph = r() * TAU;
      for (let i = 0; i < b.length; i++) {
        const t = i / SR;
        ph += (TAU * f) / SR;
        const a = Math.min(1, t / 0.9);
        const rel = t > sec ? Math.exp(-(t - sec) / 0.45) : 1;
        b[i] += (Math.sin(ph) + 0.32 * Math.sin(2 * ph) + 0.1 * Math.sin(3 * ph)) * a * rel * 0.33;
      }
    }
    return lp(b, 1500, 0.7);
  };

  const pluckNote = (midi, vel) => {
    const f = mtof(midi);
    const b = tone(f, 1.6, {tau: 0.28, attack: 0.003, partials: [[1, 1], [2, 0.28], [3, 0.1], [4, 0.04]]});
    for (let i = 0; i < b.length; i++) b[i] *= vel;
    return lp(b, 3200, 0.7);
  };

  const kick = () => tone(0, 0.45, {tau: 0.11, attack: 0.002, sweep: (t) => 48 + 70 * Math.exp(-t / 0.035)});
  const hat = () => {
    const n = hp(noise(0.05, Math.floor(r() * 1e6)), 7000);
    for (let i = 0; i < n.length; i++) n[i] *= Math.exp(-i / SR / 0.012);
    return n;
  };

  for (let b = 0; b < BARS; b++) {
    const chord = chords[Math.floor(b / 2) % 4];
    const t0 = b * bar;
    // pad: once per chord (every 2 bars)
    if (b % 2 === 0) {
      chord.pad.forEach((m, k) => addStereo(padNote(m, bar * 2 - 0.1), t0, -0.5 + k * 0.33, 0.5, padSend, 0.55));
    }
    // bass: dotted quarter at the start of the bar
    addStereo(tone(mtof(chord.root), 1.8, {tau: 0.55, attack: 0.012, partials: [[1, 1], [2, 0.3]]}), t0, 0, 0.42, null, 0);
    addStereo(tone(mtof(chord.root), 1.2, {tau: 0.4, attack: 0.012, partials: [[1, 1], [2, 0.3]]}), t0 + beat * 2.5, 0, 0.26, null, 0);
    // soft pulse
    addStereo(kick(), t0, 0, 0.2, null, 0);
    addStereo(kick(), t0 + beat * 2, 0, 0.16, null, 0);
    for (let e = 0; e < 8; e++) if (e % 2 === 1) addStereo(hat(), t0 + e * (beat / 2), e % 4 === 1 ? 0.3 : -0.3, 0.03, null, 0);
    // sparse arpeggio
    const pattern = [0, 2, 1, 3, 2, 1, 3, 2];
    for (let e = 0; e < 8; e++) {
      if (r() < 0.32) continue;
      const m = chord.arp[pattern[e]] + (r() < 0.12 ? 12 : 0);
      const vel = 0.5 + r() * 0.35;
      const at = t0 + e * (beat / 2);
      const pan = (e % 2 ? 1 : -1) * (0.25 + r() * 0.3);
      const p = pluckNote(m, vel);
      addStereo(p, at, pan, 0.2, pluckSend, 0.5);
      addStereo(p, at + beat * 0.75, -pan, 0.07, pluckSend, 0.4); // echo
    }
  }

  const rvL = reverb(padSend, {room: 0.86, damp: 0.4});
  const rvR = reverb(padSend, {room: 0.86, damp: 0.4, spread: 23});
  const rvL2 = reverb(pluckSend, {room: 0.8, damp: 0.45});
  const rvR2 = reverb(pluckSend, {room: 0.8, damp: 0.45, spread: 31});
  for (let i = 0; i < N; i++) {
    L[i] += rvL[i] * 0.9 + rvL2[i] * 0.7;
    R[i] += rvR[i] * 0.9 + rvR2[i] * 0.7;
  }

  // seamless loop: the tail is folded onto the start
  const n = Math.round(dur * SR);
  const fold = (X) => {
    const o = new Float64Array(n);
    for (let i = 0; i < n; i++) o[i] = X[i];
    for (let i = n; i < N; i++) o[i - n] += X[i];
    return o;
  };
  // the filter runs before folding the tail so the loop start has no transient
  const oL = fold(lp(L, 6500, 0.6));
  const oR = fold(lp(R, 6500, 0.6));
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(oL[i]), Math.abs(oR[i]));
  const g = 0.7 / peak;
  for (let i = 0; i < n; i++) {
    oL[i] *= g;
    oR[i] *= g;
  }
  return [oL, oR];
}

// ---------- output ----------
writeWav(path.join(outDir, 'music', 'ambient.wav'), music());
console.log(`✔ music written to ${outDir}/music/ambient.wav (64 s, loops without a seam)`);
