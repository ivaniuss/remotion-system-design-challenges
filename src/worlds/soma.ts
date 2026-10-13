import {along, applyCam, BRAKE, Cam, camPoint, glow, ground, lerp, pulse, spikeV, SPARK, ss} from './kit';
import {AXON_PATH, drawNeuron, LEAF_PATHS, NEURON_POINTS, scope, SOMA} from './neuronBody';
import type {Events, World, WorldFrame} from './types';

// The cell body, close, next to an oscilloscope. Inputs arrive one by one and the
// membrane voltage climbs from −70 mV; at −55 mV the cell fires (+40 mV, then a dip to
// −80 and back). Events: `inputs` (they start arriving), `threshold` (the −55 line shows),
// `fire` (the spike), `weak` (two inputs that fall short: nothing happens).

const TRAVEL = 0.9;
const N_INPUTS = 8;

type Arrival = {t: number; a: number};
function arrivals(ev: Events, dur: number): Arrival[] {
  const ti = ev.first('inputs');
  if (ti === undefined) return [];
  const tf = ev.first('fire');
  const end = (tf ?? Math.min(dur - 0.5, ti + 3.2)) - 0.1;
  const out: Arrival[] = [];
  for (let k = 0; k < N_INPUTS; k++) out.push({t: lerp(ti + 0.15, end, k / (N_INPUTS - 1)), a: k === 2 ? -0.8 : 1});
  return out;
}

const epsp = (d: number, decay: number) => (d > 0 ? (1 - Math.exp(-d / 0.07)) * Math.exp(-d / decay) : 0);

// Membrane voltage at t (scene seconds), from the events alone.
export function somaVoltage(ev: Events, dur: number): (t: number) => number {
  const arr = arrivals(ev, dur);
  const tf = ev.first('fire');
  const tw = ev.first('weak');
  const raw = (t: number) => arr.reduce((s, x) => s + x.a * epsp(t - x.t, 1.9), 0);
  // Scale the inputs so they reach exactly −55 mV when the cell fires (−58 if it doesn't).
  const tEnd = tf ?? (arr.length ? arr[arr.length - 1].t + 0.25 : 0);
  const peak = raw(tEnd);
  const k = peak > 0 ? (tf !== undefined ? 15 : 12) / peak : 0;
  const atFire = tf !== undefined ? -70 + k * raw(tf) : -70;
  return (t: number) => {
    let v = tf !== undefined && t >= tf ? spikeV(t - tf, atFire) : -70 + k * raw(t);
    if (tw !== undefined) v += 7 * epsp(t - tw, 0.45) * 1.4 + 6 * epsp(t - tw - 0.55, 0.45) * 1.4;
    return v;
  };
}

function layout(f: Omit<WorldFrame, 't'>) {
  // 16:9: the soma on the left third, the scope on the right. 9:16: soma above, scope below.
  const cam: Cam = f.vertical
    ? {cx: 520 + (450 - 300) / 2.0, cy: 450 + (800 - 400) / 2.0, zoom: 2.0, rot: 0, W: f.W, H: f.H}
    : {cx: 520 + 380 / 2.2, cy: 450, zoom: 2.2, rot: 0, W: f.W, H: f.H};
  // 9:16: the subtitles and the platform's buttons cover the bottom ~25 %, so the
  // scope sits above them.
  const box = f.vertical ? {x: 50, y: 700, w: 800, h: 480} : {x: 860, y: 150, w: 680, h: 590};
  return {cam, box};
}

export const soma: World = {
  draw(c, f) {
    const {t} = f;
    ground(c, f.W, f.H);
    const {cam, box} = layout(f);
    const V = somaVoltage(f.ev, f.dur);
    const tf = f.ev.first('fire');
    const fired = tf !== undefined && t >= tf;
    const v = V(t);
    c.save();
    applyCam(c, cam);
    drawNeuron(c, fired ? Math.exp(-(t - tf!) * 2.5) : Math.max(0, Math.min(1, (v + 70) / 15)) * 0.45);
    arrivals(f.ev, f.dur).forEach((x, k) => {
      pulse(c, LEAF_PATHS[(k * 9 + 4) % LEAF_PATHS.length], (t - (x.t - TRAVEL)) / TRAVEL, x.a > 0 ? SPARK : BRAKE, 12);
    });
    const tw = f.ev.first('weak');
    if (tw !== undefined) for (let k = 0; k < 2; k++) pulse(c, LEAF_PATHS[(k * 13 + 6) % LEAF_PATHS.length], (t - (tw + k * 0.55 - TRAVEL)) / TRAVEL, SPARK, 12, 0.8);
    if (fired) {
      const d = (t - tf!) * 700;
      if (d < 900) {
        const pt = along(AXON_PATH, d / AXON_PATH.len);
        glow(c, pt.x, pt.y, 40, SPARK);
        glow(c, pt.x - 20, pt.y, 26, SPARK, 0.5);
      }
    }
    c.restore();
    const th = f.ev.first('threshold');
    scope(c, box, {t, dur: f.dur, V, threshold: th === undefined ? 1 : ss(th, th + 0.6, t)});
  },
  anchor(name, f) {
    const {cam, box} = layout(f);
    if (name === 'soma') return camPoint(cam, NEURON_POINTS.soma.x, NEURON_POINTS.soma.y);
    if (name === 'nucleus') return camPoint(cam, SOMA.x, SOMA.y);
    // Points on the scope (same geometry as scope()).
    const gx0 = box.x + 24;
    const gx1 = box.x + box.w - 24;
    const gy0 = box.y + 86;
    const gy1 = box.y + box.h - 30;
    const Y = (v: number) => gy1 - ((v + 90) / 140) * (gy1 - gy0);
    if (name === 'rest') return {x: gx0 + (gx1 - gx0) * 0.12, y: Y(-70), dx: 30, dy: 70};
    if (name === 'threshold') return {x: gx0 + (gx1 - gx0) * 0.3, y: Y(-55), dx: 20, dy: -110};
    if (name === 'spike') {
      const tf = f.ev.first('fire');
      if (tf === undefined || f.t < tf + 0.12) return null;
      return {x: gx0 + ((tf + 0.12) / f.dur) * (gx1 - gx0), y: Y(40), dx: 90, dy: 10};
    }
    return null;
  },
  sounds(f) {
    const out: {t: number; kind: 'spike' | 'tick'; gain?: number}[] = arrivals(f.ev, f.dur).map((x) => ({t: x.t, kind: 'tick' as const, gain: 0.8}));
    const tf = f.ev.first('fire');
    if (tf !== undefined) out.push({t: tf, kind: 'spike'});
    const tw = f.ev.first('weak');
    if (tw !== undefined) out.push({t: tw, kind: 'tick'}, {t: tw + 0.55, kind: 'tick'});
    return out;
  },
};
