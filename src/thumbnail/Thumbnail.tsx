import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {FONT, THEMES, toneSwatch, type Theme} from '../theme';
import {NodeIcon, iconState} from '../components/icons';
import {parseRich} from '../components/Rich';
import {FIGURE_DRAW} from '../figures';
import {ICON_COLOR, type IconName} from '../spec/vocab';
import type {ThumbnailSpec} from '../spec/schema';
import type {Timeline} from '../timeline/timeline';

// The thumbnail: a designed still in the video's look, made to be read at the size of a
// thumbnail in a feed. `wide` = 1280×720 (YouTube), `tall` = 1080×1920 (Short / TikTok cover).
// Big words on one side, one clear picture on the other (an icon card, A → B, or a figure),
// and an optional sticker with the number.
export type ThumbVariant = 'wide' | 'tall';
export type ThumbProps = Timeline & {variant: ThumbVariant};

type Resolved = Omit<ThumbnailSpec, 'theme'> & {theme: Theme};

// Without a `thumbnail` block, build one from the first title scene.
export function resolveThumbnail(tl: Timeline): Resolved {
  const theme = THEMES[tl.thumbnail?.theme ?? tl.theme];
  const title = tl.scenes.find((s) => s.type === 'title');
  const headline = tl.scenes.find((s) => s.type === 'headline');
  const tag = title && title.type === 'title' ? title.tag : headline && headline.type === 'headline' ? headline.kicker : undefined;
  if (tl.thumbnail) return {...tl.thumbnail, kicker: tl.thumbnail.kicker ?? tag, theme};
  if (headline && headline.type === 'headline') return {text: headline.heading, kicker: tag, tone: 'bad', media: headline.media, theme};
  const heading = title && title.type === 'title' ? title.heading : tl.title;
  const beatIcons = title && title.type === 'title' ? (title.beats ?? []).flatMap((b) => (b.icon ? [b.icon] : [])) : [];
  const single = title && title.type === 'title' && title.icon ? [title.icon] : [];
  const icons = (beatIcons.length ? [beatIcons[0], beatIcons[beatIcons.length - 1]].filter((x, i, a) => a.indexOf(x) === i) : single).map((icon) => ({icon}));
  return {text: heading, kicker: tag, tone: 'warn', icons: icons.length ? icons : undefined, theme};
}

// The words of the text as unbreakable units: a short run of emphasized words stays together
// ("5 minutes"; a long one may wrap between its words), a word never breaks at its hyphen
// ("cache-aside"), and punctuation right after a highlight stays with it ("mods,", "falla?").
type Unit = {text: string; em: boolean; tail: string};
function units(text: string): Unit[] {
  const out: Unit[] = [];
  for (const seg of parseRich(text)) {
    let rest = seg.text;
    // Punctuation glued to the previous unit (no space before it).
    const glued = /^[^\s\p{L}\p{N}]+/u.exec(rest);
    if (glued && out.length && !/^\s/.test(rest)) {
      out[out.length - 1].tail += glued[0];
      rest = rest.slice(glued[0].length);
    }
    const t = rest.trim();
    if (!t) continue;
    if (seg.em && t.length <= 12) out.push({text: t, em: true, tail: ''});
    else for (const piece of t.split(/\s+/)) out.push({text: piece, em: seg.em, tail: ''});
  }
  return out;
}

// Largest font size whose estimated wrap fits the box.
function fitText(text: string, w: number, h: number, max: number, min: number, maxLines: number): number {
  const words = units(text).map((u) => u.text + u.tail);
  const longest = Math.max(...words.map((x) => x.length + 0.4));
  for (let s = max; s > min; s -= 2) {
    const cw = s * 0.6; // average glyph width of Inter Black, with a margin
    if (longest * cw > w) continue;
    let lines = 1;
    let line = 0;
    for (const wd of words) {
      const add = (line ? 1 : 0) + wd.length + 0.4;
      if ((line + add) * cw > w) {
        lines++;
        line = wd.length;
      } else line += add;
    }
    if (lines <= maxLines && lines * s * 1.06 <= h) return s;
  }
  return min;
}

