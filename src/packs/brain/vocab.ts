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
