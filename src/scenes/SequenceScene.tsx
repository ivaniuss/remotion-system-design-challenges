import React from 'react';
import type {SeqStep} from '../spec/schema';
import {ICON_COLOR, TONE_COLOR} from '../spec/vocab';
import type {Status, Tone} from '../spec/vocab';
import type {Theme} from '../theme';
import {FONT} from '../theme';
import {NodeIcon, iconState} from '../components/icons';
import {StatusBadge} from '../components/glyphs';
import {clamp01, easeOut, pop, progress} from '../video/anim';
import {NoteCallout, noteRoomFor, noteSizeFor, Pill} from './FlowScene';
import type {SceneProps} from './types';

// A sequence diagram: who talks to whom over TIME. Actors stand across the top with a
// dashed lifeline; time flows down; every step draws one message. Extra vertical space
// (`gap`, `after`) shows elapsed time, and a bar on a lifeline (`spans`) shows an actor
// holding or waiting while the voice talks. This is the picture boxes and arrows cannot
// give: latency, timeouts, retries, "the connection stays open for five minutes".

const TIME_WORD: Record<string, string> = {en: 'time', es: 'tiempo', pt: 'tempo'};

type Geometry = {
  cx: (i: number) => number;
  ys: number[];
  top: number;
  cardW: number;
  cardH: number;
  lifeTop: number;
  bottom: number;
  unit: number;
  axisX: number;
  axisW: number;
  noteRoom: number;
};

export function sequenceGeometry(scene: SceneProps<'sequence'>['scene'], frame: SceneProps<'sequence'>['frame']): Geometry {
  const vertical = frame.format === 'vertical';
  const c = frame.content;
  const n = scene.actors.length;
  const noteRoom = scene.steps.some((s) => s.note) ? noteRoomFor(frame.format) : 0;
  const axisW = scene.steps.some((s) => s.after) ? (vertical ? 120 : 150) : vertical ? 56 : 70;
  const x0 = c.x + axisW;
  const colW = (c.w - axisW) / n;
  const cardW = Math.min(vertical ? 220 : 270, colW - 16);
  const cardH = vertical ? 170 : 128;
  const top = c.y + 6;
  const lifeTop = top + cardH + 6;
  const bottom = c.y + c.h - noteRoom - 10;
  const rows = scene.steps.reduce((a, st) => a + st.gap, 0) + 0.5;
  const unit = Math.min(vertical ? 128 : 124, (bottom - lifeTop) / rows);
  const ys: number[] = [];
  let y = lifeTop;
  for (const st of scene.steps) {
    y += st.gap * unit;
    ys.push(y);
  }
  return {cx: (i) => x0 + colW * (i + 0.5), ys, top, cardW, cardH, lifeTop, bottom, unit, axisX: c.x + 24, axisW, noteRoom};
}

const ActorCard: React.FC<{
  a: SceneProps<'sequence'>['scene']['actors'][number];
  x: number;
  y: number;
  w: number;
  h: number;
  appear: number;
  status?: {status: Status; since: number};
  t: number;
  theme: Theme;
}> = ({a, x, y, w, h, appear, status, t, theme}) => {
  const sc = pop(t, appear);
  if (sc <= 0) return null;
  const sw = theme.colors[a.color ?? ICON_COLOR[a.icon]];
  const tileH = a.sub ? h - 80 : h - 54;
  const iconScale = (tileH - 10) / 160;
  const labelSize = Math.min(28, (w - 20) / Math.max(1, a.label.length * 0.57));
  const glow = theme.glow ? {filter: `drop-shadow(0 0 7px ${sw.stroke}55)`} : undefined;
  return (
    <g transform={`translate(${x} ${y}) scale(${sc})`} style={glow}>
      <rect x={-w / 2 + 6} y={-h / 2 + 6} width={w} height={h} rx={20} fill={theme.shadow} opacity={theme.shadowOpacity} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={20} fill={theme.surface} stroke={sw.stroke} strokeWidth={4} />
      <rect x={-w / 2 + 12} y={-h / 2 + 12} width={w - 24} height={tileH} rx={14} fill={sw.tile} />
      <g transform={`translate(${-100 * iconScale} ${-h / 2 + 12 + 5}) scale(${iconScale})`}>
        <NodeIcon icon={a.icon} state={iconState(a.icon, status?.status ?? 'idle')} frame={t * 30} p={status ? clamp01(t - status.since) : 1} />
      </g>
      <text x={0} y={-h / 2 + 12 + tileH + 32} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={labelSize} fill={theme.text}>
        {a.label}
      </text>
      {a.sub && (
        <text x={0} y={-h / 2 + 12 + tileH + 58} textAnchor="middle" fontFamily={FONT.sans} fontWeight={600} fontSize={20} fill={theme.textSoft}>
          {a.sub}
        </text>
      )}
      {status && status.status !== 'idle' && (
        <g transform={`translate(${w / 2 - 6} ${-h / 2 + 6}) scale(${pop(t, status.since)})`}>
          <StatusBadge status={status.status} r={22} theme={theme} t={t} />
        </g>
      )}
    </g>
  );
};

