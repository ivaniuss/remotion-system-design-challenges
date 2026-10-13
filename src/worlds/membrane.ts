import {FONT} from '../theme';
import {eio, eout, glow, hash, lerp, noise1, POTASSIUM, Pt, SODIUM, spikeV, ss, TAU, through} from './kit';
import {scope} from './neuronBody';
import type {Events, World, WorldFrame} from './types';

// The membrane, seen edge-on at the scale of molecules: outside on top, inside below,
// the lipid bilayer between. Sodium (Na⁺) and potassium (K⁺) ions jitter in place.
// Events: `sodium` (Na⁺ channels open, Na⁺ rushes in, the inside climbs to +40 mV),
// `potassium` (K⁺ channels open, K⁺ flows out, back down), `repeat` (a stronger push:
// more spikes, same height), `pump` (the Na⁺/K⁺ pump puts 3 Na⁺ out and 2 K⁺ back in).

type Move = {t0: number; dur: number; pts: Pt[]; dest: Pt; sound?: boolean};
type Ion = {x: number; y: number; seed: number; moves: Move[]};

const geo = (f: Pick<WorldFrame, 'W' | 'H' | 'vertical'>) => {
  const mid = f.H / 2;
  return {
    mid,
    NAX: f.W * 0.35,
    KX: f.W * 0.6,
    PX: f.W * 0.84,
    outTop: f.vertical ? 270 : f.H * 0.12,
    outBot: mid - 70,
    inTop: mid + 80,
    // 9:16: subtitles and platform buttons cover the bottom; keep the action above them.
    inBot: f.vertical ? f.H * 0.74 : f.H * 0.93,
    inset: f.vertical ? {x: 40, y: 990, w: f.W - 80, h: 200} : {x: 40, y: 640, w: 430, h: 220},
  };
};

// The spikes of the shot: the first one paced by `sodium` → `potassium`, then the
// quick repeats.
function timing(ev: Events) {
  const s0 = ev.first('sodium');
  const tk = ev.first('potassium');
  const peak = s0 === undefined ? undefined : Math.max(s0 + 0.4, tk ?? s0 + 1.3);
  const repeats: number[] = [];
  for (const r of ev.all('repeat')) for (let k = 0; k < 3; k++) repeats.push(r + k * 0.95);
  return {s0, peak, repeats};
}

export function membraneVoltage(ev: Events): (t: number) => number {
  const {s0, peak, repeats} = timing(ev);
  return (t: number) => {
    let v = -70;
    if (s0 !== undefined && peak !== undefined && t >= s0) {
      if (t < peak) v = lerp(-70, 40, eio((t - s0) / (peak - s0)));
      else if (t < peak + 1.5) v = lerp(40, -80, eio((t - peak) / 1.5));
      else v = lerp(-80, -70, eout((t - peak - 1.5) / 1.3));
    }
    for (const r of repeats) if (t >= r && t < r + 0.9) v = spikeV(t - r, -70, 0.14, 0.3, 0.46);
    return v;
  };
}

