import type {ColorName} from '../../spec/vocab';

// Science and learning: the brain and nervous system, the senses, biology, time and habits.
export const ICONS = [
  'brain', 'neuron', 'ear', 'eye', 'speech', 'chat', 'book',
  'calendar', 'clock', 'repeat', 'moon', 'idea', 'target',
  'dna', 'cell', 'heart', 'flask', 'globe',
] as const;
export type Name = (typeof ICONS)[number];

// Values may name a common icon (user, file, chart…); checked at load time.
export const ALIASES: Record<string, string> = {
  mind: 'brain', memory: 'brain', cortex: 'brain', hippocampus: 'brain', head: 'brain',
  nerve: 'neuron', synapse: 'neuron', signal: 'neuron', impulse: 'neuron',
  listen: 'ear', listening: 'ear', hearing: 'ear', audio: 'ear', podcast: 'ear', sound: 'ear',
  see: 'eye', vision: 'eye', watch: 'eye',
  speak: 'speech', speaking: 'speech', talk: 'speech', voice: 'speech', mouth: 'speech', say: 'speech',
  conversation: 'chat', dialogue: 'chat', dialog: 'chat', practice_partner: 'chat',
  read: 'book', reading: 'book', study: 'book', textbook: 'book', grammar: 'book', vocabulary: 'book', class: 'book',
  days: 'calendar', schedule: 'calendar', years: 'calendar', months: 'calendar', weeks: 'calendar',
  time: 'clock', hours: 'clock', minutes: 'clock', timer: 'clock',
  practice: 'repeat', review: 'repeat', loop: 'repeat', habit: 'repeat', routine: 'repeat', spaced: 'repeat', cycle: 'repeat',
  sleep: 'moon', night: 'moon', rest: 'moon',
  insight: 'idea', lightbulb: 'idea', bulb: 'idea', understanding: 'idea',
  goal: 'target', aim: 'target', objective: 'target',
  gene: 'dna', genes: 'dna', genome: 'dna', genetics: 'dna',
  bacteria: 'cell', organism: 'cell', tissue: 'cell',
  cardio: 'heart', blood: 'heart', pulse: 'heart', emotion: 'heart',
  experiment: 'flask', lab: 'flask', research: 'flask', evidence: 'flask', science: 'flask', chemistry: 'flask',
  world: 'globe', language: 'globe', languages: 'globe', country: 'globe', countries: 'globe', earth: 'globe',
};

export const COLOR: Record<Name, ColorName> = {
  brain: 'red', neuron: 'purple', ear: 'orange', eye: 'teal', speech: 'blue', chat: 'teal', book: 'blue',
  calendar: 'gray', clock: 'gray', repeat: 'green', moon: 'purple', idea: 'yellow', target: 'red',
  dna: 'teal', cell: 'green', heart: 'red', flask: 'green', globe: 'blue',
};

// Maps a generic node status to the illustration's own animated state.
// busy = the thing is working; ok = it worked; error = it failed; warn = struggling.
export const STATES: Record<string, Partial<Record<Name, string>>> = {
  busy: {
    brain: 'active', neuron: 'firing', ear: 'listening', eye: 'looking', speech: 'talking', chat: 'busy',
    book: 'reading', calendar: 'passing', clock: 'running', repeat: 'spinning', moon: 'sleeping',
    idea: 'flicker', target: 'aiming', dna: 'spinning', cell: 'dividing', heart: 'beating',
    flask: 'bubbling', globe: 'spinning',
  },
  ok: {brain: 'lit', idea: 'on', target: 'hit', repeat: 'ok', calendar: 'done'},
  error: {brain: 'foggy', neuron: 'blocked', ear: 'noise', speech: 'stuck', eye: 'closed', idea: 'off', target: 'miss', heart: 'error'},
  warn: {brain: 'tired', ear: 'noise', speech: 'stuck'},
};

export const DEFAULT_STATE: Partial<Record<Name, string>> = {};
