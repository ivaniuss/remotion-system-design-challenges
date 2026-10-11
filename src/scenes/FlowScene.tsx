import React from 'react';
import type {FlowEdge, FlowNode} from '../spec/schema';
import {ICON_COLOR, TONE_COLOR} from '../spec/vocab';
import type {Tone} from '../spec/vocab';
import type {Theme} from '../theme';
import {FONT} from '../theme';
import {CARD, FlowLayout, layoutFlow, NodeLayout, packetPath} from '../layout/flow';
import {cumulative, endDirection, pathD, pointAt, pointAtFrac, prefix, Pt} from '../layout/geometry';
import {NodeIcon, iconState} from '../components/icons';
import {StatusBadge} from '../components/glyphs';
import {parseRich} from '../components/Rich';
import {clamp01, easeInOut, easeOut, lerp, pop, progress} from '../video/anim';
import {ClockRun, CrowdRun, flowState, FlowState, MeterRun, Vis} from './flowState';
import type {SceneProps} from './types';

type Presence = {show: boolean; alpha: number; scale: number; draw: number};

// Splits a label at the space closest to its middle.
function splitLabel(label: string): string[] {
  const mid = label.length / 2;
  let best = -1;
  for (let i = 0; i < label.length; i++) if (label[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  return best < 0 ? [label] : [label.slice(0, best), label.slice(best + 1)];
}

export function presence(v: Vis | undefined, t: number): Presence {
  if (!v) return {show: false, alpha: 0, scale: 0, draw: 0};
  if (v.on) {
    if (t < v.since) return {show: false, alpha: 0, scale: 0, draw: 0};
    return {show: true, alpha: clamp01((t - v.since) / 0.12), scale: pop(t, v.since), draw: easeInOut(progress(t, v.since, 0.5))};
  }
  const out = t - v.off;
  if (v.off > -1e8 && out >= 0 && out < 0.4) return {show: true, alpha: 1 - out / 0.4, scale: 1 - 0.15 * (out / 0.4), draw: 1};
  return {show: false, alpha: 0, scale: 0, draw: 0};
}

export const dimFactor = (st: FlowState, ids: string[], t: number) => {
  if (!st.focus) return 1;
  const k = clamp01((t - st.focus.since) / 0.3);
  return ids.some((id) => st.focus!.ids.has(id)) ? 1 : 1 - 0.7 * k;
};

// Deterministic pseudo-random in [0, 1): the same dot lands in the same place on every
// render (the video is a pure function of time).
export function rnd(seed: number, i: number, k = 0): number {
  const x = Math.sin(seed * 127.1 + i * 311.7 + k * 74.7) * 43758.5453;
  return x - Math.floor(x);
}

// A small phase per node id, so idle nodes do not all breathe in unison.
const idPhase = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 628;
  return h / 100;
};

const glowOf = (theme: Theme, color: string, radius: number, alpha = '99') => (theme.glow ? {filter: `drop-shadow(0 0 ${radius}px ${color}${alpha})`} : undefined);

// A fill bar under a node: queue depth, CPU, connections in use.
const MeterBar: React.FC<{m: MeterRun; w: number; h: number; t: number; theme: Theme}> = ({m, w, h, t, theme}) => {
  const k = easeOut(progress(t, m.since, 0.9));
  const v = clamp01(lerp(m.prev, m.value, k));
  const tone: Tone = m.tone ?? (v < 0.6 ? 'good' : v < 0.85 ? 'warn' : 'bad');
  const sw = theme.colors[TONE_COLOR[tone]];
  const y = h / 2 + 16;
  const bh = 28;
  const fillW = (w - 8) * v;
  const text = `${m.label ? `${m.label} ` : ''}${Math.round(v * 100)}%`;
  return (
    <g opacity={clamp01((t - m.since) / 0.2)} style={glowOf(theme, sw.stroke, 8, '77')}>
      <rect x={-w / 2} y={y} width={w} height={bh} rx={bh / 2} fill={theme.surface} stroke={theme.border} strokeWidth={3.5} />
      {fillW > 4 && <rect x={-w / 2 + 4} y={y + 4} width={Math.max(bh - 8, fillW)} height={bh - 8} rx={(bh - 8) / 2} fill={sw.stroke} />}
      <text x={0} y={y + bh / 2 + 1} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.sans} fontWeight={800} fontSize={19} fill={theme.text} stroke={theme.surface} strokeWidth={4} paintOrder="stroke">
        {text}
      </text>
    </g>
  );
};

