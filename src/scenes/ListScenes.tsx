import React from 'react';
import type {Item} from '../spec/schema';
import type {ColorName, Tone} from '../spec/vocab';
import {ICON_COLOR} from '../spec/vocab';
import {FONT, Theme, toneSwatch} from '../theme';
import {CheckGlyph, CrossGlyph, DotGlyph, IconTile} from '../components/glyphs';
import {Rich} from '../components/Rich';
import {enter, pop} from '../video/anim';
import type {SceneProps} from './types';

const CYCLE: ColorName[] = ['blue', 'green', 'orange', 'purple', 'teal', 'red'];

// Index of the most recent cue that has fired (-1 = none yet).
const currentIndex = (cues: number[], t: number) => {
  let k = -1;
  cues.forEach((c, i) => {
    if (t >= c) k = i;
  });
  return k;
};

const card = (theme: Theme, active: boolean): React.CSSProperties => ({
  background: theme.surfaceAlt,
  border: `4px solid ${active ? theme.accent : theme.border}`,
  borderRadius: 22,
  boxShadow: `7px 7px 0 ${theme.shadow}`,
});

const Row: React.FC<{item: Item; index: number; numbered: boolean; at: number; active: boolean; t: number; theme: Theme; vertical: boolean; fontSize: number}> = ({
  item,
  index,
  numbered,
  at,
  active,
  t,
  theme,
  vertical,
  fontSize,
}) => {
  const e = enter(t, at, 0.35, 0);
  const slide = (1 - e.opacity) * 60;
  const color = theme.colors[item.icon ? ICON_COLOR[item.icon] : CYCLE[index % CYCLE.length]];
  const badge = vertical ? 76 : 80;
  return (
    <div
      style={{
        ...card(theme, active),
        opacity: e.opacity,
        transform: `translateX(${slide}px) scale(${active ? 1.02 : 1})`,
        display: 'flex',
        alignItems: 'center',
        gap: 26,
        padding: vertical ? '22px 30px' : '18px 28px',
      }}
    >
      {numbered && (
        <div
          style={{
            width: badge,
            height: badge,
            borderRadius: badge / 2,
            flex: 'none',
            background: color.stroke,
            color: '#fff',
            fontWeight: 900,
            fontSize: badge * 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {index + 1}
        </div>
      )}
      {item.icon && <IconTile icon={item.icon} size={vertical ? 96 : 100} tile={color.tile} border={color.stroke} frame={t * 30} />}
      <div style={{fontWeight: 700, fontSize, color: theme.text, lineHeight: 1.22}}>
        <Rich text={item.text} accent={theme.accent} accentText={theme.accentText} />
      </div>
    </div>
  );
};

export const ListScene: React.FC<SceneProps<'list'>> = ({scene, t, frame, theme}) => {
  const c = frame.content;
  const vertical = frame.format === 'vertical';
  const cur = currentIndex(scene.cues, t);
  const n = scene.items.length;
  const fontSize = vertical ? (n > 4 ? 40 : 46) : n > 4 ? 44 : 50;
  return (
    <div
      style={{
        position: 'absolute',
        left: c.x + (vertical ? 10 : 140),
        top: c.y,
        width: c.w - (vertical ? 20 : 280),
        height: c.h,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: vertical ? 26 : 20,
        fontFamily: FONT.sans,
      }}
    >
      {scene.items.map((it, i) => (
        <Row key={i} item={it} index={i} numbered={scene.numbered} at={scene.cues[i]} active={i === cur} t={t} theme={theme} vertical={vertical} fontSize={fontSize} />
      ))}
    </div>
  );
};

const ToneGlyph: React.FC<{tone: Tone; size: number; theme: Theme}> = ({tone, size, theme}) => {
  const sw = toneSwatch(theme, tone);
  if (tone === 'good') return <CheckGlyph size={size} color={sw.stroke} />;
  if (tone === 'bad') return <CrossGlyph size={size} color={sw.stroke} />;
  return <DotGlyph size={size} color={sw.stroke} />;
};

const Panel: React.FC<{
  panel: {label: string; tone: Tone; items: Item[]};
  cues: number[];
  appear: number;
  t: number;
  theme: Theme;
  vertical: boolean;
}> = ({panel, cues, appear, t, theme, vertical}) => {
  const sw = toneSwatch(theme, panel.tone);
  const e = enter(t, appear, 0.4, 30);
  const fs = vertical ? 38 : 44;
  return (
    <div
      style={{
        flex: vertical ? 'none' : 1,
        opacity: e.opacity,
        transform: `translateY(${e.dy}px)`,
        background: theme.surfaceAlt,
        border: `4px solid ${sw.stroke}`,
        borderRadius: 26,
        boxShadow: `8px 8px 0 ${theme.shadow}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{background: sw.fill, borderBottom: `4px solid ${sw.stroke}`, padding: vertical ? '20px 28px' : '18px 28px', display: 'flex', alignItems: 'center', gap: 18}}>
        <ToneGlyph tone={panel.tone} size={vertical ? 54 : 60} theme={theme} />
        <div style={{fontWeight: 900, fontSize: vertical ? 46 : 54, color: theme.text}}>{panel.label}</div>
      </div>
      <div style={{padding: vertical ? '22px 28px' : '22px 28px', display: 'flex', flexDirection: 'column', gap: vertical ? 20 : 18}}>
        {panel.items.map((it, i) => {
          const ie = enter(t, cues[i], 0.3, 0);
          return (
            <div key={i} style={{opacity: ie.opacity, transform: `translateX(${(1 - ie.opacity) * 40}px)`, display: 'flex', alignItems: 'center', gap: 18}}>
              <ToneGlyph tone={panel.tone} size={vertical ? 40 : 46} theme={theme} />
              <div style={{fontWeight: 700, fontSize: fs, color: theme.text, lineHeight: 1.2}}>
                <Rich text={it.text} accent={theme.accent} accentText={theme.accentText} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const CompareScene: React.FC<SceneProps<'compare'>> = ({scene, t, frame, theme}) => {
  const c = frame.content;
  const vertical = frame.format === 'vertical';
  const nl = scene.left.items.length;
  const leftCues = scene.cues.slice(0, nl);
  const rightCues = scene.cues.slice(nl);
  const rightAppear = Math.max(0.35, (rightCues[0] ?? 1) - 0.35);
  return (
    <div
      style={{
        position: 'absolute',
        left: c.x + 10,
        top: c.y,
        width: c.w - 20,
        height: c.h,
        display: 'flex',
        flexDirection: vertical ? 'column' : 'row',
        justifyContent: 'center',
        alignItems: vertical ? 'stretch' : 'center',
        gap: vertical ? 48 : 56,
        padding: vertical ? '20px 0' : '30px 0',
        boxSizing: 'border-box',
        fontFamily: FONT.sans,
      }}
    >
      <Panel panel={scene.left} cues={leftCues} appear={0.1} t={t} theme={theme} vertical={vertical} />
      <Panel panel={scene.right} cues={rightCues} appear={rightAppear} t={t} theme={theme} vertical={vertical} />
    </div>
  );
};

const DEFAULT_CTA: Record<string, string> = {
  en: 'Follow for more system design',
  es: 'Sígueme para más system design',
  pt: 'Siga para mais system design',
};

export const SummaryScene: React.FC<SceneProps<'summary'>> = ({scene, t, frame, theme, cta, lang}) => {
  const c = frame.content;
  const vertical = frame.format === 'vertical';
  const cur = currentIndex(scene.cues, t);
  const lastCue = scene.cues[scene.cues.length - 1] ?? 0;
  const ctaAt = Math.min(Math.max(lastCue + 0.8, scene.duration * 0.55), scene.duration - 1.2);
  const ctaText = scene.cta ?? cta ?? DEFAULT_CTA[lang] ?? DEFAULT_CTA.en;
  const ctaScale = pop(t, ctaAt) * (1 + 0.03 * Math.sin(Math.max(0, t - ctaAt) * 6));
  const fs = vertical ? 44 : 50;
  return (
    <div
      style={{
        position: 'absolute',
        left: c.x + (vertical ? 10 : 160),
        top: c.y,
        width: c.w - (vertical ? 20 : 320),
        height: c.h,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: vertical ? 28 : 22,
        fontFamily: FONT.sans,
      }}
    >
      {scene.points.map((p, i) => {
        const e = enter(t, scene.cues[i], 0.35, 0);
        return (
          <div
            key={i}
            style={{
              ...card(theme, i === cur && t < ctaAt),
              opacity: e.opacity,
              transform: `translateX(${(1 - e.opacity) * 60}px)`,
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              padding: vertical ? '24px 30px' : '20px 28px',
            }}
          >
            <CheckGlyph size={vertical ? 60 : 64} color={theme.colors.green.stroke} />
            <div style={{fontWeight: 700, fontSize: fs, color: theme.text, lineHeight: 1.22}}>
              <Rich text={p.text} accent={theme.accent} accentText={theme.accentText} />
            </div>
          </div>
        );
      })}
      <div style={{display: 'flex', justifyContent: 'center', marginTop: vertical ? 30 : 16}}>
        <div
          style={{
            transform: `scale(${ctaScale})`,
            background: theme.accent,
            color: theme.accentText,
            fontWeight: 900,
            fontSize: vertical ? 42 : 46,
            padding: '20px 40px',
            borderRadius: 999,
            border: `4px solid ${theme.border}`,
            boxShadow: `7px 7px 0 ${theme.shadow}`,
          }}
        >
          {ctaText}
        </div>
      </div>
    </div>
  );
};
