import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import type {VideoSpec} from '../../src/spec/schema';
import {estimateSpeech, holdAfter, MIN_SCENE, SceneSpeech, Speech} from '../../src/timeline/timeline';
import {alignToTranscript, round, splitWords, Word} from '../../src/timeline/words';

// Speech providers. Each returns scene start/duration, word timings and audio clips.

const LEAD_IN = 0.15; // silence before each scene's voice
const TAIL = 0.45; // breathing room after each scene's voice

export function audioDuration(file: string): number | null {
  try {
    const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], {encoding: 'utf8'});
    const d = parseFloat(out.trim());
    return Number.isFinite(d) ? d : null;
  } catch {
    return null;
  }
}

export function edgeAvailable(python: string): boolean {
  const r = spawnSync(python, ['-c', 'import edge_tts'], {stdio: 'ignore'});
  return r.status === 0;
}

// Script words with the timings of the spoken words (keeps the script's punctuation
// and spelling for captions and cue matching).
function scriptWords(narration: string, spoken: Word[]): Word[] {
  const script = splitWords(narration);
  const times = alignToTranscript(script, spoken);
  return script.map((w, i) => ({w, start: round(times[i].start), end: round(times[i].end)}));
}

export function edgeSpeech(spec: VideoSpec, outDir: string, publicPrefix: string, voice: string, rate: string, python: string): Speech {
  const jobs = spec.scenes.map((sc, i) => {
    const n = String(i + 1).padStart(2, '0');
    return {text: sc.narration.replace(/\*/g, ''), voice, rate, out: path.join(outDir, `scene-${n}.mp3`), words: path.join(outDir, `scene-${n}.words.json`)};
  });
  const jobsFile = path.join(outDir, 'tts-jobs.json');
  fs.writeFileSync(jobsFile, JSON.stringify(jobs, null, 2));
  const r = spawnSync(python, [path.join('scripts', 'tts_edge.py'), jobsFile], {stdio: 'inherit'});
  if (r.status !== 0) throw new Error('edge-tts failed (see the message above).');

  const warnings: string[] = [];
  let t = 0;
  const scenes: SceneSpeech[] = [];
  const audio = [];
  for (let i = 0; i < spec.scenes.length; i++) {
    const sc = spec.scenes[i];
    const job = jobs[i];
    const spoken: Word[] = JSON.parse(fs.readFileSync(job.words, 'utf8'));
    if (!spoken.length) warnings.push(`scene ${i + 1}: edge-tts returned no word timings; captions use estimates.`);
    const voiceLen = audioDuration(job.out) ?? (spoken.length ? spoken[spoken.length - 1].end + 0.3 : 2);
    const words = scriptWords(sc.narration, spoken).map((w) => ({w: w.w, start: round(w.start + LEAD_IN), end: round(w.end + LEAD_IN)}));
    const duration = round(Math.max(MIN_SCENE[sc.type], LEAD_IN + voiceLen + TAIL) + holdAfter(sc));
    scenes.push({start: round(t), duration, words});
    audio.push({src: `${publicPrefix}/${path.basename(job.out)}`, start: round(t + LEAD_IN)});
    t += duration;
  }
  return {scenes, audio, warnings};
}

// Your own recording of the whole script + word timings (e.g. from Whisper).
// Accepts [{w|word|text, start, end}], {words: [...]}, or Whisper's {segments: [{words}]}.
export function loadTranscript(file: string): Word[] {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  let list: Record<string, unknown>[] = [];
  if (Array.isArray(raw)) list = raw;
  else if (Array.isArray(raw.words)) list = raw.words;
  else if (Array.isArray(raw.segments)) list = raw.segments.flatMap((s: {words?: unknown[]}) => s.words ?? []);
  const out: Word[] = [];
  for (const x of list) {
    const w = String(x.w ?? x.word ?? x.text ?? '').trim();
    const start = Number(x.start);
    const end = Number(x.end);
    if (w && Number.isFinite(start) && Number.isFinite(end)) out.push({w, start, end});
  }
  if (!out.length) throw new Error(`No word timings found in ${file}. Expected [{"w","start","end"}] or Whisper JSON with word timestamps.`);
  return out;
}

export function recordedSpeech(spec: VideoSpec, audioFile: string, wordsFile: string, outDir: string, publicPrefix: string): Speech {
  const transcript = loadTranscript(wordsFile);
  const perScene = spec.scenes.map((s) => splitWords(s.narration));
  const flat = perScene.flat();
  const times = alignToTranscript(flat, transcript);
  const target = path.join(outDir, `voice${path.extname(audioFile) || '.mp3'}`);
  fs.copyFileSync(audioFile, target);

  const starts: number[] = [];
  let k = 0;
  for (let i = 0; i < perScene.length; i++) {
    const first = times[k]?.start ?? 0;
    starts.push(i === 0 ? 0 : Math.max(starts[i - 1] + 1, first - 0.3));
    k += perScene[i].length;
  }
  const total = (audioDuration(audioFile) ?? transcript[transcript.length - 1].end) + 1.0;
  const scenes: SceneSpeech[] = [];
  k = 0;
  for (let i = 0; i < perScene.length; i++) {
    const start = starts[i];
    const end = i + 1 < perScene.length ? starts[i + 1] : Math.max(total, start + MIN_SCENE[spec.scenes[i].type]);
    const words = perScene[i].map((w, j) => ({w, start: round(times[k + j].start - start), end: round(times[k + j].end - start)}));
    k += perScene[i].length;
    scenes.push({start: round(start), duration: round(end - start), words});
  }
  return {scenes, audio: [{src: `${publicPrefix}/${path.basename(target)}`, start: 0}], warnings: []};
}

export {estimateSpeech};
