import React from 'react';
import type {Frame} from '../layout/frame';
import {FONT, NEWS, Theme, themeFor} from '../theme';
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
import {DatesScene, HeadlineScene, MediaScene, QuoteScene, SourcesScene, StatsScene} from '../scenes/NewsScenes';
import {MapScene} from '../scenes/MapScene';
import {PuzzleScene, RevealScene, ScoreScene} from '../scenes/PuzzleScenes';
import {ProofScene} from '../scenes/ProofScene';
import type {ResolvedMedia} from '../timeline/timeline';
import {BoardLayer} from '../scenes/BoardLayer';
import {isBoard} from '../board/board';
import {clamp01, easeInOut, easeOut, enter} from './anim';
import {dangerAt, dangerMoments} from './effects';
import {Host} from '../host/Host';

// The whole picture at absolute time t. Pure (no hooks), so the SSR check and the
// Remotion composition render exactly the same thing.

const SceneBody: React.FC<{scene: TimedScene; t: number; frame: Frame; theme: Theme; lang: string; cta: string | null; media?: Record<string, ResolvedMedia>; fps: number}> = (p) => {
  const common = {t: p.t, frame: p.frame, theme: p.theme, lang: p.lang, cta: p.cta, media: p.media, fps: p.fps};
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
    case 'headline':
      return <HeadlineScene scene={p.scene} {...common} />;
    case 'media':
      return <MediaScene scene={p.scene} {...common} />;
    case 'map':
      return <MapScene scene={p.scene} {...common} />;
    case 'stats':
      return <StatsScene scene={p.scene} {...common} />;
    case 'quote':
      return <QuoteScene scene={p.scene} {...common} />;
    case 'timeline':
      return <DatesScene scene={p.scene} {...common} />;
    case 'sources':
      return <SourcesScene scene={p.scene} {...common} />;
    case 'puzzle':
      return <PuzzleScene scene={p.scene} {...common} />;
    case 'reveal':
      return <RevealScene scene={p.scene} {...common} />;
    case 'score':
      return <ScoreScene scene={p.scene} {...common} />;
    case 'proof':
      return <ProofScene scene={p.scene} {...common} />;
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

// News: the scene title is a red tab on the left with a thin rule, like a broadcast graphic.
const NewsHeader: React.FC<{title: string; t: number; frame: Frame}> = ({title, t, frame}) => {
  const h = frame.header;
  const vertical = frame.format === 'vertical';
  const e = enter(t, 0.05, 0.35, 0);
  const rule = easeOut(clamp01((t - 0.15) / 0.5));
  const size = vertical ? (title.length > 28 ? 46 : 54) : 48;
  return (
    <div style={{position: 'absolute', left: h.x, top: h.y + (vertical ? 0 : 22), width: h.w, height: h.h, display: 'flex', alignItems: 'center', gap: 0, fontFamily: FONT.sans}}>
      <div style={{background: NEWS.red, color: '#FFFFFF', fontWeight: 900, fontSize: size, lineHeight: 1.1, letterSpacing: 0.5, textTransform: 'uppercase', padding: '12px 24px', opacity: e.opacity, transform: `translateX(${(1 - e.opacity) * -40}px)`, maxWidth: h.w * 0.9, boxShadow: '0 6px 18px rgba(0,0,0,0.35)'}}>
        {title.replace(/\*/g, '')}
      </div>
      <div style={{flex: 1, height: 4, background: '#FFFFFF', opacity: 0.85, transformOrigin: 'left', transform: `scaleX(${rule})`}} />
    </div>
  );
};

// News: the channel bug (brand + date) in the top-left corner, the whole video.
const NewsBug: React.FC<{brand: string; date?: string; frame: Frame}> = ({brand, date, frame}) => {
  const vertical = frame.format === 'vertical';
  const size = vertical ? 26 : 24;
  return (
    <div style={{position: 'absolute', left: vertical ? 60 : 40, top: vertical ? 146 : 30, display: 'flex', fontFamily: FONT.sans, fontWeight: 900, fontSize: size, letterSpacing: 2, textTransform: 'uppercase'}}>
      <div style={{background: NEWS.red, color: '#FFFFFF', padding: '6px 14px'}}>{brand}</div>
      {date && <div style={{background: 'rgba(255,255,255,0.92)', color: NEWS.ink, padding: '6px 14px'}}>{date}</div>}
    </div>
  );
};

// News: a ticker along the bottom of the 16:9 video (when its captions are off).
const NewsTicker: React.FC<{items: string[]; brand: string; t: number; frame: Frame}> = ({items, brand, t, frame}) => {
  const h = 58;
  const text = items.join('     •     ');
  const speed = 110; // px per second
  const charW = 15.5;
  const loopW = (text.length + 11) * charW;
  const x = -((t * speed) % loopW);
  return (
    <div style={{position: 'absolute', left: 0, top: frame.height - h, width: frame.width, height: h, background: NEWS.band, display: 'flex', alignItems: 'center', overflow: 'hidden', fontFamily: FONT.sans}}>
      <div style={{position: 'absolute', left: 230 + x, top: 0, height: h, display: 'flex', alignItems: 'center', whiteSpace: 'pre', fontWeight: 700, fontSize: 28, color: '#FFFFFF'}}>
        {`${text}     •     ${text}     •     ${text}`}
      </div>
      <div style={{position: 'absolute', left: 0, top: 0, width: 210, height: h, background: NEWS.red, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 26, letterSpacing: 2, textTransform: 'uppercase'}}>{brand}</div>
    </div>
  );
};

// News: a red band sweeps across at each cut.
const NewsWipe: React.FC<{local: number; frame: Frame}> = ({local, frame}) => {
  const k = local / 0.42;
  if (k <= 0 || k >= 1) return null;
  const W = frame.width;
  const x = -W * 0.6 + k * W * 2.2;
  return <div style={{position: 'absolute', left: x, top: -frame.height * 0.2, width: W * 0.45, height: frame.height * 1.4, background: NEWS.red, transform: 'skewX(-14deg)', opacity: 0.92}} />;
};

const Header: React.FC<{title: string; t: number; frame: Frame; theme: Theme; first?: boolean}> = ({title, t, frame, theme, first}) => {
  const h = frame.header;
  // The first scene is the hook: complete on frame 0 (a puzzle's episode number included).
  const e = first ? {opacity: 1, dy: 0} : enter(t, 0.05, 0.4, 20);
  const bar = first ? 1 : easeOut(clamp01((t - 0.2) / 0.5));
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
  const band = theme.name === 'news';
  if (frame.host?.bubble) return <Bubble items={items} groups={groups} gi={gi} t={t} frame={frame} theme={theme} />;
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
      {band ? <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', background: NEWS.band, borderRadius: 14, padding: '6px 10px'}}>{items}</div> : items}
    </div>
  );
};

// With a host (9:16), the captions are its speech bubble: a card with a tail pointing at the
// host's beak. It pops in when the voice starts after a silence and stays up across the
// groups of one sentence run.
const Bubble: React.FC<{items: React.ReactNode[]; groups: Group[]; gi: number; t: number; frame: Frame; theme: Theme}> = ({items, groups, gi, t, frame, theme}) => {
  const box = frame.captions;
  const host = frame.host!;
  let run = gi;
  while (run > 0 && groups[run].start - groups[run - 1].end < 0.7) run--;
  const k = easeOut(clamp01((t - groups[run].start + 0.08) / 0.18));
  const left = host.mirror; // host on the left: tail on the bubble's left side
  const tailY = host.y + host.size * 0.47 - box.y; // the host's beak height
  const tail = 34;
  const border = theme.accent;
  return (
    <div
      style={{
        position: 'absolute',
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: k,
        transform: `scale(${0.88 + 0.12 * k})`,
        transformOrigin: `${left ? 0 : 100}% ${(tailY / box.h) * 100}%`,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxHeight: '100%',
          boxSizing: 'border-box',
          background: theme.surface,
          border: `4px solid ${border}`,
          borderRadius: 32,
          padding: '18px 22px',
          boxShadow: theme.glow ? `0 0 28px ${border}55` : `8px 8px 0 ${theme.shadow}`,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignContent: 'center',
          fontFamily: FONT.sans,
          fontWeight: 900,
          fontSize: Math.round(frame.font.caption * 0.8),
          lineHeight: 1.16,
          textAlign: 'center',
        }}
      >
        <svg width={tail + 6} height={tail * 1.4} style={{position: 'absolute', top: Math.max(10, Math.min(box.h - tail * 1.4 - 10, tailY - tail * 0.7)), ...(left ? {left: -tail - 2} : {right: -tail - 2}), overflow: 'visible'}}>
          <path
            d={left ? `M ${tail + 6} 4 L 0 ${tail * 0.75} L ${tail + 6} ${tail * 1.3}` : `M 0 4 L ${tail + 6} ${tail * 0.75} L 0 ${tail * 1.3}`}
            fill={theme.surface}
            stroke={border}
            strokeWidth={4}
            strokeLinejoin="round"
          />
        </svg>
        {items}
      </div>
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
  const isNews = theme.name === 'news';
  const inK = scene.index === 0 ? 1 : film ? easeInOut(clamp01(local / 0.7)) : easeOut(clamp01(local / 0.35));
  const outK = isLast ? 1 : clamp01((scene.duration - local) / (film ? 0.5 : 0.25));
  const danger = dangerAt(dangerMoments(tl), t);
  const shake = {x: danger.x, y: danger.y};
  const showCaptions = frame.format === 'vertical' ? tl.captions.vertical : tl.captions.horizontal;
  const title = scene.type === 'title' || scene.type === 'shot' || scene.type === 'headline' || scene.type === 'media' ? undefined : scene.title;
  const ticker = isNews && frame.format === 'horizontal' && !showCaptions && tl.news?.ticker?.length ? tl.news.ticker : null;
  return (
    <div style={{position: 'absolute', inset: 0, width: frame.width, height: frame.height, background: theme.bg, overflow: 'hidden'}}>
      {isNews && <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, #13254A 0%, #0A1426 62%)'}} />}
      {!film && !isNews && <Dots frame={frame} theme={theme} />}
      {!film && !isNews && <Progress tl={tl} t={t} frame={frame} theme={theme} />}
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
      <div style={{position: 'absolute', inset: 0, opacity: inK * outK, transform: film ? undefined : isNews ? `translate(${shake.x}px, ${shake.y}px)` : `translate(${shake.x}px, ${(1 - inK) * 30 + shake.y}px)`}}>
        <SceneBody scene={scene} t={local} frame={frame} theme={theme} lang={tl.lang} cta={tl.cta} media={tl.media} fps={tl.fps} />
        {title && (isNews ? <NewsHeader title={title} t={local} frame={frame} /> : <Header title={title} t={local} frame={frame} theme={theme} first={scene.index === 0} />)}
      </div>
      {isNews && <Progress tl={tl} t={t} frame={frame} theme={theme} />}
      {isNews && <NewsBug brand={tl.news?.brand ?? 'NEWS'} date={tl.news?.date} frame={frame} />}
      {ticker && <NewsTicker items={ticker} brand={tl.news?.brand ?? 'NEWS'} t={t} frame={frame} />}
      {isNews && scene.index > 0 && <NewsWipe local={local} frame={frame} />}
      {tl.host && frame.host && <Host tl={tl} t={t} frame={frame} words={words ?? globalWords(tl)} />}
      {showCaptions && (film ? <Subtitles words={words ?? globalWords(tl)} t={t} frame={frame} /> : <Captions words={words ?? globalWords(tl)} t={t} frame={frame} theme={theme} />)}
    </div>
  );
};
