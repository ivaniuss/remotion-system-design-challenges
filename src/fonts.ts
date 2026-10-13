import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Fonts ship with the project (public/fonts) so renders look identical everywhere
// and never depend on the network.
const FILES: {family: string; file: string; weight: string; style?: string}[] = [
  ...['400', '500', '600', '700', '800', '900'].map((w) => ({family: 'Inter', file: `inter-latin-${w}-normal.woff2`, weight: w})),
  ...['400', '500', '700'].map((w) => ({family: 'JetBrains Mono', file: `jetbrains-mono-latin-${w}-normal.woff2`, weight: w})),
  // Title cards of the film look (SIL Open Font License, public/fonts/OFL-instrument-serif.txt).
  {family: 'Instrument Serif', file: 'instrument-serif-latin-400-normal.woff2', weight: '400'},
  {family: 'Instrument Serif', file: 'instrument-serif-latin-400-italic.woff2', weight: '400', style: 'italic'},
];

for (const f of FILES) {
  loadFont({family: f.family, url: staticFile(`fonts/${f.file}`), weight: f.weight, style: f.style ?? 'normal', format: 'woff2'}).catch((err) => {
    console.error(`Could not load font ${f.file}`, err);
  });
}
