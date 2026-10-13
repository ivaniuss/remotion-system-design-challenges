import type {VideoSpec} from '../../src/spec/schema';
import type {Timeline, TimedScene} from '../../src/timeline/timeline';

// Everything to paste into YouTube when uploading: title options and a ready
// description with chapters timed from the real voice. Written by `make` (and
// `preview`) to out/<id>/youtube.md, next to the MP4s.

const MIN_CHAPTER = 10; // YouTube ignores chapters shorter than 10 s

// Chapter timestamps round down, so a chapter never starts after its scene.
const stamp = (s: number) => {
  const t = Math.max(0, Math.floor(s));
  const m = Math.floor(t / 60);
  const h = Math.floor(m / 60);
  const ss = String(t % 60).padStart(2, '0');
  return h ? `${h}:${String(m % 60).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
};
const plain = (s: string) => s.replace(/\*/g, '');

function sceneName(s: TimedScene): string {
  if (s.type === 'title') return plain(s.heading);
  if (s.type === 'callout') return s.title ? plain(s.title) : s.text;
  return s.title ? plain(s.title) : s.type;
}

export type Chapter = {t: number; title: string};

// Scenes with a `chapter` start one; without any, every scene does. Chapters closer
// than 10 s to the next one are dropped (the next one absorbs them), and the first
// always starts at 0:00, as YouTube requires.
export function chapters(tl: Timeline): Chapter[] {
  const marked = tl.scenes.some((s) => s.chapter);
  const raw = tl.scenes
    .filter((s) => (marked ? s.chapter || s.index === 0 : true))
    .map((s) => ({t: s.index === 0 ? 0 : s.start, title: s.chapter ?? sceneName(s)}));
  const out: Chapter[] = [];
  for (let i = 0; i < raw.length; i++) {
    const next = i + 1 < raw.length ? raw[i + 1].t : tl.duration;
    if (next - raw[i].t < MIN_CHAPTER && i > 0) continue;
    out.push(raw[i]);
  }
  // A dropped chapter can leave the previous one shorter than 10 s at the end.
  if (out.length > 1 && tl.duration - out[out.length - 1].t < MIN_CHAPTER) out.pop();
  if (out.length) out[0].t = 0;
  return out;
}

export function youtubeMarkdown(spec: VideoSpec, tl: Timeline, voiced: boolean): string {
  const p = spec.publish;
  const fr = spec.lang === 'es'; // Spanish headings; anything else gets English ones
  const L = {
    learn: spec.lang === 'es' ? 'Vas a aprender:' : spec.lang === 'pt' ? 'Você vai aprender:' : "You'll learn:",
    chapters: spec.lang === 'es' ? 'Capítulos' : spec.lang === 'pt' ? 'Capítulos' : 'Chapters',
  };
  const summary = spec.scenes.find((s) => s.type === 'summary');
  const comment = p?.comment ?? (summary && summary.type === 'summary' ? summary.cta : undefined);
  // Shorts (under ~2 min, vertical) do not show chapters, so none are written.
  const short = tl.duration < 120;
  const chs = short ? [] : chapters(tl);

  const desc: string[] = [];
  desc.push(p?.description ?? plain(spec.title));
  if (p?.learn?.length) desc.push('', L.learn, ...p.learn.map((x) => `• ${x}`));
  if (chs.length >= 3) desc.push('', L.chapters, ...chs.map((c) => `${stamp(c.t)} ${c.title}`));
  if (p?.extra?.length) for (const x of p.extra) desc.push('', x);
  if (comment) desc.push('', `💬 ${comment}`);
  if (p?.hashtags?.length) desc.push('', p.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' '));

  const titles = p?.titles ?? [plain(spec.title)];
  const out: string[] = [];
  out.push(`# YouTube — ${spec.id}`, '');
  out.push(`${tl.duration >= 60 ? stamp(tl.duration) : `${Math.round(tl.duration)} s`} · ${spec.lang}${voiced ? '' : fr ? ' · tiempos ESTIMADOS (sin voz): corre `npm run preview` o `make` con voz para capítulos exactos' : ' · times are ESTIMATES (no voice yet): run `npm run preview` or `make` with voice for exact chapters'}`, '');
  out.push(fr ? '## Título (elige uno)' : '## Title (pick one)', '');
  titles.forEach((t, i) => out.push(`${i + 1}. ${t}${i === 0 && titles.length > 1 ? (fr ? '  ← recomendado' : '  ← recommended') : ''}`));
  out.push('');
  out.push(fr ? '## Descripción (copia todo el bloque)' : '## Description (copy the whole block)', '');
  out.push('```', ...desc, '```', '');
  if (short) out.push(fr ? '_Short: sin capítulos (YouTube no los muestra en Shorts). Súbelo en vertical; menos de 3 min cuenta como Short._' : '_Short: no chapters (YouTube does not show them on Shorts). Upload the vertical version; under 3 min counts as a Short._', '');
  else if (chs.length < 3) out.push(fr ? '_Menos de 3 capítulos de 10 s: YouTube no los mostraría, así que no se incluyen._' : '_Fewer than 3 chapters of 10 s or more: YouTube would ignore them, so they are left out._', '');
  if (!p) out.push(fr ? '_Añade `"publish"` al spec para títulos y descripción a medida._' : '_Add `"publish"` to the spec for custom titles and description._', '');
  const thumb = `${spec.theme}.thumbnail.png`;
  const cover = `${spec.theme}.cover.png`;
  const custom = spec.thumbnail ? '' : fr ? ' (hecha desde el título; añade `"thumbnail"` al spec para diseñarla)' : ' (built from the title; add `"thumbnail"` to the spec to design it)';
  out.push(
    short
      ? fr
        ? `Portada: \`${cover}\` (9:16, en esta carpeta)${custom}. Para un video de 16:9: \`${thumb}\`.`
        : `Cover: \`${cover}\` (9:16, in this folder)${custom}. For a 16:9 upload: \`${thumb}\`.`
      : fr
        ? `Miniatura: \`${thumb}\` (1280×720, en esta carpeta)${custom}. Portada vertical: \`${cover}\`.`
        : `Thumbnail: \`${thumb}\` (1280×720, in this folder)${custom}. Vertical cover: \`${cover}\`.`,
    '',
  );
  return out.join('\n');
}
