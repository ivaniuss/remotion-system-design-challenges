import React from 'react';
import type {IconName, Status} from '../spec/vocab';
import type {Theme} from '../theme';
import {NodeIcon} from './icons';

// Small SVG glyphs shared by the scenes. All drawn in a 0..100 box.

export const CheckGlyph: React.FC<{size: number; color: string; bg?: string}> = ({size, color, bg}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{flex: 'none'}}>
    <circle cx={50} cy={50} r={46} fill={bg ?? color} />
    <polyline points="28,52 44,68 73,36" fill="none" stroke={bg ? color : '#fff'} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CrossGlyph: React.FC<{size: number; color: string; bg?: string}> = ({size, color, bg}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{flex: 'none'}}>
    <circle cx={50} cy={50} r={46} fill={bg ?? color} />
    <path d="M33 33 L67 67 M67 33 L33 67" stroke={bg ? color : '#fff'} strokeWidth={11} strokeLinecap="round" />
  </svg>
);

export const DotGlyph: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{flex: 'none'}}>
    <circle cx={50} cy={50} r={22} fill={color} />
  </svg>
);

// An illustration inside a rounded, tinted tile (HTML usage).
export const IconTile: React.FC<{icon: IconName; size: number; tile: string; border: string; frame: number; state?: string}> = ({
  icon,
  size,
  tile,
  border,
  frame,
  state = 'idle',
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.22,
      background: tile,
      border: `3px solid ${border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 'none',
    }}
  >
    <svg width={size * 0.86} height={size * 0.69} viewBox="0 0 200 160">
      <NodeIcon icon={icon} state={state} frame={frame} p={1} />
    </svg>
  </div>
);

// Status badge for flow nodes (SVG, centered at 0,0, radius r).
export const StatusBadge: React.FC<{status: Status; r: number; theme: Theme; t: number}> = ({status, r, theme, t}) => {
  if (status === 'idle') return null;
  const c = theme.colors;
  const fill = status === 'ok' ? c.green.stroke : status === 'error' ? c.red.stroke : status === 'warn' ? c.yellow.stroke : c.blue.stroke;
  const k = r / 24;
  return (
    <g>
      <circle r={r} fill={fill} stroke={theme.surface} strokeWidth={4 * k} />
      {status === 'ok' && <polyline points={`${-10 * k},${0} ${-3 * k},${8 * k} ${11 * k},${-8 * k}`} fill="none" stroke="#fff" strokeWidth={5 * k} strokeLinecap="round" strokeLinejoin="round" />}
      {status === 'error' && <path d={`M${-8 * k} ${-8 * k} L${8 * k} ${8 * k} M${8 * k} ${-8 * k} L${-8 * k} ${8 * k}`} stroke="#fff" strokeWidth={5 * k} strokeLinecap="round" />}
      {status === 'warn' && (
        <>
          <line x1={0} y1={-10 * k} x2={0} y2={3 * k} stroke="#fff" strokeWidth={5 * k} strokeLinecap="round" />
          <circle cx={0} cy={10 * k} r={3 * k} fill="#fff" />
        </>
      )}
      {status === 'busy' && (
        <g transform={`rotate(${t * 360})`}>
          <circle r={11 * k} fill="none" stroke="#fff" strokeWidth={4.5 * k} strokeDasharray={`${44 * k} ${26 * k}`} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};
