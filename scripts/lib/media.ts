import fs from 'node:fs';
import path from 'node:path';
import type {VideoSpec} from '../../src/spec/schema';

// Finds the file of every item of the spec's `media` library under public/. The extension
// is optional in the spec; the first one that exists wins. Missing files are reported (the
// video draws a "material pending" card for them) instead of failing the build.
const VIDEO = ['.mp4', '.webm', '.mov', '.m4v'];
const IMAGE = ['.jpg', '.jpeg', '.png', '.webp'];

export type Found = {src: string | null; kind: 'image' | 'video' | null};

export function resolveMedia(spec: VideoSpec, publicDir = 'public', log = true): Record<string, Found> {
  const out: Record<string, Found> = {};
  const missing: string[] = [];
  for (const [id, m] of Object.entries(spec.media ?? {})) {
    const rel = m.file.replace(/^\/+/, '').replace(/^public\//, '');
    const ext = path.extname(rel).toLowerCase();
    const tries = ext && [...VIDEO, ...IMAGE].includes(ext) ? [rel] : [...VIDEO, ...IMAGE].map((e) => rel + e);
    const hit = tries.find((f) => fs.existsSync(path.join(publicDir, f)));
    if (hit) {
      out[id] = {src: hit.split(path.sep).join('/'), kind: VIDEO.includes(path.extname(hit).toLowerCase()) ? 'video' : 'image'};
    } else {
      out[id] = {src: null, kind: null};
      missing.push(`${id} → public/${rel}${ext ? '' : '.(mp4|jpg|png…)'} — ${m.alt}`);
    }
  }
  if (log && missing.length) {
    console.log(`  ⚠ media not found yet (drawn as "material pending"):`);
    for (const x of missing) console.log(`     · ${x}`);
  }
  return out;
}
