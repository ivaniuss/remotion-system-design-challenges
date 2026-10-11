import React from 'react';
import type {ChartScene as ChartSpec, ChartSeries} from '../spec/schema';
import type {Tone} from '../spec/vocab';
import {TONE_COLOR} from '../spec/vocab';
import {FONT, Theme} from '../theme';
import {clamp01, easeInOut, easeOut, pop} from '../video/anim';
import {NoteCallout, noteRoomFor, noteSizeFor} from './FlowScene';
import type {SceneProps} from './types';

// A chart whose curves draw themselves on cue: a forgetting curve, latency over time,
// cost vs scale. Everything is a pure function of (scene, t).

const DRAW = 1.6; // seconds a series takes to draw itself

type Pt = {x: number; y: number};

// Monotone cubic (Fritsch–Carlson) through the points of one segment, sampled.
function monotone(points: Pt[], steps = 18): Pt[] {
  const n = points.length;
  if (n < 2) return points;
  if (n === 2) {
    // One stretch between two jumps: curve it like decay or growth (fast, then
    // slower), which is what most "over time" curves look like.
    const [a, b] = points;
    const out: Pt[] = [];
    for (let s = 0; s <= steps * 2; s++) {
      const u = s / (steps * 2);
      out.push({x: a.x + (b.x - a.x) * u, y: b.y + (a.y - b.y) * Math.pow(1 - u, 2.2)});
    }
    return out;
  }
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((points[i + 1].y - points[i].y) / (points[i + 1].x - points[i].x));
  const m: number[] = [d[0]];
  for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2);
  m.push(d[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const h = a * a + b * b;
    if (h > 9) {
      const k = 3 / Math.sqrt(h);
      m[i] = k * a * d[i];
      m[i + 1] = k * b * d[i];
    }
  }
  const out: Pt[] = [];
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const hx = p1.x - p0.x;
    for (let s = 0; s < steps; s++) {
      const u = s / steps;
      const h00 = 2 * u ** 3 - 3 * u ** 2 + 1;
      const h10 = u ** 3 - 2 * u ** 2 + u;
      const h01 = -2 * u ** 3 + 3 * u ** 2;
      const h11 = u ** 3 - u ** 2;
      out.push({x: p0.x + u * hx, y: h00 * p0.y + h10 * hx * m[i] + h01 * p1.y + h11 * hx * m[i + 1]});
    }
  }
  out.push(points[n - 1]);
  return out;
}

// Data-space samples of a series: smooth between jumps, straight at a vertical jump.
function sampleSeries(points: [number, number][]): Pt[] {
  const pts = points.map(([x, y]) => ({x, y}));
  const out: Pt[] = [];
  let seg: Pt[] = [pts[0]];
  const flush = () => {
    const s = monotone(seg);
    if (out.length) s.shift();
    out.push(...s);
  };
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].x === pts[i - 1].x) {
      flush();
      out.push(pts[i]); // the jump itself
      seg = [pts[i]];
    } else seg.push(pts[i]);
  }
  flush();
  return out;
}

// The first part of a polyline, `k` (0..1) of its length.
function partial(pts: Pt[], k: number): Pt[] {
  if (k >= 1) return pts;
  const len: number[] = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const target = len[len.length - 1] * k;
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (len[i] <= target) out.push(pts[i]);
    else {
      const f = (target - len[i - 1]) / Math.max(1e-6, len[i] - len[i - 1]);
      out.push({x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f});
      break;
    }
  }
  return out;
}

const toPath = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

// Value of a series at x (first crossing, i.e. before a jump at that x).
function valueAt(samples: Pt[], x: number): number {
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1];
    const b = samples[i];
    if (x >= a.x && x <= b.x && b.x > a.x) return a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
    if (x === a.x) return a.y;
  }
  return samples[samples.length - 1].y;
}

function niceTicks(min: number, max: number, count = 5): number[] {
  const span = max - min || 1;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((s) => span / s <= count) ?? raw;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(+v.toFixed(6));
  return out;
}

type ChartState = {
  drawAt: Record<string, number>; // series id -> cue time (-1 = from the start)
  focus: string[];
  focusSince: number;
  marks: {x: number; label: string; series?: string; tone?: Tone; since: number}[];
  note: {text: string; tone: Tone; since: number} | null;
};