// A ring on the corner of a node that runs out: a hold expiring, a timeout, a TTL.
const ClockRing: React.FC<{k: ClockRun; w: number; h: number; t: number; theme: Theme}> = ({k, w, h, t, theme}) => {
  const p = clamp01((t - k.since) / k.over);
  const left = 1 - p;
  const expired = p >= 1;
  const tone: Tone = expired || left < 0.2 ? 'bad' : left < 0.45 ? 'warn' : 'info';
  const sw = theme.colors[TONE_COLOR[tone]];
  const r = 44;
  const cx = -w / 2 + 4;
  const cy = -h / 2 + 4;
  const arcR = r - 11;
  const circ = 2 * Math.PI * arcR;
  const sc = pop(t, k.since);
  const text = expired && k.end ? k.end : k.label;
  const blink = expired ? 0.65 + 0.35 * Math.sin((t - k.since) * 14) : 1;
  const hand = -Math.PI / 2 + 2 * Math.PI * p;
  return (
    <g transform={`scale(${sc})`} opacity={blink} style={glowOf(theme, sw.stroke, 9, '88')}>
      <circle cx={cx} cy={cy} r={r} fill={theme.surface} stroke={sw.stroke} strokeWidth={5} />
      <circle cx={cx} cy={cy} r={arcR} fill="none" stroke={theme.dots} strokeWidth={11} />
      <circle
        cx={cx}
        cy={cy}
        r={arcR}
        fill="none"
        stroke={sw.stroke}
        strokeWidth={11}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - left)}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <line x1={cx} y1={cy} x2={cx + Math.cos(hand) * (arcR - 3)} y2={cy + Math.sin(hand) * (arcR - 3)} stroke={theme.text} strokeWidth={4} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={4.5} fill={theme.text} />
      {text && <Pill x={cx + r + 10 + (text.length * 26 * 0.56 + 34) / 2} y={cy - r + 12} text={text} size={26} fill={sw.fill} stroke={sw.stroke} color={theme.text} />}
    </g>
  );
};

const NodeCard: React.FC<{n: FlowNode; L: NodeLayout; s: number; st: FlowState; t: number; theme: Theme}> = ({n, L, s, st, t, theme}) => {
  const v = presence(st.nodes[n.id], t);
  if (!v.show) return null;
  const sw = theme.colors[n.color ?? ICON_COLOR[n.icon]];
  const status = st.status[n.id];
  const focused = st.focus?.ids.has(n.id) ?? false;
  const dim = dimFactor(st, [n.id], t);
  const w = CARD.w;
  const h = CARD.h;
  // Long labels without a sub-label wrap to two lines instead of shrinking
  // ("¿Supera el timeout?" stays readable on a phone).
  const lines = !n.sub && n.label.length > 14 ? splitLabel(n.label) : [n.label];
  const tileH = n.sub ? 112 : lines.length > 1 ? 104 : 122;
  const longest = Math.max(...lines.map((l) => l.length));
  const labelSize = Math.min(lines.length > 1 ? 30 : 32, (w - 28) / Math.max(1, longest * 0.57));
  const subSize = Math.min(22, (w - 28) / Math.max(1, (n.sub ?? '').length * 0.52));
  const iconScale = (tileH - 10) / 160;
  const frame = t * 30;
  const statusPop = status ? pop(t, status.since) : 0;
  // Idle cards breathe a little; busy ones pulse faster. Barely noticeable, but it keeps
  // a held shot from looking frozen.
  const phase = idPhase(n.id);
  const breathe = 1 + (status?.status === 'busy' ? 0.016 * Math.sin(t * 9 + phase) : 0.008 * Math.sin(t * 3.1 + phase));
  const meter = st.meters[n.id];
  const clock = st.clocks[n.id];

  return (
    <g opacity={v.alpha * dim} transform={`translate(${L.x} ${L.y}) scale(${s * v.scale * breathe})`} style={glowOf(theme, sw.stroke, focused ? 20 : 7, focused ? 'cc' : '55')}>
      {focused && (
        <rect x={-w / 2 - 12} y={-h / 2 - 12} width={w + 24} height={h + 24} rx={30} fill="none" stroke={theme.accent} strokeWidth={7} opacity={clamp01((t - st.focus!.since) / 0.25)} />
      )}
      <rect x={-w / 2 + 7} y={-h / 2 + 7} width={w} height={h} rx={22} fill={theme.shadow} opacity={theme.shadowOpacity} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={22} fill={theme.surface} stroke={sw.stroke} strokeWidth={4.5} />
      <rect x={-w / 2 + 14} y={-h / 2 + 14} width={w - 28} height={tileH} rx={16} fill={sw.tile} />
      <g transform={`translate(${-100 * iconScale} ${-h / 2 + 14 + 5}) scale(${iconScale})`}>
        <NodeIcon icon={n.icon} state={status ? iconState(n.icon, status.status) : iconState(n.icon, 'idle')} frame={frame} p={status ? clamp01(t - status.since) : 1} />
      </g>
      {lines.map((line, i) => (
        <text
          key={i}
          x={0}
          y={-h / 2 + 14 + tileH + (lines.length > 1 ? 36 + i * labelSize * 1.12 : 44)}
          textAnchor="middle"
          fontFamily={FONT.sans}
          fontWeight={800}
          fontSize={labelSize}
          fill={theme.text}
        >
          {line}
        </text>
      ))}
      {n.sub && (
        <text x={0} y={-h / 2 + 14 + tileH + 74} textAnchor="middle" fontFamily={FONT.sans} fontWeight={600} fontSize={subSize} fill={theme.textSoft}>
          {n.sub}
        </text>
      )}
      {meter && <MeterBar m={meter} w={w} h={h} t={t} theme={theme} />}
      {clock && <ClockRing k={clock} w={w} h={h} t={t} theme={theme} />}
      {status && status.status !== 'idle' && (
        <g transform={`translate(${w / 2 - 8} ${-h / 2 + 8}) scale(${statusPop})`}>
          <StatusBadge status={status.status} r={24} theme={theme} t={t} />
        </g>
      )}
    </g>
  );
};

