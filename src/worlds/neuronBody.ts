import {FONT} from '../theme';
import {glow, mkPath, mulberry, onSeg, Path, PI, Pt, Seg, SPARK, strokeSeg, TAU} from './kit';

// One neuron, drawn in its own space (about 1600×900, soma on the left, axon to the
// right). Built once from a fixed seed, so every video gets the same cell. Used by the
// `neuron` and `soma` worlds.

export const SOMA = {x: 520, y: 450, r: 58};

type Branch = Seg & {w: number; depth: number; parent: number; leaf: boolean};
const rnd = mulberry(11);
export const DEND: Branch[] = [];
function grow(x: number, y: number, ang: number, len: number, w: number, depth: number, parent: number) {
  const x1 = x + Math.cos(ang) * len;
  const y1 = y + Math.sin(ang) * len;
  const bend = (rnd() - 0.5) * len * 0.5;
  const seg: Branch = {
    x0: x, y0: y, x1, y1,
    cx: (x + x1) / 2 + Math.cos(ang + PI / 2) * bend,
    cy: (y + y1) / 2 + Math.sin(ang + PI / 2) * bend,
    w, depth, parent, leaf: false,
  };
  const id = DEND.push(seg) - 1;
  if (depth < 4) {
    const n = depth < 1 ? 2 : rnd() < 0.72 ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const a = ang + (n === 1 ? (rnd() - 0.5) * 0.5 : (k ? 1 : -1) * (0.3 + rnd() * 0.35));
      grow(x1, y1, a, len * (0.72 + rnd() * 0.14), w * 0.68, depth + 1, id);
    }
  } else seg.leaf = true;
}
for (const a of [PI, PI * 0.8, PI * 1.2, PI * 0.6, PI * 1.4, PI * 1.6, PI * 0.42]) {
  grow(SOMA.x + Math.cos(a) * SOMA.r * 0.8, SOMA.y + Math.sin(a) * SOMA.r * 0.8, a + (rnd() - 0.5) * 0.2, 105 + rnd() * 30, 15, 0, -1);
}

// Dendritic spines: tiny stalks with a knob, where most inputs land.
const SPINES: {x0: number; y0: number; x1: number; y1: number}[] = [];
for (const s of DEND) {
  if (s.depth < 1) continue;
  const L = Math.hypot(s.x1 - s.x0, s.y1 - s.y0);
  const n = Math.floor(L / 20);
  for (let k = 0; k < n; k++) {
    const u = (k + 0.5) / n;
    const p = onSeg(s, u);
    const q = onSeg(s, Math.min(1, u + 0.02));
    const a = Math.atan2(q.y - p.y, q.x - p.x) + (k % 2 ? PI / 2 : -PI / 2);
    const r = s.w / 2;
    SPINES.push({x0: p.x + Math.cos(a) * r, y0: p.y + Math.sin(a) * r, x1: p.x + Math.cos(a) * (r + 7), y1: p.y + Math.sin(a) * (r + 7)});
  }
}

// From each dendrite tip to the soma: the road an input travels.
export const LEAF_PATHS: Path[] = DEND.map((s, i) => (s.leaf ? i : -1))
  .filter((i) => i >= 0)
  .map((id) => {
    const pts: Pt[] = [];
    let cur = id;
    while (cur !== -1) {
      const s = DEND[cur];
      for (let k = 8; k >= 0; k--) pts.push(onSeg(s, k / 8));
      cur = s.parent;
    }
    pts.push({x: SOMA.x, y: SOMA.y});
    return mkPath(pts);
  });

export const axonY = (x: number) => 450 + Math.sin((x - 640) * 0.006) * 22;
const AXON_END = 1380;
export const MYELIN: [number, number][] = [];
for (let x = 672; x + 78 <= 1335; x += 92) MYELIN.push([x, x + 78]);
export const TERMINALS: Pt[] = [
  {x: 1478, y: 352}, {x: 1512, y: 418}, {x: 1524, y: 482}, {x: 1498, y: 548}, {x: 1452, y: 604},
];
export const AXON_PATH: Path = (() => {
  const pts: Pt[] = [];
  for (let x = SOMA.x + SOMA.r * 0.8; x <= AXON_END; x += 10) pts.push({x, y: axonY(x)});
  return mkPath(pts);
})();

