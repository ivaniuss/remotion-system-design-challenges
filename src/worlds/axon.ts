import {glow, lerp, SODIUM, SPARK, ss, TAU, ground} from './kit';
import type {Events, World, WorldFrame} from './types';

// A stretch of axon, side-on. On top, a myelinated axon: white sheaths with small bare
// gaps (nodes of Ranvier) where the spike is regenerated, so it jumps node to node.
// Below (from `race` on), a bare axon where the same signal creeps along continuously.
// Events: `wave` (a spike runs along the top axon; it repeats every ~3 s), `race` (both
// start together: the jumping spike is gone while the bare one has barely moved).
// The bare axon's speed is NOT to scale: about 1 m/s vs 120 m/s would be invisible.

const GAP = 180; // node spacing, logical units
const RATE = 0.24; // seconds per jump
const SLOW = 34; // logical units per second on the bare axon

const geo = (f: Pick<WorldFrame, 'W' | 'H' | 'vertical'>) => {
  const nodes: number[] = [];
  for (let x = 60; x < f.W + GAP; x += GAP) nodes.push(x);
  return f.vertical ? {Y1: f.H * 0.36, Y2: f.H * 0.62, nodes} : {Y1: f.H * 0.42, Y2: f.H * 0.78, nodes};
};

function waves(ev: Events, dur: number): number[] {
  const out: number[] = [];
  for (const w of [...ev.all('wave'), ...ev.all('race')]) for (let s = w; s < dur; s += 3.1) out.push(s);
  return out.sort((a, b) => a - b);
}

export const axon: World = {
  draw(c, f) {
    const {t} = f;
    const {Y1, Y2, nodes} = geo(f);
    ground(c, f.W, f.H, '#0a0920', '#06050f');
    // other fibres, out of focus
    c.lineCap = 'round';
    for (let k = 0; k < 9; k++) {
      const y = f.H * (0.08 + k * 0.11) + (k % 2) * 30;
      if (Math.abs(y - Y1) < 70 || Math.abs(y - Y2) < 60) continue;
      c.strokeStyle = 'rgba(110,90,200,0.12)';
      c.lineWidth = 10;
      c.beginPath();
      for (let x = 0; x <= f.W; x += 20) c.lineTo(x, y + Math.sin(x * 0.004 + k) * 10);
      c.stroke();
    }
    // the myelinated axon
    c.strokeStyle = '#6a50c4';
    c.lineWidth = 18;
    c.beginPath();
    c.moveTo(-20, Y1);
    c.lineTo(f.W + 20, Y1);
    c.stroke();
    c.strokeStyle = 'rgba(190,170,255,0.6)';
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(-20, Y1);
    c.lineTo(f.W + 20, Y1);
    c.stroke();
    const W0 = waves(f.ev, f.dur);
    // the current under the sheath, between two nodes
    for (const w0 of W0) {
      const n = (t - w0) / RATE;
      if (n < 0 || n > nodes.length) continue;
      const k = Math.floor(n);
      if (k >= nodes.length - 1) continue;
      const xa = nodes[k];
      const xb = lerp(nodes[k], nodes[k + 1], n - k);
      const gr = c.createLinearGradient(xa, 0, xb + 0.01, 0);
      gr.addColorStop(0, 'rgba(255,210,122,0)');
      gr.addColorStop(1, 'rgba(255,210,122,0.55)');
      c.strokeStyle = gr;
      c.lineWidth = 8;
      c.beginPath();
      c.moveTo(xa, Y1);
      c.lineTo(xb, Y1);
      c.stroke();
    }
    for (let k = 0; k < nodes.length; k++) {
      const a = nodes[k] + 16;
      const b = nodes[k] + GAP - 16;
      c.strokeStyle = 'rgba(205,195,240,0.95)';
      c.lineWidth = 74;
      c.beginPath();
      c.moveTo(a + 30, Y1);
      c.lineTo(b - 30, Y1);
      c.stroke();
      c.strokeStyle = 'rgba(246,242,255,0.97)';
      c.lineWidth = 56;
      c.beginPath();
      c.moveTo(a + 30, Y1);
      c.lineTo(b - 30, Y1);
      c.stroke();
      // the wraps of the sheath
      c.strokeStyle = 'rgba(180,165,230,0.35)';
      c.lineWidth = 1.5;
      for (let r = -24; r <= 24; r += 8) {
        c.beginPath();
        c.moveTo(a + 20, Y1 + r);
        c.lineTo(b - 20, Y1 + r);
        c.stroke();
      }
    }
    // each node flashes as the spike is rebuilt there, with sodium rushing in
    for (const w0 of W0) {
      nodes.forEach((x, k) => {
        const dt = t - (w0 + k * RATE);
        if (dt < 0) return;
        glow(c, x, Y1, 130, SPARK, Math.exp(-dt * 4.5));
        if (dt < 0.5) {
          for (let m = 0; m < 6; m++) {
            const a = (m / 6) * TAU + k;
            const r = lerp(46, 6, dt / 0.5);
            c.fillStyle = `rgba(${SODIUM},${1 - dt / 0.5})`;
            c.beginPath();
            c.arc(x + Math.cos(a) * r, Y1 + Math.sin(a) * r, 4, 0, TAU);
            c.fill();
          }
        }
      });
    }
    // the bare axon
    const race = f.ev.first('race');
    const bare = race === undefined ? 0 : ss(race - 0.8, race, t);
    if (bare > 0) {
      c.save();
      c.globalAlpha = bare;
      c.strokeStyle = '#5d47a8';
      c.lineWidth = 12;
      c.beginPath();
      c.moveTo(-20, Y2);
      c.lineTo(f.W + 20, Y2);
      c.stroke();
      c.strokeStyle = 'rgba(190,170,255,0.5)';
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(-20, Y2);
      c.lineTo(f.W + 20, Y2);
      c.stroke();
      const front = 60 + Math.max(0, t - race!) * SLOW;
      if (t >= race!) for (let i = 0; i < 14; i++) {
        const x = front - i * 10;
        if (x < 40) break;
        glow(c, x, Y2, i ? 34 : 60, SPARK, i ? 0.3 * (1 - i / 14) : 1);
      }
      c.restore();
    }
  },
  anchor(name, f) {
    const {Y1, Y2, nodes} = geo(f);
    const race = f.ev.first('race');
    switch (name) {
      case 'axon':
        return {x: nodes[1] + 4, y: Y1 + 9, dx: -10, dy: 150};
      case 'myelin':
        return {x: nodes[3] + GAP / 2, y: Y1 + 34, dx: 30, dy: 130};
      case 'node':
        return {x: nodes[2], y: Y1 + 12, dx: 30, dy: 210};
      case 'fast':
        return {x: 70, y: Y1 - 40, dx: 0, dy: -70};
      case 'slow':
        return race === undefined || f.t < race - 0.4 ? null : {x: 70, y: Y2 - 10, dx: 0, dy: -70};
      default:
        return null;
    }
  },
  sounds(f) {
    const {nodes} = geo(f);
    const firsts = [...f.ev.all('wave'), ...f.ev.all('race')];
    return firsts.flatMap((w0) => nodes.map((_, k) => ({t: w0 + k * RATE, kind: 'tick' as const, gain: 0.55})));
  },
};
