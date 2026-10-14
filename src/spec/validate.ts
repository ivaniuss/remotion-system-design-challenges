import {Scene, VideoSpec} from './schema';
import {FIGURE_INFO, PACKS, PACK_ALIASES, PACK_ICONS, WORLD_INFO, type Pack} from './vocab';
import {cuePhrases} from '../timeline/cues';
import {findCountry} from '../geo/world';
import {findPhrase, splitWords} from '../timeline/words';

export type Validation = {spec: VideoSpec | null; errors: string[]; warnings: string[]};

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

// Aliases depend on the pack ("timer" is a scheduler in tech, a clock in science).
let packNow: Pack = 'tech';
const normIcon = (x: unknown) => {
  if (typeof x !== 'string') return x;
  const k = x.trim().toLowerCase().replace(/\s+/g, '-');
  if ((PACK_ICONS[packNow] as readonly string[]).includes(k)) return k;
  const A = PACK_ALIASES[packNow];
  return A[k] ?? A[k.replace(/-/g, '')] ?? A[k.replace(/-/g, '_')] ?? k;
};

// Every {icon} anywhere in the spec, with its path, for the pack check.
function iconsIn(x: unknown, path: string, out: [string, string][]) {
  if (Array.isArray(x)) x.forEach((v, i) => iconsIn(v, `${path}[${i}]`, out));
  else if (isObj(x)) {
    for (const [k, v] of Object.entries(x)) {
      if (k === 'icon' && typeof v === 'string') out.push([path ? `${path}.icon` : 'icon', v]);
      else iconsIn(v, path ? `${path}.${k}` : k, out);
    }
  }
}

const normEdgeRef = (x: unknown) =>
  typeof x === 'string' ? x.replace(/\s*(->|→|=>|-->)\s*/g, '->').trim() : x;

const normItems = (arr: unknown) =>
  Array.isArray(arr) ? arr.map((it) => (typeof it === 'string' ? {text: it} : it)) : arr;

// Forgiving pre-pass: fixes the small things LLMs get wrong so the schema can stay strict.
export function normalizeSpec(raw: unknown): unknown {
  if (!isObj(raw)) return raw;
  const spec = {...raw};
  if (typeof spec.pack === 'string') spec.pack = spec.pack.trim().toLowerCase();
  packNow = (PACKS as readonly string[]).includes(spec.pack as string) ? (spec.pack as Pack) : 'tech';
  if (isObj(spec.board) && Array.isArray(spec.board.nodes)) {
    spec.board = {...spec.board, nodes: spec.board.nodes.map((n) => (isObj(n) ? {...n, icon: normIcon(n.icon)} : n))};
  }
  if (isObj(spec.thumbnail)) {
    const th: Record<string, unknown> = {...spec.thumbnail};
    // "icons": ["hand", "flame"] is fine too.
    if (Array.isArray(th.icons)) th.icons = th.icons.map((it) => (typeof it === 'string' ? {icon: normIcon(it)} : isObj(it) ? {...it, icon: normIcon(it.icon)} : it));
    if (typeof th.figure === 'string') th.figure = {name: th.figure};
    spec.thumbnail = th;
  }
  if (!Array.isArray(spec.scenes)) return spec;
  spec.scenes = spec.scenes.map((s) => {
    if (!isObj(s)) return s;
    const sc: Record<string, unknown> = {...s};
    if (typeof sc.type === 'string') sc.type = sc.type.trim().toLowerCase();
    if (typeof sc.narration === 'string') sc.narration = sc.narration.replace(/\s+/g, ' ').trim();
    if ('icon' in sc) sc.icon = normIcon(sc.icon);
    if ('items' in sc) sc.items = normItems(sc.items);
    if ('points' in sc) sc.points = normItems(sc.points);
    if ('why' in sc) sc.why = normItems(sc.why);
    // Puzzle tiles and answers may be written as numbers: [2, 6, 12, "?"], "answer": 42.
    if (Array.isArray(sc.sequence)) sc.sequence = sc.sequence.map((x) => (typeof x === 'number' ? String(x) : x));
    if (Array.isArray(sc.choices)) sc.choices = sc.choices.map((x) => (typeof x === 'number' ? String(x) : x));
    if (typeof sc.answer === 'number') sc.answer = String(sc.answer);
    for (const side of ['left', 'right']) {
      if (isObj(sc[side])) sc[side] = {...(sc[side] as object), items: normItems((sc[side] as Record<string, unknown>).items)};
    }
    for (const key of ['items', 'points', 'beats']) {
      if (Array.isArray(sc[key])) sc[key] = (sc[key] as unknown[]).map((it) => (isObj(it) && 'icon' in it ? {...it, icon: normIcon(it.icon)} : it));
    }
    if (Array.isArray(sc.nodes)) sc.nodes = sc.nodes.map((n) => (isObj(n) ? {...n, icon: normIcon(n.icon)} : n));
    if (Array.isArray(sc.steps)) {
      sc.steps = sc.steps.map((st) => {
        if (!isObj(st)) return st;
        const out = {...st};
        for (const k of ['show', 'hide', 'focus', 'camera']) {
          if (typeof out[k] === 'string') out[k] = [out[k]];
          if (Array.isArray(out[k])) out[k] = (out[k] as unknown[]).map(normEdgeRef);
        }
        if (typeof out.lines === 'number') out.lines = [out.lines];
        if (typeof out.note === 'string' && (sc.type === 'flow' || sc.type === 'board' || sc.type === 'sequence')) out.note = {text: out.note};
        // crowd: false / null / "stop" all mean "off"
        if ('crowd' in out && (out.crowd === false || out.crowd === null || out.crowd === 'stop')) out.crowd = 'off';
        return out;
      });
    }
    return sc;
  });
  return spec;
}

