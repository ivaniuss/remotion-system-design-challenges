import React from 'react';
import {FONT, NEWS, toneSwatch, type Theme} from '../theme';
import {Rich} from '../components/Rich';
import {NodeIcon, iconState} from '../components/icons';
import {Credit, LowerThirdView, MediaFill} from '../components/Media';
import {clamp01, easeOut, enter, pop} from '../video/anim';
import {BeatRow, countedText} from './TitleScene';
import type {Frame} from '../layout/frame';
import type {Tone} from '../spec/vocab';
import type {SceneProps} from './types';

// The broadcast scenes (theme "news", docs/packs/news.md): the headline over footage, full-frame
// footage with lower thirds, key figures, quotes, a dated timeline and the sources.

const at = (cues: number[], i: number, fallback: number) => cues[i] ?? fallback;

// Where the credit of full-frame footage goes: top-right, clear of the bug, the captions and
// the lower thirds.
const creditPos = (frame: Frame) => (frame.format === 'vertical' ? {x: 40, y: 146, size: 22, maxW: 640} : {x: 40, y: 28, size: 22, maxW: 900});

const toneInk = (theme: Theme, tone: Tone) => (tone === 'neutral' ? theme.text : toneSwatch(theme, tone).stroke);

// ---------- headline: banner, red tab, the headline, the dateline, footage behind ----------
export const HeadlineScene: React.FC<SceneProps<'headline'>> = ({scene, t, frame, theme, lang, media, fps = 30}) => {
  const vertical = frame.format === 'vertical';
  const W = frame.width;
  const H = frame.height;
  const item = scene.media ? media?.[scene.media] : undefined;
  const first = scene.index === 0;
  const show = (d: number) => (first ? {opacity: 1, dy: 0} : enter(t, d));
  const chars = scene.heading.replace(/\*/g, '').length;
  const size = vertical ? (chars > 60 ? 74 : chars > 40 ? 84 : 96) : chars > 60 ? 76 : 88;
  const blink = Math.floor(t * 2.2) % 2 === 0;
  const box = vertical ? {x: 60, y: scene.beats?.length ? 560 : 760, w: 960} : {x: 110, y: scene.beats?.length ? 190 : 300, w: 1320};
  const h = show(0.1);
  return (
    <>
      {scene.media && (
        <>
          <MediaFill item={item} id={scene.media} box={{x: 0, y: 0, w: W, h: H}} t={t} dur={scene.duration} absStart={scene.start} fps={fps} move="in" theme={theme} lang={lang} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: vertical
                ? 'linear-gradient(to bottom, rgba(10,20,38,0.55) 0%, rgba(10,20,38,0.72) 35%, rgba(10,20,38,0.9) 70%, rgba(10,20,38,0.96) 100%)'
                : 'linear-gradient(to right, rgba(10,20,38,0.95) 0%, rgba(10,20,38,0.82) 45%, rgba(10,20,38,0.35) 100%)',
            }}
          />
          <Credit item={item} {...creditPos(frame)} align="right" lang={lang} />
        </>
      )}
      <div style={{position: 'absolute', left: box.x, top: box.y, width: box.w, display: 'flex', flexDirection: 'column', gap: vertical ? 28 : 24, fontFamily: FONT.sans}}>
        <div style={{display: 'flex', gap: 0, alignItems: 'stretch', opacity: show(0).opacity}}>
          {scene.banner && (
            <div style={{display: 'flex', alignItems: 'center', gap: 12, background: NEWS.red, color: '#FFFFFF', fontWeight: 900, fontSize: vertical ? 34 : 30, letterSpacing: 2, textTransform: 'uppercase', padding: '10px 22px'}}>
              <span style={{width: 16, height: 16, borderRadius: 8, background: '#FFFFFF', opacity: blink ? 1 : 0.25}} />
              {scene.banner}
            </div>
          )}
          {scene.kicker && (
            <div style={{background: scene.banner ? '#FFFFFF' : NEWS.red, color: scene.banner ? NEWS.ink : '#FFFFFF', fontWeight: 800, fontSize: vertical ? 34 : 30, letterSpacing: 1.5, textTransform: 'uppercase', padding: '10px 22px'}}>
              {scene.kicker}
            </div>
          )}
        </div>
        <div style={{opacity: h.opacity, transform: `translateY(${h.dy}px)`, fontWeight: 900, fontSize: size, lineHeight: 1.06, letterSpacing: -1.5, color: theme.text, textShadow: scene.media ? '0 3px 18px rgba(0,0,0,0.6)' : undefined}}>
          <Rich text={scene.heading} accent={theme.accent} accentText={theme.accentText} />
        </div>
        {scene.dateline && (
          <div style={{opacity: show(0.3).opacity, display: 'flex', alignItems: 'center', gap: 16, fontWeight: 700, fontSize: vertical ? 36 : 32, color: theme.textSoft, letterSpacing: 0.5}}>
            <span style={{width: 46, height: 6, background: NEWS.red}} />
            {scene.dateline}
          </div>
        )}
        {scene.beats?.length ? (
          <div style={{display: 'flex', justifyContent: vertical ? 'center' : 'flex-start', marginTop: vertical ? 40 : 20}}>
            <BeatRow beats={scene.beats} cues={scene.cues} t={t} vertical={vertical} theme={theme} />
          </div>
        ) : null}
      </div>
    </>
  );
};

