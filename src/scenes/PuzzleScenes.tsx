import React from 'react';
import type {PuzzleClaim} from '../spec/schema';
import {LEVEL_POINTS, LEVEL_TONE, type PuzzleLevel} from '../spec/vocab';
import {FONT, Theme, toneSwatch} from '../theme';
import {CheckGlyph, CrossGlyph} from '../components/glyphs';
import {Rich} from '../components/Rich';
import {NodeIcon, iconState} from '../components/icons';
import {clamp01, easeOut, enter, pop} from '../video/anim';
import type {Frame} from '../layout/frame';
import type {SceneProps} from './types';
import {thinkWindow} from './puzzleTime';

// The daily-puzzle scenes (pack "brain", docs/packs/brain.md):
//   puzzle → asks (question, sequence of tiles, A–D choices, a claim to judge) and holds
//            a silent countdown while the viewer thinks;
//   reveal → the same puzzle solved, the answer big, 1–3 lines of why, the points;
//   score  → the scorecard of the video and the question that asks for a comment.
// The first scene of a Short is the hook: it is complete on frame 0 (no entrance).

const LETTERS = ['A', 'B', 'C', 'D'];
const LEVEL_NAME: Record<PuzzleLevel, string> = {easy: 'Easy', medium: 'Medium', hard: 'Hard'};
const pts = (n: number) => `${n} ${n === 1 ? 'pt' : 'pts'}`;

type Parts = {question?: string; sequence?: string[]; choices?: string[]; claim?: PuzzleClaim; ops?: string[]};
type Solved = {answer: string; correct?: number; verdict?: 'right' | 'wrong'; k: number; t: number}; // k: 0 → 1 as it is revealed; t: scene time

const shadow = (theme: Theme, px = 7) => (theme.shadowOpacity > 0 ? `${px}px ${px}px 0 ${theme.shadow}` : theme.glow ? `0 0 26px ${theme.accent}33` : 'none');

const LevelBadge: React.FC<{level: PuzzleLevel; theme: Theme; size: number; scale?: number}> = ({level, theme, size, scale = 1}) => {
  const sw = toneSwatch(theme, LEVEL_TONE[level]);
  return (
    <div
      style={{
        transform: `scale(${scale})`,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        background: sw.stroke,
        color: '#FFFFFF',
        fontWeight: 900,
        fontSize: size,
        letterSpacing: 2,
        textTransform: 'uppercase',
        padding: `${size * 0.32}px ${size * 0.8}px`,
        borderRadius: 999,
        border: `4px solid ${theme.border}`,
        boxShadow: shadow(theme, 5),
      }}
    >
      {LEVEL_NAME[level]}
      <span style={{opacity: 0.85}}>·</span>
      {pts(LEVEL_POINTS[level])}
    </div>
  );
};

