import type {Scene} from '../spec/schema';
import {findPhrase, round, Word} from './words';

// Visual changes happen slightly before the word is heard.
export const CUE_LEAD = 0.12;

// The ordered list of cue phrases ("at") of a scene. One entry per animated element.
export function cuePhrases(scene: Scene): (string | undefined)[] {
  switch (scene.type) {
    case 'flow':
    case 'board':
    case 'code':
    case 'chart':
    case 'figure':
    case 'sequence':
      return scene.steps.map((s) => s.at);
    case 'list':
      return scene.items.map((i) => i.at);
    case 'compare':
      return [...scene.left.items, ...scene.right.items].map((i) => i.at);
    case 'summary':
      return scene.points.map((p) => p.at);
    case 'title':
      return (scene.beats ?? []).map((b) => b.at);
    default:
      return [];
  }
}

export type CueResult = {times: number[]; missing: string[]};

// Resolves cue phrases to scene-local seconds. Phrases are searched in order; any
// phrase that is missing (or out of order) is placed evenly between its neighbours,
// so a sloppy cue never breaks the video.
export function resolveCues(phrases: (string | undefined)[], words: Word[], duration: number): CueResult {
  const texts = words.map((w) => w.w);
  const known: (number | null)[] = [];
  const missing: string[] = [];
  let cursor = 0;
  for (const p of phrases) {
    if (!p) {
      known.push(null);
      continue;
    }
    const i = findPhrase(texts, p, cursor);
    if (i < 0) {
      missing.push(p);
      known.push(null);
      continue;
    }
    known.push(Math.max(0, words[i].start - CUE_LEAD));
    cursor = i + 1;
  }

  const speechStart = words.length ? words[0].start : 0.3;
  const speechEnd = words.length ? words[words.length - 1].end : duration * 0.8;
  const lo = Math.min(speechStart + 0.4, duration * 0.3);
  const hi = Math.max(lo, Math.min(speechEnd - 0.3, duration * 0.85));

  const times: number[] = new Array(phrases.length);
  let k = 0;
  while (k < phrases.length) {
    const v = known[k];
    if (v !== null) {
      times[k] = v;
      k++;
      continue;
    }
    let e = k;
    while (e < phrases.length && known[e] === null) e++;
    const left = k > 0 ? times[k - 1] : lo - (hi - lo) / Math.max(1, phrases.length);
    const right = e < phrases.length ? (known[e] as number) : hi + (hi - lo) / Math.max(1, phrases.length);
    const count = e - k;
    for (let q = 0; q < count; q++) times[k + q] = left + ((right - left) * (q + 1)) / (count + 1);
    k = e;
  }
  for (let q = 1; q < times.length; q++) times[q] = Math.max(times[q], times[q - 1]);
  return {times: times.map((t) => round(Math.max(0, t))), missing};
}
