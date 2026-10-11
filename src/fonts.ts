import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Fonts ship with the project (public/fonts) so renders look identical everywhere
// and never depend on the network.
const FILES: {family: string; file: string; weight: string}[] = [
  ...['400', '500', '600', '700', '800', '900'].map((w) => ({family: 'Inter', file: `inter-latin-${w}-normal.woff2`, weight: w})),
  ...['400', '500', '700'].map((w) => ({family: 'JetBrains Mono', file: `jetbrains-mono-latin-${w}-normal.woff2`, weight: w})),
];

for (const f of FILES) {
  loadFont({family: f.family, url: staticFile(`fonts/${f.file}`), weight: f.weight, format: 'woff2'}).catch((err) => {
    console.error(`Could not load font ${f.file}`, err);
  });
}
