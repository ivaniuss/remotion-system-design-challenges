import React from 'react';
import type {Frame} from '../layout/frame';
import {FONT, Theme, themeFor} from '../theme';
import {globalWords, Timeline, TimedScene} from '../timeline/timeline';
import type {Word} from '../timeline/words';
import {Rich} from '../components/Rich';
import {FlowScene} from '../scenes/FlowScene';
import {CalloutScene, TitleScene} from '../scenes/TitleScene';
import {CompareScene, ListScene, SummaryScene} from '../scenes/ListScenes';
import {CodeScene} from '../scenes/CodeScene';
import {ChartScene} from '../scenes/ChartScene';
import {FigureScene} from '../scenes/FigureScene';
import {SequenceScene} from '../scenes/SequenceScene';
import {ShotScene} from '../scenes/ShotScene';
import {BoardLayer} from '../scenes/BoardLayer';
import {isBoard} from '../board/board';
import {clamp01, easeInOut, easeOut, enter} from './anim';
import {dangerAt, dangerMoments} from './effects';

// The whole picture at absolute time t. Pure (no hooks), so the SSR check and the
// Remotion composition render exactly the same thing.

const SceneBody: React.FC<{scene: TimedScene; t: number; frame: Frame; theme: Theme; lang: string; cta: string | null}> = (p) => {
  const common = {t: p.t, frame: p.frame, theme: p.theme, lang: p.lang, cta: p.cta};
  switch (p.scene.type) {
    case 'title':
      return <TitleScene scene={p.scene} {...common} />;
    case 'callout':
      return <CalloutScene scene={p.scene} {...common} />;
    case 'list':
      return <ListScene scene={p.scene} {...common} />;
    case 'compare':
      return <CompareScene scene={p.scene} {...common} />;
    case 'code':
      return <CodeScene scene={p.scene} {...common} />;
    case 'flow':
      return <FlowScene scene={p.scene} {...common} />;
    case 'summary':
      return <SummaryScene scene={p.scene} {...common} />;
    case 'chart':
      return <ChartScene scene={p.scene} {...common} />;
    case 'figure':
      return <FigureScene scene={p.scene} {...common} />;
    case 'sequence':
      return <SequenceScene scene={p.scene} {...common} />;
    case 'shot':
      return <ShotScene scene={p.scene} {...common} />;
    case 'board':
      return null; // drawn by the persistent BoardLayer
  }
};

// A callout right after a board scene is laid over the (dimmed) board, so the big
// "504" lands on top of the system that just broke.
const overBoard = (tl: Timeline, i: number) => tl.scenes[i]?.type === 'callout' && isBoard(tl.scenes[i - 1]);

const boardLevel = (tl: Timeline, i: number) => (isBoard(tl.scenes[i]) ? 1 : overBoard(tl, i) ? 0.14 : 0);

// Board opacity: blends between scenes instead of fading out and back in.
function boardAlpha(tl: Timeline, scene: TimedScene, local: number): number {
  const i = scene.index;
  const cur = boardLevel(tl, i);
  const prev = i === 0 ? cur : boardLevel(tl, i - 1);
  const next = i === tl.scenes.length - 1 ? cur : boardLevel(tl, i + 1);
  let a = prev + (cur - prev) * easeInOut(clamp01(local / 0.35));
  if (next < cur) a = next + (a - next) * clamp01((scene.duration - local) / 0.25);
  return a;
}

const Header: React.FC<{title: string; t: number; frame: Frame; theme: Theme}> = ({title, t, frame, theme}) => {
  const h = frame.header;
  const e = enter(t, 0.05, 0.4, 20);
  const bar = easeOut(clamp01((t - 0.2) / 0.5));
  const vertical = frame.format === 'vertical';
  const size = vertical ? (title.length > 30 ? 52 : 62) : 56;
  return (
    <div
      style={{
        position: 'absolute',
        left: h.x,
        top: h.y,
        width: h.w,
        height: h.h,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        opacity: e.opacity,
        transform: `translateY(${e.dy}px)`,
        fontFamily: FONT.sans,
      }}
    >
      <div style={{fontWeight: 900, fontSize: size, lineHeight: 1.08, color: theme.text, textAlign: 'center', letterSpacing: -1}}>
        <Rich text={title} accent={theme.accent} accentText={theme.accentText} />
      </div>
      <div style={{width: 140 * bar, height: 9, borderRadius: 5, background: theme.accent}} />
    </div>
  );
};