const kindColor = (theme: Theme, kind: SeqStep['kind']) =>
  kind === 'return' ? theme.colors.green : kind === 'lost' ? theme.colors.red : kind === 'self' ? theme.colors.purple : theme.colors.blue;

export const SequenceScene: React.FC<SceneProps<'sequence'>> = ({scene, t, frame, theme, lang}) => {
  const vertical = frame.format === 'vertical';
  const c = frame.content;
  const n = scene.actors.length;
  const G = sequenceGeometry(scene, frame);
  const idx = new Map(scene.actors.map((a, i) => [a.id, i]));
  const pillSize = n >= 4 ? 20 : vertical ? 24 : 26;

  // Actor status over time (from the steps whose cue has passed).
  const status: Record<string, {status: Status; since: number}> = {};
  let note: {text: string; tone: Tone; since: number} | null = null;
  scene.steps.forEach((st, i) => {
    const at = scene.cues[i] ?? 0;
    if (at > t) return;
    for (const [id, s] of Object.entries(st.status ?? {})) status[id] = {status: s, since: at + 0.3};
    if (st.note) note = {text: st.note.text, tone: st.note.tone, since: at};
  });

  const lifelines = scene.actors.map((a, i) => {
    const grow = easeOut(progress(t, 0.35 + i * 0.08, 0.5));
    const bad = status[a.id]?.status === 'error' && t >= status[a.id].since;
    return (
      <line
        key={a.id}
        x1={G.cx(i)}
        y1={G.top + G.cardH}
        x2={G.cx(i)}
        y2={G.top + G.cardH + (G.bottom - G.top - G.cardH) * grow}
        stroke={bad ? theme.colors.red.stroke : theme.edge}
        strokeWidth={3.5}
        strokeDasharray="10 10"
        strokeLinecap="round"
        opacity={0.8}
      />
    );
  });

  // Time axis on the left.
  const axisGrow = easeOut(progress(t, 0.5, 0.8));
  const axisY2 = G.lifeTop + (G.bottom - G.lifeTop) * axisGrow;
  const axis = (
    <g opacity={0.9}>
      <line x1={G.axisX} y1={G.lifeTop} x2={G.axisX} y2={axisY2} stroke={theme.textSoft} strokeWidth={4} strokeLinecap="round" />
      {axisGrow > 0.97 && <path d={`M${G.axisX} ${G.bottom + 6} l-10 -18 l20 0 Z`} fill={theme.textSoft} />}
      <text transform={`translate(${G.axisX - 12} ${(G.lifeTop + G.bottom) / 2}) rotate(-90)`} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={22} fill={theme.textSoft} letterSpacing={2}>
        {(TIME_WORD[lang] ?? 'time').toUpperCase()}
      </text>
    </g>
  );

  // Bars on a lifeline (holding / blocked): they grow while the voice runs.
  const spans = scene.spans.map((sp, k) => {
    const a = idx.get(sp.actor);
    if (a === undefined || sp.to >= G.ys.length) return null;
    const t1 = scene.cues[sp.from] ?? 0;
    const t2 = scene.cues[sp.to] ?? t1 + 1;
    if (t < t1) return null;
    const g = clamp01((t - t1) / Math.max(0.4, t2 - t1));
    const y1 = G.ys[sp.from];
    const h = (G.ys[sp.to] - y1) * g;
    const sw = theme.colors[TONE_COLOR[sp.tone]];
    const last = a === n - 1;
    return (
      <g key={k} style={theme.glow ? {filter: `drop-shadow(0 0 8px ${sw.stroke}77)`} : undefined}>
        <rect x={G.cx(a) - 14} y={y1} width={28} height={Math.max(0, h)} rx={9} fill={sw.fill} stroke={sw.stroke} strokeWidth={4} />
        {sp.label && h > 46 && (
          <text x={G.cx(a) + (last ? -26 : 26)} y={y1 + Math.min(h / 2, 70)} textAnchor={last ? 'end' : 'start'} dominantBaseline="central" fontFamily={FONT.sans} fontWeight={800} fontSize={22} fill={sw.stroke} stroke={theme.bg} strokeWidth={5} paintOrder="stroke">
            {sp.label}
          </text>
        )}
      </g>
    );
  });

  const messages: React.ReactNode[] = [];
  const afterEls: React.ReactNode[] = [];
  scene.steps.forEach((st, i) => {
    const at = scene.cues[i] ?? 0;
    if (t < at) return;
    const y = G.ys[i];

    // Time that passed before this message: a pill on the axis and a wavy break on every lifeline.
    if (st.after) {
      const prevY = i === 0 ? G.lifeTop : G.ys[i - 1];
      const ym = (prevY + y) / 2;
      const k = pop(t, at);
      afterEls.push(
        <g key={`after-${i}`} transform={`translate(${G.axisX + 8 + (G.axisW - 40) / 2} ${ym}) scale(${k})`}>
          <Pill x={0} y={0} text={st.after} size={20} fill={theme.colors.gray.fill} stroke={theme.colors.gray.stroke} color={theme.text} mono />
        </g>,
      );
      for (let a = 0; a < n; a++) {
        const x = G.cx(a);
        afterEls.push(<path key={`brk-${i}-${a}`} d={`M${x - 11} ${ym} q5.5 -8 11 0 t11 0`} fill="none" stroke={theme.textSoft} strokeWidth={3.5} strokeLinecap="round" opacity={k} />);
      }
    }

    if (!st.from) return;
    const a = idx.get(st.from);
    if (a === undefined) return;
    const sw = kindColor(theme, st.kind);
    const p = easeOut(progress(t, at, 0.5));
    const glow = theme.glow ? {filter: `drop-shadow(0 0 8px ${sw.stroke}99)`} : undefined;

    if (st.kind === 'self') {
      const x = G.cx(a);
      const d = `M${x + 8} ${y - 20} L${x + 52} ${y - 20} L${x + 52} ${y + 20} L${x + 14} ${y + 20}`;
      messages.push(
        <g key={i} style={glow}>
          <path d={d} fill="none" stroke={sw.stroke} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${p} 1`} />
          {p > 0.97 && <path d={`M${x + 8} ${y + 20} l14 -10 l0 20 Z`} fill={sw.stroke} />}
          {st.label && (
            <g transform={`translate(${x + 64 + (st.label.length * pillSize * 0.56 + pillSize * 1.3) / 2} ${y}) scale(${pop(t, at + 0.15)})`}>
              <Pill x={0} y={0} text={st.label} size={pillSize} fill={sw.fill} stroke={sw.stroke} color={theme.text} mono />
            </g>
          )}
        </g>,
      );
      return;
    }

    const b = idx.get(st.to ?? '');
    if (b === undefined) return;
    const x1 = G.cx(a);
    const x2 = G.cx(b);
    const dir = x2 >= x1 ? 1 : -1;
    const reach = st.kind === 'lost' ? 0.7 : 1;
    const xs = x1 + dir * 14;
    const xe = xs + (x2 - dir * 14 - xs) * reach * p;
    const xEnd = xs + (x2 - dir * 14 - xs) * reach;
    const mid = (xs + xEnd) / 2;
    messages.push(
      <g key={i} style={glow}>
        <line x1={xs} y1={y} x2={xe} y2={y} stroke={sw.stroke} strokeWidth={5.5} strokeLinecap="round" strokeDasharray={st.kind === 'return' ? '16 11' : undefined} />
        {p > 0.96 && st.kind !== 'lost' && <path d={`M${xe} ${y} l${-dir * 22} -12 l0 24 Z`} fill={sw.stroke} />}
        {p > 0.96 && st.kind === 'lost' && (
          <g transform={`translate(${xe + dir * 22} ${y}) scale(${pop(t, at + 0.45)})`} stroke={sw.stroke} strokeWidth={7} strokeLinecap="round">
            <line x1={-15} y1={-15} x2={15} y2={15} />
            <line x1={-15} y1={15} x2={15} y2={-15} />
          </g>
        )}
        {st.label && (
          <g transform={`translate(${mid} ${y - pillSize * 1.25}) scale(${pop(t, at + 0.12)})`}>
            <Pill x={0} y={0} text={st.label} size={pillSize} fill={sw.fill} stroke={sw.stroke} color={theme.text} mono />
          </g>
        )}
      </g>,
    );
  });

  const noteSize = noteSizeFor(frame.format);
  const noteEl = note ? (
    <NoteCallout text={(note as {text: string}).text} tone={(note as {tone: Tone}).tone} since={(note as {since: number}).since} x={c.x + c.w / 2} y={c.y + c.h - G.noteRoom / 2} size={noteSize} t={t} theme={theme} />
  ) : null;

  return (
    <svg width={frame.width} height={frame.height} viewBox={`0 0 ${frame.width} ${frame.height}`} style={{position: 'absolute', left: 0, top: 0}}>
      {lifelines}
      {axis}
      {spans}
      {afterEls}
      {messages}
      {scene.actors.map((a, i) => (
        <ActorCard key={a.id} a={a} x={G.cx(i)} y={G.top + G.cardH / 2} w={G.cardW} h={G.cardH} appear={0.1 + i * 0.08} status={status[a.id]} t={t} theme={theme} />
      ))}
      {noteEl}
    </svg>
  );
};