// Named points of the cell, in its own space.
export const NEURON_POINTS: Record<string, Pt> = {
  dendrites: LEAF_PATHS[3].pts[4],
  soma: {x: SOMA.x, y: SOMA.y + SOMA.r},
  nucleus: {x: SOMA.x - 6, y: SOMA.y - 4},
  axon: {x: 760, y: axonY(760)},
  myelin: {x: 1050, y: axonY(1050) + 12},
  terminals: TERMINALS[0],
};

function axonStroke(c: CanvasRenderingContext2D, x0: number, x1: number) {
  c.beginPath();
  c.moveTo(x0, axonY(x0));
  for (let x = x0 + 8; x < x1; x += 8) c.lineTo(x, axonY(x));
  c.lineTo(x1, axonY(x1));
  c.stroke();
}

export function drawNeuron(c: CanvasRenderingContext2D, somaGlow = 0) {
  c.lineCap = 'round';
  c.lineJoin = 'round';
  // halo
  c.strokeStyle = 'rgba(120,90,230,0.09)';
  for (const s of DEND) {
    c.lineWidth = s.w * 2.6 + 8;
    strokeSeg(c, s);
  }
  c.lineWidth = 30;
  axonStroke(c, 640, AXON_END);
  // spines
  c.strokeStyle = '#7c62d8';
  c.lineWidth = 2.2;
  c.beginPath();
  for (const s of SPINES) {
    c.moveTo(s.x0, s.y0);
    c.lineTo(s.x1, s.y1);
  }
  c.stroke();
  c.fillStyle = '#a58cf5';
  c.beginPath();
  for (const s of SPINES) {
    c.moveTo(s.x1 + 2.6, s.y1);
    c.arc(s.x1, s.y1, 2.6, 0, TAU);
  }
  c.fill();
  // dendrites: body, then a highlight down the middle
  c.strokeStyle = '#6a50c4';
  for (const s of DEND) {
    c.lineWidth = s.w;
    strokeSeg(c, s);
  }
  c.strokeStyle = 'rgba(190,170,255,0.65)';
  for (const s of DEND) {
    c.lineWidth = Math.max(1, s.w * 0.32);
    strokeSeg(c, s);
  }
  // terminals
  const ey = axonY(AXON_END);
  c.strokeStyle = '#6a50c4';
  c.lineWidth = 7;
  for (const t of TERMINALS) {
    c.beginPath();
    c.moveTo(AXON_END, ey);
    c.quadraticCurveTo((AXON_END + t.x) / 2, ey + (t.y - ey) * 0.2, t.x, t.y);
    c.stroke();
  }
  c.fillStyle = '#b49cff';
  for (const t of TERMINALS) {
    c.beginPath();
    c.arc(t.x, t.y, 11, 0, TAU);
    c.fill();
  }
  // axon hillock + axon
  c.fillStyle = '#6f56cc';
  c.beginPath();
  c.moveTo(SOMA.x + SOMA.r * 0.7, SOMA.y - 26);
  c.quadraticCurveTo(600, SOMA.y - 10, 650, axonY(650) - 6);
  c.lineTo(650, axonY(650) + 6);
  c.quadraticCurveTo(600, SOMA.y + 10, SOMA.x + SOMA.r * 0.7, SOMA.y + 26);
  c.fill();
  c.strokeStyle = '#6a50c4';
  c.lineWidth = 12;
  axonStroke(c, 640, AXON_END);
  c.strokeStyle = 'rgba(190,170,255,0.65)';
  c.lineWidth = 4;
  axonStroke(c, 640, AXON_END);
  // myelin sheaths
  for (const [a, b] of MYELIN) {
    c.strokeStyle = 'rgba(205,195,240,0.92)';
    c.lineWidth = 30;
    axonStroke(c, a + 12, b - 12);
    c.strokeStyle = 'rgba(246,242,255,0.95)';
    c.lineWidth = 17;
    axonStroke(c, a + 12, b - 12);
  }
  // soma, nucleus, nucleolus
  const g = c.createRadialGradient(SOMA.x - 18, SOMA.y - 20, 4, SOMA.x, SOMA.y, SOMA.r * 1.15);
  g.addColorStop(0, '#cdb8ff');
  g.addColorStop(1, '#5a42ad');
  c.fillStyle = g;
  c.beginPath();
  for (let k = 0; k <= 48; k++) {
    const th = (k / 48) * TAU;
    const r = SOMA.r * (1 + 0.08 * Math.sin(3 * th + 1) + 0.05 * Math.sin(5 * th));
    const x = SOMA.x + Math.cos(th) * r;
    const y = SOMA.y + Math.sin(th) * r;
    if (k) c.lineTo(x, y);
    else c.moveTo(x, y);
  }
  c.fill();
  c.fillStyle = '#3a2a78';
  c.beginPath();
  c.arc(SOMA.x - 6, SOMA.y - 4, 24, 0, TAU);
  c.fill();
  c.fillStyle = '#22184d';
  c.beginPath();
  c.arc(SOMA.x - 1, SOMA.y - 9, 7, 0, TAU);
  c.fill();
  if (somaGlow > 0) glow(c, SOMA.x, SOMA.y, 190, SPARK, somaGlow);
}