// ---------- media: full-frame footage, lower third, credit ----------
export const MediaScene: React.FC<SceneProps<'media'>> = ({scene, t, frame, theme, lang, media, fps = 30}) => {
  const vertical = frame.format === 'vertical';
  const W = frame.width;
  const H = frame.height;
  // The clip on screen: the scene's, or the last step that cut to another one.
  let id = scene.media;
  let since = 0;
  let lower: {title: string; sub?: string} | null = scene.lower ?? null;
  let lowerSince = 0.4;
  scene.steps.forEach((st, i) => {
    const c = at(scene.cues, i, 0);
    if (t < c) return;
    if (st.media) {
      id = st.media;
      since = c;
    }
    if (st.lower) {
      lower = st.lower === 'off' ? null : st.lower;
      lowerSince = c;
    }
  });
  const item = media?.[id];
  const cut = since > 0 ? clamp01((t - since) / 0.12) : 1; // a short dip on a cut
  const lowerY = vertical ? 1170 : 800;
  return (
    <>
      <div style={{position: 'absolute', inset: 0, opacity: 0.35 + 0.65 * cut}}>
        <MediaFill key={id + since} item={item} id={id} box={{x: 0, y: 0, w: W, h: H}} t={t - since} dur={scene.duration - since} absStart={scene.start + since} fps={fps} move={scene.move} theme={theme} lang={lang} />
      </div>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,20,38,0.45) 0%, rgba(10,20,38,0) 18%, rgba(10,20,38,0) 52%, rgba(10,20,38,0.78) 100%)'}} />
      <Credit item={item} {...creditPos(frame)} align="right" lang={lang} />
      {lower && <LowerThirdView title={(lower as {title: string}).title} sub={(lower as {sub?: string}).sub} t={t - lowerSince} frame={frame} y={lowerY} />}
    </>
  );
};

