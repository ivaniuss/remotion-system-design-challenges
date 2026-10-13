import {applyCam, Cam, eio, glow, ground, hash, lerp, onSeg, Seg, SPARK, strokeSeg, TAU} from './kit';
import type {World, WorldFrame} from './types';

// Many neurons, seen from afar: small cell bodies wired to their neighbours. Cells fire
// now and then on their own (dim); `cascade` starts a chain from the centre that spreads
// through the network, each cell passing it on after a short delay. The camera slowly
// pulls back to reveal more of it.

type Node = {x: number; y: number; stubs: {a: number; l: number}[]};
type Edge = {a: number; b: number; d: number; s: Seg; ok: boolean};

const COLS = 9;
const ROWS = 9;
const NODES: Node[] = [];
for (let j = 0; j < ROWS; j++)
  for (let i = 0; i < COLS; i++) {
    const k = j * COLS + i;
    NODES.push({
      x: -1200 + i * 300 + (hash(k, 1) - 0.5) * 170,
      y: -1200 + j * 300 + (hash(k, 2) - 0.5) * 170,
      stubs: [0, 1, 2, 3, 4].map((m) => ({a: hash(k, 10 + m) * TAU, l: 22 + hash(k, 20 + m) * 26})),
    });
  }
const EDGES: Edge[] = [];
NODES.forEach((n, i) => {
  const near = NODES.map((m, j) => ({j, d: Math.hypot(m.x - n.x, m.y - n.y)}))
    .filter((o) => o.j !== i)
    .sort((a, b) => a.d - b.d)
    .slice(0, 3);
  near.forEach((o, k) => {
    const m = NODES[o.j];
    const bend = (hash(i * 3 + k, 5) - 0.5) * 120;
    EDGES.push({
      a: i, b: o.j, d: o.d, ok: hash(i * 3 + k, 6) < 0.82,
      s: {x0: n.x, y0: n.y, x1: m.x, y1: m.y, cx: (n.x + m.x) / 2 + ((m.y - n.y) / o.d) * bend, cy: (n.y + m.y) / 2 - ((m.x - n.x) / o.d) * bend},
    });
  });
});
const SPEED = 650; // world units per second along an axon
// Delay from the centre cell to every other cell (shortest path), computed once.
const SEED = NODES.reduce((best, n, i) => (Math.hypot(n.x, n.y) < Math.hypot(NODES[best].x, NODES[best].y) ? i : best), 0);
const DELAY = NODES.map(() => Infinity);
DELAY[SEED] = 0;
for (let it = 0; it < 80; it++)
  for (const e of EDGES) {
    if (!e.ok) continue;
    const d = DELAY[e.a] + e.d / SPEED + 0.1;
    if (d < DELAY[e.b]) DELAY[e.b] = d;
  }

type Firing = {t: number; w: number};
function firings(f: Omit<WorldFrame, 't'>): Firing[][] {
  const tc = f.ev.first('cascade');
  return NODES.map((_, i) => {
    const out: Firing[] = [];
    // spontaneous activity
    const period = 2.6 + hash(i, 7) * 4;
    for (let s = hash(i, 8) * period - period; s < f.dur; s += period) out.push({t: s, w: 0.45});
    if (tc !== undefined && DELAY[i] < 99) {
      out.push({t: tc + DELAY[i], w: 1});
      out.push({t: tc + DELAY[i] + 2.4 + hash(i, 9) * 2.2, w: 0.8});
    }
    return out;
  });
}

const camOf = (f: WorldFrame): Cam => ({cx: Math.sin(f.t * 0.15) * 40, cy: Math.cos(f.t * 0.11) * 30, zoom: lerp(1.15, 0.7, eio(f.t / Math.max(1, f.dur))), rot: 0, W: f.W, H: f.H});

export const network: World = {
  draw(c, f) {
    const {t} = f;
    ground(c, f.W, f.H);
    // a far layer, out of focus, for depth
    c.save();
    applyCam(c, {...camOf(f), zoom: camOf(f).zoom * 0.5, cx: 300, cy: 200});
    c.strokeStyle = 'rgba(140,115,230,0.10)';
    c.lineWidth = 4;
    for (const e of EDGES) strokeSeg(c, e.s);
    c.restore();
    c.save();
    applyCam(c, camOf(f));
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(140,115,230,0.32)';
    c.lineWidth = 2;
    for (const e of EDGES) strokeSeg(c, e.s);
    c.strokeStyle = 'rgba(150,125,240,0.6)';
    c.lineWidth = 3.5;
    c.beginPath();
    for (const n of NODES)
      for (const s of n.stubs) {
        c.moveTo(n.x, n.y);
        c.lineTo(n.x + Math.cos(s.a) * s.l, n.y + Math.sin(s.a) * s.l);
      }
    c.stroke();
    c.fillStyle = 'rgba(170,145,250,0.9)';
    c.beginPath();
    for (const n of NODES) {
      c.moveTo(n.x + 11, n.y);
      c.arc(n.x, n.y, 11, 0, TAU);
    }
    c.fill();
    const fire = firings(f);
    // spikes travelling along the axons
    for (const e of EDGES) {
      const d = e.d / SPEED;
      for (const ft of fire[e.a]) {
        const u = (t - ft.t - 0.04) / d;
        if (u > 0 && u < 1) {
          const p = onSeg(e.s, u);
          glow(c, p.x, p.y, 26, SPARK, 0.9 * ft.w);
        }
      }
    }
    // cells flash when they fire
    NODES.forEach((n, i) => {
      for (const ft of fire[i]) {
        const dt = t - ft.t;
        if (dt >= 0 && dt < 2) glow(c, n.x, n.y, 90, SPARK, Math.exp(-dt * 3.2) * ft.w);
      }
    });
    c.restore();
  },
  anchor(name, f) {
    return name === 'center' ? {x: f.W / 2, y: f.H / 2, dx: 0, dy: -160} : null;
  },
  sounds(f) {
    const tc = f.ev.first('cascade');
    if (tc === undefined) return [];
    return DELAY.map((d) => d)
      .filter((d) => d < 99)
      .sort((a, b) => a - b)
      .slice(0, 14)
      .map((d) => ({t: tc + d, kind: 'tick' as const, gain: 0.5}));
  },
};
