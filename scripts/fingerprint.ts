// npm run fingerprint                          the recent videos and what has not been used lately
// npm run fingerprint -- videos/<pack>/<id>.json   also checks that spec against the last video
// Options: --last <id>   compare against this video instead of the most recent one
//          --all         list every video, not just the latest 10
//
// The variety guard of docs/SHAPES.md §4: a new video must differ from the previous one of
// its kind (long video, or Short of the same series) in at least 2 of 5 axes: shape, hook,
// theme, opening (first four scene types) and signature visuals. Reads the specs as plain
// JSON on purpose: it must work on half-written specs and costs nothing to run.
import fs from 'node:fs';
import path from 'node:path';

type Raw = Record<string, any>;

const SCENE_LETTER: Record<string, string> = {
  title: 'T', callout: 'C', board: 'B', flow: 'F', code: 'K', list: 'L',
  compare: 'X', summary: 'S', chart: 'H', figure: 'G', sequence: 'Q', shot: 'P',
  puzzle: 'Z', reveal: 'R', score: 'O',
};
const SHAPES = ['progressive', 'post-mortem', 'request-journey', 'a-vs-b', 'numbers-first', 'code-first', 'news-report', 'daily-puzzle'];
const HOOKS = ['interview-question', 'incident', 'surprising-number', 'broken-thing', 'headline', 'challenge'];
const THEMES = ['light', 'dark', 'neon', 'film'];
const VISUALS = ['crowd', 'meter', 'clock', 'sequence', 'code', 'chart', 'compare', 'flow'];
const SHORT_PATTERNS = ['classic', 'contrast', 'decision', 'timeline', 'code', 'crowd', 'levels', 'spot-the-mistake', 'choices', 'teaser'];
const SHORT_WORDS = 230; // about 75 s of speech: above this it is a long video

interface Print {
  file: string;
  id: string;
  series: string;
  mtime: number;
  short: boolean;
  lang: string;
  theme: string;
  shape: string; // a story shape (long) or a Short pattern
  shapeInferred: boolean;
  hook: string;
  hookInferred: boolean;
  pattern: string; // scene-type letters
  opening: string;
  visuals: string[];
  words: number;
}

const active = (v: unknown) => v !== undefined && v !== null && v !== false && v !== 'off' && v !== 'stop';

function visualsOf(spec: Raw): string[] {
  const found = new Set<string>();
  for (const sc of spec.scenes ?? []) {
    if (sc.type === 'sequence') found.add('sequence');
    if (sc.type === 'code') found.add('code');
    if (sc.type === 'chart') found.add('chart');
    if (sc.type === 'compare') found.add('compare');
    if (sc.type === 'flow') found.add('flow');
    for (const st of sc.steps ?? []) {
      if (active(st?.crowd)) found.add('crowd');
      if (st?.meter && Object.values(st.meter).some(active)) found.add('meter');
      if (st?.clock && Object.values(st.clock).some(active)) found.add('clock');
    }
  }
  return VISUALS.filter((v) => found.has(v));
}

function shortPattern(spec: Raw, visuals: string[]): string {
  const types = (spec.scenes ?? []).map((s: Raw) => s.type);
  // Daily puzzles (docs/packs/brain.md): the format of the episode.
  const puzzles = (spec.scenes ?? []).filter((s: Raw) => s.type === 'puzzle');
  if (puzzles.length) {
    if (puzzles.some((s: Raw) => s.tomorrow)) return 'teaser';
    if (puzzles.some((s: Raw) => s.claim)) return 'spot-the-mistake';
    if (puzzles.length >= 2) return 'levels';
    if (puzzles.some((s: Raw) => s.choices)) return 'choices';
  }
  if (types.includes('sequence')) return 'timeline';
  if (types.includes('code')) return 'code';
  if (types.includes('compare')) return 'contrast';
  if (types.includes('list') && types.includes('flow')) return 'decision';
  if (visuals.includes('crowd') && types.includes('callout')) return 'crowd';
  return 'classic';
}

