import React from 'react';
import {FONT, toneSwatch} from '../theme';
import {NodeIcon} from '../components/icons';
import {parseRich} from '../components/Rich';
import {clamp01, easeInOut, easeOut, enter, pop, progress} from '../video/anim';
import {ICON_COLOR} from '../spec/vocab';
import type {Theme} from '../theme';
import type {TitleScene as TitleSpec} from '../spec/schema';
import type {SceneProps} from './types';

// Hook card: tag, big heading revealed word by word, optional illustration.
export const TitleScene: React.FC<SceneProps<'title'>> = ({scene, t, frame, theme}) => {
  const c = frame.content;
  const vertical = frame.format === 'vertical';
  // Words made of emphasized and plain parts ("*minutes*." keeps its period attached).
  const words: {text: string; em: boolean}[][] = [[]];
  for (const seg of parseRich(scene.heading)) {
    seg.text.split(/(\s+)/).forEach((piece) => {
      if (!piece) return;
      if (/^\s+$/.test(piece)) {
        if (words[words.length - 1].length) words.push([]);
        return;
      }
      words[words.length - 1].push({text: piece, em: seg.em});
    });
  }
  if (!words[words.length - 1].length) words.pop();
  const chars = scene.heading.replace(/\*/g, '').length;
  const h1 = vertical ? (chars > 44 ? 80 : chars > 28 ? 90 : 100) : chars > 50 ? 84 : 100;
  // The first scene is the thumbnail: everything is readable on frame 0, with a small
  // punch-in instead of a word-by-word reveal.
  const first = scene.index === 0;
  const punch = first ? 1 + 0.07 * (1 - easeOut(clamp01(t / 0.6))) : 1;
  const step = Math.min(0.08, 1.2 / Math.max(1, words.length));
  const after = 0.25 + words.length * step;
  const sub = first ? {opacity: 1, dy: 0} : enter(t, after + 0.1);
  const tagScale = first ? 1 : pop(t, 0.05);
  const iconPop = first ? 0.85 + 0.15 * pop(t, 0.1) : pop(t, after + 0.25);
  const iconSize = vertical ? 400 : 340;

  return (
    <div
      style={{
        position: 'absolute',
        left: c.x,
        top: c.y,
        width: c.w,
        height: c.h,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: vertical ? 40 : 30,
        textAlign: 'center',
        fontFamily: FONT.sans,
      }}
    >
      {scene.tag && (
        <div
          style={{
            transform: `scale(${tagScale})`,
            background: theme.accent,
            color: theme.accentText,
            fontWeight: 800,
            fontSize: vertical ? 34 : 36,
            letterSpacing: 3,
            textTransform: 'uppercase',
            padding: '14px 30px',
            borderRadius: 14,
            border: `3px solid ${theme.border}`,
            boxShadow: `6px 6px 0 ${theme.shadow}`,
          }}
        >
          {scene.tag}
        </div>
      )}
      <div style={{fontWeight: 900, fontSize: h1, lineHeight: 1.08, color: theme.text, maxWidth: vertical ? 960 : 1500, letterSpacing: -1.5, transform: `scale(${punch})`}}>
        {words.map((w, i) => {
          const e = first ? {opacity: 1, dy: 0} : enter(t, 0.25 + i * step, 0.35, 40);
          // Consecutive emphasized words share one highlight: the gap between them is
          // painted too, and only the outer ends are rounded.
          const allEm = (k: number) => k >= 0 && k < words.length && words[k].every((x) => x.em);
          const joinL = allEm(i) && allEm(i - 1);
          const joinR = allEm(i) && allEm(i + 1);
          return (
            <span
              key={i}
              style={{display: 'inline-block', opacity: e.opacity, transform: `translateY(${e.dy}px)`, marginLeft: joinL ? 0 : '0.12em', marginRight: joinR ? 0 : '0.12em'}}
            >
              {w.map((part, j) => {
                if (!part.em) return <span key={j}>{part.text}</span>;
                const l = j === 0 && joinL;
                const r = j === w.length - 1 && joinR;
                return (
                  <span
                    key={j}
                    style={{
                      background: theme.accent,
                      color: theme.accentText,
                      paddingLeft: '0.12em',
                      paddingRight: '0.12em',
                      borderRadius: `${l ? 0 : 10}px ${r ? 0 : 10}px ${r ? 0 : 10}px ${l ? 0 : 10}px`,
                    }}
                  >
                    {part.text}
                  </span>
                );
              })}
            </span>
          );
        })}
      </div>
      {scene.subheading && (
        <div style={{opacity: sub.opacity, transform: `translateY(${sub.dy}px)`, fontWeight: 600, fontSize: vertical ? 42 : 40, color: theme.textSoft, maxWidth: vertical ? 900 : 1300, lineHeight: 1.3}}>
          {scene.subheading}
        </div>
      )}
      {scene.beats?.length ? (
        <BeatRow beats={scene.beats} cues={scene.cues} t={t} vertical={vertical} theme={theme} />
      ) : null}
      {scene.icon && !scene.beats?.length && (
        <svg
          width={iconSize}
          height={iconSize * 0.8}
          viewBox="0 0 200 160"
          style={{transform: `scale(${iconPop}) translateY(${Math.sin(t * 2.2) * 6}px)`, overflow: 'visible'}}
        >
          <NodeIcon icon={scene.icon} state="idle" frame={t * 30} p={1} />
        </svg>
      )}
    </div>
  );
};