export function chartState(scene: Pick<ChartSpec, 'series' | 'steps'>, cues: number[], t: number): ChartState {
  const drawAt: Record<string, number> = {};
  const later = new Set(scene.steps.flatMap((s) => s.draw ?? []));
  for (const s of scene.series) drawAt[s.id] = later.has(s.id) ? Infinity : -1;
  const st: ChartState = {drawAt, focus: [], focusSince: 0, marks: [], note: null};
  scene.steps.forEach((step, i) => {
    const at = cues[i] ?? 0;
    for (const id of step.draw ?? []) if (drawAt[id] === Infinity) drawAt[id] = at;
    if (at > t) return;
    if (step.focus) {
      st.focus = step.focus;
      st.focusSince = at;
    }
    if (step.mark) st.marks.push({...step.mark, since: at});
    if (step.note) st.note = {...step.note, since: at};
  });
  return st;
}

const Pill: React.FC<{x: number; y: number; text: string; size: number; fill: string; stroke: string; color: string; anchor: 'start' | 'middle' | 'end'; scale: number}> = ({
  x,
  y,
  text,
  size,
  fill,
  stroke,
  color,
  anchor,
  scale,
}) => {
  const w = text.length * size * 0.56 + size * 1.1;
  const h = size * 1.7;
  const x0 = anchor === 'start' ? 0 : anchor === 'end' ? -w : -w / 2;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x={x0} y={-h / 2} width={w} height={h} rx={h / 2} fill={fill} stroke={stroke} strokeWidth={3.5} />
      <text x={x0 + w / 2} y={1} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.sans} fontWeight={800} fontSize={size} fill={color}>
        {text}
      </text>
    </g>
  );
};