const Arrow: React.FC<{pts: Pt[]; size: number; color: string}> = ({pts, size, color}) => {
  const tip = pts[pts.length - 1];
  const d = endDirection(pts);
  const bx = tip.x - d.x * size;
  const by = tip.y - d.y * size;
  const nx = -d.y * size * 0.55;
  const ny = d.x * size * 0.55;
  return <path d={`M${tip.x} ${tip.y} L${bx + nx} ${by + ny} L${bx - nx} ${by - ny} Z`} fill={color} />;
};

export const Pill: React.FC<{x: number; y: number; text: string; size: number; fill: string; stroke: string; color: string; mono?: boolean; alpha?: number}> = ({
  x,
  y,
  text,
  size,
  fill,
  stroke,
  color,
  mono,
  alpha = 1,
}) => {
  const w = text.length * size * (mono ? 0.62 : 0.56) + size * 1.3;
  const h = size * 1.75;
  return (
    <g opacity={alpha}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill={fill} stroke={stroke} strokeWidth={Math.max(2.5, size * 0.13)} />
      <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontFamily={mono ? FONT.mono : FONT.sans} fontWeight={700} fontSize={size} fill={color}>
        {text}
      </text>
    </g>
  );
};

// Everything drawn for a diagram: edges, cards, edge labels and packets in flight.
// Coordinates come from `layout`; `t` must use the same clock as `st`.
export const DiagramLayer: React.FC<{
  nodes: FlowNode[];
  edges: FlowEdge[];
  layout: FlowLayout;
  st: FlowState;
  t: number;
  theme: Theme;
}> = ({nodes, edges, layout, st, t, theme}) => {
  const s = layout.scale;

  // Packets in flight and the edges they are using right now.
  const flying: {pos: Pt; alpha: number; label?: string; color?: string; trail: Pt[]}[] = [];
  const activeEdges = new Set<string>();
  for (const p of st.packets) {
    const dt = t - p.start;
    if (dt < 0 || dt > p.seconds) continue;
    const pts = packetPath(p.chain, layout);
    if (pts.length < 2) continue;
    const cum = cumulative(pts);
    const k = easeInOut(dt / p.seconds);
    const pos = pointAt(pts, cum, k * cum[cum.length - 1]);
    const alpha = clamp01(Math.min(dt / 0.15, (p.seconds - dt) / 0.2));
    // A short comet tail: the positions the packet had a moment ago.
    const total = cum[cum.length - 1];
    const trail: Pt[] = [];
    for (let j = 1; j <= 7; j++) trail.push(pointAt(pts, cum, easeInOut(Math.max(0, dt - j * 0.045) / p.seconds) * total));
    flying.push({pos, alpha, label: p.label, color: p.color, trail});
    for (let i = 0; i < p.chain.length - 1; i++) {
      activeEdges.add(`${p.chain[i]}->${p.chain[i + 1]}`);
      activeEdges.add(`${p.chain[i + 1]}->${p.chain[i]}`);
    }
  }

  const edgeEls: React.ReactNode[] = [];
  const labelEls: React.ReactNode[] = [];
  for (const e of edges) {
    const id = `${e.from}->${e.to}`;
    const L = layout.edges[id];
    const v = presence(st.edges[id], t);
    if (!L || !v.show || L.pts.length < 2) continue;
    const active = activeEdges.has(id);
    const color = active ? theme.accent : theme.edge;
    const dim = dimFactor(st, [e.from, e.to], t);
    const width = Math.max(3, (active ? 7 : 4.5) * s);
    const pts = prefix(L.pts, v.draw);
    edgeEls.push(
      <g key={id} opacity={v.alpha * dim} style={active ? glowOf(theme, theme.accent, 10, 'aa') : undefined}>
        <path
          d={pathD(pts)}
          fill="none"
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={e.dashed ? `${16 * s} ${13 * s}` : undefined}
          strokeDashoffset={e.dashed ? -t * 70 * s : undefined}
        />
        {active && v.draw > 0.97 && (
          // Marching dashes along the path that is carrying a packet right now.
          <path d={pathD(pts)} fill="none" stroke={theme.accentText} strokeOpacity={0.85} strokeWidth={Math.max(2, width * 0.28)} strokeLinecap="round" strokeDasharray={`${12 * s} ${22 * s}`} strokeDashoffset={-t * 150 * s} />
        )}
        {v.draw > 0.97 && <Arrow pts={L.pts} size={Math.max(14, 22 * s)} color={color} />}
      </g>,
    );
    if (e.label && v.draw > 0.6) {
      const mid = pointAtFrac(L.pts, 0.5);
      labelEls.push(
        <g key={`l-${id}`} opacity={clamp01((v.draw - 0.6) / 0.4) * v.alpha * dim}>
          <Pill x={mid.x} y={mid.y} text={e.label} size={Math.max(18, 24 * s)} fill={theme.surface} stroke={theme.edge} color={theme.text} />
        </g>,
      );
    }
  }

  return (
    <>
      {edgeEls}
      {nodes.map((n) => (layout.nodes[n.id] ? <NodeCard key={n.id} n={n} L={layout.nodes[n.id]} s={s} st={st} t={t} theme={theme} /> : null))}
      {labelEls}
      <CrowdLayer runs={st.crowds} st={st} layout={layout} s={s} t={t} theme={theme} />
      {flying.map((p, i) => {
        const sw = theme.colors[(p.color as keyof Theme['colors']) ?? 'blue'];
        const tailColor = p.label ? sw.stroke : theme.accent;
        const tail = p.trail.map((q, j) => (
          <circle key={j} cx={q.x} cy={q.y} r={Math.max(3, (p.label ? 9 : 13) * s * (1 - j * 0.12))} fill={tailColor} opacity={p.alpha * 0.32 * (1 - j / 8)} />
        ));
        if (!p.label)
          return (
            <g key={i} style={glowOf(theme, theme.accent, 12, 'bb')}>
              {tail}
              <circle cx={p.pos.x} cy={p.pos.y} r={Math.max(10, 15 * s)} fill={theme.accent} stroke={theme.border} strokeWidth={3} opacity={p.alpha} />
            </g>
          );
        return (
          <g key={i} style={glowOf(theme, sw.stroke, 10, 'aa')}>
            {tail}
            <Pill x={p.pos.x} y={p.pos.y} text={p.label} size={Math.max(22, 27 * s)} fill={sw.fill} stroke={sw.stroke} color={theme.text} mono alpha={p.alpha} />
          </g>
        );
      })}
    </>
  );
};