function load(file: string): Print | null {
  let spec: Raw;
  try {
    spec = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
  if (!Array.isArray(spec.scenes)) return null;
  const scenes: Raw[] = spec.scenes;
  const id = String(spec.id ?? path.basename(file, '.json'));
  const words = scenes.reduce((a, s) => a + String(s.narration ?? '').split(/\s+/).filter(Boolean).length, 0);
  const letters = scenes.map((s) => SCENE_LETTER[s.type] ?? '?').join('');
  const short = /-short-/.test(id) || words < SHORT_WORDS;
  const visuals = visualsOf(spec);
  const first = scenes[0] ?? {};
  const callouts = scenes.filter((s) => s.type === 'callout').length;

  let shape: string;
  let shapeInferred = false;
  if (short) {
    shape = shortPattern(spec, visuals);
    shapeInferred = true; // Shorts have no spec field: the pattern is read from the scenes
  } else if (SHAPES.includes(spec.shape)) {
    shape = spec.shape;
  } else {
    shapeInferred = true;
    shape = callouts >= 2 && scenes.length >= 10 ? 'progressive' : 'unknown';
  }

  let hook: string;
  let hookInferred = false;
  if (HOOKS.includes(spec.hook)) {
    hook = spec.hook;
  } else {
    hookInferred = true;
    hook = /interview|entrevista|entrevistas/i.test(String(first.tag ?? '')) ? 'interview-question' : 'unknown';
  }

  return {
    file,
    id,
    series: id.includes('-short-') ? id.split('-short-')[0] : id,
    mtime: fs.statSync(file).mtimeMs,
    short,
    lang: String(spec.lang ?? 'en'),
    theme: THEMES.includes(spec.theme) ? spec.theme : 'light',
    shape,
    shapeInferred,
    hook,
    hookInferred,
    pattern: letters,
    opening: letters.slice(0, 4),
    visuals,
    words,
  };
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name.endsWith('.json')) out.push(p);
  }
  return out;
}

const args = process.argv.slice(2);
const flag = (n: string) => args.includes(n);
const lastIdx = args.indexOf('--last');
const lastId = lastIdx >= 0 ? args[lastIdx + 1] : undefined;
const target = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--last');

let prints = walk('videos').map(load).filter((p): p is Print => p !== null);
// A translation of a video is the same video: keep the original, drop "<id>-en" / "<id>-es" / "<id>-pt".
const ids = new Set(prints.map((p) => p.id));
prints = prints.filter((p) => {
  const m = p.id.match(/^(.*)-(en|es|pt)$/);
  return !(m && ids.has(m[1]));
});
prints.sort((a, b) => b.mtime - a.mtime || a.id.localeCompare(b.id));

const targetPath = target ? path.resolve(target) : undefined;
const mine = targetPath ? load(target!) : null;
if (target && !mine) {
  console.error(`✖ Cannot read ${target} as a video spec.`);
  process.exit(1);
}
const others = prints.filter((p) => !targetPath || path.resolve(p.file) !== targetPath);

// ---- the table -------------------------------------------------------------------------------
const mark = (v: string, inferred: boolean) => (inferred && v !== 'unknown' ? `${v}*` : v);
function row(p: Print) {
  return [
    (p.short ? 'short' : 'long').padEnd(5),
    p.id.slice(0, 34).padEnd(34),
    mark(p.shape, p.shapeInferred).padEnd(17),
    mark(p.hook, p.hookInferred).padEnd(19),
    p.theme.padEnd(6),
    p.opening.padEnd(4),
    p.visuals.join(',') || '-',
  ].join('  ');
}
const header = ['kind '.padEnd(5), 'id'.padEnd(34), 'shape/pattern'.padEnd(17), 'hook'.padEnd(19), 'theme'.padEnd(6), 'open'.padEnd(4), 'signature visuals'].join('  ');

const shown = flag('--all') ? prints : prints.slice(0, 10);
console.log('\nRecent videos (newest first; * = inferred from the scenes, set "shape"/"hook" in the spec to make it exact):\n');
console.log(header);
for (const p of shown) console.log(row(p));
if (prints.length > shown.length) console.log(`… ${prints.length - shown.length} older (use --all)`);

