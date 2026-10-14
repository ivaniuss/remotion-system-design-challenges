import React from 'react';
import type {ProofScene as ProofSpec} from '../spec/schema';
import {FONT, Theme, toneSwatch} from '../theme';
import {Rich, plain} from '../components/Rich';
import {clamp01, easeInOut, enter} from '../video/anim';
import type {SceneProps} from './types';

// The answer shown, not told (pack "brain"): a bar model on one scale — bars that appear, grow
// or shrink to a new value, split into labelled segments — and the working written out line by
// line beside it, all on the voice's cues. The didactic half of a reveal.

type Timed = ProofSpec & {cues: number[]};
const GROW = 0.6; // seconds a bar takes to reach a new value

export type ProofState = {
  bars: {id: string; label: string; value: number; target: number; shown: boolean; since: number; dim: boolean}[];
  lines: {text: string; at: number}[];
  max: number;
};

export function proofMax(scene: ProofSpec): number {
  const vals = scene.bars.flatMap((b) => [b.value, (b.segments ?? []).reduce((a, s) => a + s.value, 0)]);
  for (const st of scene.steps) for (const v of Object.values(st.set ?? {})) vals.push(v);
  return scene.max ?? Math.max(1, ...vals);
}

export function proofState(scene: Timed, t: number): ProofState {
  const hidden = new Set(scene.steps.flatMap((s) => s.show ?? []));
  const at = (i: number) => scene.cues[i] ?? 0.5 + i * 0.8;
  let focus: Set<string> | null = null;
  const lines: ProofState['lines'] = [];
  const bars = scene.bars.map((b) => {
    // Value history: [time, value]. A bar that is shown later grows from 0 when it appears.
    const hist: [number, number][] = hidden.has(b.id) ? [] : [[-1, b.value]];
    let label = b.label;
    let shownAt = hidden.has(b.id) ? Infinity : -1;
    scene.steps.forEach((st, i) => {
      const ti = at(i);
      if (st.show?.includes(b.id) && shownAt === Infinity) {
        shownAt = ti;
        hist.push([ti - 0.0001, 0], [ti, b.value]);
      }
      if (st.set && b.id in st.set) hist.push([ti, st.set[b.id]]);
      if (st.relabel?.[b.id] && t >= ti) label = st.relabel[b.id];
    });
    let prev = 0;
    let target = 0;
    let since = -1;
    for (const [ht, v] of hist) {
      if (t >= ht) {
        prev = target;
        target = v;
        since = ht;
      }
    }
    const k = easeInOut(clamp01((t - since) / GROW));
    const value = since < 0 ? target : prev + (target - prev) * k;
    return {id: b.id, label, value, target, shown: t >= shownAt, since: shownAt, dim: false};
  });
  scene.steps.forEach((st, i) => {
    const ti = at(i);
    if (t < ti) return;
    if (st.focus !== undefined) focus = st.focus.length ? new Set(st.focus) : null;
    if (st.line) lines.push({text: st.line, at: ti});
  });
  const f = focus as Set<string> | null;
  for (const b of bars) b.dim = !!f && !f.has(b.id);
  return {bars, lines, max: proofMax(scene)};
}

const fmt = (v: number, exact: boolean) => {
  const r = exact ? v : Math.round(v * 100) / 100;
  return Number.isInteger(r) ? r.toLocaleString('en-US') : r.toFixed(2);
};

