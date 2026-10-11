import type {Timeline} from '../timeline/timeline';

// "Something just broke" moments: a node turns to `error`, or a bad-tone callout
// lands. They get a short camera shake and a red blink, the emotional peak of an
// interview video. Pure functions of (timeline, t).

export type Danger = {t: number; shake: boolean};

export function dangerMoments(tl: Timeline): Danger[] {
  const out: Danger[] = [];
  for (const s of tl.scenes) {
    if (s.type === 'flow' || s.type === 'board') {
      s.steps.forEach((st, i) => {
        if (Object.values(st.status ?? {}).includes('error')) out.push({t: s.start + (s.cues[i] ?? 0), shake: true});
      });
    }
    if (s.type === 'sequence') {
      s.steps.forEach((st, i) => {
        if (Object.values(st.status ?? {}).includes('error') || st.kind === 'lost') out.push({t: s.start + (s.cues[i] ?? 0) + 0.3, shake: Object.values(st.status ?? {}).includes('error')});
      });
    }
    // The callout shakes its own number; the screen only blinks.
    if (s.type === 'callout' && s.tone === 'bad') out.push({t: s.start + 0.15, shake: false});
  }
  return out.sort((a, b) => a.t - b.t);
}

export function dangerAt(moments: Danger[], t: number): {x: number; y: number; flash: number} {
  let x = 0;
  let y = 0;
  let flash = 0;
  for (const d of moments) {
    const dt = t - d.t;
    if (dt < 0 || dt > 0.7) continue;
    if (d.shake && dt < 0.6) {
      const amp = 16 * (1 - dt / 0.6);
      x += amp * Math.sin(dt * 55);
      y += amp * 0.5 * Math.cos(dt * 43);
    }
    if (dt < 0.45) flash = Math.max(flash, (Math.floor(dt / 0.075) % 2 === 0 ? 0.2 : 0.05) * (1 - dt / 0.45));
  }
  return {x, y, flash};
}
