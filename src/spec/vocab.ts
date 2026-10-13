// Closed vocabularies shared by the schema, the validator, the renderer and the authoring guide.

import * as common from '../packs/common/vocab';
import * as tech from '../packs/tech/vocab';
import * as science from '../packs/science/vocab';
import * as news from '../packs/news/vocab';

// Icon packs. A video declares its pack ("pack": "tech" | "science"; default tech) and may
// only use that pack's icons plus the common ones, so topics never mix by accident.
// To add a pack: src/packs/<name>/{vocab.ts,icons.tsx}, register it here and in
// src/components/icons.tsx, and write docs/packs/<name>.md.
export const PACKS = ['tech', 'science', 'news'] as const;
export type Pack = (typeof PACKS)[number];

const BY_PACK = {tech, science, news} as const;

export const ICONS = [...common.ICONS, ...tech.ICONS, ...science.ICONS, ...news.ICONS] as const;
export type IconName = common.Name | tech.Name | science.Name | news.Name;

// Icons a video of this pack may use (common first).
export const PACK_ICONS: Record<Pack, readonly IconName[]> = {
  tech: [...common.ICONS, ...tech.ICONS],
  science: [...common.ICONS, ...science.ICONS],
  news: [...common.ICONS, ...news.ICONS],
};

// Common words an LLM may use instead of the canonical icon name, per pack.
export const PACK_ALIASES: Record<Pack, Record<string, IconName>> = Object.fromEntries(
  PACKS.map((p) => {
    const merged: Record<string, string> = {...common.ALIASES, ...BY_PACK[p].ALIASES};
    for (const [k, v] of Object.entries(merged)) {
      if (!(PACK_ICONS[p] as readonly string[]).includes(v)) throw new Error(`alias ${k} -> ${v} is not a ${p} icon`);
    }
    return [p, merged as Record<string, IconName>];
  }),
) as Record<Pack, Record<string, IconName>>;

// Large illustrations for `figure` scenes, with the pack each belongs to and its
// named regions (the drawings live in src/figures/).
export const FIGURES = ['brain', 'neuron', 'body'] as const;
export type FigureName = (typeof FIGURES)[number];
// `props`: optional objects a scene can switch on (a hot pan under the hand).
export const FIGURE_INFO: Record<FigureName, {pack: Pack; regions: readonly string[]; props?: readonly string[]}> = {
  brain: {pack: 'science', regions: ['frontal', 'parietal', 'temporal', 'occipital', 'cerebellum', 'stem', 'hippocampus']},
  neuron: {pack: 'science', regions: ['dendrites', 'soma', 'axon', 'myelin', 'node', 'terminals', 'gap', 'next']},
  body: {pack: 'science', regions: ['brain', 'cord', 'gate', 'hand', 'elbow', 'arm', 'fast', 'slow', 'leg', 'foot', 'pan'], props: ['pan']},
};

// Worlds for `shot` scenes (the documentary look, theme "film"): full-frame places the
// camera is inside of, drawn in src/worlds/. Each world knows a few named moments
// (`event` on a step: the cell fires, the vesicles release…) and named points a label can
// be pinned to (`label.anchor`).
export const WORLDS = ['network', 'neuron', 'soma', 'membrane', 'axon', 'synapse'] as const;
export type WorldName = (typeof WORLDS)[number];
export const WORLD_INFO: Record<WorldName, {pack: Pack; events: readonly string[]; anchors: readonly string[]}> = {
  network: {pack: 'science', events: ['cascade'], anchors: ['center']},
  neuron: {pack: 'science', events: ['dendrites', 'go', 'brake', 'soma', 'fire'], anchors: ['dendrites', 'soma', 'nucleus', 'axon', 'myelin', 'terminals']},
  soma: {pack: 'science', events: ['inputs', 'threshold', 'fire', 'weak'], anchors: ['soma', 'rest', 'threshold', 'spike']},
  membrane: {pack: 'science', events: ['sodium', 'potassium', 'repeat', 'pump'], anchors: ['outside', 'inside', 'sodium', 'potassium', 'pump', 'voltage']},
  axon: {pack: 'science', events: ['wave', 'race'], anchors: ['axon', 'myelin', 'node', 'fast', 'slow']},
  synapse: {pack: 'science', events: ['arrive', 'calcium', 'release', 'bind'], anchors: ['terminal', 'vesicles', 'calcium', 'gap', 'receptors', 'next']},
};
// How the camera moves through a shot (on top of the world's own framing).
export const CAMERA_MOVES = ['push', 'pull', 'drift', 'still'] as const;

