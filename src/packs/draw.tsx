// Drawing kit shared by every icon pack: palette, stroke style, helpers.
import React from 'react';
import {FONT} from '../theme';

// Illustrations drawn in a 200x160 box with light fills and an ink outline. They use
// a fixed palette so they read the same on light and dark cards.
export const STROKE = 4.5;
export const T = {
  fill: {
    blue: '#CFE0FF', orange: '#FFD9B8', green: '#CDEBD3', red: '#FAC9C4',
    yellow: '#FFE9A8', gray: '#E4E0D6', paper: '#FFFDF8', purple: '#E2D6FF', teal: '#C8EEF0',
  },
  state: {bad: '#D8473B', ok: '#2E9E5B', info: '#2F6FEB', warn: '#E8A21A'},
  line: '#1D1D1F',
  sans: FONT.sans,
  mono: FONT.mono,
};

// Shared contract for every pack's icons: {state, frame, p}. frame = t*30 (float). p = progress 0..1 of the last state change.
export type IconProps = {state: string; frame: number; p: number};

export const F = T.fill;
export const S = T.state;
export const L = T.line;
export const ln = {stroke: L, strokeWidth: STROKE, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const};
export const rnd = {strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
export const clampP = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

export const caption = (x: number, y: number, s: string, size = 16, color = L) => (
  <text x={x} y={y} textAnchor="middle" fontFamily={T.sans} fontWeight={800} fontSize={size} fill={color}>
    {s}
  </text>
);