// The hook's beats: cards that pop in on their cues, joined by arrows that draw
// themselves; once all are there a dot keeps flowing through them, so the opening is
// never a still picture.
const BeatRow: React.FC<{beats: NonNullable<TitleSpec['beats']>; cues: number[]; t: number; vertical: boolean; theme: Theme}> = ({beats, cues, t, vertical, theme}) => {
  const n = beats.length;
  const w = vertical ? (n > 4 ? 168 : n > 3 ? 200 : 230) : n > 4 ? 240 : 290;
  const h = Math.round(w * 1.02);
  const gap = vertical ? (n > 4 ? 26 : 34) : 80;
  const at = (i: number) => cues[i] ?? 0.4 + i * 0.6;
  const last = at(n - 1) + 0.5;
  // A dot runs left to right through every card, again and again, after the last beat.
  const loop = 2.2;
  const run = t > last ? ((t - last) % loop) / loop : -1;
  const totalW = n * w + (n - 1) * gap;
  const dotX = run >= 0 ? easeInOut(run) * (totalW - w) + w / 2 : -1;

  return (
    <div style={{position: 'relative', display: 'flex', alignItems: 'center', gap, marginTop: vertical ? 20 : 10}}>
      {beats.map((b, i) => {
        const k = pop(t, at(i));
        const sw = theme.colors[b.icon ? ICON_COLOR[b.icon] : 'yellow'];
        const isLast = i === n - 1;
        // The last card breathes while it waits for the answer (often a "?").
        const breathe = isLast && t > at(i) + 0.5 ? 1 + 0.04 * Math.sin((t - at(i)) * 4) : 1;
        const arrow = i > 0 ? easeOut(progress(t, at(i) - 0.05, 0.3)) : 0;
        return (
          <React.Fragment key={i}>
            {i > 0 && arrow > 0.02 && (
              <svg width={gap} height={24} viewBox={`0 0 ${gap} 24`} style={{position: 'absolute', left: i * (w + gap) - gap, top: h / 2 - 12, overflow: 'visible'}}>
                <line x1={4} y1={12} x2={4 + (gap - 16) * arrow} y2={12} stroke={theme.edge} strokeWidth={5} strokeLinecap="round" />
                {arrow > 0.9 && <path d={`M ${gap - 14} 4 L ${gap - 3} 12 L ${gap - 14} 20`} fill="none" stroke={theme.edge} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />}
              </svg>
            )}
            <div
              style={{
                width: w,
                height: h,
                transform: `scale(${k * breathe})`,
                opacity: k > 0 ? 1 : 0,
                background: sw.fill,
                border: `4px solid ${sw.stroke}`,
                borderRadius: 26,
                boxShadow: `7px 7px 0 ${theme.shadow}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {b.icon ? (
                <>
                  <svg width={w * 0.62} height={w * 0.5} viewBox="0 0 200 160" style={{overflow: 'visible'}}>
                    <NodeIcon icon={b.icon} state={isLast ? 'busy' : 'idle'} frame={t * 30} p={1} />
                  </svg>
                  <div style={{fontWeight: 800, fontSize: Math.round(w * 0.13), color: theme.text, lineHeight: 1.1, padding: '0 10px'}}>{b.text}</div>
                </>
              ) : (
                <div style={{fontWeight: 900, fontSize: Math.round(w * (b.text.length <= 2 ? 0.55 : 0.2)), color: sw.stroke, lineHeight: 1}}>{b.text}</div>
              )}
            </div>
          </React.Fragment>
        );
      })}
      {dotX >= 0 && (
        <div
          style={{
            position: 'absolute',
            left: dotX - 13,
            top: -22,
            width: 26,
            height: 26,
            borderRadius: 13,
            background: theme.accent,
            border: `4px solid ${theme.border}`,
            opacity: Math.sin(Math.PI * run),
          }}
        />
      )}
    </div>
  );
};

// Big number / word moment: "504", "10x", "5 min".
// "50M ventas" → counts 0 → 50M while the card lands. Only the leading number moves; the
// prefix and suffix stay. The final text is laid out invisibly underneath so the card does
// not change width while the digits run.
function countedText(text: string, t: number): string {
  const m = /^(\D*?)(\d[\d.,]*)(.*)$/.exec(text);
  if (!m) return text;
  const [, pre, num, post] = m;
  const target = parseFloat(num.replace(/,/g, ''));
  if (!Number.isFinite(target)) return text;
  const decimals = /\.\d+$/.test(num) ? num.split('.')[1].length : 0;
  const k = easeOut(clamp01((t - 0.2) / 1.15));
  const v = target * k;
  const fixed = v.toFixed(decimals);
  const shown = num.includes(',') ? Number(fixed).toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals}) : fixed;
  return `${pre}${shown}${post}`;
}

export const CalloutScene: React.FC<SceneProps<'callout'>> = ({scene, t, frame, theme}) => {
  const c = frame.content;
  const vertical = frame.format === 'vertical';
  const sw = toneSwatch(theme, scene.tone);
  const k = pop(t, 0.15);
  const shakeAmp = scene.tone === 'bad' ? Math.max(0, 1 - (t - 0.3) / 0.7) * 14 : 0;
  const shake = t > 0.3 ? Math.sin(t * 60) * shakeAmp : 0;
  const cap = enter(t, 0.55);
  const len = scene.text.length;
  const size = (vertical ? 300 : 280) * Math.min(1, 5 / Math.max(3, len));

  return (
    <div
      style={{
        position: 'absolute',
        left: c.x,
        top: c.y,
        width: c.w,
        height: c.h,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 36,
        fontFamily: FONT.sans,
        textAlign: 'center',
      }}
    >
      {scene.icon && (
        <svg width={vertical ? 260 : 200} height={vertical ? 208 : 160} viewBox="0 0 200 160" style={{transform: `scale(${pop(t, 0.05)})`, overflow: 'visible'}}>
          <NodeIcon icon={scene.icon} state={scene.tone === 'bad' ? 'error' : 'idle'} frame={t * 30} p={1} />
        </svg>
      )}
      <div
        style={{
          transform: `translateX(${shake}px) scale(${k})`,
          fontWeight: 900,
          fontSize: size,
          lineHeight: 1,
          color: sw.stroke,
          letterSpacing: -6,
          padding: '20px 56px 34px',
          background: sw.fill,
          border: `6px solid ${sw.stroke}`,
          borderRadius: 40,
          boxShadow: `12px 12px 0 ${theme.shadow}`,
        }}
      >
        {scene.countUp ? (
          <span style={{display: 'inline-grid'}}>
            <span style={{gridArea: '1 / 1', visibility: 'hidden'}}>{scene.text}</span>
            <span style={{gridArea: '1 / 1'}}>{countedText(scene.text, t)}</span>
          </span>
        ) : (
          scene.text
        )}
      </div>
      {scene.caption && (
        <div style={{opacity: cap.opacity, transform: `translateY(${cap.dy}px)`, fontWeight: 800, fontSize: vertical ? 54 : 50, color: theme.text, maxWidth: vertical ? 920 : 1400, lineHeight: 1.2}}>
          {scene.caption}
        </div>
      )}
    </div>
  );
};
