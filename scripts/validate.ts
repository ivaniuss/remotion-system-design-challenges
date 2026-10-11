// npm run validate -- videos/<pack>/<id>.json [more.json ...]
// Checks a spec without rendering: schema, ids, cue phrases, and estimated length.
import {loadSpec} from './lib/spec';
import {buildTimeline, estimateSpeech} from '../src/timeline/timeline';

const files = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!files.length) {
  console.error('Usage: npm run validate -- videos/<pack>/<id>.json');
  process.exit(1);
}
for (const f of files) {
  const spec = loadSpec(f);
  const {timeline} = buildTimeline(spec, estimateSpeech(spec));
  const words = spec.scenes.reduce((a, s) => a + s.narration.split(/\s+/).length, 0);
  console.log(`✔ ${f}: ${spec.scenes.length} scenes, ${words} words, ~${timeline.duration.toFixed(0)} s (estimated)`);
}