function ions(f: Omit<WorldFrame, 't'>): {na: Ion[]; k: Ion[]} {
  const g = geo(f);
  const place = (k: number, salt: number, out: boolean): Ion => ({
    x: f.W * 0.04 + hash(k, salt) * f.W * 0.92,
    y: out ? lerp(g.outTop, g.outBot, hash(k, salt + 1)) : lerp(g.inTop, g.inBot, hash(k, salt + 2)),
    seed: salt * 100 + k,
    moves: [],
  });
  const na = Array.from({length: 30}, (_, k) => place(k, 201, k < 26));
  const kk = Array.from({length: 26}, (_, k) => place(k, 211, k >= 22));
  const {s0, peak} = timing(f.ev);
  const pump = f.ev.first('pump');
  const nearest = (list: Ion[], x: number, y: number, n: number) =>
    [...list].sort((a, b) => Math.abs(a.x - x) + Math.abs(a.y - y) * 0.3 - (Math.abs(b.x - x) + Math.abs(b.y - y) * 0.3)).slice(0, n);
  const naIn = s0 === undefined ? [] : nearest(na.slice(0, 26), g.NAX, g.outBot - 60, 7);
  naIn.forEach((o, k) =>
    o.moves.push({
      t0: s0! + k * 0.17, dur: 0.95, sound: true,
      pts: [{x: g.NAX + ((k % 3) - 1) * 6, y: g.mid - 70}, {x: g.NAX, y: g.mid + 70}],
      dest: {x: g.NAX + (hash(k, 221) - 0.5) * f.W * 0.5, y: lerp(g.inTop + 40, g.inBot - 20, hash(k, 222))},
    }),
  );
  const kOut = peak === undefined ? [] : nearest(kk.filter((o) => o.y > g.mid), g.KX, g.inTop + 60, 6);
  kOut.forEach((o, k) =>
    o.moves.push({
      t0: peak! + k * 0.18, dur: 0.95, sound: true,
      pts: [{x: g.KX + ((k % 3) - 1) * 6, y: g.mid + 70}, {x: g.KX, y: g.mid - 70}],
      dest: {x: g.KX + (hash(k, 231) - 0.5) * f.W * 0.55, y: lerp(g.outBot - 40, g.outTop + 20, hash(k, 232))},
    }),
  );
  if (pump !== undefined) {
    // The pump undoes the flow: 3 Na⁺ back out, 2 K⁺ back in, per cycle.
    const naBack = naIn.length >= 3 ? naIn.slice(0, 3) : nearest(na.slice(26), g.PX, g.inTop, 3);
    naBack.forEach((o, k) =>
      o.moves.push({t0: pump + k * 0.25, dur: 1.2, pts: [{x: g.PX - 10 + k * 10, y: g.mid + 75}, {x: g.PX, y: g.mid - 72}], dest: {x: g.PX - 140 + hash(k, 241) * 280, y: g.mid - 150 - hash(k, 242) * 140}}),
    );
    const kBack = kOut.length >= 2 ? kOut.slice(0, 2) : nearest(kk.slice(22), g.PX, g.outBot, 2);
    kBack.forEach((o, k) =>
      o.moves.push({t0: pump + 0.7 + k * 0.3, dur: 1.2, pts: [{x: g.PX, y: g.mid - 72}, {x: g.PX, y: g.mid + 75}], dest: {x: g.PX - 150 + hash(k, 251) * 300, y: g.mid + 150 + hash(k, 252) * 140}}),
    );
  }
  return {na, k: kk};
}

const jitter = (p: Pt, t: number, seed: number): Pt => ({x: p.x + (noise1(t * 0.7, seed) - 0.5) * 44, y: p.y + (noise1(t * 0.7, seed + 50) - 0.5) * 44});
function ionAt(o: Ion, t: number): Pt {
  let pos = jitter(o, t, o.seed);
  for (const m of o.moves) {
    if (t < m.t0) break;
    const u = (t - m.t0) / m.dur;
    if (u >= 1) {
      pos = jitter(m.dest, t, o.seed);
      continue;
    }
    return through([pos, ...m.pts, m.dest], u);
  }
  return pos;
}

function channel(c: CanvasRenderingContext2D, x: number, mid: number, open: number, rgb: string) {
  const g = lerp(4, 34, open);
  if (open > 0.05) glow(c, x, mid, 90, rgb, open * 0.6);
  c.fillStyle = `rgba(${rgb},0.85)`;
  for (const sd of [-1, 1]) {
    const x0 = sd < 0 ? x - g / 2 - 36 : x + g / 2;
    c.beginPath();
    c.roundRect(x0, mid - 58, 36, 116, 14);
    c.fill();
  }
  // the gate swings away as the channel opens
  c.save();
  c.translate(x - g / 2 - 30, mid - 58);
  c.rotate(-open * 1.2);
  c.fillStyle = `rgba(${rgb},0.95)`;
  c.fillRect(0, -10, g + 60, 12);
  c.restore();
}

