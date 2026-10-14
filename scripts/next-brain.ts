// npm run next            the Daily Brain episodes written so far and which one comes next
// Reads videos/brain/brain-NNN-*.json (what is written) and out/<id>/ (what is rendered on this
// computer). The format of each episode follows from its number (EPISODE_CYCLE in
// src/packs/brain/vocab.ts, docs/packs/brain.md §7), so the order never depends on dates.
// Whether an episode is published lives in the tracker, not here.
import fs from 'node:fs';
import path from 'node:path';
import {cycleSlot, EPISODE_CYCLE, type EpisodeFormat} from '../src/packs/brain/vocab';

type Raw = Record<string, any>;
const DIR = path.join('videos', 'brain');

// The format an episode actually has, read from its scenes.
function formatOf(spec: Raw): EpisodeFormat | 'other' {
  const scenes: Raw[] = spec.scenes ?? [];
  const puzzles = scenes.filter((s) => s.type === 'puzzle');
  if (puzzles.some((s) => s.tomorrow)) return 'answer-tomorrow';
  if (scenes[0]?.type === 'reveal' && puzzles.length) return 'reveal-levels';
  if (puzzles.some((s) => s.claim)) return 'spot-the-mistake';
  if (puzzles.length >= 2) return 'levels';
  if (puzzles.some((s) => s.choices)) return 'answer-fast';
  if (puzzles.some((s) => s.pause)) return 'hard';
  return 'other';
}

const label = (f: EpisodeFormat | 'other') => EPISODE_CYCLE.find((c) => c.format === f)?.label ?? 'other';

const episodes = (fs.existsSync(DIR) ? fs.readdirSync(DIR) : [])
  .map((f) => /^brain-(\d{3})-.+\.json$/.exec(f))
  .filter((m): m is RegExpExecArray => !!m)
  .map((m) => {
    const file = path.join(DIR, m[0]);
    const spec: Raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    const id = String(spec.id ?? m[0].replace(/\.json$/, ''));
    const outDir = path.join('out', id);
    const mp4 = fs.existsSync(outDir) ? fs.readdirSync(outDir).filter((f) => f.endsWith('.mp4')) : [];
    return {n: Number(m[1]), id, theme: String(spec.theme ?? 'light'), format: formatOf(spec), rendered: mp4.map((f) => f.split('.').slice(-2, -1)[0]).join(', ')};
  })
  .sort((a, b) => a.n - b.n);

console.log(`Daily Brain episodes in ${DIR}/ (format from the scenes, rendered = MP4 in out/ on this computer)\n`);
const warnings: string[] = [];
for (const e of episodes) {
  const slot = cycleSlot(e.n);
  const ok = e.format === slot.format;
  if (!ok) warnings.push(`${String(e.n).padStart(3, '0')} is "${label(e.format)}" but its slot in the cycle is "${slot.label}".`);
  console.log(
    `  ${String(e.n).padStart(3, '0')}  ${e.id.padEnd(34)} ${label(e.format).padEnd(30)} ${e.theme.padEnd(6)} ${e.rendered ? `rendered (${e.rendered})` : 'written, not rendered'}${ok ? '' : '  ⚠'}`,
  );
}
if (!episodes.length) console.log('  (none yet)');
const nums = episodes.map((e) => e.n);
for (let k = 1; k < (nums[nums.length - 1] ?? 0); k++) if (!nums.includes(k)) warnings.push(`episode ${String(k).padStart(3, '0')} is missing.`);
if (warnings.length) console.log(`\n${warnings.map((w) => `⚠ ${w}`).join('\n')}`);

const next = (nums[nums.length - 1] ?? 0) + 1;
const slot = cycleSlot(next);
const pad = String(next).padStart(3, '0');
console.log(`\nNext: ${pad} → ${slot.label} (slot ${((next - 1) % EPISODE_CYCLE.length) + 1} of ${EPISODE_CYCLE.length}), theme "${slot.theme}"`);
console.log(`  file: ${DIR}/brain-${pad}-<slug>.json`);
console.log(`  how:  ${slot.how}`);
const prev = episodes.find((e) => e.n === next - 1);
if (slot.format === 'reveal-levels') {
  if (prev?.format === 'answer-tomorrow') console.log(`  open with the answer to ${String(prev.n).padStart(3, '0')} (${prev.id}).`);
  else console.log(`  ⚠ the previous episode is not an "answer tomorrow": open with a normal puzzle instead.`);
}
