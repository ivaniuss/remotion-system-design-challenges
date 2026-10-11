// A neuron drawn top to bottom (dendrites up, terminals down, then the next cell's membrane) for
// science explainers. Ported from the "chispa" short film: same seeded dendrite tree, violet cell,
// amber signal. Pure function of props: regions light up via `glow`, unlit ones fade via `dim`, and
// `frame` drives the ambient pulses (inputs running toward the cell body, the signal hopping from
// gap to gap, vesicles releasing). Nothing animates in a region that is not lit, except the faint
// pulses on the dendrites that make the cell look alive.
import React from 'react';

export const NEURON_VIEWBOX = {w: 620, h: 1110} as const;
export const NEURON_REGIONS = ['dendrites', 'soma', 'axon', 'myelin', 'node', 'terminals', 'gap', 'next'] as const;
export type NeuronRegion = (typeof NEURON_REGIONS)[number];

type Pt = {x: number; y: number};
const TAU = Math.PI * 2;
const f = (n: number) => Math.round(n * 10) / 10;
const clamp = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hash = (i: number, j: number) => {
  let h = (Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
const mulberry = (a: number) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// ---------------------------------------------------------------- geometry
const CX = 310;
const SOMA = {x: CX, y: 360, r: 52};
const axonX = (y: number) => CX + Math.sin((y - 410) * 0.012) * 15;

// Myelin sheaths along the axon, with a gap (node of Ranvier) between neighbours.
const SHEATHS = [0, 1, 2, 3, 4].map((k) => ({y0: 470 + 80 * k, y1: 534 + 80 * k}));
const NODES = [0, 1, 2, 3].map((k) => 542 + 80 * k);
const AXON_END = 900; // where the axon splits into terminals

// Dendrite tree: the seeded generator of the film, pointing up.
type Seg = {x0: number; y0: number; cx: number; cy: number; x1: number; y1: number; w: number; depth: number; parent: number; leaf: boolean};
const rnd = mulberry(11);
const DEND: Seg[] = [];
function grow(x: number, y: number, ang: number, len: number, w: number, depth: number, parent: number): number {
  const x1 = x + Math.cos(ang) * len;
  const y1 = y + Math.sin(ang) * len;
  const bend = (rnd() - 0.5) * len * 0.5;
  const seg: Seg = {x0: x, y0: y, cx: (x + x1) / 2 + Math.cos(ang + Math.PI / 2) * bend, cy: (y + y1) / 2 + Math.sin(ang + Math.PI / 2) * bend, x1, y1, w, depth, parent, leaf: false};
  const id = DEND.push(seg) - 1;
  if (depth < 4) {
    const n = depth < 1 ? 2 : rnd() < 0.72 ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const a = ang + (n === 1 ? (rnd() - 0.5) * 0.5 : (k ? 1 : -1) * (0.3 + rnd() * 0.35));
      grow(x1, y1, a, len * (0.72 + rnd() * 0.14), w * 0.68, depth + 1, id);
    }
  } else seg.leaf = true;
  return id;
}
[-2.95, -2.45, -2.0, -1.571, -1.14, -0.69, -0.19].forEach((a) => {
  const ang = a + (rnd() - 0.5) * 0.2;
  grow(SOMA.x + Math.cos(a) * SOMA.r * 0.8, SOMA.y + Math.sin(a) * SOMA.r * 0.8, ang, 64 + rnd() * 18, 14, 0, -1);
});
const bzp = (s: Seg, u: number): Pt => {
  const v = 1 - u;
  return {x: v * v * s.x0 + 2 * v * u * s.cx + u * u * s.x1, y: v * v * s.y0 + 2 * v * u * s.cy + u * u * s.y1};
};
const segD = (s: Seg) => `M${f(s.x0)} ${f(s.y0)}Q${f(s.cx)} ${f(s.cy)} ${f(s.x1)} ${f(s.y1)}`;

// Spines: tiny stubs along the finer branches.
const SPINES: {x0: number; y0: number; x1: number; y1: number}[] = [];
DEND.forEach((s) => {
  if (s.depth < 1) return;
  const L = Math.hypot(s.x1 - s.x0, s.y1 - s.y0);
  const n = Math.floor(L / 22);
  for (let k = 0; k < n; k++) {
    const u = (k + 0.5) / n;
    const p = bzp(s, u);
    const q = bzp(s, Math.min(1, u + 0.02));
    const a = Math.atan2(q.y - p.y, q.x - p.x) + (k % 2 ? Math.PI / 2 : -Math.PI / 2);
    const r = s.w / 2;
    SPINES.push({x0: p.x + Math.cos(a) * r, y0: p.y + Math.sin(a) * r, x1: p.x + Math.cos(a) * (r + 7), y1: p.y + Math.sin(a) * (r + 7)});
  }
});

// Polylines (leaf -> cell body) the input pulses run along.
type Path = {pts: Pt[]; cum: number[]; len: number};
const mkPath = (pts: Pt[]): Path => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return {pts, cum, len: cum[cum.length - 1]};
};
const pathAt = (P: Path, u: number): Pt => {
  const d = clamp(u) * P.len;
  let i = 1;
  while (i < P.cum.length - 1 && P.cum[i] < d) i++;
  const a = P.pts[i - 1];
  const b = P.pts[i];
  const k = (d - P.cum[i - 1]) / Math.max(1e-6, P.cum[i] - P.cum[i - 1]);
  return {x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k)};
};
const LEAF_PATHS: Path[] = DEND.map((s, i) => (s.leaf ? i : -1))
  .filter((i) => i >= 0)
  .map((leafId) => {
    const pts: Pt[] = [];
    let id = leafId;
    while (id !== -1) {
      const s = DEND[id];
      for (let k = 8; k >= 0; k--) pts.push(bzp(s, k / 8));
      id = s.parent;
    }
    pts.push({x: SOMA.x, y: SOMA.y});
    return mkPath(pts);
  });