const fmtPath = (path: PropertyKey[]) =>
  path.reduce<string>((acc, p) => (typeof p === 'number' ? `${acc}[${p}]` : acc ? `${acc}.${String(p)}` : String(p)), '');

const MAX_SCENE_WORDS = 75;

export function validateSpec(raw: unknown): Validation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const parsed = VideoSpec.safeParse(normalizeSpec(raw));
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      let msg = `${fmtPath(issue.path)}: ${issue.message}`;
      if (issue.path[issue.path.length - 1] === 'icon') msg += `. Valid ${packNow} icons: ${PACK_ICONS[packNow].join(', ')}`;
      errors.push(msg);
    }
    return {spec: null, errors, warnings};
  }
  const spec = parsed.data;

  // Icons from another pack parse fine (one global list) but are not allowed here.
  const used: [string, string][] = [];
  iconsIn(spec, '', used);
  for (const [where, icon] of used) {
    if (!(PACK_ICONS[spec.pack] as readonly string[]).includes(icon)) {
      const other = PACKS.find((p) => (PACK_ICONS[p] as readonly string[]).includes(icon));
      errors.push(`${where}: "${icon}" is a ${other} icon; this video's pack is "${spec.pack}". Valid ${spec.pack} icons: ${PACK_ICONS[spec.pack].join(', ')}`);
    }
  }
  if (errors.length) return {spec: null, errors, warnings};

  const boardScenes = spec.scenes.filter((s) => s.type === 'board').length;
  if (boardScenes && !spec.board) errors.push('board: scenes of type "board" need a top-level "board" with nodes and edges.');
  if (spec.board) checkGraph(spec.board.nodes, spec.board.edges, 'board', errors, warnings);
  if (spec.board && !boardScenes) warnings.push('board: defined but no scene has type "board", so it is never shown.');

  if (spec.thumbnail?.media && !(spec.thumbnail.media in (spec.media ?? {}))) errors.push(`thumbnail.media: "${spec.thumbnail.media}" is not in the top-level "media" library.`);
  for (const [id, m] of Object.entries(spec.media ?? {})) {
    if (!/^[a-z0-9][a-z0-9_-]*$/.test(id)) errors.push(`media.${id}: ids are lowercase kebab-case.`);
    if (/^https?:/.test(m.file)) errors.push(`media.${id}.file: download the file into public/ and give its path; URLs are not rendered (put the URL in "url").`);
  }
  if (spec.thumbnail) {
    const th = spec.thumbnail;
    if (th.icons && th.figure) errors.push('thumbnail: use "icons" or "figure", not both.');
    if (th.figure) {
      const info = FIGURE_INFO[th.figure.name];
      if (info.pack !== spec.pack) errors.push(`thumbnail.figure: "${th.figure.name}" belongs to the ${info.pack} pack; this video's pack is "${spec.pack}".`);
      for (const r of th.figure.glow) if (!info.regions.includes(r)) errors.push(`thumbnail.figure.glow: "${r}" is not a region of ${th.figure.name}. Regions: ${info.regions.join(', ')}`);
      for (const pr of th.figure.props) if (!(info.props ?? []).includes(pr)) errors.push(`thumbnail.figure.props: "${pr}" is not a prop of ${th.figure.name}. Props: ${(info.props ?? []).join(', ') || 'none'}`);
    }
    const words = th.text.replace(/\*/g, '').trim().split(/\s+/).length;
    if (words > 7) warnings.push(`thumbnail.text: ${words} words; 2–6 big words read at thumbnail size.`);
  }

  spec.scenes.forEach((scene, si) => {
    const where = `scenes[${si}] (${scene.type})`;
    const words = splitWords(scene.narration);
    if (words.length > MAX_SCENE_WORDS) {
      warnings.push(`${where}: narration has ${words.length} words; split it into two scenes (max ~${MAX_SCENE_WORDS}).`);
    }
    checkCues(scene, words, where, warnings);
    if (scene.type === 'flow') {
      checkGraph(scene.nodes, scene.edges, where, errors, warnings);
      checkSteps(scene.nodes, scene.edges, scene.steps, where, errors);
    }
    if (scene.type === 'chart') {
      const ids = new Set(scene.series.map((x) => x.id));
      if (ids.size !== scene.series.length) errors.push(`${where}: series ids must be unique.`);
      scene.series.forEach((x, k) => {
        for (let q = 1; q < x.points.length; q++)
          if (x.points[q][0] < x.points[q - 1][0]) errors.push(`${where}.series[${k}]: x values must not decrease (point ${q}).`);
      });
      scene.steps.forEach((st, k) => {
        for (const id of [...(st.draw ?? []), ...(st.focus ?? []), ...(st.mark?.series ? [st.mark.series] : [])])
          if (!ids.has(id)) errors.push(`${where}.steps[${k}]: unknown series "${id}". Series: ${[...ids].join(', ')}`);
      });
      if (!scene.schematic && !scene.y.ticks && spec.pack === 'science')
        warnings.push(`${where}: a chart with numbers needs a source in notes; if the shape is illustrative set "schematic": true.`);
    }
    if (scene.type === 'figure') {
      const info = FIGURE_INFO[scene.figure];
      if (info.pack !== spec.pack) errors.push(`${where}: figure "${scene.figure}" belongs to the ${info.pack} pack; this video's pack is "${spec.pack}".`);
      const ok = (r: string) => info.regions.includes(r);
      scene.steps.forEach((st, k) => {
        const used = [...(st.glow ?? []), ...(st.label ? [st.label.region] : []), ...(st.signal ? [st.signal.from, st.signal.to] : []), ...(st.zoom ? [st.zoom] : [])];
        for (const r of used) if (!ok(r)) errors.push(`${where}.steps[${k}]: "${r}" is not a region of ${scene.figure}. Regions: ${info.regions.join(', ')}`);
      });
      for (const pr of scene.props) if (!(info.props ?? []).includes(pr)) errors.push(`${where}.props: "${pr}" is not a prop of ${scene.figure}. Props: ${(info.props ?? []).join(', ') || 'none'}`);
    }
    if (scene.type === 'shot') {
      const info = WORLD_INFO[scene.world];
      if (info.pack !== spec.pack) errors.push(`${where}: world "${scene.world}" belongs to the ${info.pack} pack; this video's pack is "${spec.pack}".`);
      let cards = 0;
      let labels = 0;
      scene.steps.forEach((st, k) => {
        if (st.event && !info.events.includes(st.event)) errors.push(`${where}.steps[${k}].event: "${st.event}" is not a moment of ${scene.world}. Events: ${info.events.join(', ')}`);
        if (st.label && !info.anchors.includes(st.label.anchor)) errors.push(`${where}.steps[${k}].label.anchor: "${st.label.anchor}" is not a point of ${scene.world}. Anchors: ${info.anchors.join(', ')}`);
        if (st.card) cards++;
        if (st.label) labels++;
      });
      if (cards > 1) errors.push(`${where}: only one title card per shot.`);
      if (labels > 4) warnings.push(`${where}: ${labels} labels; a documentary names 1–3 things per shot and lets the picture speak.`);
      if (spec.theme !== 'film') warnings.push(`${where}: "shot" scenes are made for "theme": "film" (grain, subtitles, no header).`);
    }
    // News scenes: media ids must be in the library, countries must exist on the map.
    const mediaIds = new Set(Object.keys(spec.media ?? {}));
    const needMedia = (id: string | undefined, w: string) => {
      if (id && !mediaIds.has(id)) errors.push(`${w}: media "${id}" is not in the top-level "media" library. Known: ${[...mediaIds].join(', ') || 'none'}`);
    };
    if (scene.type === 'headline') needMedia(scene.media, where);
    if (scene.type === 'media') {
      needMedia(scene.media, where);
      scene.steps.forEach((st, k) => needMedia(st.media, `${where}.steps[${k}]`));
    }
    if (scene.type === 'quote') scene.quotes.forEach((q, k) => needMedia(q.media, `${where}.quotes[${k}]`));
    if (scene.type === 'map') {
      const names = [...scene.highlight, ...scene.steps.flatMap((st) => st.highlight ?? [])];
      for (const n of names) if (!findCountry(n)) errors.push(`${where}: "${n}" is not a country on the map (Natural Earth names in English, e.g. "France", "United Kingdom", "Czechia").`);
      const boxes = [scene.view, ...(scene.from ? [scene.from] : []), ...scene.steps.flatMap((st) => (st.zoom ? [st.zoom] : []))];
      for (const b of boxes) if (b[0][0] >= b[1][0] || b[0][1] >= b[1][1]) errors.push(`${where}: a map box is [[west, south], [east, north]]; west < east and south < north.`);
    }
    if (['headline', 'media', 'map', 'stats', 'quote', 'timeline', 'sources'].includes(scene.type) && spec.theme !== 'news')
      warnings.push(`${where}: "${scene.type}" scenes are made for "theme": "news" (bug, red tabs, lower thirds).`);
    if (scene.type === 'board' && spec.board) checkSteps(spec.board.nodes, spec.board.edges, scene.steps, where, errors);
    if (scene.type === 'sequence') checkSequence(scene, where, errors, warnings);
    if (scene.type === 'code') {
      const lines = scene.code.replace(/\n+$/, '').split('\n');
      if (lines.length > 18) warnings.push(`${where}: ${lines.length} code lines; keep it under 16 so it stays readable.`);
      const longest = Math.max(...lines.map((l) => l.length));
      if (longest > 48) warnings.push(`${where}: longest code line has ${longest} chars; the font shrinks above ~44 on vertical video.`);
      scene.steps.forEach((st, k) => {
        for (const ln of st.lines) {
          if (ln > lines.length) errors.push(`${where}.steps[${k}].lines: line ${ln} does not exist (code has ${lines.length} lines).`);
        }
      });
    }
  });

  checkPuzzles(spec, errors, warnings);

  // Science is told with illustrations and curves; boxes and arrows make it look like a
  // software diagram (docs/packs/science.md).
  if (spec.pack === 'science') {
    const boards = spec.scenes.filter((s) => s.type === 'board' || s.type === 'flow').length;
    const pictures = spec.scenes.filter((s) => s.type === 'figure' || s.type === 'chart').length;
    if (boards >= 3 && boards > pictures)
      warnings.push(`science: ${boards} of ${spec.scenes.length} scenes are board/flow diagrams and only ${pictures} are figures or charts. Science is told on a drawing (figure: body, neuron, brain) with charts for time; keep the board for a model that has no drawing (docs/packs/science.md §2A).`);
  }

  return {spec: errors.length ? null : spec, errors, warnings};
}