// ---------- stats: key figures in cards ----------
export const StatsScene: React.FC<SceneProps<'stats'>> = ({scene, t, frame, theme}) => {
  const vertical = frame.format === 'vertical';
  const c = frame.content;
  const n = scene.items.length;
  const cols = vertical ? (n <= 3 ? 1 : 2) : n <= 3 ? n : n === 4 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  const gap = vertical ? 28 : 34;
  const foot = scene.footnote ? (vertical ? 70 : 60) : 0;
  const cw = (c.w - gap * (cols - 1)) / cols;
  const ch = Math.min(vertical ? 330 : 300, (c.h - foot - gap * (rows - 1)) / rows);
  const totalH = rows * ch + (rows - 1) * gap;
  const top = c.y + (c.h - foot - totalH) / 2;
  const valueSize = Math.min(vertical ? (cols === 1 ? 120 : 92) : 96, ch * 0.38);
  return (
    <>
      {scene.items.map((it, i) => {
        const r = Math.floor(i / cols);
        const inRow = Math.min(cols, n - r * cols);
        const rowW = inRow * cw + (inRow - 1) * gap;
        const x = c.x + (c.w - rowW) / 2 + (i % cols) * (cw + gap);
        const y = top + r * (ch + gap);
        const cue = at(scene.cues, i, 0.4 + i * 0.6);
        const k = pop(t, cue);
        const ink = toneInk(theme, it.tone);
        const stripe = it.tone === 'neutral' ? NEWS.red : toneSwatch(theme, it.tone).stroke;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: cw,
              height: ch,
              transform: `scale(${0.9 + 0.1 * k})`,
              opacity: clamp01(k * 1.4),
              background: theme.surface,
              borderLeft: `12px solid ${stripe}`,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              padding: '0 34px',
              boxSizing: 'border-box',
              fontFamily: FONT.sans,
            }}
          >
            {it.icon && (
              <svg width={ch * 0.42} height={ch * 0.34} viewBox="0 0 200 160" style={{flexShrink: 0, overflow: 'visible'}}>
                <NodeIcon icon={it.icon} state={iconState(it.icon, it.tone === 'bad' ? 'error' : 'idle')} frame={t * 30} p={1} />
              </svg>
            )}
            <div style={{display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0}}>
              <div style={{fontWeight: 900, fontSize: valueSize, lineHeight: 1, color: ink, letterSpacing: -2, whiteSpace: 'nowrap'}}>
                {it.countUp ? (
                  <span style={{display: 'inline-grid'}}>
                    <span style={{gridArea: '1 / 1', visibility: 'hidden'}}>{it.value}</span>
                    <span style={{gridArea: '1 / 1'}}>{countedText(it.value, t - cue)}</span>
                  </span>
                ) : (
                  it.value
                )}
              </div>
              <div style={{fontWeight: 800, fontSize: vertical ? 38 : 34, color: theme.text, lineHeight: 1.15}}>
                <Rich text={it.label} accent={theme.accent} accentText={theme.accentText} />
              </div>
              {it.sub && <div style={{fontWeight: 600, fontSize: vertical ? 28 : 26, color: theme.textSoft, lineHeight: 1.2}}>{it.sub}</div>}
            </div>
          </div>
        );
      })}
      {scene.footnote && (
        <div style={{position: 'absolute', left: c.x, width: c.w, top: c.y + c.h - foot + 16, textAlign: 'center', fontFamily: FONT.sans, fontWeight: 600, fontStyle: 'italic', fontSize: vertical ? 30 : 28, color: theme.textSoft, opacity: enter(t, 0.6).opacity}}>
          {scene.footnote}
        </div>
      )}
    </>
  );
};