// The two signals of the "go / brake" beat: the longest path on each side of the cell.
const pickLeaf = (left: boolean) => {
  const cand = LEAF_PATHS.filter((p) => (p.pts[0].x < CX) === left).sort((a, b) => b.len - a.len);
  return cand[0] ?? LEAF_PATHS[0];
};
const LEAF_GO = pickLeaf(true);
const LEAF_BRAKE = pickLeaf(false);

// The axon as a polyline (hillock -> split), for the travelling signal.
const axonPts = (y0: number, y1: number): Pt[] => {
  const out: Pt[] = [];
  for (let y = y0; y < y1; y += 8) out.push({x: axonX(y), y});
  out.push({x: axonX(y1), y: y1});
  return out;
};
const axonD = (y0: number, y1: number) => axonPts(y0, y1).map((p, i) => `${i ? 'L' : 'M'}${f(p.x)} ${f(p.y)}`).join('');
const AXON_PATH = mkPath([{x: SOMA.x, y: SOMA.y}, ...axonPts(430, AXON_END)]);

// Terminals: one large bulb straight below the axon, two small ones beside it.
const BULB = {x: CX, y: 986, rx: 76, ry: 46};
const SIDE_BULBS = [{x: 150, y: 950, r: 24}, {x: 470, y: 950, r: 24}];
// The next cell's membrane: y at a given x (a shallow arch), and the body below it.
const memY = (x: number) => {
  const u = (x + 10) / 640;
  return 1075 - 90 * u * (1 - u);
};
const MEM_TOP = memY(CX);
// The arch continues beyond the drawing so the next cell bleeds off the frame when the camera zooms.
const MEM_X0 = -440;
const MEM_X1 = 1060;
const RECEPTORS = [-5, -3, -1, 1, 3, 5].map((k) => CX + k * 36);
const VESICLES = [
  {x: CX - 40, y: 972}, {x: CX + 6, y: 962}, {x: CX + 46, y: 978}, {x: CX - 12, y: 996}, {x: CX + 28, y: 1006}, {x: CX - 58, y: 1000}, {x: CX + 62, y: 998},
];

export const NEURON_ANCHORS: Record<NeuronRegion, Pt> = {
  dendrites: pathAt(LEAF_GO, 0.5),
  soma: {x: CX + 20, y: SOMA.y},
  axon: {x: axonX(878), y: 878},
  myelin: {x: axonX(582), y: 582},
  node: {x: axonX(NODES[2]), y: NODES[2]},
  terminals: {x: CX, y: BULB.y},
  gap: {x: CX + 40, y: (BULB.y + BULB.ry + MEM_TOP) / 2},
  next: {x: 150, y: memY(150) + 8},
};