// Daily puzzles (docs/packs/brain.md): the answer must be checkable and honest.
const AI_NAME = /\b(ai|gpt|chatgpt|claude|gemini|llama|copilot|grok|deepseek|mistral|model|llm|bot)\b/i;
function checkPuzzles(spec: VideoSpec, errors: string[], warnings: string[]) {
  const scenes = spec.scenes;
  const PUZZLE_TYPES = ['puzzle', 'reveal', 'score'];
  if (spec.pack !== 'brain' && scenes.some((s) => PUZZLE_TYPES.includes(s.type)))
    warnings.push(`puzzle/reveal/score scenes are made for "pack": "brain" (docs/packs/brain.md).`);
  const checkParts = (where: string, p: {sequence?: string[]; claim?: {who: string; source?: string}}) => {
    if (p.sequence) {
      const q = p.sequence.filter((x) => x.trim() === '?').length;
      if (q !== 1) errors.push(`${where}.sequence: mark exactly one missing tile with "?" (found ${q}).`);
    }
    if (p.claim && AI_NAME.test(p.claim.who) && !p.claim.source)
      errors.push(`${where}.claim: an AI's answer must be a real, logged output. Name the model and date in "who" and say where the log is kept in "source"; never write the AI's mistake yourself.`);
  };
  scenes.forEach((sc, i) => {
    const where = `scenes[${i}] (${sc.type})`;
    if (sc.type === 'puzzle') {
      checkParts(where, sc);
      if (sc.pause && sc.think === 0) warnings.push(`${where}: "pause" shows its tag during the hold; give it "think": 2.`);
      if (sc.pause && sc.think > 4) warnings.push(`${where}: a "pause the video" hold of ${sc.think} s; 2–3 s is enough (the viewer pauses).`);
      if (!sc.pause && sc.think > 0 && sc.think < 3) warnings.push(`${where}: a ${sc.think} s countdown is too short to read the puzzle; 3–8 s, or "pause": true for hard ones.`);
      if (sc.think > 10) warnings.push(`${where}: a ${sc.think} s countdown is long for a Short; use "pause": true instead and let the viewer stop the video.`);
      let j = i + 1;
      while (j < scenes.length && scenes[j].type !== 'puzzle' && scenes[j].type !== 'reveal') j++;
      const next = scenes[j];
      if ((!next || next.type !== 'reveal') && !sc.tomorrow)
        warnings.push(`${where}: no reveal after this puzzle. For an "answer tomorrow" episode set "tomorrow": true and say it in the narration.`);
      if (next && next.type === 'reveal' && sc.tomorrow) warnings.push(`${where}: "tomorrow": true but the next scene reveals the answer.`);
      if (next && next.type === 'reveal' && sc.choices && next.correct === undefined) warnings.push(`scenes[${j}] (reveal): the puzzle has choices; set "correct" (0 = A) so the right one lights up.`);
      if (next && next.type === 'reveal' && sc.claim && !next.verdict) warnings.push(`scenes[${j}] (reveal): the puzzle has a claim; set "verdict": "right" | "wrong".`);
    }
    if (sc.type === 'reveal') {
      checkParts(where, sc);
      const prev = scenes.slice(0, i).reverse().find((x) => x.type === 'puzzle');
      const p = prev && prev.type === 'puzzle' ? prev : undefined;
      if (!p && !sc.question) errors.push(`${where}: a reveal needs a puzzle scene before it, or its own "question" (an "answer tomorrow" reveal of yesterday's puzzle).`);
      const choices = sc.choices ?? p?.choices;
      if (sc.correct !== undefined && (!choices || sc.correct >= choices.length))
        errors.push(`${where}.correct: ${sc.correct} is not a choice of the puzzle (${choices ? `0–${choices.length - 1}` : 'it has no choices'}).`);
      if (sc.verdict && !(sc.claim ?? p?.claim)) errors.push(`${where}.verdict: the puzzle has no claim to judge.`);
      if (!sc.why.length) warnings.push(`${where}: no "why"; one line of why turns a riddle into something the viewer learns.`);
    }
  });
}