type Group = {from: number; to: number; start: number; end: number};

function captionGroups(words: Word[], maxWords: number): Group[] {
  const out: Group[] = [];
  let from = 0;
  for (let i = 0; i < words.length; i++) {
    const size = i - from + 1;
    const stop = /[.,;:!?…]$/.test(words[i].w);
    const gap = i + 1 < words.length && words[i + 1].start - words[i].end > 0.45;
    if (size >= maxWords || stop || gap || i === words.length - 1) {
      out.push({from, to: i, start: words[from].start, end: words[i].end});
      from = i + 1;
    }
  }
  return out;
}

const Captions: React.FC<{words: Word[]; t: number; frame: Frame; theme: Theme}> = ({words, t, frame, theme}) => {
  if (!words.length) return null;
  const vertical = frame.format === 'vertical';
  const groups = captionGroups(words, vertical ? 6 : 9);
  const gi = groups.findIndex((g, i) => t >= g.start - 0.08 && t < (groups[i + 1]?.start ?? g.end + 0.6) - 0.08 && t <= g.end + 0.6);
  if (gi < 0) return null;
  const g = groups[gi];
  const box = frame.captions;
  const items: React.ReactNode[] = [];
  for (let i = g.from; i <= g.to; i++) {
    const w = words[i];
    const current = t >= w.start - 0.05 && t < (words[i + 1]?.start ?? w.end + 0.3);
    items.push(
      <span
        key={i}
        style={{
          display: 'inline-block',
          background: current ? theme.accent : 'transparent',
          color: current ? theme.accentText : theme.text,
          padding: '0 10px',
          margin: '2px 2px',
          borderRadius: 12,
          transform: `scale(${current ? 1.06 : 1})`,
        }}
      >
        {w.w}
      </span>,
    );
  }
  return (
    <div
      style={{
        position: 'absolute',
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignContent: 'center',
        fontFamily: FONT.sans,
        fontWeight: 900,
        fontSize: frame.font.caption,
        lineHeight: 1.18,
        textAlign: 'center',
      }}
    >
      {items}
    </div>
  );
};

// Film look: plain subtitles, one line group at a time, no word highlight.
const Subtitles: React.FC<{words: Word[]; t: number; frame: Frame}> = ({words, t, frame}) => {
  if (!words.length) return null;
  const vertical = frame.format === 'vertical';
  const groups = captionGroups(words, vertical ? 7 : 12);
  const gi = groups.findIndex((g, i) => t >= g.start - 0.08 && t < (groups[i + 1]?.start ?? g.end + 0.6) - 0.08 && t <= g.end + 0.6);
  if (gi < 0) return null;
  const g = groups[gi];
  const text = words.slice(g.from, g.to + 1).map((w) => w.w.replace(/\*/g, '')).join(' ');
  const box = frame.captions;
  return (
    <div
      style={{
        position: 'absolute',
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        display: 'flex',
        alignItems: vertical ? 'center' : 'flex-end',
        justifyContent: 'center',
        fontFamily: FONT.sans,
        fontWeight: 500,
        fontSize: vertical ? 46 : 38,
        lineHeight: 1.25,
        textAlign: 'center',
        color: '#F4F0FB',
        textShadow: '0 2px 6px rgba(0,0,0,0.95), 0 0 18px rgba(0,0,0,0.7)',
      }}
    >
      <span>{text}</span>
    </div>
  );
};

const Progress: React.FC<{tl: Timeline; t: number; frame: Frame; theme: Theme}> = ({tl, t, frame, theme}) => {
  const p = frame.progress;
  const gap = frame.format === 'vertical' ? 8 : 0;
  const usable = p.w - gap * (tl.scenes.length - 1);
  let x = p.x;
  return (
    <>
      {tl.scenes.map((s) => {
        const w = (usable * s.duration) / tl.duration;
        const fill = clamp01((t - s.start) / s.duration);
        const el = (
          <div key={s.index} style={{position: 'absolute', left: x, top: p.y, width: w, height: p.h, borderRadius: p.h / 2, background: theme.dots, overflow: 'hidden'}}>
            <div style={{width: w * fill, height: p.h, background: theme.accent}} />
          </div>
        );
        x += w + gap;
        return el;
      })}
    </>
  );
};