// Where a travelling signal goes, region to region (figure coordinates).
export function neuronRoute(from: string, to: string, variant: number): Pt[] {
  if (from === 'dendrites' && to === 'soma') return (variant % 2 === 0 ? LEAF_GO : LEAF_BRAKE).pts;
  if (from === 'soma' && (to === 'terminals' || to === 'axon' || to === 'node' || to === 'myelin')) {
    const end = to === 'terminals' ? AXON_END : NEURON_ANCHORS[to as NeuronRegion].y;
    return [{x: SOMA.x, y: SOMA.y}, ...axonPts(430, end), ...(to === 'terminals' ? [{x: BULB.x, y: BULB.y - 20}] : [])];
  }
  if (from === 'terminals' && to === 'next') return [{x: BULB.x, y: BULB.y + 10}, {x: BULB.x, y: MEM_TOP - 4}, {x: BULB.x, y: MEM_TOP + 6}];
  const a = NEURON_ANCHORS[from as NeuronRegion] ?? {x: CX, y: 500};
  const b = NEURON_ANCHORS[to as NeuronRegion] ?? {x: CX, y: 500};
  return [a, b];
}

// ---------------------------------------------------------------- palette
type Pal = {base: string; lit: string; halo: string};
const PAL: Record<NeuronRegion, Pal> = {
  dendrites: {base: '#6A50C4', lit: '#A58CF5', halo: '#8A5CFF'},
  soma: {base: '#7C62D8', lit: '#C2A8FF', halo: '#A67CFF'},
  axon: {base: '#6A50C4', lit: '#9C84F0', halo: '#FFB43C'},
  myelin: {base: '#E6DEFB', lit: '#FFFFFF', halo: '#FFD27A'},
  node: {base: '#6A50C4', lit: '#FFD27A', halo: '#FFB43C'},
  terminals: {base: '#A98FF5', lit: '#D8C8FF', halo: '#FF7AA8'},
  gap: {base: '#FFD27A', lit: '#FFD27A', halo: '#FFB43C'},
  next: {base: '#3D3088', lit: '#5C4AC0', halo: '#FF7AA8'},
};
const AMBER = '255,210,122';
const PINK = '255,122,168';
const CALCIUM = '185,228,255';
const OUTLINE = '#2A1B66';

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const toHex = (v: number[]) => '#' + v.map((x) => Math.round(clamp(x, 0, 255)).toString(16).padStart(2, '0')).join('');
const mix = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  return toHex(A.map((x, i) => x + (B[i] - x) * t));
};
const PHASE: Record<NeuronRegion, number> = {dendrites: 0, soma: 1.3, axon: 2.6, myelin: 3.9, node: 5.2, terminals: 0.7, gap: 2, next: 3.1};

type Look = {g: number; fade: number; op: number; fill: string};
const look = (r: NeuronRegion, glow: number, dim: number, frame: number): Look => {
  const g0 = clamp(glow);
  const g = g0 > 0 ? g0 * (0.92 + 0.08 * Math.sin((frame / 48) * TAU + PHASE[r])) : 0;
  const fade = clamp(dim) * (1 - clamp(g0 / 0.3));
  return {g, fade, op: 1 - 0.62 * fade, fill: mix(PAL[r].base, PAL[r].lit, g)};
};

const stroke = {fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};

