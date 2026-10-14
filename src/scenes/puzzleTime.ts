import type {TimedScene} from '../timeline/timeline';

// The thinking time of a puzzle scene: from just after the last spoken word to the end of
// the scene. With the generated voice the scene is exactly `think` seconds longer than
// the voice; with a recorded voice it is whatever pause the speaker left (never longer
// than `think`). Shared by the scene (countdown) and the sound track (ticks).
export function thinkWindow(scene: TimedScene): {start: number; end: number} | null {
  if (scene.type !== 'puzzle' || scene.think <= 0) return null;
  const lastWord = scene.words.length ? scene.words[scene.words.length - 1].end : 0;
  const end = Math.max(0, scene.duration - 0.2);
  const start = Math.min(end, Math.max(end - scene.think, lastWord + 0.2));
  return end - start >= 0.5 ? {start, end} : null;
}