const Bar: React.FC<{
  spec: ProofSpec['bars'][number];
  state: ProofState['bars'][number];
  max: number;
  width: number;
  height: number;
  theme: Theme;
  t: number;
  prefix: string;
  suffix: string;
  font: number;
}> = ({spec, state, max, width, height, theme, t, prefix, suffix, font}) => {
  const e = enter(t, state.since < 0 ? 0 : state.since, 0.3, 16);
  const sw = toneSwatch(theme, spec.tone);
  // On the dark looks the tinted fills are too dim for a bar: fill with the stroke color.
  const solid = theme.name !== 'light';
  const fillOf = (x: {fill: string; stroke: string}) => (solid ? x.stroke : x.fill);
  const inkOn = (x: {text: string}) => (solid ? '#0B0F17' : x.text);
  const fw = Math.max(0, (width * state.value) / max);
  const settled = Math.abs(state.value - state.target) < 1e-6;
  const text = `${prefix}${fmt(settled ? state.target : Math.round(state.value), settled)}${suffix}`;
  const textW = text.length * font * 0.62;
  const outside = fw + textW + 18 <= width;
  // Segments only while the bar is at the value they add up to.
  const segs = spec.segments && settled && Math.abs(state.target - spec.segments.reduce((a, s) => a + s.value, 0)) < 1e-6 ? spec.segments : null;
  const CYCLE = ['blue', 'orange', 'green', 'purple'] as const;
  return (
    <div style={{opacity: state.dim ? 0.32 * e.opacity : e.opacity, transform: `translateY(${e.dy}px)`, display: 'flex', flexDirection: 'column', gap: 8}}>
      <div style={{fontWeight: 800, fontSize: font * 0.72, color: theme.textSoft, letterSpacing: 0.5}}>
        <Rich text={state.label} accent={theme.accent} accentText={theme.accentText} />
      </div>
      <div style={{position: 'relative', width, height}}>
        <div style={{position: 'absolute', inset: 0, borderRadius: 14, background: theme.dots, opacity: 0.45}} />
        {segs ? (
          <div style={{position: 'absolute', left: 0, top: 0, height, width: fw, display: 'flex', borderRadius: 14, overflow: 'hidden', border: `4px solid ${solid ? 'transparent' : theme.border}`, boxSizing: 'border-box'}}>
            {segs.map((s, i) => {
              const ssw = s.tone ? toneSwatch(theme, s.tone) : theme.colors[CYCLE[i % CYCLE.length]];
              const w = (fw * s.value) / state.target;
              const lab = `${s.label ? `${s.label} ` : ''}${prefix}${fmt(s.value, true)}${suffix}`;
              const fits = lab.length * font * 0.5 < w - 12;
              return (
                <div key={i} style={{width: w, height: '100%', background: fillOf(ssw), borderLeft: i ? `4px solid ${solid ? theme.bg : theme.border}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: font * 0.62, color: inkOn(ssw), whiteSpace: 'nowrap', overflow: 'hidden'}}>
                  {fits ? lab : ''}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{position: 'absolute', left: 0, top: 0, height, width: fw, borderRadius: 14, background: fillOf(sw), border: fw > 8 ? `4px solid ${sw.stroke}` : 'none', boxSizing: 'border-box'}} />
        )}
        <div
          style={{
            position: 'absolute',
            top: 0,
            height,
            display: 'flex',
            alignItems: 'center',
            ...(outside ? {left: fw + 14} : {right: width - fw + 14}),
            fontWeight: 900,
            fontSize: font,
            color: outside ? theme.text : inkOn(sw),
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          {fw > 4 || outside ? text : ''}
        </div>
      </div>
    </div>
  );
};

// Lines of working, typed out on their cue; the last one carries the result.
const Lines: React.FC<{lines: ProofState['lines']; t: number; theme: Theme; font: number}> = ({lines, t, theme, font}) => (
  <div style={{display: 'flex', flexDirection: 'column', gap: font * 0.38}}>
    {lines.map((l, i) => {
      const full = plain(l.text);
      const k = clamp01((t - l.at) / Math.max(0.35, full.length * 0.025));
      const last = i === lines.length - 1;
      return (
        <div key={i} style={{fontFamily: FONT.mono, fontWeight: 700, fontSize: font, lineHeight: 1.2, color: last ? theme.text : theme.textSoft, whiteSpace: 'pre-wrap'}}>
          {k < 1 ? (
            <>
              {full.slice(0, Math.ceil(full.length * k))}
              <span style={{color: theme.accent}}>▍</span>
            </>
          ) : (
            <Rich text={l.text} accent={theme.accent} accentText={theme.accentText} />
          )}
        </div>
      );
    })}
  </div>
);

export const ProofScene: React.FC<SceneProps<'proof'>> = ({scene, t, frame, theme}) => {
  const c = frame.content;
  const vertical = frame.format === 'vertical';
  const st = proofState(scene, t);
  const n = scene.bars.length;
  const font = vertical ? 56 : 46;
  const lineFont = vertical ? (st.lines.length > 4 ? 42 : 50) : 40;
  const barW = vertical ? c.w - 80 : Math.min(980, c.w * 0.58);
  const barH = vertical ? (n > 3 ? 92 : 118) : n > 3 ? 70 : 88;
  const bars = scene.bars.map((b, i) => (
    <Bar key={b.id} spec={b} state={st.bars[i]} max={st.max} width={barW} height={barH} theme={theme} t={t} prefix={scene.prefix} suffix={scene.suffix} font={font} />
  ));
  const barsBox = n ? (
    <div style={{display: 'flex', flexDirection: 'column', gap: vertical ? 40 : 26, width: barW}}>
      {scene.bars.map((b, i) => (st.bars[i].shown ? bars[i] : <div key={b.id} style={{height: barH + font * 0.72 + 8}} />))}
    </div>
  ) : null;
  const lines = <Lines lines={st.lines} t={t} theme={theme} font={lineFont} />;
  if (vertical || !n)
    return (
      <div style={{position: 'absolute', left: c.x + 40, top: c.y, width: c.w - 80, height: c.h, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: n ? 'flex-start' : 'center', gap: 70, fontFamily: FONT.sans}}>
        {barsBox}
        {lines}
      </div>
    );
  return (
    <div style={{position: 'absolute', left: c.x, top: c.y, width: c.w, height: c.h, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 70, fontFamily: FONT.sans}}>
      {barsBox}
      <div style={{flex: 1, minWidth: 0}}>{lines}</div>
    </div>
  );
};