// An oscilloscope panel: membrane voltage over the shot, with the resting line and the
// threshold. Draws in logical screen units. Returns the panel's coordinate helpers.
export type Scope = {X: (t: number) => number; Y: (v: number) => number; gx0: number; gx1: number};
export function scope(
  c: CanvasRenderingContext2D,
  box: {x: number; y: number; w: number; h: number},
  o: {t: number; dur: number; V: (t: number) => number; threshold: number; small?: boolean},
): Scope {
  const {x, y, w, h} = box;
  c.fillStyle = o.small ? 'rgba(8,6,22,0.93)' : 'rgba(8,6,22,0.82)';
  c.fillRect(x, y, w, h);
  c.strokeStyle = 'rgba(160,140,240,0.35)';
  c.lineWidth = 1.5;
  c.strokeRect(x, y, w, h);
  const pad = o.small ? 16 : 24;
  const gx0 = x + pad;
  const gx1 = x + w - pad;
  const gy0 = y + (o.small ? 52 : 86);
  const gy1 = y + h - (o.small ? 18 : 30);
  const Y = (v: number) => gy1 - ((v + 90) / 140) * (gy1 - gy0);
  const X = (tt: number) => gx0 + (tt / o.dur) * (gx1 - gx0);
  const fs = o.small ? 15 : 19;
  const line = (v: number, dash: number[], col: string, label: string | null, alpha = 1) => {
    if (alpha <= 0) return;
    c.save();
    c.globalAlpha *= alpha;
    c.strokeStyle = col;
    c.setLineDash(dash);
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(gx0, Y(v));
    c.lineTo(gx1, Y(v));
    c.stroke();
    c.setLineDash([]);
    if (label) {
      c.font = `400 ${fs}px ${FONT.mono}`;
      c.fillStyle = col;
      c.textAlign = 'right';
      c.textBaseline = 'bottom';
      c.fillText(label, gx1, Y(v) - 4);
    }
    c.restore();
  };
  line(0, [], 'rgba(200,190,255,0.18)', o.small ? null : '0');
  line(-70, [], 'rgba(200,190,255,0.55)', '−70');
  line(-55, [8, 7], 'rgba(255,195,90,0.85)', '−55', o.threshold);
  // the trace
  c.beginPath();
  const step = o.dur / 400;
  for (let tt = 0; tt <= o.t + 1e-6; tt += step) {
    const px = X(tt);
    const py = Y(o.V(tt));
    if (tt === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.strokeStyle = 'rgba(255,210,122,0.25)';
  c.lineWidth = 8;
  c.stroke();
  c.strokeStyle = '#ffd27a';
  c.lineWidth = 2.6;
  c.stroke();
  const v = o.V(o.t);
  glow(c, X(o.t), Y(v), 24, SPARK);
  // live readout
  c.font = `500 ${o.small ? 26 : 44}px ${FONT.mono}`;
  c.fillStyle = v > -55 ? '#ffd27a' : '#ebe7fb';
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  const r = Math.round(v);
  c.fillText(`${r > 0 ? '+' : r < 0 ? '−' : ''}${Math.abs(r)} mV`, gx0, y + (o.small ? 28 : 44));
  return {X, Y, gx0, gx1};
}
