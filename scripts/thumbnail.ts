// npm run thumbnail -- videos/<pack>/<id>.json
// Renders only the thumbnail and the Short cover (a few seconds):
// out/<id>/<theme>.thumbnail.png (1280×720) and out/<id>/<theme>.cover.png (1080×1920).
// `make` and `stills` render them too.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {renderThumbnails} from './lib/thumbs';

const args = process.argv.slice(2);
const specFile = args.find((a) => a.endsWith('.json'));
if (!specFile) {
  console.error('Usage: npm run thumbnail -- videos/<pack>/<id>.json');
  process.exit(1);
}
const id = JSON.parse(fs.readFileSync(specFile, 'utf8')).id as string;
const tlFile = path.join('public', 'generated', id, 'timeline.json');
// Rebuild the timeline (silent, fast) when it is missing or older than the spec.
if (!fs.existsSync(tlFile) || fs.statSync(tlFile).mtimeMs < fs.statSync(specFile).mtimeMs) {
  const tsx = path.join('node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');
  const r = spawnSync(tsx, ['scripts/make.ts', specFile, '--no-render', '--voice', 'none'], {stdio: 'inherit'});
  if (r.status !== 0) process.exit(r.status ?? 1);
}
const tl = JSON.parse(fs.readFileSync(tlFile, 'utf8'));
fs.mkdirSync(path.join('out', id), {recursive: true});
console.log('▸ Bundling…');
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
for (const f of await renderThumbnails(serveUrl, tl, process.env.REMOTION_BROWSER_EXECUTABLE || null)) console.log(`✔ ${f}`);