const Dots: React.FC<{frame: Frame; theme: Theme}> = ({frame, theme}) => (
  <svg width={frame.width} height={frame.height} style={{position: 'absolute', left: 0, top: 0}}>
    <defs>
      <pattern id="dots" width={36} height={36} patternUnits="userSpaceOnUse">
        <circle cx={18} cy={18} r={2.4} fill={theme.dots} />
      </pattern>
      {theme.glow && (
        <radialGradient id="bg-glow" cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor={theme.accent} stopOpacity={0.1} />
          <stop offset="60%" stopColor={theme.accent} stopOpacity={0.02} />
          <stop offset="100%" stopColor={theme.accent} stopOpacity={0} />
        </radialGradient>
      )}
    </defs>
    <rect width={frame.width} height={frame.height} fill="url(#dots)" />
    {theme.glow && <rect width={frame.width} height={frame.height} fill="url(#bg-glow)" />}
  </svg>
);

export function sceneAt(tl: Timeline, t: number): TimedScene {
  let cur = tl.scenes[0];
  for (const s of tl.scenes) if (t >= s.start) cur = s;
  return cur;
}

export const VideoFrame: React.FC<{tl: Timeline; t: number; frame: Frame; words?: Word[]}> = ({tl, t, frame, words}) => {
  const theme = themeFor(tl.theme);
  const scene = sceneAt(tl, t);
  const local = t - scene.start;
  const isLast = scene.index === tl.scenes.length - 1;
  // Scene transition: quick fade/slide in, fade out at the end. The first scene is
  // fully there on frame 0: the first frame is the thumbnail and the hook.
  // The film look cuts through black, slower, and never slides.
  const film = theme.name === 'film';
  const inK = scene.index === 0 ? 1 : film ? easeInOut(clamp01(local / 0.7)) : easeOut(clamp01(local / 0.35));
  const outK = isLast ? 1 : clamp01((scene.duration - local) / (film ? 0.5 : 0.25));
  const danger = dangerAt(dangerMoments(tl), t);
  const shake = {x: danger.x, y: danger.y};
  const showCaptions = frame.format === 'vertical' ? tl.captions.vertical : tl.captions.horizontal;
  const title = scene.type === 'title' || scene.type === 'shot' ? undefined : scene.title;
  return (
    <div style={{position: 'absolute', inset: 0, width: frame.width, height: frame.height, background: theme.bg, overflow: 'hidden'}}>
      {!film && <Dots frame={frame} theme={theme} />}
      {!film && <Progress tl={tl} t={t} frame={frame} theme={theme} />}
      {tl.handle && (
        <div
          style={{
            position: 'absolute',
            top: frame.handle.y,
            ...(frame.handle.align === 'left' ? {left: frame.handle.x} : {right: frame.width - frame.handle.x}),
            fontFamily: FONT.mono,
            fontWeight: 700,
            fontSize: frame.format === 'vertical' ? 26 : 24,
            color: theme.textSoft,
          }}
        >
          {tl.handle}
        </div>
      )}
      {tl.board && <BoardLayer tl={tl} t={t} frame={frame} theme={theme} alpha={boardAlpha(tl, scene, local)} offset={shake} />}
      {danger.flash > 0 && <div style={{position: 'absolute', inset: 0, background: theme.colors.red.stroke, opacity: danger.flash}} />}
      <div style={{position: 'absolute', inset: 0, opacity: inK * outK, transform: film ? undefined : `translate(${shake.x}px, ${(1 - inK) * 30 + shake.y}px)`}}>
        {title && <Header title={title} t={local} frame={frame} theme={theme} />}
        <SceneBody scene={scene} t={local} frame={frame} theme={theme} lang={tl.lang} cta={tl.cta} />
      </div>
      {showCaptions && (film ? <Subtitles words={words ?? globalWords(tl)} t={t} frame={frame} /> : <Captions words={words ?? globalWords(tl)} t={t} frame={frame} theme={theme} />)}
    </div>
  );
};
