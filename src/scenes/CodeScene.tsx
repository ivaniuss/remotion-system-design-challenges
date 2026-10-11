import React from 'react';
import {FONT} from '../theme';
import {TOKEN_COLOR, tokenizeLine} from '../code/highlight';
import {clamp01, enter, progress} from '../video/anim';
import type {SceneProps} from './types';

// Editor window: the code types itself in, then each step highlights lines while
// the rest dims, with an optional note under the editor.
export const CodeScene: React.FC<SceneProps<'code'>> = ({scene, t, frame, theme}) => {
  const c = frame.content;
  const vertical = frame.format === 'vertical';
  const ed = theme.editor;
  const lines = scene.code.replace(/\t/g, '  ').replace(/\n+$/, '').split('\n');
  const longest = Math.max(10, ...lines.map((l) => l.length));
  const hasNotes = scene.steps.some((s) => s.note);
  const noteRoom = hasNotes ? (vertical ? 150 : 110) : 0;

  // Font size that fits both width and height.
  const maxW = vertical ? c.w : Math.min(c.w, 1560);
  const gutterCh = String(lines.length).length + 2;
  const byWidth = (maxW - 80) / ((longest + gutterCh) * 0.6);
  const byHeight = (c.h - noteRoom - 110) / (lines.length * 1.55);
  const fs = Math.max(18, Math.min(vertical ? 34 : 42, byWidth, byHeight));
  // Horizontal editors hug their code instead of spanning the whole frame.
  const editorW = vertical ? maxW : Math.min(maxW, Math.max(900, (longest + gutterCh) * 0.6 * fs + 110));
  const lh = fs * 1.55;

  // Typing animation, finished before the first highlight.
  const total = lines.reduce((a, l) => a + l.length + 1, 0);
  const firstCue = scene.cues[0] ?? scene.duration;
  const typeDur = Math.max(0.6, Math.min(total / 55, 4, scene.duration * 0.4, firstCue - 0.5));
  const typed = Math.floor(total * progress(t, 0.35, typeDur));
  const typingDone = typed >= total;

  // Active step.
  let active = -1;
  scene.cues.forEach((cue, i) => {
    if (t >= cue) active = i;
  });
  const step = active >= 0 ? scene.steps[active] : null;
  const hl = new Set(step?.lines ?? []);
  const hlK = step ? clamp01((t - scene.cues[active]) / 0.3) : 0;

  const win = enter(t, 0, 0.4, 40);
  let budget = typed;
  const editorH = lines.length * lh + 100;

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
        gap: 30,
        fontFamily: FONT.sans,
      }}
    >
      <div
        style={{
          width: editorW,
          height: editorH,
          opacity: win.opacity,
          transform: `translateY(${win.dy}px)`,
          background: ed.bg,
          borderRadius: 24,
          border: `4px solid ${theme.name === 'light' ? theme.border : '#30363D'}`,
          boxShadow: `10px 10px 0 ${theme.shadow}`,
          overflow: 'hidden',
          flex: 'none',
        }}
      >
        <div style={{height: 64, background: ed.bar, display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px'}}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((col) => (
            <div key={col} style={{width: 18, height: 18, borderRadius: 9, background: col}} />
          ))}
          {scene.filename && (
            <div style={{marginLeft: 20, fontFamily: FONT.mono, fontSize: 24, fontWeight: 500, color: '#C9D1D9', background: ed.bg, padding: '10px 18px', borderRadius: '10px 10px 0 0', alignSelf: 'flex-end'}}>
              {scene.filename}
            </div>
          )}
        </div>
        <div style={{padding: '18px 0', fontFamily: FONT.mono, fontSize: fs, lineHeight: `${lh}px`}}>
          {lines.map((line, i) => {
            const shown = Math.max(0, Math.min(line.length, budget));
            const cursorHere = !typingDone && budget >= 0 && budget <= line.length;
            budget -= line.length + 1;
            const on = hl.has(i + 1);
            const dim = step && !on ? 1 - 0.6 * hlK : 1;
            const tokens = tokenizeLine(line.slice(0, shown), scene.language);
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  whiteSpace: 'pre',
                  opacity: dim,
                  background: on ? ed.highlight : 'transparent',
                  boxShadow: on ? `inset 8px 0 0 ${theme.accent}` : 'none',
                  paddingRight: 24,
                }}
              >
                <span style={{width: `${gutterCh}ch`, textAlign: 'right', paddingRight: '1.4ch', color: on ? theme.accent : ed.gutter, flex: 'none'}}>{i + 1}</span>
                <span>
                  {tokens.map((tk, j) => (
                    <span key={j} style={{color: TOKEN_COLOR[tk.kind], fontStyle: tk.kind === 'com' ? 'italic' : 'normal', fontWeight: tk.kind === 'kw' ? 700 : 400}}>
                      {tk.text}
                    </span>
                  ))}
                  {cursorHere && <span style={{background: theme.accent, color: theme.accent, opacity: Math.floor(t * 4) % 2 ? 1 : 0.4}}> </span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{height: noteRoom, display: hasNotes ? 'flex' : 'none', alignItems: 'flex-start', justifyContent: 'center'}}>
        {step?.note && (
          <div
            style={{
              opacity: enter(t, scene.cues[active], 0.3).opacity,
              transform: `translateY(${enter(t, scene.cues[active], 0.3).dy}px)`,
              background: theme.accent,
              color: theme.accentText,
              fontWeight: 800,
              fontSize: vertical ? 40 : 36,
              padding: '18px 34px',
              borderRadius: 18,
              border: `4px solid ${theme.border}`,
              boxShadow: `7px 7px 0 ${theme.shadow}`,
              textAlign: 'center',
              maxWidth: c.w - 40,
            }}
          >
            {step.note}
          </div>
        )}
      </div>
    </div>
  );
};