function checkCues(scene: Scene, words: string[], where: string, warnings: string[]) {
  let cursor = 0;
  for (const p of cuePhrases(scene)) {
    if (!p) continue;
    const i = findPhrase(words, p, cursor);
    if (i < 0) {
      const anywhere = findPhrase(words, p, 0) >= 0;
      warnings.push(
        anywhere
          ? `${where}: cue "${p}" is out of order (it appears before the previous cue). It will be spread evenly.`
          : `${where}: cue "${p}" is not in the narration. Copy 2-4 exact words from it. It will be spread evenly.`,
      );
      continue;
    }
    cursor = i + 1;
  }
}

type GraphNode = {id: string; row?: number; col?: number};
type GraphEdge = {from: string; to: string};
type Step = {
  show?: string[];
  hide?: string[];
  focus?: string[];
  camera?: string[];
  status?: Record<string, string>;
  packet?: {from: string; to: string; via?: string[]};
  crowd?: 'off' | {from: string; to: string; via?: string[]};
  meter?: Record<string, unknown>;
  clock?: Record<string, unknown>;
  note?: {near?: string};
};

function checkGraph(nodes: GraphNode[], edges: GraphEdge[], where: string, errors: string[], warnings: string[]) {
  const ids = new Set<string>();
  for (const n of nodes) {
    if (ids.has(n.id)) errors.push(`${where}: duplicate node id "${n.id}".`);
    ids.add(n.id);
  }
  edges.forEach((e, k) => {
    if (!ids.has(e.from)) errors.push(`${where}.edges[${k}]: unknown node "${e.from}".`);
    if (!ids.has(e.to)) errors.push(`${where}.edges[${k}]: unknown node "${e.to}".`);
    if (e.from === e.to) errors.push(`${where}.edges[${k}]: self-loops are not supported.`);
  });
  const placed = nodes.filter((n) => n.row !== undefined && n.col !== undefined);
  if (placed.length && placed.length !== nodes.length) {
    warnings.push(`${where}: only ${placed.length}/${nodes.length} nodes have row and col; the grid is used only when all of them do.`);
  }
  if (placed.length === nodes.length) {
    const cells = new Map<string, string>();
    for (const n of nodes) {
      const key = `${n.row},${n.col}`;
      const other = cells.get(key);
      if (other) errors.push(`${where}: nodes "${other}" and "${n.id}" share the same cell (row ${n.row}, col ${n.col}).`);
      cells.set(key, n.id);
    }
    for (const a of nodes) {
      for (const b of nodes) {
        if (a.id < b.id && Math.abs(a.row! - b.row!) < 1 && Math.abs(a.col! - b.col!) < 1 && cells.get(`${a.row},${a.col}`) !== b.id) {
          errors.push(`${where}: nodes "${a.id}" and "${b.id}" overlap; keep at least 1 row or 1 col between them.`);
        }
      }
    }
    const cols = Math.max(...nodes.map((n) => n.col!)) + 1;
    if (cols > 3) warnings.push(`${where}: ${cols} columns; 3 or fewer read much better on a phone (rows are fine).`);
  }
  const max = where === 'board' ? 12 : 7;
  if (nodes.length > max) warnings.push(`${where}: ${nodes.length} nodes; ${max} or fewer reads much better on a phone.`);
}