// ---------- quote: what someone said, who and their role ----------
export const QuoteScene: React.FC<SceneProps<'quote'>> = ({scene, t, frame, theme, lang, media, fps = 30}) => {
  const vertical = frame.format === 'vertical';
  const c = frame.content;
  const n = scene.quotes.length;
  const gap = vertical ? 60 : 50;
  const h = (c.h - gap * (n - 1)) / n;
  return (
    <>
      {scene.quotes.map((q, i) => {
        const cue = at(scene.cues, i, 0.3 + i * 2);
        const e = enter(t, cue, 0.5, 30);
        const y = c.y + i * (h + gap);
        const len = q.text.length;
        const size = vertical ? (n === 1 ? (len > 110 ? 62 : 74) : len > 110 ? 50 : 58) : n === 1 ? (len > 110 ? 62 : 72) : len > 110 ? 44 : 52;
        const portrait = q.media ? media?.[q.media] : undefined;
        const ps = vertical ? 130 : 110;
        return (
          <div key={i} style={{position: 'absolute', left: c.x + 20, top: y, width: c.w - 40, height: h, opacity: e.opacity, transform: `translateY(${e.dy}px)`, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 26, fontFamily: FONT.sans}}>
            <div style={{position: 'relative', paddingLeft: vertical ? 70 : 90}}>
              <div style={{position: 'absolute', left: 0, top: -size * 0.35, fontFamily: FONT.display, fontSize: size * 2.4, lineHeight: 1, color: NEWS.red}}>“</div>
              <div style={{fontFamily: FONT.display, fontSize: size, lineHeight: 1.12, color: theme.text}}>
                <Rich text={q.text} accent={theme.accent} accentText={theme.accentText} />
              </div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 22, paddingLeft: vertical ? 70 : 90}}>
              {q.media && (
                <div style={{position: 'relative', width: ps, height: ps, borderRadius: ps / 2, overflow: 'hidden', border: `4px solid ${NEWS.red}`, flexShrink: 0}}>
                  <MediaFill item={portrait} id={q.media} box={{x: 0, y: 0, w: ps, h: ps}} t={t} dur={scene.duration} absStart={scene.start} fps={fps} move="still" theme={theme} lang={lang} />
                </div>
              )}
              <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
                  <span style={{width: 34, height: 6, background: NEWS.red}} />
                  <span style={{fontWeight: 900, fontSize: vertical ? 38 : 34, color: theme.text}}>{q.who}</span>
                </div>
                {q.role && <div style={{fontWeight: 600, fontSize: vertical ? 30 : 28, color: theme.textSoft, paddingLeft: 48}}>{q.role}</div>}
                {q.tag && (
                  <div style={{marginLeft: 48, marginTop: 6, alignSelf: 'flex-start', background: NEWS.gold, color: NEWS.ink, fontWeight: 800, fontSize: vertical ? 24 : 22, letterSpacing: 1, textTransform: 'uppercase', padding: '4px 12px', borderRadius: 4}}>
                    {q.tag}
                  </div>
                )}
              </div>
            </div>
            {portrait && <Credit item={portrait} x={vertical ? 70 : 90} y={h - 10} align="left" size={18} lang={lang} maxW={600} />}
          </div>
        );
      })}
    </>
  );
};

// ---------- timeline: dated events on a line ----------
export const DatesScene: React.FC<SceneProps<'timeline'>> = ({scene, t, frame, theme}) => {
  const vertical = frame.format === 'vertical';
  const c = frame.content;
  const n = scene.items.length;
  const cue = (i: number) => at(scene.cues, i, 0.4 + i * 0.8);
  const lastShown = scene.items.reduce((acc, _, i) => (t >= cue(i) ? i : acc), -1);
  if (vertical) {
    const rowH = Math.min(240, c.h / n);
    const top = c.y + (c.h - rowH * n) / 2;
    const lx = c.x + 40;
    const lineK = lastShown < 0 ? 0 : clamp01((lastShown + easeOut(clamp01((t - cue(lastShown)) / 0.4))) / n);
    return (
      <>
        <div style={{position: 'absolute', left: lx - 3, top: top + rowH / 2, width: 6, height: (n - 1) * rowH * clamp01(lineK * n / Math.max(1, n - 1)), background: theme.border}} />
        {scene.items.map((it, i) => {
          const k = pop(t, cue(i));
          const y = top + i * rowH;
          const col = it.tone === 'neutral' ? NEWS.red : toneSwatch(theme, it.tone).stroke;
          const current = i === lastShown;
          return (
            <div key={i} style={{position: 'absolute', left: lx - 22, top: y, height: rowH, display: 'flex', alignItems: 'center', gap: 30, opacity: clamp01(k * 1.5), fontFamily: FONT.sans}}>
              <div style={{width: 44, height: 44, borderRadius: 22, background: current ? col : theme.surface, border: `6px solid ${col}`, transform: `scale(${k})`, flexShrink: 0, boxSizing: 'border-box'}} />
              <div style={{display: 'flex', flexDirection: 'column', gap: 8, width: c.w - 110}}>
                <div style={{alignSelf: 'flex-start', background: col, color: '#FFFFFF', fontWeight: 900, fontSize: 36, letterSpacing: 1, textTransform: 'uppercase', padding: '4px 14px'}}>{it.when}</div>
                <div style={{fontWeight: 700, fontSize: 44, lineHeight: 1.2, color: current ? theme.text : theme.textSoft}}>
                  <Rich text={it.text} accent={theme.accent} accentText={theme.accentText} />
                </div>
              </div>
            </div>
          );
        })}
      </>
    );
  }
  const colW = c.w / n;
  const ly = c.y + c.h * 0.38;
  const lineK = lastShown < 0 ? 0 : clamp01((lastShown + 0.5 + 0.5 * easeOut(clamp01((t - cue(lastShown)) / 0.4))) / n);
  return (
    <>
      <div style={{position: 'absolute', left: c.x, top: ly - 3, width: c.w * lineK, height: 6, background: theme.border}} />
      {scene.items.map((it, i) => {
        const k = pop(t, cue(i));
        const x = c.x + i * colW;
        const col = it.tone === 'neutral' ? NEWS.red : toneSwatch(theme, it.tone).stroke;
        const current = i === lastShown;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: c.y, width: colW, height: c.h, opacity: clamp01(k * 1.5), fontFamily: FONT.sans}}>
            <div style={{position: 'absolute', left: 0, width: colW, top: ly - c.y - 90, display: 'flex', justifyContent: 'center'}}>
              <div style={{background: col, color: '#FFFFFF', fontWeight: 900, fontSize: 34, letterSpacing: 1, textTransform: 'uppercase', padding: '4px 14px', whiteSpace: 'nowrap'}}>{it.when}</div>
            </div>
            <div style={{position: 'absolute', left: colW / 2 - 22, top: ly - c.y - 22, width: 44, height: 44, borderRadius: 22, background: current ? col : theme.surface, border: `6px solid ${col}`, transform: `scale(${k})`, boxSizing: 'border-box'}} />
            <div style={{position: 'absolute', left: 16, width: colW - 32, top: ly - c.y + 50, textAlign: 'center', fontWeight: 700, fontSize: n > 4 ? 32 : 38, lineHeight: 1.22, color: current ? theme.text : theme.textSoft}}>
              <Rich text={it.text} accent={theme.accent} accentText={theme.accentText} />
            </div>
          </div>
        );
      })}
    </>
  );
};

