import {applyCam, blendCam, BRAKE, Cam, camPoint, eio, ground, glow, pulse, SPARK, clamp} from './kit';
import {AXON_PATH, drawNeuron, LEAF_PATHS, NEURON_POINTS, SOMA} from './neuronBody';
import type {World, WorldFrame} from './types';
import {along} from './kit';

// The whole cell. The camera starts on the full neuron and moves in when the story
// does: `dendrites` (to the branches), `soma` (to the cell body). `go` and `brake` send
// bursts of exciting (amber) and inhibiting (blue) inputs down the branches; the soma
// lights up as they add up; `fire` sends a spike down the axon.

type View = Omit<Cam, 'W' | 'H'>;
const MOVE = 1.8; // seconds a camera move takes

function views(vertical: boolean): Record<'whole' | 'dendrites' | 'soma', View> {
  // In 9:16 the cell stands up: dendrites on top, axon going down.
  const rot = vertical ? Math.PI / 2 : 0;
  return {
    whole: {cx: 815, cy: 450, zoom: vertical ? 1.04 : 0.98, rot},
    dendrites: {cx: vertical ? 360 : 330, cy: 450, zoom: vertical ? 1.75 : 1.9, rot},
    soma: {cx: 560, cy: 450, zoom: 2.3, rot},
  };
}

function camAt(f: Omit<WorldFrame, 't'>, t: number): Cam {
  const V = views(f.vertical);
  let cam: View = V.whole;
  const moves: {at: number; to: View}[] = [];
  const d = f.ev.first('dendrites');
  const s = f.ev.first('soma');
  if (d !== undefined) moves.push({at: d, to: V.dendrites});
  if (s !== undefined) moves.push({at: s, to: V.soma});
  moves.sort((a, b) => a.at - b.at);
  for (const m of moves) if (t >= m.at) cam = blendCam(cam, m.to, eio((t - m.at) / MOVE));
  // a slow breath so the frame is never frozen
  return {...cam, cx: cam.cx + Math.sin(t * 0.21) * 6, cy: cam.cy + Math.cos(t * 0.17) * 4, W: f.W, H: f.H};
}

const TRAVEL = 1.5; // seconds an input takes from a tip to the soma

type Input = {start: number; path: number; inh: boolean};
function inputs(f: Omit<WorldFrame, 't'>): Input[] {
  const out: Input[] = [];
  for (const g of f.ev.all('go')) for (let i = 0; i < 7; i++) out.push({start: g + i * 0.22, path: (i * 7 + 2) % LEAF_PATHS.length, inh: false});
  for (const b of f.ev.all('brake')) for (let i = 0; i < 5; i++) out.push({start: b + i * 0.26, path: (i * 5 + 11) % LEAF_PATHS.length, inh: true});
  return out;
}

export const neuron: World = {
  draw(c, f) {
    const {t} = f;
    ground(c, f.W, f.H);
    const cam = camAt(f, t);
    c.save();
    applyCam(c, cam);
    // How excited the soma is: recent arrivals add up and fade.
    let sum = 0;
    for (const p of inputs(f)) {
      const dt = t - (p.start + TRAVEL);
      if (dt > 0) sum += (p.inh ? -0.12 : 0.2) * Math.exp(-dt / 1.6);
    }
    const fire = f.ev.first('fire');
    const fired = fire !== undefined && t >= fire;
    const somaGlow = fired ? Math.max(clamp(sum, 0, 0.6), Math.exp(-(t - fire!) * 2.4)) : clamp(sum, 0, 0.6);
    drawNeuron(c, somaGlow);
    // ambient traffic: the cell is never quiet
    for (let k = 0; k < 6; k++) {
      const u = ((t + k * 0.53) % 2.6) / TRAVEL;
      pulse(c, LEAF_PATHS[(k * 7) % LEAF_PATHS.length], u, SPARK, 11, 0.55);
    }
    for (const p of inputs(f)) pulse(c, LEAF_PATHS[p.path], (t - p.start) / TRAVEL, p.inh ? BRAKE : SPARK, 13);
    if (fired) {
      const u = (t - fire!) / 0.9;
      if (u < 1) {
        const pt = along(AXON_PATH, u);
        glow(c, pt.x, pt.y, 40, SPARK);
        glow(c, pt.x - 20, pt.y, 26, SPARK, 0.5);
      }
    }
    // dust in the tissue, drifting slowly (world space, so it parallaxes with the camera)
    for (let k = 0; k < 40; k++) {
      const x = ((k * 397) % 1700) - 50 + Math.sin(t * 0.3 + k) * 14;
      const y = ((k * 211) % 980) - 40 + Math.cos(t * 0.25 + k * 1.7) * 10;
      glow(c, x, y, 5 + (k % 3) * 2, '200,180,255', 0.12);
    }
    c.restore();
    if (somaGlow > 0.2) {
      const p = camPoint(cam, SOMA.x, SOMA.y);
      glow(c, p.x, p.y, 260, SPARK, (somaGlow - 0.2) * 0.25);
    }
  },
  anchor(name, f) {
    const p = NEURON_POINTS[name];
    if (!p) return null;
    return camPoint(camAt(f, f.t), p.x, p.y);
  },
  sounds(f) {
    const out: {t: number; kind: 'spike' | 'tick'; gain?: number}[] = inputs(f).map((p) => ({t: p.start + TRAVEL, kind: 'tick' as const, gain: p.inh ? 0.6 : 0.9}));
    const fire = f.ev.first('fire');
    if (fire !== undefined) out.push({t: fire, kind: 'spike'});
    return out;
  },
};