function checkSteps(nodes: GraphNode[], edges: GraphEdge[], steps: Step[], where: string, errors: string[]) {
  const ids = new Set(nodes.map((n) => n.id));
  const edgeIds = new Set(edges.map((e) => `${e.from}->${e.to}`));
  const known = (ref: string) => ids.has(ref) || edgeIds.has(ref);
  steps.forEach((st, k) => {
    const sw = `${where}.steps[${k}]`;
    for (const key of ['show', 'hide'] as const) {
      for (const ref of st[key] ?? []) {
        if (!known(ref)) errors.push(`${sw}.${key}: "${ref}" is not a node id or an edge id ("from->to").`);
      }
    }
    for (const key of ['focus', 'camera'] as const) {
      for (const ref of st[key] ?? []) if (!ids.has(ref)) errors.push(`${sw}.${key}: unknown node "${ref}".`);
    }
    for (const ref of Object.keys(st.status ?? {})) if (!ids.has(ref)) errors.push(`${sw}.status: unknown node "${ref}".`);
    if (st.packet) {
      for (const ref of [st.packet.from, ...(st.packet.via ?? []), st.packet.to]) {
        if (!ids.has(ref)) errors.push(`${sw}.packet: unknown node "${ref}".`);
      }
    }
    if (st.note?.near && !ids.has(st.note.near)) errors.push(`${sw}.note.near: unknown node "${st.note.near}".`);
    if (st.crowd && st.crowd !== 'off') {
      for (const ref of [st.crowd.from, ...(st.crowd.via ?? []), st.crowd.to]) if (!ids.has(ref)) errors.push(`${sw}.crowd: unknown node "${ref}".`);
    }
    for (const ref of Object.keys(st.meter ?? {})) if (!ids.has(ref)) errors.push(`${sw}.meter: unknown node "${ref}".`);
    for (const ref of Object.keys(st.clock ?? {})) if (!ids.has(ref)) errors.push(`${sw}.clock: unknown node "${ref}".`);
  });
}

