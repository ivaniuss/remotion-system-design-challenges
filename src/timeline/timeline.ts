import type {BoardSpec, Scene, VideoSpec} from '../spec/schema';
import type {ThemeName} from '../spec/vocab';
import {cuePhrases, resolveCues} from './cues';
import {estimateWords, round, Word} from './words';

// The timeline is what Remotion renders: the spec plus resolved timing. It is plain
// JSON (written by `npm run make`) so the same file drives the Studio and the render.

export type TimedScene = Scene & {
  index: number;
  start: number; // seconds, absolute
  duration: number; // seconds
  words: Word[]; // scene-local times
  cues: number[]; // scene-local seconds, one per entry of cuePhrases(scene)
};

export type AudioClip = {src: string; start: number};
export type Music = {src: string; volume: number};

export type Timeline = {
  version: 2;
  id: string;
  title: string;
  lang: string;
  theme: ThemeName;
  handle: string | null;
  cta: string | null;
  captions: {vertical: boolean; horizontal: boolean};
  fps: number;
  duration: number;
  audio: AudioClip[];
  sfx: boolean; // sound effects on visual events
  music: Music | null; // background track under the voice (file in public/)
  board: BoardSpec | null;
  scenes: TimedScene[];
};

// Speech for one scene: where it starts, how long it lasts, and word timings.
export type SceneSpeech = {start: number; duration: number; words: Word[]};
export type Speech = {scenes: SceneSpeech[]; audio: AudioClip[]; warnings: string[]};

export type TimelineOptions = {
  fps?: number;
  handle?: string | null;
  cta?: string | null;
  captions?: {vertical: boolean; horizontal: boolean};
  sfx?: boolean;
  music?: Music | null;
};

// Minimum time on screen per scene type, so short narration still reads well.
export const MIN_SCENE: Record<Scene['type'], number> = {
  title: 2.6,
  callout: 2.2,
  list: 3,
  compare: 3.5,
  code: 4,
  flow: 3.5,
  board: 3,
  summary: 3.5,
  chart: 4,
  figure: 3.5,
  sequence: 4.5,
};

// Silent timing: each scene lasts as long as its estimated narration.
export function estimateSpeech(spec: VideoSpec, wordsPerSecond = 3.0): Speech {
  let t = 0;
  const scenes: SceneSpeech[] = spec.scenes.map((sc) => {
    const words = estimateWords(sc.narration, wordsPerSecond, 0.25);
    const end = words.length ? words[words.length - 1].end : 0;
    const duration = round(Math.max(MIN_SCENE[sc.type], end + 0.6));
    const out = {start: round(t), duration, words};
    t += duration;
    return out;
  });
  return {scenes, audio: [], warnings: []};
}

export function buildTimeline(spec: VideoSpec, speech: Speech, opts: TimelineOptions = {}): {timeline: Timeline; warnings: string[]} {
  const warnings = [...speech.warnings];
  const scenes: TimedScene[] = spec.scenes.map((sc, index) => {
    const sp = speech.scenes[index];
    const {times, missing} = resolveCues(cuePhrases(sc), sp.words, sp.duration);
    for (const m of missing) warnings.push(`scene ${index + 1}: cue "${m}" not found in the spoken words; spread evenly.`);
    return {...sc, index, start: sp.start, duration: sp.duration, words: sp.words, cues: times};
  });
  const last = scenes[scenes.length - 1];
  const timeline: Timeline = {
    version: 2,
    id: spec.id,
    title: spec.title,
    lang: spec.lang,
    theme: spec.theme,
    handle: opts.handle ?? null,
    cta: opts.cta ?? null,
    captions: opts.captions ?? {vertical: true, horizontal: false},
    fps: opts.fps ?? 30,
    duration: round(last.start + last.duration),
    audio: speech.audio,
    sfx: opts.sfx ?? true,
    music: opts.music ?? null,
    board: spec.board ?? null,
    scenes,
  };
  return {timeline, warnings};
}

// All words with absolute times, for the captions track.
export function globalWords(tl: Timeline): Word[] {
  const out: Word[] = [];
  for (const s of tl.scenes) for (const w of s.words) out.push({w: w.w, start: s.start + w.start, end: s.start + w.end});
  return out;
}