export const ChartScene: React.FC<SceneProps<'chart'>> = ({scene, t, frame, theme, lang}) => {
  const vertical = frame.format === 'vertical';
  const noteRoom = scene.steps.some((s) => s.note) ? noteRoomFor(frame.format) : 0;
  const box = {...frame.content, h: frame.content.h - noteRoom};
  const small = vertical ? 32 : 30;
  const pad = {l: vertical ? 70 : 90, r: vertical ? 30 : 60, t: vertical ? 110 : 90, b: vertical ? 90 : 80};
  // Horizontal: keep a pleasant aspect instead of a very wide, flat plot.
  const plotW0 = box.w - pad.l - pad.r;
  const plotH = Math.min(box.h - pad.t - pad.b, vertical ? 760 : 600);
  const plotW = vertical ? plotW0 : Math.min(plotW0, plotH * 2.1);
  const px0 = box.x + pad.l + (box.w - pad.l - pad.r - plotW) / 2;
  const py0 = box.y + pad.t + (box.h - pad.t - pad.b - plotH) / 2;
  const P = {x0: px0, x1: px0 + plotW, y0: py0, y1: py0 + plotH};

  const all = scene.series.flatMap((s) => s.points);
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const xMin = scene.x.min ?? Math.min(...xs);
  const xMax = scene.x.max ?? Math.max(...xs);
  const yMin = scene.y.min ?? Math.min(0, ...ys);
  const yMax = scene.y.max ?? Math.max(...ys) * 1.08;
  const X = (v: number) => P.x0 + ((v - xMin) / (xMax - xMin || 1)) * plotW;
  const Y = (v: number) => P.y1 - ((v - yMin) / (yMax - yMin || 1)) * plotH;

  const st = chartState(scene, scene.cues, t);
  const axisK = easeOut(clamp01(t / 0.45));
  const sw = (tone: Tone) => theme.colors[TONE_COLOR[tone]];

  const xTicks = scene.x.ticks ?? (scene.schematic ? [] : niceTicks(xMin, xMax).map((v) => ({at: v, label: String(v)})));
  const yTicks = scene.y.ticks ?? (scene.schematic ? [] : niceTicks(yMin, yMax).map((v) => ({at: v, label: String(v)})));

  type Drawn = {s: ChartSeries; samples: Pt[]; shown: Pt[]; k: number; dimK: number};
  const drawn: Drawn[] = scene.series.map((s) => {
    const samples = sampleSeries(s.points).map((p) => ({x: X(p.x), y: Y(p.y)}));
    const at = st.drawAt[s.id];
    const k = at < 0 ? 1 : at === Infinity ? 0 : easeInOut(clamp01((t - at) / DRAW));
    const inFocus = !st.focus.length || st.focus.includes(s.id);
    const fk = easeOut(clamp01((t - st.focusSince) / 0.35));
    const dimK = (inFocus ? 1 : 1 - 0.72 * fk) * (at < 0 ? axisK : 1);
    return {s, samples, shown: partial(samples, k), k, dimK};
  });

  // End labels, pushed apart vertically so they never overlap.
  const labelSize = vertical ? 30 : 30;
  const ends = drawn
    .filter((d) => d.k > 0.92)
    .map((d) => {
      const e = d.samples[d.samples.length - 1];
      return {d, x: Math.min(e.x, P.x1), y: e.y - labelSize * 1.5};
    })
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < labelSize * 1.9) ends[i].y = ends[i - 1].y + labelSize * 1.9;

  const tag = lang === 'en' ? 'Illustrative sketch' : 'Esquema ilustrativo';
  const fs = small;

  let noteEl: React.ReactNode = null;
  if (st.note) {
    const size = noteSizeFor(frame.format);
    noteEl = (
      <NoteCallout text={st.note.text} tone={st.note.tone} since={st.note.since} x={frame.content.x + frame.content.w / 2} y={frame.content.y + frame.content.h - noteRoom / 2} size={size} t={t} theme={theme} />
    );
  }

  return (
    <svg width={frame.width} height={frame.height} viewBox={`0 0 ${frame.width} ${frame.height}`} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        {drawn.map(({s}) => (
          <linearGradient key={s.id} id={`chartfill-${s.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={sw(s.tone).stroke} stopOpacity={0.22} />
            <stop offset="1" stopColor={sw(s.tone).stroke} stopOpacity={0.02} />
          </linearGradient>
        ))}
      </defs>
      {/* plot card */}
      <g opacity={axisK}>
        <rect x={P.x0 - 24} y={P.y0 - 24} width={plotW + 48} height={plotH + 48} rx={26} fill={theme.surface} opacity={theme.name === 'light' ? 0.75 : 0.5} />
        {yTicks.map((tk) => (
          <g key={`y${tk.at}`}>
            <line x1={P.x0} x2={P.x1} y1={Y(tk.at)} y2={Y(tk.at)} stroke={theme.dots} strokeWidth={2} />
            <text x={P.x0 - 14} y={Y(tk.at)} textAnchor="end" dominantBaseline="central" fontFamily={FONT.sans} fontWeight={600} fontSize={fs} fill={theme.textSoft}>
              {tk.label}
            </text>
          </g>
        ))}
        {xTicks.map((tk) => (
          <g key={`x${tk.at}`}>
            <line x1={X(tk.at)} x2={X(tk.at)} y1={P.y1} y2={P.y1 + 12} stroke={theme.edge} strokeWidth={3} />
            <text x={X(tk.at)} y={P.y1 + 22 + fs * 0.5} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.sans} fontWeight={700} fontSize={fs} fill={theme.textSoft}>
              {tk.label}
            </text>
          </g>
        ))}
        <path d={`M${P.x0} ${P.y0 - 20} L${P.x0} ${P.y1} L${P.x1 + 20} ${P.y1}`} fill="none" stroke={theme.edge} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M${P.x0 - 9} ${P.y0 - 6} L${P.x0} ${P.y0 - 22} L${P.x0 + 9} ${P.y0 - 6}`} fill="none" stroke={theme.edge} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M${P.x1 + 6} ${P.y1 - 9} L${P.x1 + 22} ${P.y1} L${P.x1 + 6} ${P.y1 + 9}`} fill="none" stroke={theme.edge} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        {scene.y.label && (
          <text x={P.x0 - 4} y={P.y0 - 50} textAnchor="start" fontFamily={FONT.sans} fontWeight={800} fontSize={fs} fill={theme.text}>
            {scene.y.label}
          </text>
        )}
        {scene.x.label && (
          <text x={P.x1 + 20} y={P.y1 + (xTicks.length ? 80 : 46)} textAnchor="end" fontFamily={FONT.sans} fontWeight={800} fontSize={fs} fill={theme.text}>
            {scene.x.label}
          </text>
        )}
        {scene.schematic && (
          <Pill x={P.x1 + 10} y={P.y0 - 58} text={tag} size={fs * 0.72} fill={theme.colors.gray.fill} stroke={theme.colors.gray.stroke} color={theme.textSoft} anchor="end" scale={1} />
        )}
      </g>
      {/* marks: guides under the curves */}
      {st.marks.map((m, i) => {
        const k = easeOut(clamp01((t - m.since) / 0.4));
        const ser = m.series ? drawn.find((d) => d.s.id === m.series) : undefined;
        const mx = X(m.x);
        const my = ser ? valueAt(ser.samples, mx) : P.y0;
        return <line key={`g${i}`} opacity={ser ? ser.dimK : 1} x1={mx} x2={mx} y1={P.y1} y2={P.y1 - (P.y1 - my) * k} stroke={theme.textSoft} strokeWidth={3} strokeDasharray="10 10" />;
      })}
      {drawn.map(({s, shown, k, dimK}) => {
        if (!shown.length || (st.drawAt[s.id] !== -1 && k <= 0)) return null;
        const c = sw(s.tone);
        const head = shown[shown.length - 1];
        const area = `${toPath(shown)} L${head.x.toFixed(1)} ${P.y1} L${shown[0].x.toFixed(1)} ${P.y1} Z`;
        return (
          <g key={s.id} opacity={dimK}>
            <path d={area} fill={`url(#chartfill-${s.id})`} />
            <path d={toPath(shown)} fill="none" stroke={theme.shadow} strokeOpacity={theme.name === 'light' ? 0.18 : 0.4} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" transform="translate(4 5)" />
            <path d={toPath(shown)} fill="none" stroke={c.stroke} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={s.dashed ? '20 16' : undefined} />
            {k > 0 && k < 1 && (
              <>
                <circle cx={head.x} cy={head.y} r={20} fill={c.stroke} opacity={0.22} />
                <circle cx={head.x} cy={head.y} r={11} fill={theme.surface} stroke={c.stroke} strokeWidth={5} />
              </>
            )}
          </g>
        );
      })}
      {ends.map(({d, x, y}) => {
        const c = sw(d.s.tone);
        const a = easeOut(clamp01((d.k - 0.92) / 0.08));
        return (
          <g key={`l${d.s.id}`} opacity={a * d.dimK}>
            <Pill x={x} y={y} text={d.s.label} size={labelSize} fill={c.fill} stroke={c.stroke} color={theme.text} anchor="end" scale={1} />
          </g>
        );
      })}
      {st.marks.map((m, i) => ({m, i})).sort((a, b) => {
        const da = drawn.find((d) => d.s.id === a.m.series)?.dimK ?? 1;
        const db = drawn.find((d) => d.s.id === b.m.series)?.dimK ?? 1;
        return da - db;
      }).map(({m, i}) => {
        const sc = pop(t, m.since);
        const ser = m.series ? drawn.find((d) => d.s.id === m.series) : undefined;
        const op = ser ? ser.dimK : 1;
        const c = sw(m.tone ?? ser?.s.tone ?? 'warn');
        const mx = X(m.x);
        const my = ser ? valueAt(ser.samples, mx) : P.y0 + 30;
        const ly = my - (vertical ? 62 : 58);
        const anchor = mx > P.x1 - 160 ? 'end' : mx < P.x0 + 160 ? 'start' : 'middle';
        return (
          <g key={`m${i}`} opacity={op}>
            {ser && <circle cx={mx} cy={my} r={14 * sc} fill={theme.surface} stroke={c.stroke} strokeWidth={6} />}
            <Pill x={mx} y={ly} text={m.label} size={vertical ? 30 : 28} fill={theme.surface} stroke={c.stroke} color={theme.text} anchor={anchor} scale={sc} />
          </g>
        );
      })}
      {noteEl}
    </svg>
  );
};