export const COLORS = ['blue', 'green', 'orange', 'purple', 'red', 'yellow', 'teal', 'gray'] as const;
export type ColorName = (typeof COLORS)[number];

// Default card color per icon so the author rarely needs to choose one.
export const ICON_COLOR: Record<IconName, ColorName> = {...common.COLOR, ...tech.COLOR, ...science.COLOR, ...news.COLOR};

// Generic node status -> the illustration's own animated state, per icon.
export const ICON_STATES: Record<string, Partial<Record<IconName, string>>> = Object.fromEntries(
  ['idle', 'busy', 'ok', 'error', 'warn'].map((st) => [st, {...common.STATES[st], ...tech.STATES[st], ...science.STATES[st], ...news.STATES[st]}]),
);
export const ICON_DEFAULT_STATE: Partial<Record<IconName, string>> = {...common.DEFAULT_STATE, ...tech.DEFAULT_STATE, ...science.DEFAULT_STATE, ...news.DEFAULT_STATE};

export const TONES = ['good', 'bad', 'info', 'warn', 'neutral'] as const;
export type Tone = (typeof TONES)[number];

export const TONE_COLOR: Record<Tone, ColorName> = {
  good: 'green', bad: 'red', info: 'blue', warn: 'yellow', neutral: 'gray',
};

export const STATUSES = ['idle', 'busy', 'ok', 'error', 'warn'] as const;
export type Status = (typeof STATUSES)[number];

// Sound cues an author can put on a step, item or scene. The automatic sounds (pops,
// whooshes, error buzz, success chime) need no markup; these add meaning:
// cash = cost / money spent, clock = waiting / a timeout, notify = a notification,
// alarm = outage / incident, riser = tension right before a failure (ends on the cue),
// type = code being written. Use 1–3 per short video.
// spike = an electrode-style click with a low thump (a neuron fires), tick = a soft click
// (a small event: an input arrives, an ion passes). Worlds add these by themselves.
export const SFX = ['cash', 'clock', 'notify', 'alarm', 'riser', 'type', 'pop', 'whoosh', 'error', 'success', 'impact', 'spike', 'tick'] as const;
export type SfxName = (typeof SFX)[number];

export const CODE_LANGUAGES = ['ts', 'js', 'python', 'go', 'java', 'sql', 'bash', 'json', 'yaml', 'text'] as const;
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

export const LANGS = ['en', 'es', 'pt'] as const;
export type Lang = (typeof LANGS)[number];

// Looks. `light` = clean diagram (ByteByteGo-like), `dark` = editor (Fazt-like),
// `neon` = dark with glowing active paths (night-mode look for incidents and code).
// `film` = documentary: no header or progress bar, full-frame `shot` scenes, grain,
// vignette, a serif title card and plain subtitles (docs/FILM.md).
// `news` = broadcast look: channel bug, red title tabs, lower thirds, real footage
// (`media` scenes), maps and an optional ticker (docs/packs/news.md).
export const THEME_NAMES = ['light', 'dark', 'neon', 'film', 'news'] as const;
export type ThemeName = (typeof THEME_NAMES)[number];

// The story shape of a video (docs/SHAPES.md) and the kind of hook it opens with.
// Both are optional in the spec: they are recorded so `npm run fingerprint` can keep a
// channel from repeating itself, and so the reviewer knows which skeleton to expect.
export const SHAPES = ['progressive', 'post-mortem', 'request-journey', 'a-vs-b', 'numbers-first', 'code-first', 'news-report'] as const;
export type Shape = (typeof SHAPES)[number];
export const HOOKS = ['interview-question', 'incident', 'surprising-number', 'broken-thing', 'headline'] as const;
export type Hook = (typeof HOOKS)[number];

// How crowded a `crowd` is. The dots are a picture of load, not a count: the real
// number goes in the label ("×3.5B").
export const CROWD_DENSITY = ['few', 'many', 'flood'] as const;
export type CrowdDensity = (typeof CROWD_DENSITY)[number];