const BigText: React.FC<{text: string; size: number; theme: Theme; align: 'left' | 'center'}> = ({text, size, theme, align}) => {
  const us = units(text);
  return (
    <div style={{fontFamily: FONT.sans, fontWeight: 900, fontSize: size, lineHeight: 1.06, letterSpacing: -0.03 * size, color: theme.text, textAlign: align}}>
      {us.map((u, i) => (
        <React.Fragment key={i}>
          {i > 0 && ' '}
          <span style={{whiteSpace: 'nowrap', display: 'inline-block'}}>
            <span style={u.em ? {background: theme.accent, color: theme.accentText, padding: '0 0.1em', borderRadius: '0.14em', display: 'inline-block', margin: '0.03em 0'} : undefined}>{u.text}</span>
            {u.tail}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};

const Kicker: React.FC<{text: string; theme: Theme; size: number}> = ({text, theme, size}) => (
  <div
    style={{
      display: 'inline-block',
      background: theme.accent,
      color: theme.accentText,
      fontFamily: FONT.sans,
      fontWeight: 800,
      fontSize: size,
      letterSpacing: size * 0.1,
      textTransform: 'uppercase',
      padding: `${size * 0.36}px ${size * 0.8}px`,
      borderRadius: size * 0.4,
      border: `3px solid ${theme.border}`,
      boxShadow: `5px 5px 0 ${theme.shadow}`,
    }}
  >
    {text}
  </div>
);

const Sticker: React.FC<{text: string; theme: Theme; tone: ThumbnailSpec['tone']; size: number; rotate: number}> = ({text, theme, tone, size, rotate}) => {
  const sw = toneSwatch(theme, tone);
  return (
    <div
      style={{
        display: 'inline-block',
        transform: `rotate(${rotate}deg)`,
        background: sw.stroke,
        color: '#FFFFFF',
        fontFamily: FONT.sans,
        fontWeight: 900,
        fontSize: size,
        letterSpacing: -0.02 * size,
        lineHeight: 1,
        padding: `${size * 0.2}px ${size * 0.38}px`,
        borderRadius: size * 0.28,
        border: `${Math.max(4, size * 0.07)}px solid ${theme.name === 'light' ? '#FFFFFF' : theme.border}`,
        boxShadow: theme.glow ? `0 0 ${size * 0.6}px ${sw.stroke}` : `${size * 0.1}px ${size * 0.1}px 0 ${theme.shadow}`,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
};

// One icon on a card, in the same style as the cards of the video.
const IconCard: React.FC<{icon: IconName; status?: string; x: number; y: number; w: number; theme: Theme; rotate: number}> = ({icon, status, x, y, w, theme, rotate}) => {
  const sw = theme.colors[ICON_COLOR[icon]];
  const h = w * 0.86;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        transform: `rotate(${rotate}deg)`,
        background: sw.fill,
        border: `${Math.round(w * 0.022)}px solid ${sw.stroke}`,
        borderRadius: w * 0.11,
        boxShadow: theme.glow ? `0 0 ${w * 0.16}px ${sw.stroke}88, ${w * 0.03}px ${w * 0.03}px 0 ${theme.shadow}` : `${w * 0.035}px ${w * 0.035}px 0 ${theme.shadow}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width={w * 0.8} height={w * 0.64} viewBox="0 0 200 160" style={{overflow: 'visible'}}>
        <NodeIcon icon={icon} state={iconState(icon, (status ?? 'idle') as never)} frame={42} p={1} />
      </svg>
    </div>
  );
};

const Arrow: React.FC<{x1: number; y1: number; x2: number; y2: number; theme: Theme; width: number}> = ({x1, y1, x2, y2, theme, width}) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const head = width * 3;
  const bx = x2 - Math.cos(a) * head * 0.6;
  const by = y2 - Math.sin(a) * head * 0.6;
  const p = (ang: number) => `${x2 - Math.cos(a + ang) * head} ${y2 - Math.sin(a + ang) * head}`;
  return (
    <g stroke={theme.edge} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <line x1={x1} y1={y1} x2={bx} y2={by} />
      <path d={`M${p(0.55)} L${x2} ${y2} L${p(-0.55)}`} />
    </g>
  );
};

// The picture, laid out inside a box (absolute coordinates of the frame).
const Art: React.FC<{th: Resolved; box: {x: number; y: number; w: number; h: number}}> = ({th, box}) => {
  const theme = th.theme;
  if (th.figure) {
    const fig = FIGURE_DRAW[th.figure.name];
    const s = Math.min(box.w / fig.viewBox.w, box.h / fig.viewBox.h);
    const w = fig.viewBox.w * s;
    const h = fig.viewBox.h * s;
    const glow = Object.fromEntries(th.figure.glow.map((r) => [r, 1]));
    return (
      <svg style={{position: 'absolute', left: box.x + (box.w - w) / 2, top: box.y + (box.h - h) / 2, overflow: 'visible'}} width={w} height={h} viewBox={`0 0 ${fig.viewBox.w} ${fig.viewBox.h}`}>
        <fig.Component glow={glow} dim={th.figure.glow.length ? 0.45 : 0} frame={40} props={th.figure.props} />
      </svg>
    );
  }
  const icons = th.icons ?? [];
  if (!icons.length) return null;
  // Card positions (fractions of the box) for 1, 2 or 3 icons: a big card, A → B, or a zig-zag.
  const tall = box.h > box.w * 0.9;
  const layouts: Record<number, {x: number; y: number; w: number; r: number}[]> = tall
    ? {
        1: [{x: 0.15, y: 0.1, w: 0.7, r: -3}],
        2: [{x: 0.02, y: 0.05, w: 0.44, r: -5}, {x: 0.46, y: 0.33, w: 0.52, r: 4}],
        3: [{x: 0.0, y: 0.0, w: 0.36, r: -5}, {x: 0.62, y: 0.12, w: 0.36, r: 4}, {x: 0.28, y: 0.48, w: 0.42, r: -2}],
      }
    : {
        1: [{x: 0.1, y: 0.12, w: 0.8, r: -3}],
        2: [{x: 0.0, y: 0.02, w: 0.5, r: -5}, {x: 0.42, y: 0.42, w: 0.58, r: 4}],
        3: [{x: 0.0, y: 0.0, w: 0.44, r: -5}, {x: 0.56, y: 0.12, w: 0.44, r: 4}, {x: 0.22, y: 0.55, w: 0.5, r: -2}],
      };
  const L = layouts[icons.length];
  const raw = L.map((l, i) => ({...icons[i], x: l.x * box.w, y: l.y * box.h, w: l.w * box.w, r: l.r}));
  // Fit the group inside the box (cards are 0.86 as tall as wide) and center it.
  const bw = Math.max(...raw.map((c) => c.x + c.w)) - Math.min(...raw.map((c) => c.x));
  const bh = Math.max(...raw.map((c) => c.y + c.w * 0.86)) - Math.min(...raw.map((c) => c.y));
  const k = Math.min(1, box.w / bw, box.h / bh);
  const ox = box.x + (box.w - bw * k) / 2 - Math.min(...raw.map((c) => c.x)) * k;
  const oy = box.y + (box.h - bh * k) / 2 - Math.min(...raw.map((c) => c.y)) * k;
  const cards = raw.map((c) => ({...c, x: ox + c.x * k, y: oy + c.y * k, w: c.w * k}));
  const centre = (c: (typeof cards)[number]) => ({x: c.x + c.w / 2, y: c.y + (c.w * 0.86) / 2});
  // Arrows from the edge of one card toward the next.
  const arrows = cards.slice(1).map((c, i) => {
    const a = centre(cards[i]);
    const b = centre(c);
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    const ka = (cards[i].w * 0.5) / d;
    const kb = (c.w * 0.5) / d;
    return {x1: a.x + (b.x - a.x) * ka, y1: a.y + (b.y - a.y) * ka, x2: b.x - (b.x - a.x) * kb, y2: b.y - (b.y - a.y) * kb};
  });
  return (
    <>
      <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
        {arrows.map((a, i) => (
          <Arrow key={i} {...a} theme={theme} width={Math.max(8, box.w * 0.018)} />
        ))}
      </svg>
      {cards.map((c, i) => (
        <IconCard key={i} icon={c.icon} status={c.status} x={c.x} y={c.y} w={c.w} theme={theme} rotate={c.r} />
      ))}
    </>
  );
};

export const Thumbnail: React.FC<ThumbProps> = (tl) => {
  const th = resolveThumbnail(tl);
  const theme = th.theme;
  const wide = tl.variant === 'wide';
  const W = wide ? 1280 : 1080;
  const H = wide ? 720 : 1920;
  const hasArt = Boolean(th.figure || th.icons?.length);
  // News: a photo of the media library behind the words.
  const photo = th.media ? tl.media?.[th.media] : undefined;
  // Text box: the left side in 16:9 (all the width without a picture); the top in 9:16.
  const tb = wide
    ? {x: 64, y: th.kicker ? 150 : 90, w: hasArt ? 660 : 1150, h: th.kicker ? 500 : 560}
    : {x: 70, y: th.kicker ? 400 : 300, w: 940, h: hasArt ? 560 : 900};
  const size = wide ? fitText(th.text, tb.w, tb.h, hasArt ? 128 : 150, 56, 4) : fitText(th.text, tb.w, tb.h, 168, 80, 5);
  // Picture box: right side in 16:9; middle in 9:16 (clear of the Shorts buttons at the bottom).
  // A figure (a tall drawing) gets more height in 9:16 than a row of icon cards.
  const ab = wide ? {x: 760, y: 120, w: 470, h: 500} : th.figure ? {x: 90, y: 930, w: 900, h: 720} : {x: 90, y: 980, w: 900, h: 540};
  const dots = theme.dots;
  return (
    <AbsoluteFill style={{background: theme.bg, overflow: 'hidden'}}>
      {photo?.src && photo.kind === 'image' && (
        <>
          <Img src={staticFile(photo.src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${photo.focus[0] * 100}% ${photo.focus[1] * 100}%`}} />
          <AbsoluteFill
            style={{
              background: wide
                ? 'linear-gradient(to right, rgba(10,20,38,0.96) 0%, rgba(10,20,38,0.8) 50%, rgba(10,20,38,0.15) 100%)'
                : 'linear-gradient(to bottom, rgba(10,20,38,0.2) 0%, rgba(10,20,38,0.85) 35%, rgba(10,20,38,0.95) 100%)',
            }}
          />
        </>
      )}
      {!photo?.src && <AbsoluteFill style={{backgroundImage: `radial-gradient(${dots} 2.4px, transparent 2.8px)`, backgroundSize: '34px 34px', opacity: 0.8}} />}
      {/* a soft pool of the accent color behind the picture */}
      {!photo?.src && <div
        style={{
          position: 'absolute',
          left: ab.x + ab.w / 2 - (wide ? 420 : 560),
          top: ab.y + ab.h / 2 - (wide ? 420 : 560),
          width: wide ? 840 : 1120,
          height: wide ? 840 : 1120,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.accent}${theme.name === 'light' ? '40' : '55'} 0%, ${theme.accent}00 68%)`,
        }}
      />}
      {th.kicker && (
        <div style={{position: 'absolute', left: wide ? tb.x : 0, width: wide ? undefined : W, top: wide ? 64 : 250, textAlign: 'center'}}>
          <Kicker text={th.kicker} theme={theme} size={wide ? 30 : 42} />
        </div>
      )}
      <div style={{position: 'absolute', left: tb.x, top: tb.y, width: tb.w, height: tb.h, display: 'flex', alignItems: wide ? 'center' : 'flex-start', justifyContent: wide ? 'flex-start' : 'center'}}>
        <BigText text={th.text} size={size} theme={theme} align={wide ? 'left' : 'center'} />
      </div>
      {hasArt && <Art th={th} box={ab} />}
      {th.number && (
        <div style={{position: 'absolute', ...(wide ? {right: 40, top: 54} : {left: 0, width: W, top: ab.y + ab.h + 40, textAlign: 'center' as const})}}>
          <Sticker text={th.number} theme={theme} tone={th.tone} size={wide ? 64 : 96} rotate={wide ? 5 : -3} />
        </div>
      )}
      {tl.handle && (
        <div style={{position: 'absolute', left: wide ? tb.x : 0, width: wide ? undefined : W, textAlign: 'center', bottom: wide ? 34 : 330, fontFamily: FONT.sans, fontWeight: 700, fontSize: wide ? 26 : 34, color: theme.textSoft}}>
          {tl.handle}
        </div>
      )}
      {/* channel stripe */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: wide ? 12 : 16, background: theme.accent}} />
    </AbsoluteFill>
  );
};