// ---- what has not been used lately -----------------------------------------------------------
const recentLong = others.filter((p) => !p.short).slice(0, 4);
const used = <T extends string>(pick: (p: Print) => T[]) => new Set(recentLong.flatMap(pick));
const unusedList = (all: string[], u: Set<string>) => all.filter((x) => !u.has(x));
if (recentLong.length) {
  console.log(`\nNot used in the last ${recentLong.length} long video(s):`);
  console.log(`  shapes   : ${unusedList(SHAPES, used((p) => [p.shape])).join(', ') || '(all used)'}`);
  console.log(`  hooks    : ${unusedList(HOOKS, used((p) => [p.hook])).join(', ') || '(all used)'}`);
  console.log(`  themes   : ${unusedList(THEMES, used((p) => [p.theme])).join(', ') || '(all used)'}`);
  console.log(`  visuals  : ${unusedList(VISUALS, used((p) => p.visuals)).join(', ') || '(all used)'}`);
}
const recentShorts = others.filter((p) => p.short).slice(0, 6);
if (recentShorts.length) {
  const u = new Set(recentShorts.map((p) => p.shape));
  console.log(`  short patterns not used in the last ${recentShorts.length} Short(s): ${unusedList(SHORT_PATTERNS, u).join(', ') || '(all used)'}`);
}

// ---- the check -------------------------------------------------------------------------------
if (mine) {
  const pool = others.filter((p) => p.short === mine.short && (!mine.short || p.series === mine.series));
  const prev = lastId ? pool.find((p) => p.id === lastId) ?? others.find((p) => p.id === lastId) : pool[0];
  console.log(`\nChecking ${mine.id} (${mine.short ? 'Short' : 'long video'}):`);
  console.log(header);
  console.log(row(mine));
  if (!prev) {
    console.log(`\n✔ No earlier ${mine.short ? 'Short in this series' : 'long video'} to compare against.`);
    process.exit(0);
  }
  console.log(`Compared with the previous one: ${prev.id}`);
  console.log(row(prev));

  const known = (a: string, b: string) => a !== 'unknown' && b !== 'unknown';
  const newVisuals = mine.visuals.filter((v) => !prev.visuals.includes(v));
  const axes: [string, boolean, string][] = [
    [mine.short ? 'pattern' : 'shape', known(mine.shape, prev.shape) && mine.shape !== prev.shape, `${prev.shape} → ${mine.shape}`],
    ['hook', known(mine.hook, prev.hook) && mine.hook !== prev.hook, `${prev.hook} → ${mine.hook}`],
    ['theme', mine.theme !== prev.theme, `${prev.theme} → ${mine.theme}`],
    ['opening', mine.opening !== prev.opening, `${prev.opening} → ${mine.opening}`],
    ['visuals', newVisuals.length > 0, newVisuals.length ? `new: ${newVisuals.join(', ')}` : 'nothing new'],
  ];
  console.log('');
  for (const [name, differs, detail] of axes) console.log(`  ${differs ? '✔ differs' : '· same   '}  ${name.padEnd(8)} ${detail}`);
  const differing = axes.filter(([, d]) => d).length;
  const unknowns = [mine, prev].some((p) => p.shape === 'unknown' || p.hook === 'unknown');
  if (differing >= 2) {
    console.log(`\n✔ ${differing} of 5 axes differ from ${prev.id} (2 needed).`);
  } else {
    const cheapest = axes.filter(([n, d]) => !d && (n === 'hook' || n === 'visuals' || n === 'theme')).map(([n]) => n);
    console.log(`\n⚠ Only ${differing} of 5 axes differ from ${prev.id}; docs/SHAPES.md §4 asks for 2.`);
    if (cheapest.length) console.log(`  Cheapest changes: ${cheapest.join(', ')}.`);
    if (mine.shape === prev.shape && !mine.short) {
      console.log('  Same shape twice in a row: change at least the hook and one signature visual, and say so in the draft.');
    }
    process.exitCode = 0; // a warning, never a failure: the topic may truly demand it
  }
  if (unknowns) console.log('  (A shape or hook is unknown for one of the two; set "shape" and "hook" in the specs for an exact check.)');
}
console.log('');
