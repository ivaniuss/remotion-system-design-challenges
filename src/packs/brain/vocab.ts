import type {ColorName} from '../../spec/vocab';

// Brain: daily puzzles and brain teasers (logic, memory, perception, critical thinking,
// "spot the mistake", cognitive biases). The puzzle itself is drawn by the `puzzle`,
// `reveal` and `score` scenes; icons are for the few title cards and the thumbnail.
export const ICONS = ['puzzle', 'stopwatch', 'trophy'] as const;
export type Name = (typeof ICONS)[number];

// Science icons this pack may use too (a brain channel needs the brain, the eye of a
// visual illusion, the light bulb of an insight and a target). Declared here on purpose:
// a video still may not use any other science icon.
export const BORROW = ['brain', 'eye', 'idea', 'target'] as const;

// Values may name a common icon (user, ai…) or a borrowed one; checked at load time.
export const ALIASES: Record<string, string> = {
  riddle: 'puzzle', teaser: 'puzzle', 'brain-teaser': 'puzzle', jigsaw: 'puzzle', challenge: 'puzzle', logic: 'puzzle',
  timer: 'stopwatch', countdown: 'stopwatch', clock: 'stopwatch', time: 'stopwatch', seconds: 'stopwatch',
  score: 'trophy', points: 'trophy', winner: 'trophy', leaderboard: 'trophy', streak: 'trophy', prize: 'trophy',
  mind: 'brain', memory: 'brain', think: 'brain', thinking: 'brain',
  vision: 'eye', illusion: 'eye', see: 'eye', look: 'eye', perception: 'eye',
  insight: 'idea', answer: 'idea', lightbulb: 'idea', bulb: 'idea', aha: 'idea',
  goal: 'target', aim: 'target', accuracy: 'target',
};

export const COLOR: Record<Name, ColorName> = {
  puzzle: 'purple', stopwatch: 'orange', trophy: 'yellow',
};

// Maps a generic node status to the illustration's own animated state.
export const STATES: Record<string, Partial<Record<Name, string>>> = {
  busy: {stopwatch: 'running', puzzle: 'thinking'},
  ok: {puzzle: 'solved', trophy: 'shine', stopwatch: 'done'},
  error: {puzzle: 'wrong', stopwatch: 'done'},
};

export const DEFAULT_STATE: Partial<Record<Name, string>> = {};

// The episode cycle of the Daily Brain series (docs/packs/brain.md §7). The format of an
// episode follows from its number, not from the date, so batching or skipping a day never
// breaks the rotation: episode n takes slot (n - 1) % 7. `npm run next` says which one is next.
export const EPISODE_FORMATS = ['levels', 'spot-the-mistake', 'answer-fast', 'answer-tomorrow', 'reveal-levels', 'hard'] as const;
export type EpisodeFormat = (typeof EPISODE_FORMATS)[number];
export const EPISODE_CYCLE: {format: EpisodeFormat; theme: 'light' | 'dark' | 'neon'; label: string; how: string}[] = [
  {format: 'levels', theme: 'light', label: '3 levels', how: 'Three puzzles easy → medium → hard (pause), each followed by its reveal, then a score scene with the scorecard.'},
  {format: 'spot-the-mistake', theme: 'dark', label: 'Spot the mistake', how: 'One puzzle with a claim to judge (an AI claim only from a real log with claim.source), a reveal with verdict, a score scene with card: false.'},
  {format: 'answer-fast', theme: 'neon', label: 'Answer fast', how: 'One trick question with 2–4 choices (a bias, a classic trap), a reveal with correct and the bias named in why, a score scene with card: false.'},
  {format: 'answer-tomorrow', theme: 'dark', label: 'Answer tomorrow', how: 'One puzzle with "tomorrow": true and no reveal, the narration says the answer comes in the next episode, then a score scene (card: false) asking for guesses.'},
  {format: 'reveal-levels', theme: 'light', label: "Yesterday's answer + 3 levels", how: "Opens with a reveal of the previous episode's puzzle (copy its question/sequence/choices into the reveal), then the 3-levels structure."},
  {format: 'spot-the-mistake', theme: 'dark', label: 'Spot the mistake', how: 'As slot 2, on another kind of trap (percentages, units, logic, a misleading chart).'},
  {format: 'hard', theme: 'neon', label: 'Hard puzzle of the week', how: 'One hard puzzle with "pause": true and "think": 2, a reveal with up to 3 lines of why, a score scene with the 3-point scorecard.'},
];
export const cycleSlot = (episode: number) => EPISODE_CYCLE[(((episode - 1) % EPISODE_CYCLE.length) + EPISODE_CYCLE.length) % EPISODE_CYCLE.length];
