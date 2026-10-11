// npm run stills -- videos/<pack>/<id>.json [--format vertical|horizontal|both] [--every 3]
// A quick visual check without rendering the whole video (seconds instead of minutes):
// renders one small frame every N seconds of the timeline and, when ffmpeg is installed,
// tiles them into a contact sheet: out/<id>/<theme>.<format>.sheet.png.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const args = process.argv.slice(2);
const opt = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const specFile = args.find((a) => a.endsWith('.json'));
if (!specFile) {
  console.error('Usage: npm run stills -- videos/<pack>/<id>.json [--format vertical|horizontal|both] [--every 3]');
  process.exit(1);
}
const id = JSON.parse(fs.readFileSync(specFile, 'utf8')).id as string;
const tlFile = path.join('public', 'generated', id, 'timeline.json');

// Rebuild the timeline when it is missing or older than the spec (silent: fast).
const stale = !fs.existsSync(tlFile) || fs.statSync(tlFile).mtimeMs < fs.statSync(specFile).mtimeMs;
if (stale) {
  const tsx = path.join('node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');
  const r = spawnSync(tsx, ['scripts/make.ts', specFile, '--no-render', '--voice', opt('--voice') ?? 'none'], {stdio: 'inherit'});
  if (r.status !== 0) process.exit(r.status ?? 1);
}
const tl = JSON.parse(fs.readFileSync(tlFile, 'utf8'));
const every = Number(opt('--every') ?? 3);
const fmt = opt('--format') ?? 'both';
const formats = fmt === 'both' ? ['vertical', 'horizontal'] : [fmt];
const hasFfmpeg = spawnSync('ffmpeg', ['-version'], {stdio: 'ignore'}).status === 0;
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || null;

console.log('▸ Bundling…');
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
for (const format of formats) {
  const comp = format === 'vertical' ? 'Vertical' : 'Horizontal';
  const props = {...tl, format};
  const composition = await selectComposition({serveUrl, id: comp, inputProps: props, browserExecutable});
  const dir = path.join('out', id, 'stills', `${tl.theme}.${format}`);
  fs.rmSync(dir, {recursive: true, force: true});
  fs.mkdirSync(dir, {recursive: true});
  const times: number[] = [];
  for (let t = 0; t < tl.duration - 0.2; t += every) times.push(t);
  for (const [i, t] of times.entries()) {
    const out = path.join(dir, `${String(i).padStart(3, '0')}.png`);
    await renderStill({composition, serveUrl, output: out, frame: Math.round(t * tl.fps), inputProps: props, browserExecutable, scale: format === 'vertical' ? 0.3 : 0.25});
    process.stdout.write(`\r▸ ${format}: ${i + 1}/${times.length} frames`);
  }
  process.stdout.write('\n');
  if (hasFfmpeg) {
    const cols = format === 'vertical' ? 8 : 5;
    const rows = Math.ceil(times.length / cols);
    const sheet = path.join('out', id, `${tl.theme}.${format}.sheet.png`);
    const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(dir, '%03d.png'), '-vf', `tile=${cols}x${rows}:padding=6:color=white`, '-frames:v', '1', sheet]);
    console.log(r.status === 0 ? `✔ ${sheet} (one frame every ${every} s)` : `✔ frames in ${dir}`);
  } else {
    console.log(`✔ frames in ${dir} (install ffmpeg to get a single contact sheet)`);
  }
}
