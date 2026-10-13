import type {ColorName, ThemeName, Tone} from './spec/vocab';
import {TONE_COLOR} from './spec/vocab';

// Three looks: `light` (clean diagram style, ByteByteGo-like), `dark` (editor style,
// Fazt-like) and `neon` (night mode: dark with glowing active paths and cards).
// light/dark are flat colors with depth from hard offset shadows; neon swaps the hard
// shadow for a glow.

export type Swatch = {fill: string; stroke: string; tile: string; text: string};

export type Theme = {
  name: ThemeName;
  glow: boolean; // draw soft glows on cards, active paths and packets (neon)
  shadowOpacity: number; // opacity of the hard offset shadow under cards
  bg: string;
  dots: string;
  surface: string; // cards
  surfaceAlt: string; // rows, panels
  border: string;
  text: string;
  textSoft: string;
  edge: string; // arrows
  accent: string; // highlights, active elements
  accentText: string; // text drawn on top of `accent`
  shadow: string; // hard shadow under cards
  colors: Record<ColorName, Swatch>;
  editor: {bg: string; bar: string; gutter: string; text: string; highlight: string};
};

export const FONT = {
  sans: '"Inter", system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace',
  // Title cards of the film look.
  display: '"Instrument Serif", Georgia, "Times New Roman", serif',
};

const STROKES: Record<ColorName, string> = {
  blue: '#2F6FEB',
  green: '#1F9D57',
  orange: '#EA7A1A',
  purple: '#7C4DFF',
  red: '#E5484D',
  yellow: '#D69E00',
  teal: '#0E9AA7',
  gray: '#6B7280',
};

const LIGHT_FILLS: Record<ColorName, string> = {
  blue: '#E3EDFF',
  green: '#DDF4E6',
  orange: '#FFEBD9',
  purple: '#EEE6FF',
  red: '#FFE3E1',
  yellow: '#FFF3C7',
  teal: '#D9F3F4',
  gray: '#EEF0F4',
};

const DARK_FILLS: Record<ColorName, string> = {
  blue: '#14254A',
  green: '#11331F',
  orange: '#3A2412',
  purple: '#271B4A',
  red: '#3D1719',
  yellow: '#352B0B',
  teal: '#0D3135',
  gray: '#22272E',
};

const swatches = (fills: Record<ColorName, string>, text: string) =>
  Object.fromEntries(
    (Object.keys(STROKES) as ColorName[]).map((c) => [c, {fill: fills[c], stroke: STROKES[c], tile: LIGHT_FILLS[c], text}]),
  ) as Record<ColorName, Swatch>;

const EDITOR = {bg: '#1E222A', bar: '#272C35', gutter: '#5C6370', text: '#E6EDF3', highlight: 'rgba(255, 212, 59, 0.16)'};

export const light: Theme = {
  name: 'light',
  glow: false,
  shadowOpacity: 1,
  bg: '#F5F6FA',
  dots: '#D9DEE8',
  surface: '#FFFFFF',
  surfaceAlt: '#FFFFFF',
  border: '#1B2130',
  text: '#121826',
  textSoft: '#5B6476',
  edge: '#2B3445',
  accent: '#FFC933',
  accentText: '#121826',
  shadow: '#1B2130',
  colors: swatches(LIGHT_FILLS, '#121826'),
  editor: EDITOR,
};

export const dark: Theme = {
  name: 'dark',
  glow: false,
  shadowOpacity: 0.6,
  bg: '#0D1117',
  dots: '#1B2230',
  surface: '#161B22',
  surfaceAlt: '#1C222B',
  border: '#3A4452',
  text: '#E6EDF3',
  textSoft: '#8B96A5',
  edge: '#8B96A5',
  accent: '#FFD43B',
  accentText: '#0D1117',
  shadow: '#000000',
  colors: swatches(DARK_FILLS, '#E6EDF3'),
  editor: {...EDITOR, bg: '#161B22', bar: '#1F252E'},
};