// The row of tiles of a sequence. The "?" tile is dashed and breathes; when solved it
// flips to the answer in green.
// Arrows over a solved sequence, one per gap, each with its step ("+4", "×2"), drawn one
// after another once the answer tile has flipped: the rule is seen, not read.
const OpsArcs: React.FC<{ops: string[]; size: number; gap: number; theme: Theme; t: number}> = ({ops, size, gap, theme, t}) => {
  const n = ops.length + 1;
  const w = n * size + (n - 1) * gap;
  const h = Math.max(70, size * 0.62);
  const font = Math.max(24, Math.min(40, size * 0.28));
  const color = theme.name === 'light' ? theme.colors.orange.stroke : theme.accent;
  return (
    <svg width={w} height={h} style={{display: 'block', overflow: 'visible'}}>
      {ops.map((op, i) => {
        const k = easeOut(clamp01((t - (0.8 + i * 0.32)) / 0.4));
        if (k <= 0) return null;
        const x1 = i * (size + gap) + size * 0.62;
        const x2 = (i + 1) * (size + gap) + size * 0.38;
        const top = h * 0.32;
        const d = `M ${x1} ${h - 2} C ${x1} ${top}, ${x2} ${top}, ${x2} ${h - 2}`;
        const len = (x2 - x1) * 1.6 + h;
        const mid = (x1 + x2) / 2;
        return (
          <g key={i}>
            <path d={d} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeDasharray={`${len * k} ${len}`} />
            {k > 0.9 && <path d={`M ${x2 - 9} ${h - 14} L ${x2} ${h - 1} L ${x2 + 9} ${h - 14}`} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />}
            <text x={mid} y={top - 4} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={font} fill={color} opacity={k} transform={`translate(0 ${(1 - k) * 10})`}>
              {op}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const SequenceRow: React.FC<{items: string[]; width: number; theme: Theme; t: number; solved?: Solved; max: number; ops?: string[]}> = ({items, width, theme, t, solved, max, ops}) => {
  const n = items.length;
  const gap = n > 6 ? 12 : 18;
  const size = Math.min(max, (width - gap * (n - 1)) / n);
  const longest = Math.max(...items.map((x) => x.length), solved ? solved.answer.length : 1);
  const font = Math.min(size * 0.5, (size * 1.5) / Math.max(1, longest * 0.62));
  const green = theme.colors.green;
  // The yellow accent of the light look is too pale for a dashed outline: use its darker stroke.
  const hole = theme.name === 'light' ? theme.colors.yellow.stroke : theme.accent;
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4}}>
    {solved && ops && ops.length === n - 1 && <OpsArcs ops={ops} size={size} gap={gap} theme={theme} t={solved.t} />}
    <div style={{display: 'flex', gap, justifyContent: 'center'}}>
      {items.map((x, i) => {
        const missing = x.trim() === '?';
        const flip = missing && solved ? solved.k : 0;
        const breathe = missing && !solved ? 1 + 0.05 * Math.sin(t * 5) : 1;
        const showAnswer = flip > 0.5;
        return (
          <div
            key={i}
            style={{
              width: size,
              height: size,
              flex: 'none',
              borderRadius: size * 0.18,
              background: showAnswer ? green.fill : missing ? 'transparent' : theme.surface,
              border: `${Math.max(3, size * 0.04)}px ${missing && !showAnswer ? 'dashed' : 'solid'} ${showAnswer ? green.stroke : missing ? hole : theme.border}`,
              boxShadow: missing && !showAnswer ? 'none' : shadow(theme, 5),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONT.sans,
              fontWeight: 900,
              fontSize: font,
              color: showAnswer ? green.stroke : missing ? hole : theme.text,
              transform: `scale(${breathe}) scaleX(${missing && solved ? Math.abs(1 - 2 * flip) || 0.02 : 1})`,
              letterSpacing: -1,
            }}
          >
            {showAnswer ? solved!.answer : x}
          </div>
        );
      })}
    </div>
    </div>
  );
};

const Choices: React.FC<{items: string[]; width: number; theme: Theme; vertical: boolean; solved?: Solved; font: number}> = ({items, width, theme, vertical, solved, font}) => {
  const cols = items.length === 4 ? 2 : vertical ? 1 : Math.min(3, items.length);
  const gap = 20;
  const cw = (width - gap * (cols - 1)) / cols;
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', gap, width, justifyContent: 'center'}}>
      {items.map((c, i) => {
        const right = solved && solved.correct === i;
        const dim = solved && solved.correct !== undefined && !right ? 1 - 0.6 * solved.k : 1;
        const sw = right ? theme.colors.green : null;
        const k = right ? solved!.k : 0;
        return (
          <div
            key={i}
            style={{
              width: cw,
              boxSizing: 'border-box',
              opacity: dim,
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              padding: '16px 22px',
              background: sw && k > 0.3 ? sw.fill : theme.surface,
              border: `4px solid ${sw && k > 0.3 ? sw.stroke : theme.border}`,
              borderRadius: 20,
              boxShadow: shadow(theme, 6),
              transform: `scale(${1 + 0.04 * Math.sin(Math.PI * k)})`,
            }}
          >
            <div
              style={{
                width: font * 1.5,
                height: font * 1.5,
                flex: 'none',
                borderRadius: font,
                background: sw && k > 0.3 ? sw.stroke : theme.accent,
                color: sw && k > 0.3 ? '#FFFFFF' : theme.accentText,
                fontWeight: 900,
                fontSize: font * 0.8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {LETTERS[i]}
            </div>
            <div style={{fontWeight: 800, fontSize: font, color: theme.text, lineHeight: 1.15}}>
              <Rich text={c} accent={theme.accent} accentText={theme.accentText} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// What someone answered, as a speech bubble. Revealed: a ✓ or ✕ stamp lands on it.
const ClaimBubble: React.FC<{claim: PuzzleClaim; width: number; theme: Theme; solved?: Solved; font: number}> = ({claim, width, theme, solved, font}) => {
  const stamp = solved?.verdict ? pop(solved.t, 0.5) : 0;
  const wrong = solved?.verdict === 'wrong';
  const sw = solved?.verdict ? theme.colors[wrong ? 'red' : 'green'] : null;
  return (
    <div style={{position: 'relative', width, display: 'flex', flexDirection: 'column', gap: 10}}>
      <div style={{fontWeight: 800, fontSize: font * 0.62, color: theme.textSoft, letterSpacing: 1.5, textTransform: 'uppercase', paddingLeft: 10}}>{claim.who}</div>
      <div
        style={{
          position: 'relative',
          background: theme.surface,
          border: `4px solid ${sw && stamp > 0.2 ? sw.stroke : theme.border}`,
          borderRadius: '28px 28px 28px 6px',
          boxShadow: shadow(theme, 6),
          padding: '22px 30px',
          fontWeight: 800,
          fontSize: font,
          lineHeight: 1.2,
          color: theme.text,
          textDecoration: wrong && stamp > 0.5 ? 'line-through' : 'none',
          textDecorationColor: sw?.stroke,
          textDecorationThickness: 5,
        }}
      >
        <Rich text={claim.text} accent={theme.accent} accentText={theme.accentText} />
      </div>
      {sw && stamp > 0 && (
        <div style={{position: 'absolute', right: -16, top: font * 0.2, transform: `scale(${stamp}) rotate(-12deg)`}}>
          {wrong ? <CrossGlyph size={font * 2.2} color={sw.stroke} /> : <CheckGlyph size={font * 2.2} color={sw.stroke} />}
        </div>
      )}
    </div>
  );
};

// The puzzle itself: question, then whichever parts it has. `compact` = the smaller
// version a reveal shows above the answer.
const Board: React.FC<{parts: Parts; width: number; theme: Theme; t: number; vertical: boolean; first: boolean; solved?: Solved; compact?: boolean; maxH: number}> = ({
  parts,
  width,
  theme,
  t,
  vertical,
  first,
  solved,
  compact,
  maxH,
}) => {
  const q = parts.question ?? '';
  const chars = q.replace(/\*/g, '').length;
  const many = [parts.sequence, parts.choices, parts.claim].filter(Boolean).length;
  let qFont = vertical ? (chars > 110 ? 52 : chars > 70 ? 60 : 72) : chars > 110 ? 52 : chars > 70 ? 62 : 76;
  if (compact) qFont *= 0.72;
  if (many >= 2) qFont *= 0.88;
  const body = vertical ? 46 : 44;
  const bodyFont = compact ? body * 0.85 : body;
  const tileMax = compact ? (vertical ? 140 : 170) : vertical ? 180 : 210;
  const appear = (i: number) => (first ? {opacity: 1, dy: 0} : enter(t, 0.08 + i * 0.12, 0.35, 26));
  const blocks: React.ReactNode[] = [];
  if (q)
    blocks.push(
      <div key="q" style={{fontWeight: 900, fontSize: qFont, lineHeight: 1.15, color: theme.text, textAlign: 'center', letterSpacing: -0.5, maxWidth: width}}>
        <Rich text={q} accent={theme.accent} accentText={theme.accentText} />
      </div>,
    );
  if (parts.sequence) blocks.push(<SequenceRow key="s" items={parts.sequence} width={width} theme={theme} t={t} solved={solved} max={tileMax} ops={parts.ops} />);
  if (parts.choices) blocks.push(<Choices key="c" items={parts.choices} width={width} theme={theme} vertical={vertical} solved={solved} font={bodyFont} />);
  if (parts.claim) blocks.push(<ClaimBubble key="b" claim={parts.claim} width={width * (vertical ? 0.94 : 0.9)} theme={theme} solved={solved} font={bodyFont} />);
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: compact ? 26 : vertical ? 40 : 34, width, maxHeight: maxH}}>
      {blocks.map((b, i) => {
        const e = appear(i);
        return (
          <div key={i} style={{opacity: e.opacity, transform: `translateY(${e.dy}px)`, display: 'flex', justifyContent: 'center', width}}>
            {b}
          </div>
        );
      })}
    </div>
  );
};

// The countdown: a ring that runs out, the seconds left in the middle; red in the last 3.
const Countdown: React.FC<{left: number; total: number; size: number; theme: Theme; live: boolean}> = ({left, total, size, theme, live}) => {
  const frac = total > 0 ? clamp01(left / total) : 0;
  const secs = Math.max(0, Math.ceil(left - 0.001));
  const urgent = live && left <= 3 && left > 0;
  const color = urgent ? theme.colors.red.stroke : theme.accent;
  const r = size / 2 - 14;
  const C = 2 * Math.PI * r;
  const beat = urgent ? 1 + 0.06 * Math.max(0, Math.cos((left % 1) * Math.PI * 2)) : 1;
  return (
    <div style={{position: 'relative', width: size, height: size, transform: `scale(${beat})`, opacity: live ? 1 : 0.55}}>
      <svg width={size} height={size} style={{position: 'absolute', left: 0, top: 0}}>
        <circle cx={size / 2} cy={size / 2} r={r} fill={theme.surface} stroke={theme.dots} strokeWidth={16} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={16}
          strokeLinecap="round"
          strokeDasharray={`${C * frac} ${C}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.sans, fontWeight: 900, fontSize: size * 0.42, color: urgent ? color : theme.text, letterSpacing: -2}}>
        {secs}
      </div>
    </div>
  );
};

const Tag: React.FC<{text: string; theme: Theme; size: number; k: number; tone?: 'accent' | 'soft'}> = ({text, theme, size, k, tone = 'accent'}) => (
  <div
    style={{
      transform: `scale(${k})`,
      background: tone === 'accent' ? theme.accent : theme.surface,
      color: tone === 'accent' ? theme.accentText : theme.text,
      border: `4px solid ${theme.border}`,
      boxShadow: shadow(theme, 5),
      borderRadius: 999,
      padding: `${size * 0.4}px ${size}px`,
      fontWeight: 900,
      fontSize: size,
      letterSpacing: 1,
      whiteSpace: 'nowrap',
    }}
  >
    {text}
  </div>
);

// What sits next to (16:9) or under (9:16) the puzzle while the viewer thinks.
const ThinkPanel: React.FC<{scene: SceneProps<'puzzle'>['scene']; t: number; theme: Theme; vertical: boolean; first: boolean; compact?: boolean}> = ({scene, t, theme, vertical, first, compact}) => {
  const win = thinkWindow(scene);
  const tag = vertical ? 40 : 38;
  const items: React.ReactNode[] = [];
  if (scene.pause && win) {
    const on = t >= win.start;
    const k = on ? pop(t, win.start) * (1 + 0.04 * Math.sin((t - win.start) * 6)) : 0;
    items.push(<Tag key="p" text="❚❚  Pause the video" theme={theme} size={tag} k={k} />);
  } else if (win) {
    const total = win.end - win.start;
    const left = t < win.start ? total : Math.max(0, win.end - t);
    const e = first ? {opacity: 1, dy: 0} : enter(t, 0.3, 0.4, 20);
    items.push(
      <div key="c" style={{opacity: e.opacity, transform: `translateY(${e.dy}px)`}}>
        <Countdown left={left} total={total} size={vertical ? (compact ? 200 : 260) : compact ? 250 : 300} theme={theme} live={t >= win.start} />
      </div>,
    );
  }
  if (scene.tomorrow) {
    const at = win ? win.end - 0.9 : Math.max(0.5, scene.duration - 1.6);
    if (t >= at) items.push(<Tag key="tm" text="Answer: tomorrow" theme={theme} size={tag} k={pop(t, at)} tone="soft" />);
  }
  if (!items.length) return null;
  return <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26}}>{items}</div>;
};

const Layout: React.FC<{frame: Frame; children: React.ReactNode; side?: React.ReactNode; top?: React.ReactNode}> = ({frame, children, side, top}) => {
  const c = frame.content;
  const vertical = frame.format === 'vertical';
  // A shorter content area (a host stands below it) tightens the gaps; `safe center` keeps
  // anything that still overflows from sliding up under the header.
  const tight = vertical && c.h < 1000;
  if (vertical || !side)
    return (
      <div style={{position: 'absolute', left: c.x, top: c.y, width: c.w, height: c.h, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'safe center', gap: vertical ? (tight ? 28 : 44) : 30, fontFamily: FONT.sans}}>
        {top}
        {children}
        {side}
      </div>
    );
  return (
    <div style={{position: 'absolute', left: c.x, top: c.y, width: c.w, height: c.h, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 70, fontFamily: FONT.sans}}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30}}>
        {top}
        {children}
      </div>
      <div style={{width: 470, flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30}}>{side}</div>
    </div>
  );
};

export const PuzzleScene: React.FC<SceneProps<'puzzle'>> = ({scene, t, frame, theme}) => {
  const vertical = frame.format === 'vertical';
  const first = scene.index === 0;
  const c = frame.content;
  const hasSide = !!thinkWindow(scene) || scene.tomorrow;
  const width = vertical ? c.w - 40 : hasSide ? c.w - 470 - 70 : c.w - 200;
  const badge = scene.level ? <LevelBadge level={scene.level} theme={theme} size={vertical ? 34 : 32} scale={first ? 1 : pop(t, 0.05)} /> : null;
  return (
    <Layout frame={frame} top={badge} side={hasSide ? <ThinkPanel scene={scene} t={t} theme={theme} vertical={vertical} first={first} compact={!!frame.host} /> : undefined}>
      <Board parts={scene} width={width} theme={theme} t={t} vertical={vertical} first={first} maxH={c.h} />
    </Layout>
  );
};

export const RevealScene: React.FC<SceneProps<'reveal'>> = ({scene, t, frame, theme}) => {
  const vertical = frame.format === 'vertical';
  const c = frame.content;
  const p = scene.puzzle;
  const parts: Parts = {
    question: scene.question ?? p?.question,
    sequence: scene.sequence ?? p?.sequence,
    choices: scene.choices ?? p?.choices,
    claim: scene.claim ?? p?.claim,
    ops: scene.ops,
  };
  const level = p?.level;
  const k = easeOut(clamp01((t - 0.15) / 0.5));
  const solved: Solved = {answer: scene.answer, correct: scene.correct, verdict: scene.verdict, k, t};
  // The puzzle is shown again, smaller; a long question is dropped when the parts carry it.
  const showQ = !parts.sequence || (parts.question ?? '').length < 60;
  const boardParts = showQ ? parts : {...parts, question: undefined};
  const width = vertical ? c.w - 60 : c.w - 560 - 70;
  const ansPop = pop(t, 0.2);
  const answerSize = vertical ? (scene.answer.length > 14 ? 74 : 110) : scene.answer.length > 14 ? 76 : 120;
  const lastCue = scene.cues[scene.cues.length - 1] ?? 0.6;
  const ptsAt = Math.min(Math.max(lastCue + 0.7, 1.2), Math.max(0.8, scene.duration - 1.2));
  const green = theme.colors.green;
  const side = (
    <>
      <div
        style={{
          transform: `scale(${ansPop})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          background: green.fill,
          border: `5px solid ${green.stroke}`,
          borderRadius: 26,
          boxShadow: shadow(theme, 7),
          padding: vertical ? '14px 44px 18px' : '16px 44px 20px',
          maxWidth: vertical ? c.w - 60 : 520,
        }}
      >
        <div style={{fontWeight: 900, fontSize: vertical ? 28 : 26, letterSpacing: 4, color: green.stroke, textTransform: 'uppercase'}}>Answer</div>
        <div style={{fontWeight: 900, fontSize: answerSize, lineHeight: 1.05, color: theme.name === 'light' ? '#121826' : theme.text, letterSpacing: -2, textAlign: 'center'}}>{scene.answer}</div>
      </div>
      {scene.why.length > 0 && (
        <div style={{display: 'flex', flexDirection: 'column', gap: 16, width: vertical ? c.w - 80 : 520}}>
          {scene.why.map((w, i) => {
            const e = enter(t, scene.cues[i] ?? 0.6 + i * 0.6, 0.35, 0);
            return (
              <div key={i} style={{opacity: e.opacity, transform: `translateX(${(1 - e.opacity) * 40}px)`, display: 'flex', alignItems: 'center', gap: 16}}>
                <div style={{width: 14, height: 14, borderRadius: 7, background: theme.accent, flex: 'none', border: `3px solid ${theme.border}`}} />
                <div style={{fontWeight: 700, fontSize: vertical ? 44 : 42, color: theme.text, lineHeight: 1.2}}>
                  <Rich text={w.text} accent={theme.accent} accentText={theme.accentText} />
                </div>
              </div>
            );
          })}
        </div>
      )}
      {level && t >= ptsAt && <Tag text={`Got it? +${pts(LEVEL_POINTS[level])}`} theme={theme} size={vertical ? 36 : 32} k={pop(t, ptsAt)} />}
    </>
  );
  if (vertical)
    return (
      <div style={{position: 'absolute', left: c.x, top: c.y, width: c.w, height: c.h, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 36, fontFamily: FONT.sans}}>
        <Board parts={boardParts} width={width} theme={theme} t={t} vertical first={false} solved={solved} compact maxH={c.h * 0.5} />
        {side}
      </div>
    );
  return (
    <Layout frame={frame} side={side}>
      <Board parts={boardParts} width={width} theme={theme} t={t} vertical={false} first={false} solved={solved} maxH={c.h} />
    </Layout>
  );
};

export const ScoreScene: React.FC<SceneProps<'score'>> = ({scene, t, frame, theme}) => {
  const vertical = frame.format === 'vertical';
  const c = frame.content;
  const levels = scene.card ? scene.levels ?? [] : [];
  const total = levels.reduce((a, l) => a + LEVEL_POINTS[l], 0);
  const rowAt = (i: number) => 0.25 + i * 0.3;
  const ctaAt = levels.length ? rowAt(levels.length) + 0.3 : 0.3;
  const nextAt = Math.min(ctaAt + 0.9, Math.max(ctaAt, scene.duration - 1.4));
  const ctaK = pop(t, ctaAt) * (1 + 0.025 * Math.sin(Math.max(0, t - ctaAt) * 6));
  const fs = vertical ? 50 : 48;
  return (
    <div style={{position: 'absolute', left: c.x, top: c.y, width: c.w, height: c.h, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: vertical ? 46 : 30, fontFamily: FONT.sans}}>
      {levels.length > 0 ? (
        <div style={{width: vertical ? c.w - 120 : 900, background: theme.surface, border: `4px solid ${theme.border}`, borderRadius: 28, boxShadow: shadow(theme, 8), padding: vertical ? '28px 36px' : '22px 34px', display: 'flex', flexDirection: 'column', gap: vertical ? 18 : 12}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 18, fontWeight: 900, fontSize: fs * 0.7, letterSpacing: 4, textTransform: 'uppercase', color: theme.textSoft}}>
            <svg width={fs * 1.6} height={fs * 1.28} viewBox="0 0 200 160">
              <NodeIcon icon="trophy" state={iconState('trophy', t > ctaAt ? 'ok' : 'idle')} frame={t * 30} p={clamp01((t - ctaAt) / 0.6)} />
            </svg>
            Your score
          </div>
          {levels.map((l, i) => {
            const e = enter(t, rowAt(i), 0.3, 0);
            const sw = toneSwatch(theme, LEVEL_TONE[l]);
            return (
              <div key={i} style={{opacity: e.opacity, transform: `translateX(${(1 - e.opacity) * 40}px)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 800, fontSize: fs, color: theme.text, borderBottom: `3px dashed ${theme.dots}`, paddingBottom: 10}}>
                <span style={{display: 'flex', alignItems: 'center', gap: 16}}>
                  <span style={{width: 22, height: 22, borderRadius: 11, background: sw.stroke, display: 'inline-block'}} />
                  {LEVEL_NAME[l]}
                </span>
                <span style={{color: sw.stroke, fontWeight: 900}}>{pts(LEVEL_POINTS[l])}</span>
              </div>
            );
          })}
          <div style={{opacity: enter(t, rowAt(levels.length), 0.3, 0).opacity, display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: fs * 1.15, color: theme.text}}>
            <span>Total</span>
            <span>
              <span style={{color: theme.textSoft}}>? </span>/ {total}
            </span>
          </div>
        </div>
      ) : (
        <svg width={vertical ? 300 : 260} height={vertical ? 240 : 208} viewBox="0 0 200 160" style={{transform: `scale(${pop(t, 0.1)})`}}>
          <NodeIcon icon="trophy" state="shine" frame={t * 30} p={clamp01(t / 0.8)} />
        </svg>
      )}
      <div
        style={{
          transform: `scale(${ctaK})`,
          background: theme.accent,
          color: theme.accentText,
          fontWeight: 900,
          fontSize: vertical ? 50 : 48,
          lineHeight: 1.15,
          textAlign: 'center',
          padding: '22px 44px',
          borderRadius: 30,
          border: `4px solid ${theme.border}`,
          boxShadow: shadow(theme, 7),
          maxWidth: vertical ? c.w - 60 : 1300,
        }}
      >
        <Rich text={scene.cta} accent={theme.surface} accentText={theme.text} />
      </div>
      {scene.next && t >= nextAt && (
        <div style={{opacity: enter(t, nextAt, 0.35, 0).opacity, display: 'flex', alignItems: 'center', gap: 16, fontWeight: 800, fontSize: vertical ? 38 : 34, color: theme.textSoft}}>
          <svg width={vertical ? 64 : 56} height={vertical ? 52 : 45} viewBox="0 0 200 160">
            <NodeIcon icon="stopwatch" state="idle" frame={t * 30} p={1} />
          </svg>
          {scene.next}
        </div>
      )}
    </div>
  );
};
