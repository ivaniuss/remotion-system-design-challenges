// One command from spec to MP4:
//   npm run make -- videos/tech/my-video.json [--voice auto|edge|none] [--format vertical|horizontal|both]
//                                        [--audio my-voice.mp3 --words my-voice.words.json] [--no-render]
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {loadConfig} from './lib/config';
import {loadSpec} from './lib/spec';
import {edgeAvailable, edgeSpeech, estimateSpeech, recordedSpeech} from './lib/speech';
import {buildTimeline, Speech} from '../src/timeline/timeline';
import {scriptMarkdown} from './lib/script';
import {youtubeMarkdown} from './lib/youtube';

const args = process.argv.slice(2);
const opt = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const specFile = args.find((a) => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--'));
if (!specFile) {
  console.error('Usage: npm run make -- videos/<pack>/<id>.json [--voice auto|edge|none] [--format vertical|horizontal|both] [--audio file --words file] [--no-render]');
  process.exit(1);
}

const spec = loadSpec(specFile);
const config = loadConfig(process.cwd(), spec.pack);
const publicPrefix = `generated/${spec.id}`;
const outDir = path.join('public', publicPrefix);
fs.rmSync(outDir, {recursive: true, force: true});
fs.mkdirSync(outDir, {recursive: true});

// 1. Voice
const audioArg = opt('--audio');
const wordsArg = opt('--words');
let mode = (opt('--voice') ?? config.voice.mode) as 'auto' | 'edge' | 'none';
let speech: Speech;
if (audioArg || wordsArg) {
  if (!audioArg || !wordsArg) {
    console.error('✖ --audio and --words go together (record your voice, then get word timings with Whisper).');
    process.exit(1);
  }
  console.log(`▸ Voice: your recording (${audioArg})`);
  speech = recordedSpeech(spec, audioArg, wordsArg, outDir, publicPrefix);
} else {
  if (mode === 'auto') mode = edgeAvailable(config.python) ? 'edge' : 'none';
  if (mode === 'edge') {
    if (!edgeAvailable(config.python)) {
      console.error('✖ edge-tts is not installed. Run: pip install edge-tts   (or use --voice none)');
      process.exit(1);
    }
    const voice = spec.voice ?? config.voice.voices[spec.lang] ?? config.voice.voices.en;
    console.log(`▸ Voice: edge-tts ${voice} (${config.voice.rate})`);
    try {
      speech = edgeSpeech(spec, outDir, publicPrefix, voice, config.voice.rate, config.python);
    } catch (err) {
      console.error(`✖ ${(err as Error).message}\n  Tip: --voice none renders a silent video with estimated timings.`);
      process.exit(1);
    }
  } else {
    console.log('▸ Voice: none (silent video, estimated timings — record your voice later)');
    speech = estimateSpeech(spec);
  }
}

// 2. Timeline
let music = null;
if (config.music) {
  if (fs.existsSync(path.join('public', config.music.file))) music = {src: config.music.file, volume: config.music.volume ?? 0.12};
  else console.log(`  ⚠ music: public/${config.music.file} not found; rendering without music.`);
}
const {timeline, warnings} = buildTimeline(spec, speech, {handle: config.handle, cta: config.cta, captions: config.captions, sfx: config.sfx, music});
for (const w of warnings) console.log(`  ⚠ ${w}`);
console.log(`▸ ${timeline.scenes.length} scenes, ${timeline.duration.toFixed(1)} s`);
for (const s of timeline.scenes) {
  const label = s.type === 'title' ? s.heading : s.type === 'callout' ? s.text : s.title ?? '';
  console.log(`  ${String(s.index + 1).padStart(2)}  ${s.start.toFixed(1).padStart(6)}s  ${s.duration.toFixed(1).padStart(5)}s  ${s.type.padEnd(8)} ${label.replace(/\*/g, '')}`);
}
const tlFile = path.join(outDir, 'timeline.json');
fs.writeFileSync(tlFile, JSON.stringify(timeline, null, 2));
fs.mkdirSync('src/generated', {recursive: true});
fs.writeFileSync('src/generated/preview.json', JSON.stringify(timeline, null, 2));
console.log(`✔ Timeline: ${tlFile} (also loaded by \`npm run dev\`)`);
// Every output of one video lives in out/<id>/; files are named by theme and format.
const vidOut = path.join('out', spec.id);
fs.mkdirSync(vidOut, {recursive: true});
const scriptFile = path.join(vidOut, 'script.md');
fs.writeFileSync(scriptFile, scriptMarkdown(spec, timeline, timeline.audio.length > 0));
console.log(`✔ Script: ${scriptFile} (narration, what is on screen, talking points)`);
const ytFile = path.join(vidOut, 'youtube.md');
fs.writeFileSync(ytFile, youtubeMarkdown(spec, timeline, timeline.audio.length > 0));
console.log(`✔ YouTube: ${ytFile} (titles, description and chapters to paste)`);

// 3. Render
if (args.includes('--no-render')) process.exit(0);
const fmtArg = opt('--format');
const formats = fmtArg === 'both' ? ['vertical', 'horizontal'] : fmtArg ? [fmtArg] : config.formats;
fs.mkdirSync(vidOut, {recursive: true});
const bin = path.join('node_modules', '.bin', process.platform === 'win32' ? 'remotion.cmd' : 'remotion');
for (const format of formats) {
  if (format !== 'vertical' && format !== 'horizontal') {
    console.error(`✖ Unknown format "${format}" (use vertical, horizontal or both).`);
    process.exit(1);
  }
  const propsFile = path.join(outDir, `props.${format}.json`);
  fs.writeFileSync(propsFile, JSON.stringify({...timeline, format}));
  const comp = format === 'vertical' ? 'Vertical' : 'Horizontal';
  const out = path.join(vidOut, `${spec.theme}.${format}.mp4`);
  console.log(`▸ Rendering ${out}`);
  const r = spawnSync(bin, ['render', 'src/index.ts', comp, out, `--props=${propsFile}`], {stdio: 'inherit'});
  if (r.status !== 0) {
    console.error(`✖ Render failed for ${format}.`);
    process.exit(r.status ?? 1);
  }
  console.log(`✔ ${out}`);
}
