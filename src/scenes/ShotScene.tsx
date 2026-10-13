import React, {useLayoutEffect, useRef} from 'react';
import {FONT} from '../theme';
import {clamp01, easeOut} from '../video/anim';
import {WORLD_DRAW} from '../worlds';
import {drawShot, logicalSize, toPixel, worldFrame} from '../worlds/render';
import type {SceneProps} from './types';

// A documentary shot: the world fills the frame (canvas), with a few thin labels, the
// shot's name and real scale in the corner, and, once per film, the title card.
// The canvas is redrawn from (scene, t) on every frame, so it stays a pure function of time.

const fade = (t: number, at: number, d = 0.5) => easeOut(clamp01((t - at) / d));

export const ShotScene: React.FC<SceneProps<'shot'>> = ({scene, t, frame}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current?.getContext('2d');
    if (c) drawShot(c, scene, t, frame);
  }, [scene, t, frame]);

  const vertical = frame.format === 'vertical';
  const {W} = logicalSize(frame);
  const px = frame.width / W; // logical unit -> pixels
  const wf = worldFrame(scene, t, frame);
  const world = WORLD_DRAW[scene.world];

  // Labels: pinned to a point of the world, text placed away from it.
  const labelPx = vertical ? 30 : 24;
  const top = vertical ? 260 : 60; // keep clear of the corner title and, in 9:16, the platform UI
  const bottom = vertical ? 1380 : frame.height - 40;
  const labels = scene.steps.flatMap((st, i) => {
    if (!st.label) return [];
    const since = scene.cues[i] ?? 0;
    if (t < since) return [];
    const a = world.anchor(st.label.anchor, wf);
    if (!a) return [];
    const p = toPixel(scene, t, frame, a);
    // the camera may have moved the point out of the frame: then the label goes too
    const m = 30;
    if (p.x < m || p.x > frame.width - m || p.y < m || p.y > frame.height - m) return [];
    let dx = (a.dx ?? 0) * px;
    let dy = (a.dy ?? 0) * px;
    if (a.dx === undefined && a.dy === undefined) {
      const ox = p.x - frame.width / 2;
      const oy = p.y - frame.height / 2;
      const n = Math.hypot(ox, oy) || 1;
      dx = (ox / n) * 150;
      dy = (oy / n) * 150;
    }
    const tx = Math.min(frame.width - 40, Math.max(40, p.x + dx));
    const ty = Math.min(bottom, Math.max(top, p.y + dy));
    let right = tx >= p.x;
    const w = st.label.text.length * labelPx * 0.6 + 12; // monospace: ~0.6 em per character
    if (right && tx + w > frame.width - 24) right = false;
    else if (!right && tx - w < 24) right = true;
    return [{key: i, p, tx, ty, right, text: st.label.text, k: fade(t, since)}];
  });

  const cardStep = scene.steps.findIndex((st) => st.card);
  const card = cardStep >= 0 ? scene.steps[cardStep].card! : null;
  const cardK = card ? fade(t, scene.cues[cardStep] ?? 0, 0.9) : 0;
  const hudK = fade(t, 0.2, 0.6) * (1 - cardK);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <canvas ref={ref} width={frame.width} height={frame.height} style={{position: 'absolute', left: 0, top: 0, width: frame.width, height: frame.height}} />
      <svg width={frame.width} height={frame.height} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {labels.map((l) => (
          <g key={l.key} opacity={l.k}>
            <line x1={l.p.x} y1={l.p.y} x2={l.tx} y2={l.ty} stroke="rgba(225,215,255,0.6)" strokeWidth={1.6} />
            <circle cx={l.p.x} cy={l.p.y} r={4.5} fill="#ECE6FA" />
            <text
              x={l.tx + (l.right ? 12 : -12)}
              y={l.ty}
              textAnchor={l.right ? 'start' : 'end'}
              dominantBaseline="middle"
              fontFamily={FONT.mono}
              fontSize={labelPx}
              fill="#ECE6FA"
              style={{paintOrder: 'stroke', stroke: 'rgba(5,4,11,0.85)', strokeWidth: 6}}
            >
              {l.text}
            </text>
          </g>
        ))}
      </svg>
      {(scene.title || scene.scale) && hudK > 0 && (
        <div style={{position: 'absolute', left: vertical ? 60 : 48, top: vertical ? 200 : 40, display: 'grid', gap: 6, opacity: hudK, textShadow: '0 1px 10px rgba(0,0,0,0.9)'}}>
          {scene.title && <div style={{fontFamily: FONT.mono, fontWeight: 500, fontSize: vertical ? 34 : 28, color: '#EFEAF8', letterSpacing: 0.5}}>{scene.title}</div>}
          {/* never uppercase: units are case-sensitive (µm would read "MM") */}
          {scene.scale && <div style={{fontFamily: FONT.mono, fontSize: vertical ? 24 : 20, color: '#FFC35A', letterSpacing: 1.5}}>{scene.scale}</div>}
        </div>
      )}
      {card && cardK > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: vertical ? 26 : 18,
            opacity: cardK,
            background: `radial-gradient(ellipse at 50% 50%, rgba(5,4,11,${0.62 * cardK}) 0%, rgba(5,4,11,${0.3 * cardK}) 55%, rgba(5,4,11,0) 80%)`,
            paddingBottom: vertical ? 260 : 40,
          }}
        >
          <div
            style={{
              fontFamily: FONT.display,
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: (vertical ? 150 : 190) * (card.title.length > 14 ? 0.62 : 1),
              lineHeight: 1,
              color: '#FFD27A',
              textAlign: 'center',
              padding: '0 60px',
              transform: `scale(${1.03 - 0.03 * cardK})`,
            }}
          >
            {card.title}
          </div>
          {card.subtitle && (
            <div style={{fontFamily: FONT.mono, fontSize: vertical ? 26 : 24, letterSpacing: 6, textTransform: 'uppercase', color: '#D9D2F5', textAlign: 'center', padding: '0 60px'}}>
              {card.subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