function checkSequence(scene: Extract<Scene, {type: 'sequence'}>, where: string, errors: string[], warnings: string[]) {
  const ids = new Set<string>();
  for (const a of scene.actors) {
    if (ids.has(a.id)) errors.push(`${where}: duplicate actor id "${a.id}".`);
    ids.add(a.id);
  }
  scene.steps.forEach((st, k) => {
    const sw = `${where}.steps[${k}]`;
    for (const [key, ref] of [['from', st.from], ['to', st.to]] as const) if (ref && !ids.has(ref)) errors.push(`${sw}.${key}: unknown actor "${ref}". Actors: ${[...ids].join(', ')}`);
    if (st.kind === 'self') {
      if (!st.from) errors.push(`${sw}: a "self" step needs "from".`);
    } else if ((st.from && !st.to) || (!st.from && st.to)) {
      errors.push(`${sw}: a message needs both "from" and "to" (or neither, for a note-only step).`);
    }
    for (const ref of Object.keys(st.status ?? {})) if (!ids.has(ref)) errors.push(`${sw}.status: unknown actor "${ref}".`);
    if (st.from && st.kind !== 'self' && st.from === st.to) errors.push(`${sw}: from and to are the same actor; use kind "self".`);
  });
  scene.spans.forEach((sp, k) => {
    const sw = `${where}.spans[${k}]`;
    if (!ids.has(sp.actor)) errors.push(`${sw}: unknown actor "${sp.actor}".`);
    if (sp.to <= sp.from) errors.push(`${sw}: "to" must be greater than "from" (step indices, 0-based).`);
    if (sp.to >= scene.steps.length) errors.push(`${sw}: step ${sp.to} does not exist (the scene has ${scene.steps.length} steps).`);
  });
  const total = scene.steps.reduce((a, st) => a + st.gap, 0);
  if (total > 9) warnings.push(`${where}: the steps add up to ${total.toFixed(1)} rows of height; the messages will be squeezed. Use fewer steps or smaller gaps.`);
}

export function formatIssues(v: Validation): string {
  const lines: string[] = [];
  for (const e of v.errors) lines.push(`  ✖ ${e}`);
  for (const w of v.warnings) lines.push(`  ⚠ ${w}`);
  return lines.join('\n');
}