// ---------------------------------------------------------------- component
export const NeuronFigure: React.FC<{glow?: Partial<Record<NeuronRegion, number>>; dim?: number; frame: number}> = ({glow = {}, dim = 0, frame}) => {
  const time = frame / 30;
  const L = {} as Record<NeuronRegion, Look>;
  for (const r of NEURON_REGIONS) L[r] = look(r, glow[r] ?? 0, dim, frame);
  const spot = (x: number, y: number, r: number, rgb: string, a: number, key: string) =>
    a > 0.01 ? <circle key={key} cx={f(x)} cy={f(y)} r={r} fill={`url(#nf-glow-${rgb === PINK ? 'pink' : rgb === CALCIUM ? 'calcium' : 'amber'})`} opacity={clamp(a)} /> : null;

  // Shapes that get a halo when their region is lit (drawn blurred, behind everything).
  const haloShape = (r: NeuronRegion): React.ReactNode => {
    const c = PAL[r].halo;
    switch (r) {
      case 'dendrites':
        return <g {...stroke} stroke={c}>{DEND.map((s, i) => <path key={i} d={segD(s)} strokeWidth={s.w + 18} />)}</g>;
      case 'soma':
        return <circle cx={SOMA.x} cy={SOMA.y} r={SOMA.r + 18} fill={c} />;
      case 'axon':
        return <path d={axonD(430, AXON_END)} {...stroke} stroke={c} strokeWidth={34} />;
      case 'myelin':
        return <g {...stroke} stroke={c}>{SHEATHS.map((s, i) => <path key={i} d={axonD(s.y0 + 6, s.y1 - 6)} strokeWidth={56} />)}</g>;
      case 'node':
        return <g fill={c}>{NODES.map((y) => <ellipse key={y} cx={axonX(y)} cy={y} rx={38} ry={22} />)}</g>;
      case 'terminals':
        return (
          <g fill={c}>
            <ellipse cx={BULB.x} cy={BULB.y} rx={BULB.rx + 12} ry={BULB.ry + 12} />
            {SIDE_BULBS.map((b, i) => <circle key={i} cx={b.x} cy={b.y} r={b.r + 12} />)}
          </g>
        );
      case 'gap':
        return <rect x={CX - 190} y={BULB.y + BULB.ry - 2} width={380} height={MEM_TOP - BULB.y - BULB.ry + 8} rx={10} fill={c} />;
      case 'next':
        return <path d={`M-10 1075 Q${CX} ${2 * MEM_TOP - 1075} 630 1075`} {...stroke} stroke={c} strokeWidth={34} />;
    }
  };

  // ---- ambient animation
  // Inputs running toward the cell body (always faintly on; stronger when the dendrites are lit).
  const dendAmb = 0.4 + 0.6 * clamp(glow.dendrites ?? 0);
  const inputPulses: React.ReactNode[] = [];
  for (let k = 0; k < 6; k++) {
    const per = 2.6;
    const u = ((time + k * 0.53) % per) / 1.5;
    if (u > 1) continue;
    const P = LEAF_PATHS[(k * 7) % LEAF_PATHS.length];
    for (let i = 4; i >= 0; i--) {
      const p = pathAt(P, u - i * 0.03);
      inputPulses.push(spot(p.x, p.y, i ? 11 : 24, AMBER, (i ? 0.25 : 0.95) * dendAmb, `ip${k}-${i}`));
    }
  }

  // The signal on the axon: one pulse, looping, while the axon is lit.
  const axonG = glow.axon ?? 0;
  const axonPulse: React.ReactNode[] = [];
  if (axonG > 0.02) {
    const u = (time % 1.6) / 1.6;
    for (let i = 4; i >= 0; i--) {
      const p = pathAt(AXON_PATH, u - i * 0.03);
      axonPulse.push(spot(p.x, p.y, i ? 14 : 36, AMBER, (i ? 0.3 : 1) * axonG, `ap${i}`));
    }
  }

  // The signal hopping from gap to gap: each gap flashes in turn, looping, while the gaps are lit.
  const nodeG = glow.node ?? 0;
  const nodeWave: React.ReactNode[] = [];
  if (nodeG > 0.02) {
    const ph = time % 1.8;
    NODES.forEach((y, i) => {
      const dt = ph - (0.15 + i * 0.3);
      const a = dt >= 0 ? Math.exp(-dt * 4) : 0;
      nodeWave.push(spot(axonX(y), y, 62, AMBER, a * nodeG, `nw${i}`));
      if (dt >= 0 && dt < 0.5)
        for (let m = 0; m < 6; m++) {
          const ang = (m / 6) * TAU + i;
          const rr = lerp(14, 40, dt / 0.5);
          nodeWave.push(<circle key={`nwp${i}-${m}`} cx={f(axonX(y) + Math.cos(ang) * rr)} cy={f(y + Math.sin(ang) * rr * 0.6)} r={3.2} fill="#FFA94D" opacity={(1 - dt / 0.5) * nodeG} />);
        }
    });
  }

  // Hand-off: calcium in, vesicles empty, chemical dots cross the gap, receptors turn on.
  const termG = glow.terminals ?? 0;
  const nextG = glow.next ?? 0;
  const handoff: React.ReactNode[] = [];
  if (termG > 0.02) {
    for (let k = 0; k < 4; k++) {
      const sd = k % 2 ? 1 : -1;
      const u = (time * 0.7 + k * 0.27) % 1;
      const x = CX + sd * lerp(92, 58, u);
      const y = lerp(1030, 1004, u) - (k > 1 ? 14 : 0);
      handoff.push(<circle key={`ca${k}`} cx={f(x)} cy={f(y)} r={6} fill={`rgb(${CALCIUM})`} opacity={(1 - u * 0.4) * termG} />);
    }
    for (let k = 0; k < 7; k++) {
      const u = (time * 0.62 + k / 7) % 1;
      const x0 = CX - 70 + hash(k, 5) * 140;
      const y = lerp(BULB.y + BULB.ry - 10, MEM_TOP - 6, clamp(u * 1.25));
      const a = clamp(u * 6) * (1 - clamp((u - 0.8) / 0.2));
      handoff.push(<circle key={`nt${k}`} cx={f(x0 + Math.sin(u * 9 + k) * 5)} cy={f(y)} r={4.6} fill={`rgb(${PINK})`} opacity={a * termG} />);
    }
  }

  const memD = `M-10 1075 Q${CX} ${2 * MEM_TOP - 1075} 630 1075`;
  const memWide = (() => {
    let d = '';
    for (let x = MEM_X0; x <= MEM_X1; x += 20) d += `${d ? 'L' : 'M'}${x} ${f(memY(x))}`;
    return d;
  })();

  return (
    <g>
      <defs>
        <filter id="nf-halo" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="16" /></filter>
        <radialGradient id="nf-glow-amber"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.12" stopColor={`rgb(${AMBER})`} /><stop offset="0.4" stopColor={`rgba(${AMBER},0.35)`} /><stop offset="1" stopColor={`rgba(${AMBER},0)`} /></radialGradient>
        <radialGradient id="nf-glow-pink"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.12" stopColor={`rgb(${PINK})`} /><stop offset="0.4" stopColor={`rgba(${PINK},0.35)`} /><stop offset="1" stopColor={`rgba(${PINK},0)`} /></radialGradient>
        <radialGradient id="nf-glow-calcium"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.3" stopColor={`rgb(${CALCIUM})`} /><stop offset="1" stopColor={`rgba(${CALCIUM},0)`} /></radialGradient>
        <radialGradient id="nf-soma" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stopColor="#D9C8FF" /><stop offset="1" stopColor="#5A42AD" /></radialGradient>
        <radialGradient id="nf-bulb" cx="0.4" cy="0.3" r="0.8"><stop offset="0" stopColor="#E3D8FF" /><stop offset="1" stopColor="#8E74E8" /></radialGradient>
        <linearGradient id="nf-membrane" gradientUnits="userSpaceOnUse" x1="0" y1="1052" x2="0" y2="1480"><stop offset="0" stopColor="#4B3AA8" /><stop offset="0.45" stopColor="#2C2470" stopOpacity={0.92} /><stop offset="1" stopColor="#1D1846" stopOpacity={0} /></linearGradient>
      </defs>

      {/* halos behind the whole drawing */}
      {NEURON_REGIONS.filter((r) => L[r].g > 0).map((r) => (
        <g key={`h${r}`} filter="url(#nf-halo)" opacity={0.75 * L[r].g}>{haloShape(r)}</g>
      ))}

      {/* the next cell: membrane + body, receptors */}
      <g opacity={L.next.op}>
        <path d={`${memWide} L${MEM_X1} 1500 L${MEM_X0} 1500 Z`} fill="url(#nf-membrane)" />
        <path d={memWide} {...stroke} stroke={mix('#B7A0FF', '#FFC1D6', L.next.g)} strokeWidth={5} />
        {RECEPTORS.map((x, i) => {
          const y = memY(x);
          const on = clamp(L.next.g * 1.6 - i * 0.02);
          return (
            <g key={i} fill={on > 0.3 ? mix('#8A76E0', '#FF7AA8', on) : '#8A76E0'}>
              <rect x={x - 14} y={y - 14} width={8} height={20} rx={3} />
              <rect x={x + 6} y={y - 14} width={8} height={20} rx={3} />
              {on > 0.3 && spot(x, y - 6, 30, PINK, on * 0.7, `rg${i}`)}
            </g>
          );
        })}
      </g>

      {/* the gap itself */}
      {L.gap.g > 0 && (
        <g opacity={0.9 * L.gap.g}>
          <rect x={CX - 190} y={BULB.y + BULB.ry + 2} width={380} height={MEM_TOP - BULB.y - BULB.ry - 4} rx={6} fill={`rgba(${AMBER},0.22)`} />
          <path d={`M${CX + 205} ${BULB.y + BULB.ry} L${CX + 205} ${MEM_TOP}`} {...stroke} stroke={`rgb(${AMBER})`} strokeWidth={4} />
          <path d={`M${CX + 195} ${BULB.y + BULB.ry} L${CX + 215} ${BULB.y + BULB.ry} M${CX + 195} ${MEM_TOP} L${CX + 215} ${MEM_TOP}`} {...stroke} stroke={`rgb(${AMBER})`} strokeWidth={4} />
        </g>
      )}

      {/* dendrites */}
      <g opacity={L.dendrites.op}>
        <g {...stroke} stroke="rgba(120,90,230,0.12)">{DEND.map((s, i) => <path key={i} d={segD(s)} strokeWidth={s.w * 2.6 + 8} />)}</g>
        <g stroke="#7C62D8" strokeWidth={2.4} {...stroke}>{SPINES.map((s, i) => <path key={i} d={`M${f(s.x0)} ${f(s.y0)}L${f(s.x1)} ${f(s.y1)}`} />)}</g>
        <g fill="#A58CF5">{SPINES.map((s, i) => <circle key={i} cx={f(s.x1)} cy={f(s.y1)} r={2.8} />)}</g>
        <g {...stroke} stroke={L.dendrites.fill}>{DEND.map((s, i) => <path key={i} d={segD(s)} strokeWidth={s.w} />)}</g>
        <g {...stroke} stroke="rgba(205,190,255,0.7)">{DEND.map((s, i) => <path key={i} d={segD(s)} strokeWidth={Math.max(1.2, s.w * 0.32)} />)}</g>
        <g>{inputPulses}</g>
      </g>

      {/* axon core, then myelin, then the gaps */}
      <g opacity={L.axon.op}>
        <path d={axonD(430, AXON_END)} {...stroke} stroke="rgba(120,90,230,0.12)" strokeWidth={34} />
        <path d={axonD(430, AXON_END)} {...stroke} stroke={L.axon.fill} strokeWidth={14} />
        <path d={axonD(430, AXON_END)} {...stroke} stroke="rgba(205,190,255,0.65)" strokeWidth={4.5} />
        <g>{axonPulse}</g>
      </g>
      <g opacity={L.myelin.op}>
        {SHEATHS.map((s, i) => (
          <g key={i}>
            <path d={axonD(s.y0 + 6, s.y1 - 6)} {...stroke} stroke={OUTLINE} strokeOpacity={0.55} strokeWidth={39} />
            <path d={axonD(s.y0 + 6, s.y1 - 6)} {...stroke} stroke={mix('#B9AAEE', PAL.myelin.lit, L.myelin.g * 0.5)} strokeWidth={35} />
            <path d={axonD(s.y0 + 6, s.y1 - 6)} {...stroke} stroke={L.myelin.fill} strokeWidth={22} />
            <path d={`M${f(axonX(s.y0 + 12) - 6)} ${s.y0 + 14}L${f(axonX(s.y1 - 12) - 6)} ${s.y1 - 14}`} {...stroke} stroke="rgba(150,135,205,0.35)" strokeWidth={1.6} />
          </g>
        ))}
      </g>
      <g opacity={L.node.op}>
        {NODES.map((y) => (
          <circle key={y} cx={f(axonX(y))} cy={y} r={6 + 4 * L.node.g} fill={mix('#6A50C4', '#FFD27A', L.node.g)} />
        ))}
        <g>{nodeWave}</g>
      </g>

      {/* cell body + hillock */}
      <g opacity={L.soma.op}>
        <path
          d={`M${CX - 32} ${SOMA.y + 38}Q${CX - 11} ${SOMA.y + 66} ${CX - 7} 448L${CX + 7} 448Q${CX + 11} ${SOMA.y + 66} ${CX + 32} ${SOMA.y + 38}Z`}
          fill={mix('#6F56CC', '#B79CFF', L.soma.g)}
        />
        <path
          d={Array.from({length: 49}, (_, k) => {
            const th = (k / 48) * TAU;
            const r = SOMA.r * (1 + 0.08 * Math.sin(3 * th + 1) + 0.05 * Math.sin(5 * th));
            return `${k ? 'L' : 'M'}${f(SOMA.x + Math.cos(th) * r)} ${f(SOMA.y + Math.sin(th) * r)}`;
          }).join('') + 'Z'}
          fill="url(#nf-soma)"
          stroke={OUTLINE}
          strokeOpacity={0.5}
          strokeWidth={3}
        />
        {L.soma.g > 0 && <circle cx={SOMA.x} cy={SOMA.y} r={SOMA.r * 0.98} fill={`rgba(${AMBER},${0.35 * L.soma.g})`} />}
        <circle cx={SOMA.x - 6} cy={SOMA.y - 4} r={22} fill="#3A2A78" />
        <circle cx={SOMA.x - 1} cy={SOMA.y - 9} r={7} fill="#22184D" />
      </g>

      {/* terminals */}
      <g opacity={L.terminals.op}>
        <g {...stroke} stroke={L.terminals.fill}>
          {[...SIDE_BULBS.map((b) => ({x: b.x, y: b.y})), {x: BULB.x, y: BULB.y - 30}].map((b, i) => (
            <path key={i} d={`M${f(axonX(AXON_END))} ${AXON_END}Q${f((axonX(AXON_END) + b.x) / 2)} ${f(AXON_END + (b.y - AXON_END) * 0.2)} ${b.x} ${b.y}`} strokeWidth={i === 2 ? 12 : 7} />
          ))}
        </g>
        {SIDE_BULBS.map((b, i) => <circle key={i} cx={b.x} cy={b.y} r={b.r} fill="url(#nf-bulb)" stroke={OUTLINE} strokeOpacity={0.5} strokeWidth={3} />)}
        <ellipse cx={BULB.x} cy={BULB.y} rx={BULB.rx} ry={BULB.ry} fill="url(#nf-bulb)" stroke={OUTLINE} strokeOpacity={0.5} strokeWidth={3.5} />
        {/* calcium channels in the membrane of the bulb */}
        {[-1, 1].map((sd) => (
          <g key={sd} fill={`rgb(${CALCIUM})`} opacity={0.9}>
            <rect x={BULB.x + sd * 62 - 16} y={BULB.y + 20 + (sd > 0 ? 0 : 0)} width={10} height={24} rx={3} transform={`rotate(${sd * -28} ${BULB.x + sd * 62} ${BULB.y + 32})`} />
            <rect x={BULB.x + sd * 62 + 6} y={BULB.y + 20} width={10} height={24} rx={3} transform={`rotate(${sd * -28} ${BULB.x + sd * 62} ${BULB.y + 32})`} />
          </g>
        ))}
        {/* vesicles full of chemical messengers */}
        {VESICLES.map((v, i) => {
          const open = termG > 0.02 && i < 3 ? clamp(((time * 0.62 + i * 0.3) % 1) * 1.6 - 0.4) : 0;
          return (
            <g key={i} opacity={1 - open}>
              <circle cx={v.x} cy={v.y} r={12} fill="rgba(255,122,168,0.18)" stroke="rgba(235,225,255,0.9)" strokeWidth={2.4} />
              {[0, 1, 2, 3].map((m) => <circle key={m} cx={f(v.x + Math.cos(m * 1.57 + i) * 5)} cy={f(v.y + Math.sin(m * 1.57 + i) * 5)} r={2.4} fill={`rgb(${PINK})`} />)}
            </g>
          );
        })}
        <g>{handoff}</g>
      </g>
    </g>
  );
};
