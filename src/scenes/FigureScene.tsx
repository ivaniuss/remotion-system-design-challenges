import React from 'react';
import type {FigureScene as FigureSpec} from '../spec/schema';
import type {Tone} from '../spec/vocab';
import {TONE_COLOR} from '../spec/vocab';
import {FONT} from '../theme';
import {FIGURE_DRAW} from '../figures';
import {clamp01, easeInOut, easeOut, lerp, pop} from '../video/anim';
import {NoteCallout, noteRoomFor, noteSizeFor} from './FlowScene';
import type {SceneProps} from './types';

// A large illustration (the brain…) whose regions light up, get labels and pass
// signals to each other in sync with the voice. Pure function of (scene, t).

const FADE = 0.45; // glow fade in/out
const TRIP = 1.25; // seconds a signal takes to travel
const ZOOM = 0.9; // camera move
const ZOOM_FACTOR = 1.55; // default magnification of a `zoom` step

type Change = {at: number; to: number};
export type FigureState = {
  glow: Record<string, number>;
  dim: number;
  labels: {region: string; text: string; tone?: Tone; since: number}[];
  signals: {from: string; to: string; label?: string; start: number}[];
  zoom: {from: string | null; to: string | null; since: number};
  note: {text: string; tone: Tone; since: number} | null;
};

const fadeTo = (changes: Change[], t: number, d = FADE) => {
  let v = 0;
  let from = 0;
  let since = -1;
  for (const c of changes) {
    if (c.at > t) break;
    from = since < 0 ? 0 : lerp(from, v, easeOut(clamp01((c.at - since) / d)));
    v = c.to;
    since = c.at;
  }
  return since < 0 ? 0 : lerp(from, v, easeOut(clamp01((t - since) / d)));
};

export function figureState(scene: Pick<FigureSpec, 'steps'>, regions: readonly string[], cues: number[], t: number): FigureState {
  const glowChanges: Record<string, Change[]> = Object.fromEntries(regions.map((r) => [r, []]));
  const dimChanges: Change[] = [];
  const st: FigureState = {glow: {}, dim: 0, labels: [], signals: [], zoom: {from: null, to: null, since: -10}, note: null};
  let lit = new Set<string>();
  let zoomNow: string | null = null;
  scene.steps.forEach((step, i) => {
    const at = cues[i] ?? 0;
    if (step.glow) {
      const next = new Set(step.glow);
      for (const r of regions) if (next.has(r) !== lit.has(r)) glowChanges[r].push({at, to: next.has(r) ? 1 : 0});
      lit = next;
    }
    if (step.dim !== undefined) dimChanges.push({at, to: step.dim ? 1 : 0});
    if (step.signal) st.signals.push({...step.signal, start: at});
    if (at > t) return;
    if (step.label) st.labels.push({...step.label, since: at});
    if (step.zoom !== undefined && step.zoom !== zoomNow) {
      st.zoom = {from: zoomNow, to: step.zoom, since: at};
      zoomNow = step.zoom;
    }
    if (step.note) st.note = {...step.note, since: at};
  });
  for (const r of regions) {
    let g = fadeTo(glowChanges[r], t);
    // A region that receives a signal flashes when it arrives.
    for (const s of st.signals) {
      if (s.to !== r) continue;
      const dt = t - (s.start + TRIP);
      if (dt >= 0 && dt < 1.1) g = Math.max(g, 0.85 * (1 - dt / 1.1));
    }
    st.glow[r] = g;
  }
  st.dim = 0.85 * fadeTo(dimChanges, t);
  return st;
}