// ---------- crowds: a picture of load. Dots stream from one node to another and pile up
// around the target, so "millions of requests" is something you see arriving.
const CROWD_DOTS = {few: 10, many: 30, flood: 80} as const;

// Where a crowd's label goes: on the path if there is room, otherwise above or below the
// cards it connects, never on top of a card (or the meter bar under one).
function crowdLabelSpot(run: CrowdRun, pts: Pt[], cum: number[], total: number, layout: FlowLayout, s: number, st: FlowState, t: number): Pt {
  const size = Math.max(24, 30 * s);
  const w = (run.label ?? '').length * size * 0.62 + size * 1.3;
  const h = size * 1.75;
  const mid = pointAt(pts, cum, total * 0.5);
  const boxes = Object.entries(layout.nodes).filter(([id]) => presence(st.nodes[id], t).show).map(([, n]) => ({l: n.x - n.w / 2 - 10 * s, r: n.x + n.w / 2 + 10 * s, t: n.y - n.h / 2 - 10 * s, b: n.y + n.h / 2 + 56 * s}));
  const chain = run.chain.map((id) => layout.nodes[id]).filter(Boolean);
  const top = Math.min(...chain.map((n) => n.y - n.h / 2));
  const bottom = Math.max(...chain.map((n) => n.y + n.h / 2));
  const candidates: Pt[] = [
    {x: mid.x, y: mid.y - 38 * s},
    {x: mid.x, y: mid.y + 38 * s},
    {x: mid.x, y: mid.y},
    {x: mid.x, y: top - h / 2 - 22 * s},
    {x: mid.x, y: bottom + h / 2 + 70 * s},
  ];
  const free = (c: Pt) => boxes.every((b) => c.x + w / 2 < b.l || c.x - w / 2 > b.r || c.y + h / 2 < b.t || c.y - h / 2 > b.b);
  return candidates.find(free) ?? candidates[0];
}

