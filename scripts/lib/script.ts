import type {FlowStep, VideoSpec} from '../../src/spec/schema';
import type {Timeline, TimedScene} from '../../src/timeline/timeline';

// The video as a document: a teleprompter (narration per scene with timestamps), what
// appears on screen at each cue, and the talking points that are said but not shown.
// Written by `make` to out/<id>/script.md.

const mmss = (s: number) => {
  const t = Math.max(0, Math.round(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};
const plain = (s: string) => s.replace(/\*/g, '');

function describeStep(st: FlowStep & {camera?: string[]}, label: (id: string) => string): string {
  const parts: string[] = [];
  const nodes = (st.show ?? []).filter((id) => !id.includes('->'));
  if (nodes.length) parts.push(`shows ${nodes.map(label).join(', ')}`);
  if (st.packet) {
    const chain = [st.packet.from, ...(st.packet.via ?? []), st.packet.to].map(label).join(' → ');
    parts.push(`packet ${chain}${st.packet.label ? ` "${st.packet.label}"` : ''}`);
  }
  for (const [id, s] of Object.entries(st.status ?? {})) if (s !== 'idle') parts.push(`${label(id)}: ${s}`);
  if (st.focus?.length) parts.push(`focus on ${st.focus.map(label).join(', ')}`);
  if (st.hide?.length) parts.push(`hides ${st.hide.map((id) => (id.includes('->') ? id.split('->').map(label).join(' → ') : label(id))).join(', ')}`);
  if (st.crowd === 'off') parts.push('crowd clears');
  else if (st.crowd) parts.push(`crowd ${[st.crowd.from, ...(st.crowd.via ?? []), st.crowd.to].map(label).join(' → ')} (${st.crowd.density}${st.crowd.label ? `, "${st.crowd.label}"` : ''})`);
  for (const [id, m] of Object.entries(st.meter ?? {})) parts.push(m === 'off' ? `${label(id)}: meter off` : `${label(id)}: meter ${Math.round(m.value * 100)}%${m.label ? ` "${m.label}"` : ''}`);
  for (const [id, k] of Object.entries(st.clock ?? {})) parts.push(k === 'off' ? `${label(id)}: timer off` : `${label(id)}: timer${k.label ? ` "${k.label}"` : ''}${k.end ? ` → "${k.end}"` : ''}`);
  if (st.note) parts.push(`note "${plain(st.note.text)}"`);
  if (st.camera && st.camera.length === 0) parts.push('camera shows the whole system');
  if (st.sfx) parts.push(`sound: ${st.sfx}`);
  return parts.join('; ') || '—';
}

function onScreen(s: TimedScene, label: (id: string) => string): string[] {
  const at = (i: number) => `[${mmss(s.start + (s.cues[i] ?? 0))}]`;
  switch (s.type) {
    case 'title':
      return [`${s.tag ? `${s.tag} · ` : ''}**${plain(s.heading)}**${s.subheading ? ` — ${s.subheading}` : ''}`];
    case 'callout':
      return [`**${s.text}**${s.caption ? ` — ${s.caption}` : ''}`];
    case 'flow':
    case 'board':
      return s.steps.map((st, i) => `${at(i)} “${st.at ?? '…'}” → ${describeStep(st, label)}`);
    case 'code':
      return [`\`${s.filename ?? s.language}\``, ...s.steps.map((st, i) => `${at(i)} lines ${st.lines.join(', ')}${st.note ? ` — ${st.note}` : ''}`)];
    case 'list':
      return s.items.map((it, i) => `${at(i)} ${plain(it.text)}`);
    case 'compare':
      return [
        `${s.left.label}: ${s.left.items.map((x) => plain(x.text)).join(' · ')}`,
        `${s.right.label}: ${s.right.items.map((x) => plain(x.text)).join(' · ')}`,
      ];
    case 'chart':
      return [
        `${s.schematic ? '(illustrative) ' : ''}${s.series.map((x) => x.label).join(' vs ')}`,
        ...s.steps.map((st, i) => `${at(i)} “${st.at ?? '…'}” → ${[st.draw?.length ? `draws ${st.draw.join(', ')}` : '', st.mark ? `mark "${st.mark.label}"` : '', st.focus?.length ? `focus ${st.focus.join(', ')}` : '', st.note ? `note "${plain(st.note.text)}"` : ''].filter(Boolean).join('; ') || '—'}`),
      ];
    case 'figure':
      return [
        `figure: ${s.figure}`,
        ...s.steps.map((st, i) => `${at(i)} “${st.at ?? '…'}” → ${[st.glow ? `lights ${st.glow.join(', ') || 'nothing'}` : '', st.label ? `label "${st.label.text}" on ${st.label.region}` : '', st.signal ? `signal ${st.signal.from} → ${st.signal.to}` : '', st.zoom !== undefined ? `zoom ${st.zoom ?? 'out'}` : '', st.note ? `note "${plain(st.note.text)}"` : ''].filter(Boolean).join('; ') || '—'}`),
      ];
    case 'summary':
      return [...s.points.map((p, i) => `${at(i)} ${plain(p.text)}`), ...(s.cta ? [`CTA: ${s.cta}`] : [])];
    case 'sequence': {
      const who = new Map(s.actors.map((a) => [a.id, a.label]));
      const nm = (id?: string) => (id ? who.get(id) ?? id : '?');
      return [
        `timeline: ${s.actors.map((a) => a.label).join(' | ')}`,
        ...s.steps.map((st, i) => {
          const msg = st.from ? `${nm(st.from)} ${st.kind === 'return' ? '⇢' : st.kind === 'lost' ? '→✕' : '→'} ${st.kind === 'self' ? 'itself' : nm(st.to)}${st.label ? ` "${st.label}"` : ''}` : '';
          const parts = [msg, st.after ? `after ${st.after}` : '', st.note ? `note "${plain(st.note.text)}"` : '', st.sfx ? `sound: ${st.sfx}` : ''].filter(Boolean);
          return `${at(i)} “${st.at ?? '…'}” → ${parts.join('; ') || '—'}`;
        }),
        ...s.spans.map((sp) => `bar on ${nm(sp.actor)} from step ${sp.from + 1} to ${sp.to + 1}${sp.label ? ` "${sp.label}"` : ''}`),
      ];
    }
  }
}

export function scriptMarkdown(spec: VideoSpec, tl: Timeline, voiced: boolean): string {
  const labels = new Map<string, string>();
  for (const n of spec.board?.nodes ?? []) labels.set(n.id, n.label);
  for (const s of spec.scenes) if (s.type === 'flow') for (const n of s.nodes) labels.set(n.id, n.label);
  const label = (id: string) => labels.get(id) ?? id;

  const words = spec.scenes.reduce((a, s) => a + s.narration.split(/\s+/).length, 0);
  const out: string[] = [];
  out.push(`# ${spec.title}`, '');
  out.push(`\`${spec.id}\` · ${spec.lang} · ${tl.duration.toFixed(0)} s${voiced ? '' : ' (estimated, no voice)'} · ${spec.scenes.length} scenes · ${words} words`, '');

  out.push('## Narration (teleprompter)', '');
  out.push('Read it in one take, scene after scene. Pauses between scenes are fine: the video');
  out.push('re-aligns to your voice (see "Record your own voice" below).', '');
  for (const s of tl.scenes) {
    const name = s.type === 'title' ? plain(s.heading) : s.type === 'callout' ? s.text : s.title ? plain(s.title) : s.type;
    out.push(`### ${s.index + 1}. ${name}  ·  ${mmss(s.start)}–${mmss(s.start + s.duration)}  ·  ${s.type}`, '');
    out.push(`> ${s.narration}`, '');
    const lines = onScreen(s, label);
    if (lines.length) {
      out.push('On screen:', '');
      for (const l of lines) out.push(`- ${l}`);
      out.push('');
    }
  }

  out.push('## Say it, not shown', '');
  if (spec.notes?.length) {
    out.push('Nuances, alternatives and follow-up questions. Not shown in the video; use them in a');
    out.push('long version, the description, a pinned comment, or a follow-up video.', '');
    for (const n of spec.notes) out.push(`- ${n}`);
  } else {
    out.push('_No talking points in this spec (add them in `"notes"`)._');
  }
  out.push('');

  out.push('## Record your own voice', '');
  out.push('1. Record the narration above in one take and save it as `voice.mp3`.');
  out.push('2. Get word timestamps with a Whisper tool that outputs words (check its current docs).');
  out.push(`3. \`npm run make -- videos/${spec.pack}/${spec.id}.json --audio voice.mp3 --words voice.json --format both\`` + ' (or `--format horizontal` / `vertical`)');
  out.push('');
  return out.join('\n');
}