export const membrane: World = {
  draw(c, f) {
    const {t} = f;
    const g = geo(f);
    const V = membraneVoltage(f.ev);
    const v = V(t);
    const {s0, peak, repeats} = timing(f.ev);
    c.fillStyle = '#0d0c26';
    c.fillRect(0, 0, f.W, g.mid);
    c.fillStyle = '#140f30';
    c.fillRect(0, g.mid, f.W, f.H - g.mid);
    glow(c, f.W / 2, g.mid * 0.45, Math.max(f.W, f.H) * 0.5, '90,60,200', 0.12);
    // channel states
    let naO = 0;
    let kO = 0;
    if (s0 !== undefined && peak !== undefined) {
      naO = ss(s0 - 0.05, s0 + 0.15, t) * (1 - ss(peak - 0.1, peak + 0.1, t));
      kO = ss(peak - 0.05, peak + 0.15, t) * (1 - ss(peak + 1.4, peak + 1.7, t));
    }
    for (const r of repeats) {
      naO = Math.max(naO, ss(r - 0.02, r + 0.04, t) * (1 - ss(r + 0.12, r + 0.18, t)));
      kO = Math.max(kO, ss(r + 0.12, r + 0.18, t) * (1 - ss(r + 0.42, r + 0.5, t)));
    }
    const pumpAt = f.ev.first('pump');
    const pump = pumpAt === undefined ? 0 : ss(pumpAt - 0.2, pumpAt + 0.2, t);
    // lipid bilayer: heads on both faces, tails pointing in
    const skip = (x: number) => Math.abs(x - g.NAX) < 60 || Math.abs(x - g.KX) < 60 || Math.abs(x - g.PX) < 70;
    c.strokeStyle = 'rgba(205,185,255,0.33)';
    c.lineWidth = 2;
    c.beginPath();
    for (let x = 8; x < f.W; x += 16) {
      if (skip(x)) continue;
      for (const d of [-3, 3]) {
        c.moveTo(x + d, g.mid - 32);
        c.lineTo(x + d, g.mid - 4);
        c.moveTo(x + d, g.mid + 32);
        c.lineTo(x + d, g.mid + 4);
      }
    }
    c.stroke();
    c.fillStyle = 'rgba(205,185,255,0.85)';
    c.beginPath();
    for (let x = 8; x < f.W; x += 16) {
      if (skip(x)) continue;
      for (const y of [g.mid - 38, g.mid + 38]) {
        c.moveTo(x + 7, y);
        c.arc(x, y, 7, 0, TAU);
      }
    }
    c.fill();
    // charge across the membrane: + outside at rest, flips while the inside is positive
    c.font = `500 22px ${FONT.mono}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const outPlus = v < 0;
    for (let x = 45; x < f.W; x += 90) {
      if (skip(x)) continue;
      c.fillStyle = outPlus ? 'rgba(255,160,90,0.85)' : 'rgba(120,180,255,0.85)';
      c.fillText(outPlus ? '+' : '−', x, g.mid - 62);
      c.fillStyle = outPlus ? 'rgba(120,180,255,0.85)' : 'rgba(255,160,90,0.85)';
      c.fillText(outPlus ? '−' : '+', x, g.mid + 64);
    }
    channel(c, g.NAX, g.mid, naO, SODIUM);
    channel(c, g.KX, g.mid, kO, POTASSIUM);
    // the pump rocks while it works
    c.save();
    c.translate(g.PX, g.mid);
    c.rotate(Math.sin(t * 6) * 0.25 * pump);
    c.fillStyle = 'rgba(176,140,255,0.9)';
    c.beginPath();
    c.ellipse(-24, 0, 30, 66, 0, 0, TAU);
    c.ellipse(24, 0, 30, 66, 0, 0, TAU);
    c.fill();
    c.restore();
    if (pump > 0) glow(c, g.PX, g.mid, 90, '176,140,255', pump * 0.4);
    // ions, labelled with their symbol (no legend needed, in any language)
    const {na, k} = ions(f);
    c.font = `600 12px ${FONT.mono}`;
    const drawIon = (o: Ion, rgb: string, sym: string) => {
      const q = ionAt(o, t);
      c.fillStyle = `rgb(${rgb})`;
      c.beginPath();
      c.arc(q.x, q.y, 15, 0, TAU);
      c.fill();
      c.fillStyle = 'rgba(20,12,30,0.88)';
      c.fillText(sym, q.x, q.y + 1);
    };
    for (const o of na) drawIon(o, SODIUM, 'Na⁺');
    for (const o of k) drawIon(o, POTASSIUM, 'K⁺');
    scope(c, g.inset, {t, dur: f.dur, V, threshold: 1, small: true});
  },
  anchor(name, f) {
    const g = geo(f);
    switch (name) {
      case 'outside':
        return {x: f.W * 0.06, y: g.outBot - 40, dx: 0, dy: -90};
      case 'inside':
        return {x: f.W * 0.06, y: g.inTop + 40, dx: 0, dy: 90};
      case 'sodium':
        return {x: g.NAX, y: g.mid - 60, dx: 40, dy: -120};
      case 'potassium':
        return {x: g.KX, y: g.mid - 60, dx: 40, dy: -120};
      case 'pump':
        return {x: g.PX, y: g.mid - 68, dx: -20, dy: -150};
      case 'voltage':
        return {x: g.inset.x + g.inset.w * 0.55, y: g.inset.y, dx: 40, dy: -70};
      default:
        return null;
    }
  },
  sounds(f) {
    const out: {t: number; kind: 'spike' | 'tick'; gain?: number}[] = [];
    const {na, k} = ions(f);
    for (const o of [...na, ...k]) for (const m of o.moves) if (m.sound) out.push({t: m.t0 + m.dur * 0.45, kind: 'tick', gain: 0.55});
    const {s0, peak, repeats} = timing(f.ev);
    if (s0 !== undefined && peak !== undefined) out.push({t: peak, kind: 'spike'});
    for (const r of repeats) out.push({t: r + 0.12, kind: 'spike', gain: 0.8});
    return out;
  },
};