export const FigureScene: React.FC<SceneProps<'figure'>> = ({scene, t, frame, theme}) => {
  const fig = FIGURE_DRAW[scene.figure];
  const vertical = frame.format === 'vertical';
  const noteRoom = scene.steps.some((s) => s.note) ? noteRoomFor(frame.format) : 0;
  const box = {...frame.content, h: frame.content.h - noteRoom};
  const {w: vw, h: vh} = fig.viewBox;
  // Labels go beside the figure in 16:9, and also in 9:16 for tall figures (a neuron).
  const sides = !vertical || fig.layout?.labels === 'sides';
  const padX = vertical ? fig.layout?.padX ?? 20 : 230; // room for labels beside the figure
  const padY = vertical ? fig.layout?.padY ?? 150 : 30; // room for labels above/below in 9:16
  const zoomFactor = fig.layout?.zoom ?? ZOOM_FACTOR;
  const VW = vw + padX * 2;
  const VH = vh + padY * 2;
  const s = Math.min(box.w / VW, box.h / VH);
  const W = VW * s;
  const H = VH * s;
  const ox = box.x + (box.w - W) / 2;
  const oy = box.y + (box.h - H) / 2;
  const regions = Object.keys(fig.anchors);
  const st = figureState(scene, regions, scene.cues, t);
  const enterK = easeOut(clamp01(t / 0.5));

  // Camera: zoom toward a region's anchor (in figure coords).
  const center = {x: vw / 2, y: vh / 2};
  const target = (r: string | null) => (r ? fig.anchors[r] : center);
  const zk = easeInOut(clamp01((t - st.zoom.since) / ZOOM));
  const zFrom = st.zoom.from ? zoomFactor : 1;
  const zTo = st.zoom.to ? zoomFactor : 1;
  const Z = lerp(zFrom, zTo, zk) * lerp(0.94, 1, enterK);
  const c = {x: lerp(target(st.zoom.from).x, target(st.zoom.to).x, zk), y: lerp(target(st.zoom.from).y, target(st.zoom.to).y, zk)};
  // Figure point -> viewBox point (the viewBox includes the padding).
  const P = (p: {x: number; y: number}) => ({x: padX + vw / 2 + (p.x - c.x) * Z, y: padY + vh / 2 + (p.y - c.y) * Z});

  const labelPx = vertical ? 34 : 32;
  const fsz = labelPx / s; // font size in viewBox units, constant on screen
  const sw = (tone: Tone) => theme.colors[TONE_COLOR[tone]];
  const Comp = fig.Component;

  const labels = st.labels.map((l, i) => {
    const a = P(fig.anchors[l.region]);
    const dx = a.x - (padX + vw / 2);
    const dy = a.y - (padY + vh / 2);
    // Push the label away from the figure's center: sideways in 16:9, up/down in 9:16.
    let lx: number;
    let ly: number;
    if (!sides) {
      lx = Math.max(fsz * 5, Math.min(VW - fsz * 5, a.x + dx * 0.25));
      ly = dy < 0 ? fsz * 1.4 + (i % 2) * fsz * 2.2 : VH - fsz * 1.4 - (i % 2) * fsz * 2.2;
    } else {
      // Side of the figure the region sits on (in figure coordinates, so it does not flip when the camera zooms).
      const left = vertical && fig.layout?.labels === 'sides' ? fig.anchors[l.region].x <= vw / 2 : dx < 0;
      lx = left ? padX * 0.55 : VW - padX * 0.55;
      ly = Math.max(fsz * 1.5, Math.min(VH - fsz * 1.5, a.y));
    }
    const text = l.text.replace(/\*/g, '');
    const w = text.length * fsz * 0.56 + fsz * 1.2;
    const h = fsz * 1.8;
    const tone = sw(l.tone ?? 'warn');
    const sc = pop(t, l.since);
    const lineK = easeOut(clamp01((t - l.since) / 0.35));
    const ex = lerp(a.x, lx, lineK);
    const ey = lerp(a.y, ly, lineK);
    return (
      <g key={`l${i}`}>
        <line x1={a.x} y1={a.y} x2={ex} y2={ey} stroke={theme.border} strokeWidth={3.5 / s} strokeLinecap="round" />
        <circle cx={a.x} cy={a.y} r={(9 / s) * sc} fill={tone.stroke} stroke={theme.surface} strokeWidth={3 / s} />
        <g transform={`translate(${lx} ${ly}) scale(${sc})`}>
          <rect x={-w / 2 + 5 / s} y={-h / 2 + 5 / s} width={w} height={h} rx={h / 2} fill={theme.shadow} opacity={theme.shadowOpacity} />
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={tone.fill} stroke={tone.stroke} strokeWidth={4 / s} />
          <text x={0} y={fsz * 0.05} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.sans} fontWeight={800} fontSize={fsz} fill={theme.text}>
            {text}
          </text>
        </g>
      </g>
    );
  });

  const signals = st.signals.map((g, i) => {
    const dt = t - g.start;
    if (dt < 0 || dt > TRIP + 0.6) return null;
    let at: (u: number) => {x: number; y: number};
    let trail: string;
    if (fig.route) {
      // The figure says where the signal travels (waypoints), e.g. down the axon.
      const variant = st.signals.slice(0, i).filter((o) => o.from === g.from && o.to === g.to).length;
      const pts = fig.route(g.from, g.to, variant).map(P);
      const cum = [0];
      for (let q = 1; q < pts.length; q++) cum.push(cum[q - 1] + Math.hypot(pts[q].x - pts[q - 1].x, pts[q].y - pts[q - 1].y));
      const total = cum[cum.length - 1] || 1;
      at = (u: number) => {
        const d = clamp01(u) * total;
        let q = 1;
        while (q < pts.length - 1 && cum[q] < d) q++;
        const k = (d - cum[q - 1]) / Math.max(1e-6, cum[q] - cum[q - 1]);
        return {x: lerp(pts[q - 1].x, pts[q].x, k), y: lerp(pts[q - 1].y, pts[q].y, k)};
      };
      trail = pts.map((p, q) => `${q ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('');
    } else {
      const a = P(fig.anchors[g.from]);
      const b = P(fig.anchors[g.to]);
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      // Arc control point: perpendicular to the chord, bulging upward.
      let nx = -(b.y - a.y) / (len || 1);
      let ny = (b.x - a.x) / (len || 1);
      if (ny > 0) {
        nx = -nx;
        ny = -ny;
      }
      const cx = mx + nx * len * 0.32;
      const cy = my + ny * len * 0.32;
      at = (u: number) => ({
        x: (1 - u) ** 2 * a.x + 2 * (1 - u) * u * cx + u ** 2 * b.x,
        y: (1 - u) ** 2 * a.y + 2 * (1 - u) * u * cy + u ** 2 * b.y,
      });
      trail = `M${a.x} ${a.y} Q${cx} ${cy} ${b.x} ${b.y}`;
    }
    const k = easeInOut(clamp01(dt / TRIP));
    const fade = 1 - clamp01((dt - TRIP) / 0.6);
    const head = at(k);
    const r = 13 / s;
    return (
      <g key={`s${i}`} opacity={fade}>
        <path d={trail} fill="none" stroke="#E8A21A" strokeWidth={4 / s} strokeDasharray={`${12 / s} ${12 / s}`} opacity={0.55} />
        {[0.16, 0.12, 0.08, 0.04].map((d, j) => {
          const p = at(Math.max(0, k - d));
          return <circle key={j} cx={p.x} cy={p.y} r={r * (0.45 + j * 0.13)} fill="#FFD84D" opacity={0.25 + j * 0.15} />;
        })}
        {k < 1 && (
          <>
            <circle cx={head.x} cy={head.y} r={r * 2.2} fill="#FFD84D" opacity={0.35} />
            <circle cx={head.x} cy={head.y} r={r} fill="#FFD84D" stroke="#1D1D1F" strokeWidth={3 / s} />
          </>
        )}
        {g.label && k < 1 && (
          <text x={head.x} y={head.y - r * 2.6} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={fsz * 0.85} fill={theme.text} stroke={theme.bg} strokeWidth={6 / s} paintOrder="stroke">
            {g.label}
          </text>
        )}
      </g>
    );
  });

  let noteEl: React.ReactNode = null;
  if (st.note) {
    noteEl = (
      <svg width={frame.width} height={frame.height} viewBox={`0 0 ${frame.width} ${frame.height}`} style={{position: 'absolute', left: 0, top: 0}}>
        <NoteCallout
          text={st.note.text}
          tone={st.note.tone}
          since={st.note.since}
          x={frame.content.x + frame.content.w / 2}
          y={frame.content.y + frame.content.h - noteRoom / 2}
          size={noteSizeFor(frame.format)}
          t={t}
          theme={theme}
        />
      </svg>
    );
  }

  const tr = P({x: 0, y: 0});
  return (
    <>
      <svg width={W} height={H} viewBox={`0 0 ${VW} ${VH}`} style={{position: 'absolute', left: ox, top: oy, overflow: 'visible'}}>
        {fig.layout?.clip && (
          <defs>
            {/* keep a zoomed drawing inside the content area (it must not run under the title or the captions); the top and bottom edges fade out instead of being cut */}
            <linearGradient id="figure-fade" gradientUnits="objectBoundingBox" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#000" />
              <stop offset="0.06" stopColor="#fff" />
              <stop offset="0.94" stopColor="#fff" />
              <stop offset="1" stopColor="#000" />
            </linearGradient>
            <mask id="figure-clip" maskUnits="userSpaceOnUse" x={(box.x - ox) / s} y={(box.y - oy) / s} width={box.w / s} height={box.h / s}>
              <rect x={(box.x - ox) / s} y={(box.y - oy) / s} width={box.w / s} height={box.h / s} fill="url(#figure-fade)" />
            </mask>
          </defs>
        )}
        <g mask={fig.layout?.clip ? 'url(#figure-clip)' : undefined}>
          <g opacity={enterK} transform={`translate(${tr.x} ${tr.y}) scale(${Z})`}>
            <Comp glow={st.glow} dim={st.dim} frame={t * 30} />
          </g>
          {signals}
        </g>
        {labels}
      </svg>
      {noteEl}
    </>
  );
};
