import fs from 'node:fs';
import path from 'node:path';
import {PACKS} from '../../src/spec/vocab';
import {formatIssues, validateSpec} from '../../src/spec/validate';
import type {VideoSpec} from '../../src/spec/schema';

// Reads and validates a spec file; prints problems; exits on errors.
export function loadSpec(file: string): VideoSpec {
  if (!fs.existsSync(file)) {
    console.error(`✖ Spec not found: ${file}`);
    process.exit(1);
  }
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    console.error(`✖ ${file} is not valid JSON: ${(err as Error).message}`);
    process.exit(1);
  }
  const v = validateSpec(raw);
  if (v.errors.length || v.warnings.length) console.log(formatIssues(v));
  if (!v.spec) {
    console.error(`✖ ${file}: ${v.errors.length} error(s). Fix them and run again.`);
    process.exit(1);
  }
  // videos/<pack>/<id>.json keeps topics apart; warn when the folder and the pack disagree.
  const folder = path.basename(path.dirname(path.resolve(file)));
  if ((PACKS as readonly string[]).includes(folder) && folder !== v.spec.pack) {
    console.log(`  ⚠ ${file} is in videos/${folder}/ but its "pack" is "${v.spec.pack}". Set "pack": "${folder}" or move the file.`);
  }
  return v.spec;
}