// ---------- sources: who reported what, on screen ----------
export const SourcesScene: React.FC<SceneProps<'sources'>> = ({scene, t, frame, theme}) => {
  const vertical = frame.format === 'vertical';
  const c = frame.content;
  const n = scene.items.length;
  const cols = vertical ? (n > 6 ? 2 : 1) : n > 4 ? 2 : 1;
  const rows = Math.ceil(n / cols);
  const foot = scene.asOf ? 70 : 0;
  const gap = 18;
  const cw = (c.w - (cols - 1) * 30) / cols;
  const rh = Math.min(vertical ? 130 : 110, (c.h - foot - (rows - 1) * gap) / rows);
  const top = c.y + (c.h - foot - (rows * rh + (rows - 1) * gap)) / 2;
  return (
    <>
      {scene.items.map((it, i) => {
        const col = Math.floor(i / rows);
        const row = i % rows;
        const e = enter(t, 0.15 + i * 0.12, 0.35, 16);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: c.x + col * (cw + 30),
              top: top + row * (rh + gap),
              width: cw,
              height: rh,
              opacity: e.opacity,
              transform: `translateY(${e.dy}px)`,
              background: theme.surface,
              borderLeft: `8px solid ${NEWS.red}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '0 26px',
              boxSizing: 'border-box',
              fontFamily: FONT.sans,
            }}
          >
            <div style={{fontWeight: 900, fontSize: vertical ? 36 : 32, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{it.name}</div>
            {it.detail && <div style={{fontWeight: 600, fontSize: vertical ? 26 : 24, color: theme.textSoft, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{it.detail}</div>}
          </div>
        );
      })}
      {scene.asOf && (
        <div style={{position: 'absolute', left: c.x, width: c.w, top: c.y + c.h - foot + 20, textAlign: 'center', fontFamily: FONT.sans, fontWeight: 700, fontSize: vertical ? 32 : 28, color: theme.textSoft, opacity: enter(t, 0.3 + n * 0.12).opacity}}>
          {scene.asOf}
        </div>
      )}
    </>
  );
};
