import React from 'react';
import {Img, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {FONT, NEWS, type Theme} from '../theme';
import {clamp01, easeInOut, enter} from '../video/anim';
import type {Box, Frame} from '../layout/frame';
import type {ResolvedMedia} from '../timeline/timeline';

// Real footage and photos (news). A media item fills its box like `object-fit: cover`, keeps
// its `focus` point in frame and moves slowly (Ken Burns). Videos play muted, in sync with the
// timeline: `absStart` is the absolute second at which the clip starts. A file that is not
// there yet is drawn as a "material pending" card with what it should show.

export type Move = 'in' | 'out' | 'left' | 'right' | 'still';

const ILLUSTRATIVE: Record<string, string> = {en: 'Illustrative image', es: 'Imagen ilustrativa', pt: 'Imagem ilustrativa'};
const PENDING: Record<string, string> = {en: 'Material pending', es: 'Material pendiente', pt: 'Material pendente'};

function moveTransform(move: Move, k: number): string {
  const e = easeInOut(k);
  switch (move) {
    case 'in':
      return `scale(${1.04 + 0.1 * e})`;
    case 'out':
      return `scale(${1.14 - 0.1 * e})`;
    case 'left':
      return `scale(1.12) translateX(${3 - 6 * e}%)`;
    case 'right':
      return `scale(1.12) translateX(${-3 + 6 * e}%)`;
    default:
      return 'scale(1.03)';
  }
}

export const MediaFill: React.FC<{
  item: ResolvedMedia | undefined;
  id: string;
  box: Box;
  t: number; // seconds since the clip started on screen
  dur: number; // how long it stays (for the move)
  absStart: number; // absolute second the clip starts (video sync)
  fps: number;
  move?: Move;
  theme: Theme;
  lang: string;
  radius?: number;
}> = ({item, id, box, t, dur, absStart, fps, move = 'in', theme, lang, radius = 0}) => {
  const k = clamp01(t / Math.max(1, dur));
  const style: React.CSSProperties = {position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, overflow: 'hidden', borderRadius: radius, background: '#05080F'};
  if (!item?.src) return <div style={style}><Pending item={item} id={id} box={box} t={t} theme={theme} lang={lang} /></div>;
  const pos = `${item.focus[0] * 100}% ${item.focus[1] * 100}%`;
  const fill: React.CSSProperties = {width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos};
  return (
    <div style={style}>
      <div style={{position: 'absolute', inset: 0, transform: moveTransform(move, k), transformOrigin: pos}}>
        {item.kind === 'video' ? (
          <Sequence from={Math.round(absStart * fps)} layout="none">
            <OffthreadVideo src={staticFile(item.src)} muted trimBefore={Math.round(item.start * fps)} style={fill} />
          </Sequence>
        ) : (
          <Img src={staticFile(item.src)} style={fill} />
        )}
      </div>
    </div>
  );
};

// What is missing, drawn where it will go: the file name to save and what it should show.
const Pending: React.FC<{item: ResolvedMedia | undefined; id: string; box: Box; t: number; theme: Theme; lang: string}> = ({item, id, box, t, theme, lang}) => {
  const small = Math.min(box.w, box.h) < 500;
  const fs = small ? 24 : 34;
  const stripes = `repeating-linear-gradient(135deg, #0E1A30 0 34px, #122140 34px 68px)`;
  return (
    <div style={{position: 'absolute', inset: 0, background: stripes, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: small ? 10 : 18, fontFamily: FONT.sans, textAlign: 'center', padding: 40}}>
      <svg width={small ? 70 : 120} height={small ? 54 : 92} viewBox="0 0 120 92" style={{opacity: 0.55 + 0.25 * Math.sin(t * 3)}}>
        <rect x={6} y={18} width={108} height={68} rx={12} fill="none" stroke={theme.textSoft} strokeWidth={6} />
        <path d="M38 18 L46 6 L74 6 L82 18" fill="none" stroke={theme.textSoft} strokeWidth={6} strokeLinejoin="round" />
        <circle cx={60} cy={52} r={20} fill="none" stroke={theme.textSoft} strokeWidth={6} />
      </svg>
      <div style={{fontWeight: 900, fontSize: fs, letterSpacing: 3, textTransform: 'uppercase', color: NEWS.gold}}>{PENDING[lang] ?? PENDING.en}</div>
      <div style={{fontWeight: 700, fontSize: fs * 1.05, color: theme.text, maxWidth: box.w * 0.85, lineHeight: 1.25}}>{item?.alt ?? id}</div>
      <div style={{fontFamily: FONT.mono, fontSize: fs * 0.7, color: theme.textSoft}}>public/{item?.file ?? `media/…/${id}`}.(mp4|jpg)</div>
    </div>
  );
};

// The credit line, always visible while the picture is: "Photo: … · CC BY-SA 4.0", and the
// "Illustrative image" tag for stock or archive footage.
export const Credit: React.FC<{item: ResolvedMedia | undefined; x: number; y: number; align: 'left' | 'right'; size: number; lang: string; maxW: number}> = ({item, x, y, align, size, lang, maxW}) => {
  if (!item) return null;
  const text = item.license ? `${item.credit} · ${item.license}` : item.credit;
  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        ...(align === 'right' ? {right: x} : {left: x}),
        maxWidth: maxW,
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'right' ? 'flex-end' : 'flex-start',
        gap: 6,
        fontFamily: FONT.sans,
      }}
    >
      {item.illustrative && (
        <div style={{background: NEWS.gold, color: NEWS.ink, fontWeight: 800, fontSize: size * 0.9, letterSpacing: 1.5, textTransform: 'uppercase', padding: `${size * 0.18}px ${size * 0.5}px`, borderRadius: 4}}>
          {ILLUSTRATIVE[lang] ?? ILLUSTRATIVE.en}
        </div>
      )}
      <div style={{background: 'rgba(0,0,0,0.55)', color: '#E6ECF7', fontWeight: 600, fontSize: size, padding: `${size * 0.15}px ${size * 0.45}px`, borderRadius: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: maxW}}>
        {text}
      </div>
    </div>
  );
};

// A lower third: red name bar, white line under it. Slides in from the left.
export const LowerThirdView: React.FC<{title: string; sub?: string; t: number; frame: Frame; y: number}> = ({title, sub, t, frame, y}) => {
  const vertical = frame.format === 'vertical';
  const e = enter(t, 0, 0.45, 0);
  const slide = (1 - e.opacity) * -60;
  const big = vertical ? 50 : 46;
  return (
    <div style={{position: 'absolute', left: vertical ? 40 : 110, top: y, opacity: e.opacity, transform: `translateX(${slide}px)`, fontFamily: FONT.sans, maxWidth: vertical ? 1000 : 1300}}>
      <div style={{display: 'inline-block', background: NEWS.red, color: '#FFFFFF', fontWeight: 900, fontSize: big, lineHeight: 1.1, padding: `${big * 0.22}px ${big * 0.5}px`, textTransform: 'uppercase', letterSpacing: 0.5}}>{title}</div>
      {sub && (
        <div>
          <div style={{display: 'inline-block', background: '#FFFFFF', color: NEWS.ink, fontWeight: 700, fontSize: big * 0.66, lineHeight: 1.15, padding: `${big * 0.16}px ${big * 0.5}px`}}>{sub}</div>
        </div>
      )}
    </div>
  );
};
