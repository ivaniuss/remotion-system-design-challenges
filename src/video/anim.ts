import {spring} from 'remotion';

// Pure animation helpers. Everything is a function of time in seconds, so scenes
// render the same in the Studio, in the renderer and in the SSR check.

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeInOut = (x: number) => {
  const k = clamp01(x);
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
};

// 0 -> 1 over `dur` seconds starting at `at`.
export const progress = (t: number, at: number, dur: number) => clamp01((t - at) / Math.max(0.001, dur));

// Springy pop-in scale (slight overshoot), 0 before `at`.
export function pop(t: number, at: number): number {
  const dt = t - at;
  if (dt < 0) return 0;
  return spring({frame: dt * 30, fps: 30, config: {damping: 13, stiffness: 180, mass: 0.7}});
}

// Standard entrance: opacity + small upward slide.
export function enter(t: number, at: number, dur = 0.35, distance = 24) {
  const k = easeOut(progress(t, at, dur));
  return {opacity: k, dy: (1 - k) * distance};
}
