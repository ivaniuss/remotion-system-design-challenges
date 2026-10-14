import type {Timeline, TimedScene} from '../timeline/timeline';
import type {Word} from '../timeline/words';
import {thinkWindow} from '../scenes/puzzleTime';
import type {HostClip, HostClipInfo, HostManifest, Mouth} from './types';

// What the host does, as a pure function of the timeline: one clip per stretch of time.
// The choice follows the scene:
//   puzzle   points at the question while it is read, then thinks during the countdown
//            ("suspicious" when the round judges a claim: spot the mistake)
//   reveal   reacts to the answer (celebrates; surprised when the claim was wrong), then talks
//   proof    points at the working while it explains
//   score    celebrates, then waves while asking for the score
//   other    talks while the voice talks
// Silence between all of that is `idle`. A scene can choose its own clips with `host`.

export type HostSegment = {clip: HostClip; start: number; end: number}; // absolute seconds

const lastWordEnd = (s: TimedScene) => (s.words.length ? s.words[s.words.length - 1].end : 0);
const firstWordStart = (s: TimedScene) => (s.words.length ? s.words[0].start : 0);

function sceneSegments(s: TimedScene): HostSegment[] {
  const S = s.start;
  const E = s.start + s.duration;
  const speechEnd = S + lastWordEnd(s) + 0.15;
  const out: HostSegment[] = [];
  const add = (clip: HostClip, a: number, b: number) => {
    const start = Math.max(S, a);
    const end = Math.min(E, b);
    if (end - start > 0.05) out.push({clip, start, end});
  };
  // A scene's own choice: [main] or [main, after]: `after` takes the silence after the voice.
  const own = (s as {host?: HostClip[]}).host;
  if (own?.length) {
    add(own[0], S, own.length > 1 ? speechEnd : E);
    if (own.length > 1) add(own[1], speechEnd, E);
    return out;
  }
  switch (s.type) {
    case 'puzzle': {
      const tw = thinkWindow(s);
      const thinkStart = tw ? S + tw.start : E;
      add('point', S, Math.min(speechEnd, thinkStart));
      if (tw) add(s.claim ? 'suspicious' : 'think', thinkStart, S + tw.end + 0.2);
      break;
    }
    case 'reveal': {
      const react = Math.min(1.2, s.duration * 0.4);
      add(s.verdict === 'wrong' ? 'surprised' : 'celebrate', S, S + react);
      add('talk', S + react, speechEnd);
      break;
    }
    case 'proof':
      add('point', S, speechEnd);
      break;
    case 'score': {
      const react = Math.min(1.2, s.duration * 0.3);
      add('celebrate', S, S + react);
      add('wave', S + react, E);
      break;
    }
    case 'title':
      add(s.index === 0 ? 'wave' : 'talk', S + firstWordStart(s), speechEnd);
      break;
    default:
      if (s.words.length) add('talk', S + firstWordStart(s), speechEnd);
  }
  return out;
}

export function hostTrack(tl: Timeline): HostSegment[] {
  const raw = tl.scenes.flatMap(sceneSegments);
  // Fill the gaps with idle and merge neighbours that play the same clip (a point that goes
  // on from the puzzle into its proof does not restart).
  const out: HostSegment[] = [];
  let t = 0;
  for (const seg of raw) {
    if (seg.start > t + 0.01) out.push({clip: 'idle', start: t, end: seg.start});
    out.push({...seg, start: Math.max(seg.start, t)});
    t = Math.max(t, seg.end);
  }
  if (t < tl.duration) out.push({clip: 'idle', start: t, end: tl.duration});
  const merged: HostSegment[] = [];
  for (const seg of out) {
    const prev = merged[merged.length - 1];
    if (prev && prev.clip === seg.clip && seg.start - prev.end < 0.05) prev.end = seg.end;
    else if (seg.end - seg.start > 0.01) merged.push({...seg});
  }
  return merged;
}

export function segmentAt(track: HostSegment[], t: number): HostSegment {
  for (const s of track) if (t < s.end) return s;
  return track[track.length - 1];
}

// The frame of a clip at time t: intro from the neutral pose, the loop for as long as the
// segment lasts, and the outro so that it ends back on the neutral pose. Idle loops on the
// absolute clock, so it never restarts visibly.
export function clipFrame(info: HostClipInfo, fps: number, seg: HostSegment, clip: HostClip, t: number): number {
  const n = info.frames;
  if (clip === 'idle') return Math.floor(t * fps + 1e-6) % n;
  const fi = Math.max(0, Math.floor((t - seg.start) * fps + 1e-6));
  const ri = Math.max(0, Math.floor((seg.end - t) * fps));
  const loop = Math.max(1, n - info.intro - info.outro);
  if (ri < info.outro) return n - 1 - ri;
  if (fi < info.intro) return fi;
  return info.intro + ((fi - info.intro) % loop);
}

// Lip sync from the word timings: the beak opens and closes about four times a second inside
// each word and stays shut between words. Short words never open fully.
export function mouthAt(words: Word[], t: number): Mouth {
  for (const w of words) {
    if (t < w.start - 0.02) break;
    if (t >= w.end) continue;
    const u = t - w.start;
    const left = w.end - t;
    if (u < 0.04 || left < 0.04) return 'half';
    const k = Math.abs(Math.sin(Math.PI * u * 8.5));
    const short = w.w.replace(/[^\p{L}\p{N}]/gu, '').length <= 2;
    if (k > 0.55) return short ? 'half' : 'open';
    return k > 0.2 ? 'half' : 'closed';
  }
  return 'closed';
}

export function hostManifest(name: string, all: Record<string, HostManifest>): HostManifest {
  return all[name] ?? Object.values(all)[0];
}
