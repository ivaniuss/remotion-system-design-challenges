import type {ColorName} from '../../spec/vocab';

// Icons every pack can use: people, devices, documents, notifications, charts, AI.
export const ICONS = ['user', 'users', 'mobile', 'file', 'mail', 'search', 'bell', 'chart', 'ai'] as const;
export type Name = (typeof ICONS)[number];

// Common words an LLM may use instead of the canonical icon name.
export const ALIASES: Record<string, string> = {
  person: 'user', customer: 'user', student: 'user', learner: 'user', patient: 'user',
  people: 'users', crowd: 'users', group: 'users',
  phone: 'mobile', smartphone: 'mobile', app: 'mobile',
  document: 'file', report: 'file', paper: 'file', notes: 'file',
  email: 'mail', letter: 'mail', notification: 'bell', alert: 'bell', push: 'bell',
  magnifier: 'search', metrics: 'chart', analytics: 'chart', dashboard: 'chart', graph: 'chart', stats: 'chart',
  llm: 'ai', model: 'ai', ml: 'ai', agent: 'ai', chatbot: 'ai',
};

export const COLOR: Record<Name, ColorName> = {
  user: 'blue', users: 'blue', mobile: 'blue', file: 'gray', mail: 'orange', search: 'yellow',
  bell: 'orange', chart: 'green', ai: 'purple',
};

export const STATES: Record<string, Partial<Record<Name, string>>> = {
  busy: {mobile: 'loading', users: 'surge', user: 'surge', search: 'busy', bell: 'busy', chart: 'busy', ai: 'busy'},
  error: {mobile: 'error'},
  ok: {bell: 'ok'},
};

export const DEFAULT_STATE: Partial<Record<Name, string>> = {};
