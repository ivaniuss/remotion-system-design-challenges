import React from 'react';
import type {Frame} from '../layout/frame';
import type {Theme} from '../theme';
import type {Timeline} from '../timeline/timeline';
import {boardView} from '../board/board';
import {DiagramLayer, NoteCallout, noteRoomFor, noteSizeFor} from './FlowScene';

// The shared board, seen through the camera. Drawn behind the scene layer so it stays
// put while titles and captions change between board scenes.
export const BoardLayer: React.FC<{tl: Timeline; t: number; frame: Frame; theme: Theme; alpha: number; offset: {x: number; y: number}}> = ({
  tl,
  t,
  frame,
  theme,
  alpha,
  offset,
}) => {
  if (alpha <= 0.001 || !tl.board) return null;
  const view = boardView(tl, t, frame.content, frame.format);
  if (!view) return null;
  const {layout, state, camera, box} = view;
  const z = camera.zoom;
  const tx = box.x + box.w / 2 - camera.x * z + offset.x;
  const ty = box.y + box.h / 2 - camera.y * z + offset.y;

  let noteEl: React.ReactNode = null;
  if (state.note) {
    const size = noteSizeFor(frame.format);
    const near = state.note.near ? layout.nodes[state.note.near] : null;
    const x = near ? tx + near.x * z : frame.content.x + frame.content.w / 2 + offset.x;
    const y = near ? ty + near.rect.y0 * z - size * 1.4 : frame.content.y + frame.content.h - noteRoomFor(frame.format) / 2 + offset.y;
    noteEl = <NoteCallout text={state.note.text} tone={state.note.tone} since={state.note.since} x={x} y={y} size={size} t={t} theme={theme} />;
  }

  // When the camera zooms in, neighbours leave the frame softly instead of running
  // under the title or the captions.
  const H = frame.height;
  const top = frame.header.y + frame.header.h;
  const bottom = Math.min(H, frame.content.y + frame.content.h + 30);
  const fade = 50;
  const stop = (y: number) => Math.min(1, Math.max(0, y / H));
  return (
    <svg width={frame.width} height={H} viewBox={`0 0 ${frame.width} ${H}`} style={{position: 'absolute', left: 0, top: 0, opacity: alpha}}>
      <defs>
        <linearGradient id="board-fade" gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={0} y2={H}>
          <stop offset={stop(top - fade)} stopColor="#fff" stopOpacity={0} />
          <stop offset={stop(top)} stopColor="#fff" stopOpacity={1} />
          <stop offset={stop(bottom)} stopColor="#fff" stopOpacity={1} />
          <stop offset={stop(bottom + fade)} stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id="board-mask" maskUnits="userSpaceOnUse" x={0} y={0} width={frame.width} height={H}>
          <rect x={0} y={0} width={frame.width} height={H} fill="url(#board-fade)" />
        </mask>
      </defs>
      <g mask="url(#board-mask)">
        <g transform={`translate(${tx} ${ty}) scale(${z})`}>
          <DiagramLayer nodes={tl.board.nodes} edges={tl.board.edges} layout={layout} st={state} t={t} theme={theme} />
        </g>
      </g>
      {noteEl}
    </svg>
  );
};
