// Brain-pack icons (daily puzzles): a jigsaw piece, a stopwatch and a trophy. Same drawing
// kit as every pack: 200x160 box, light fills, ink outline.
import React from 'react';
import {T, F, S, L, ln, rnd, clampP, type IconProps} from '../draw';

// ---------- puzzle: one jigsaw piece (a challenge; "solved" clicks a check on it) ----------
const PIECE =
  'M44 46 H82 C78 36 80 22 100 22 C120 22 122 36 118 46 H156 V82 C166 78 180 80 180 100 ' +
  'C180 120 166 122 156 118 V146 H44 V118 C54 122 68 120 68 100 C68 80 54 78 44 82 Z';
const PuzzleIcon: React.FC<IconProps> = ({state, frame, p}) => {
  const solved = state === 'solved';
  const wrong = state === 'wrong';
  const wobble = state === 'thinking' ? Math.sin(frame / 5) * 4 : 0;
  return (
    <g transform={`rotate(${wobble} 100 90)`}>
      <path d={PIECE} fill={solved ? F.green : wrong ? F.red : F.purple} {...ln} />
      {!solved && !wrong && (
        <text x={100} y={112} textAnchor="middle" fontFamily={T.sans} fontWeight={900} fontSize={54} fill={L}>
          ?
        </text>
      )}
      {solved && <polyline points={`78,96 ${78 + 16 * clampP(p * 2)},${96 + 16 * clampP(p * 2)} ${94 + 30 * clampP(p * 2 - 1)},${112 - 34 * clampP(p * 2 - 1)}`} fill="none" stroke={S.ok} strokeWidth={11} {...rnd} />}
      {wrong && (
        <g stroke={S.bad} strokeWidth={11} {...rnd}>
          <line x1={82} y1={78} x2={118} y2={114} />
          <line x1={118} y1={78} x2={82} y2={114} />
        </g>
      )}
    </g>
  );
};

// ---------- stopwatch: thinking time ("running" sweeps the hand) ----------
const StopwatchIcon: React.FC<IconProps> = ({state, frame}) => {
  const run = state === 'running';
  const done = state === 'done';
  const angle = run ? (frame * 6) % 360 : done ? 0 : 300;
  return (
    <>
      <rect x={88} y={4} width={24} height={14} rx={4} fill={L} />
      <line x1={100} y1={18} x2={100} y2={28} stroke={L} strokeWidth={7} strokeLinecap="round" />
      <line x1={146} y1={34} x2={156} y2={24} stroke={L} strokeWidth={8} strokeLinecap="round" />
      <circle cx={100} cy={90} r={62} fill={done ? F.red : F.orange} {...ln} />
      <circle cx={100} cy={90} r={46} fill={F.paper} {...ln} strokeWidth={3.5} />
      {run && <path d={`M100 90 L100 44 A46 46 0 ${angle > 180 ? 1 : 0} 1 ${100 + 46 * Math.sin((angle * Math.PI) / 180)} ${90 - 46 * Math.cos((angle * Math.PI) / 180)} Z`} fill={F.yellow} opacity={0.8} />}
      <line x1={100} y1={90} x2={100} y2={52} transform={`rotate(${angle} 100 90)`} stroke={L} strokeWidth={6} strokeLinecap="round" />
      <circle cx={100} cy={90} r={6} fill={L} />
    </>
  );
};

// ---------- trophy: points, the weekly ranking ("shine" adds rays) ----------
const TrophyIcon: React.FC<IconProps> = ({state, p}) => {
  const shine = state === 'shine';
  return (
    <>
      {shine &&
        [-60, -30, 0, 30, 60].map((a, i) => (
          <line key={i} x1={100} y1={6} x2={100} y2={6 - 12 * clampP(p * 2)} transform={`rotate(${a} 100 70)`} stroke={S.warn} strokeWidth={6} strokeLinecap="round" />
        ))}
      <path d="M62 34 C40 34 34 48 38 60 C42 74 56 80 68 80" fill="none" {...ln} strokeWidth={8} />
      <path d="M138 34 C160 34 166 48 162 60 C158 74 144 80 132 80" fill="none" {...ln} strokeWidth={8} />
      <path d="M58 22 H142 V58 C142 84 124 100 100 100 C76 100 58 84 58 58 Z" fill={F.yellow} {...ln} />
      <rect x={90} y={100} width={20} height={20} fill={F.yellow} {...ln} />
      <rect x={64} y={120} width={72} height={22} rx={5} fill={F.gray} {...ln} />
      <path d="M100 40 L106 54 L121 55 L109 64 L113 79 L100 71 L87 79 L91 64 L79 55 L94 54 Z" fill={L} opacity={0.85} />
    </>
  );
};

export const ICONS: Record<string, React.FC<IconProps>> = {
  puzzle: PuzzleIcon,
  stopwatch: StopwatchIcon,
  trophy: TrophyIcon,
};