// Neon: bright strokes on deep navy. Fills stay dark and tinted so the glow carries the color.
const NEON_STROKES: Record<ColorName, string> = {
  blue: '#4DA3FF',
  green: '#3DF5A0',
  orange: '#FFA94D',
  purple: '#B58CFF',
  red: '#FF5A6E',
  yellow: '#FFE14D',
  teal: '#2EF2E0',
  gray: '#8FA3C4',
};
const NEON_FILLS: Record<ColorName, string> = {
  blue: '#0E2142',
  green: '#0B3023',
  orange: '#3A2310',
  purple: '#251A47',
  red: '#3E1220',
  yellow: '#363006',
  teal: '#08302F',
  gray: '#1B2333',
};

export const neon: Theme = {
  name: 'neon',
  glow: true,
  shadowOpacity: 0,
  bg: '#070B14',
  dots: '#131B2D',
  surface: '#0F1626',
  surfaceAlt: '#141D33',
  border: '#2B3A5C',
  text: '#EAF2FF',
  textSoft: '#8FA3C4',
  edge: '#4B6A9B',
  accent: '#3CE8FF',
  accentText: '#04121A',
  shadow: '#000000',
  colors: Object.fromEntries(
    (Object.keys(NEON_STROKES) as ColorName[]).map((c) => [c, {fill: NEON_FILLS[c], stroke: NEON_STROKES[c], tile: LIGHT_FILLS[c], text: '#EAF2FF'}]),
  ) as Record<ColorName, Swatch>,
  editor: {...EDITOR, bg: '#0B1220', bar: '#111A2E'},
};

// Film: the documentary look. Near-black with a violet cast, warm amber for the one thing
// that matters (the spark), no hard shadows. Built for `shot` scenes, which draw their own
// world full-frame; the other scene types still render, on the dark palette.
export const film: Theme = {
  ...dark,
  name: 'film',
  glow: false,
  shadowOpacity: 0,
  bg: '#05040B',
  dots: '#14122A',
  surface: '#110F22',
  surfaceAlt: '#16142E',
  border: '#2C2850',
  text: '#EFEAF8',
  textSoft: '#A49FC4',
  edge: '#6E64A8',
  accent: '#FFC35A',
  accentText: '#1A1206',
};

// News: the broadcast look. Deep navy, white type, a red brand color for the bug, the title
// tabs and lower thirds, flat cards (no hard shadows). Diagram scenes (flow, chart, list…)
// render on this palette too, so a report mixes footage, maps and diagrams in one look.
const NEWS_FILLS: Record<ColorName, string> = {
  blue: '#13294F',
  green: '#0F3524',
  orange: '#3D2610',
  purple: '#28204F',
  red: '#46141C',
  yellow: '#3A300C',
  teal: '#0C3337',
  gray: '#1C2638',
};
export const news: Theme = {
  name: 'news',
  glow: false,
  shadowOpacity: 0,
  bg: '#0A1426',
  dots: '#16233D',
  surface: '#111E36',
  surfaceAlt: '#172744',
  border: '#2B3E63',
  text: '#F4F7FC',
  textSoft: '#9DB0CF',
  edge: '#7F95BC',
  accent: '#E5202E',
  accentText: '#FFFFFF',
  shadow: '#000000',
  colors: swatches(NEWS_FILLS, '#F4F7FC'),
  editor: {...EDITOR, bg: '#0E1A30', bar: '#14223D'},
};

// Extra colors of the broadcast look (bug, tabs, lower thirds, ticker).
export const NEWS = {
  red: '#E5202E',
  redDark: '#A3121C',
  ink: '#0A1426',
  band: 'rgba(7, 14, 28, 0.86)',
  white: '#FFFFFF',
  gold: '#FFC933',
};

export const THEMES = {light, dark, neon, film, news};
export const themeFor = (name: string): Theme =>
  name === 'news' ? news : name === 'film' ? film : name === 'neon' ? neon : name === 'dark' ? dark : light;
export const toneSwatch = (theme: Theme, tone: Tone) => theme.colors[TONE_COLOR[tone]];