const CrowdLayer: React.FC<{runs: CrowdRun[]; st: FlowState; layout: FlowLayout; s: number; t: number; theme: Theme}> = ({runs, st, layout, s, t, theme}) => {
  const out: React.ReactNode[] = [];
  runs.forEach((run, ri) => {
    if (t < run.start) return;
    const fade = run.end === null ? 1 : 1 - clamp01((t - run.end) / 0.5);
    if (fade <= 0) return;
    const pts = packetPath(run.chain, layout);
    const tgt = layout.nodes[run.chain[run.chain.length - 1]];
    if (pts.length < 2 || !tgt) return;
    const cum = cumulative(pts);
    const total = cum[cum.length - 1];
    const sw = theme.colors[run.color ?? 'blue'];
    const N = CROWD_DOTS[run.density];
    const spread = run.density === 'flood' ? 2.8 : run.density === 'many' ? 2.2 : 1.6;
    const prev = pointAt(pts, cum, total * 0.88);
    const approach = Math.atan2(prev.y - tgt.y, prev.x - tgt.x);
    const end = pts[pts.length - 1];
    const dots: React.ReactNode[] = [];
    for (let i = 0; i < N; i++) {
      const at = run.start + Math.pow(i / N, 0.85) * spread;
      const dt = t - at;
      if (dt < 0) continue;
      const dur = 0.8 + rnd(run.seed, i, 1) * 0.4;
      const lateral = (rnd(run.seed, i, 2) - 0.5) * 2 * 24 * s;
      const r = Math.max(5, (6 + rnd(run.seed, i, 3) * 3.5) * s);
      let x: number;
      let y: number;
      if (dt < dur) {
        const k = easeInOut(dt / dur);
        const p0 = pointAt(pts, cum, k * total);
        const p1 = pointAt(pts, cum, Math.min(total, k * total + 6));
        const len = Math.hypot(p1.x - p0.x, p1.y - p0.y) || 1;
        const side = Math.sin(Math.PI * k) * lateral;
        x = p0.x + (-(p1.y - p0.y) / len) * side;
        y = p0.y + ((p1.x - p0.x) / len) * side;
      } else {
        // Settle into a spot around the target, on the side the crowd came from.
        const theta = approach + (rnd(run.seed, i, 4) - 0.5) * 1.7;
        const margin = (16 + rnd(run.seed, i, 5) * 44) * s;
        const hw = tgt.w / 2 + margin;
        // Below the card there may be a meter bar: keep the pile clear of it.
        const hh = tgt.h / 2 + margin + (Math.sin(theta) > 0 ? 50 * s : 0);
        const rr = Math.min(hw / Math.max(0.001, Math.abs(Math.cos(theta))), hh / Math.max(0.001, Math.abs(Math.sin(theta))));
        const k = easeOut((dt - dur) / 0.35);
        x = lerp(end.x, tgt.x + Math.cos(theta) * rr, k) + Math.sin(t * 7 + i) * 2.2 * s;
        y = lerp(end.y, tgt.y + Math.sin(theta) * rr, k) + Math.cos(t * 6 + i * 1.3) * 2.2 * s;
      }
      dots.push(<circle key={i} cx={x} cy={y} r={r} fill={sw.stroke} stroke={theme.surface} strokeWidth={Math.max(1.5, 2 * s)} />);
    }
    const lab = run.label ? crowdLabelSpot(run, pts, cum, total, layout, s, st, t) : null;
    out.push(
      <g key={ri} opacity={fade} style={glowOf(theme, sw.stroke, 8, '77')}>
        {dots}
        {lab && run.label && (
          <g opacity={clamp01((t - run.start) / 0.2)}>
            <Pill x={lab.x} y={lab.y} text={run.label} size={Math.max(24, 30 * s)} fill={sw.fill} stroke={sw.stroke} color={theme.text} mono />
          </g>
        )}
      </g>,
    );
  });
  return <>{out}</>;
};

