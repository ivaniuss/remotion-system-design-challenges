// npm run preview -- videos/<pack>/<id>.json [--voice auto|edge|none] [--audio f --words f] [--no-studio]
// The fast way to review a video: builds the timeline (with the real voice when edge-tts
// is installed, plus out/<id>/script.md) and opens Remotion Studio in the browser.
// No render needed. After editing the spec, run it again with --no-studio while the
// Studio is open: it reloads by itself. Render the MP4s with `npm run make` when happy.
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const args = process.argv.slice(2);
if (!args.some((a) => a.endsWith('.json'))) {
  console.error('Usage: npm run preview -- videos/<pack>/<id>.json [--voice auto|edge|none] [--no-studio]');
  process.exit(1);
}
const bin = (name: string) => path.join('node_modules', '.bin', process.platform === 'win32' ? `${name}.cmd` : name);
const makeArgs = args.filter((a) => a !== '--no-studio' && a !== '--no-render');
const made = spawnSync(bin('tsx'), ['scripts/make.ts', ...makeArgs, '--no-render'], {stdio: 'inherit'});
if (made.status !== 0) process.exit(made.status ?? 1);
if (args.includes('--no-studio')) {
  console.log('✔ Timeline updated. An open Remotion Studio reloads by itself.');
  process.exit(0);
}
console.log('▸ Opening Remotion Studio (compositions "Vertical" and "Horizontal"). Ctrl+C to stop.');
const studio = spawnSync(bin('remotion'), ['studio', 'src/index.ts'], {stdio: 'inherit'});
process.exit(studio.status ?? 0);