// A callout pill with *emphasis*, popping in at `since`. Drawn in screen space.
export const NoteCallout: React.FC<{text: string; tone: Tone; since: number; x: number; y: number; size: number; t: number; theme: Theme}> = ({
  text,
  tone,
  since,
  x,
  y,
  size,
  t,
  theme,
}) => {
  const sw = theme.colors[TONE_COLOR[tone]];
  const sc = pop(t, since);
  const segs = parseRich(text);
  const w = text.replace(/\*/g, '').length * size * 0.56 + size * 1.6;
  const h = size * 2;
  return (
    <g transform={`translate(${x} ${y}) scale(${sc})`}>
      <rect x={-w / 2 + 6} y={-h / 2 + 6} width={w} height={h} rx={16} fill={theme.shadow} opacity={theme.shadowOpacity} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={16} fill={sw.fill} stroke={sw.stroke} strokeWidth={4} />
      <text x={0} y={2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.sans} fontWeight={800} fontSize={size} fill={theme.text}>
        {segs.map((g, i) => (
          <tspan key={i} fill={g.em ? sw.stroke : theme.text}>
            {g.text}
          </tspan>
        ))}
      </text>
    </g>
  );
};

export const noteRoomFor = (format: 'vertical' | 'horizontal') => (format === 'vertical' ? 120 : 96);
export const noteSizeFor = (format: 'vertical' | 'horizontal') => (format === 'vertical' ? 40 : 42);

export const FlowScene: React.FC<SceneProps<'flow'>> = ({scene, t, frame, theme}) => {
  // Keep room under the diagram for notes that are not attached to a node.
  const noteRoom = scene.steps.some((x) => x.note && !x.note.near) ? noteRoomFor(frame.format) : 0;
  const box = {...frame.content, h: frame.content.h - noteRoom};
  const layout: FlowLayout = layoutFlow(scene.nodes, scene.edges, box, frame.format === 'vertical');
  const st = flowState(scene, scene.cues, t);

  let noteEl: React.ReactNode = null;
  if (st.note) {
    const near = st.note.near ? layout.nodes[st.note.near] : null;
    const size = noteSizeFor(frame.format);
    const x = near ? near.x : frame.content.x + frame.content.w / 2;
    const y = near ? near.rect.y0 - size * 1.4 : frame.content.y + frame.content.h - noteRoom / 2;
    noteEl = <NoteCallout text={st.note.text} tone={st.note.tone} since={st.note.since} x={x} y={y} size={size} t={t} theme={theme} />;
  }

  return (
    <svg width={frame.width} height={frame.height} viewBox={`0 0 ${frame.width} ${frame.height}`} style={{position: 'absolute', left: 0, top: 0}}>
      <DiagramLayer nodes={scene.nodes} edges={scene.edges} layout={layout} st={st} t={t} theme={theme} />
      {noteEl}
    </svg>
  );
};
