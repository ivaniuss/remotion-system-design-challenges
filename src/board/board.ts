import type {BoardStep, FlowEdge, FlowNode} from '../spec/schema';
import type {Timeline, TimedScene} from '../timeline/timeline';
import type {Box} from '../layout/frame';
import {edgeId, FlowLayout, layoutBounds, layoutWorld} from '../layout/flow';
import {applyMetrics, PACKET_LEG_SECONDS, type FlowState, type Vis} from '../scenes/flowState';
import {clamp01, easeInOut} from '../video/anim';

// The board is ONE diagram shared by every `board` scene. Its state is a fold over all
// board steps of the video in absolute time, so whatever was built in "the problem"
// is still there in "the solution". Pure functions of (timeline, t).

type BoardScene = Extract<TimedScene, {type: 'board'}>;
export type BoardEvent =
  | {kind: 'scene'; t: number; scene: number}
  | {kind: 'step'; t: number; scene: number; step: BoardStep};

export type BoardState = FlowState & {camera: string[] | null};
export type Camera = {x: number; y: number; zoom: number};

const NEVER = -1e9;
const CAMERA_MOVE = 0.9; // seconds per camera move
// Breathing room around whatever the camera frames (world units).
export const PAD = {x: 36, y: 60};
const NODE_STAGGER = 0.1; // between nodes that appear in the same step

export const isBoard = (s: TimedScene | undefined): s is BoardScene => s?.type === 'board';

// Every board scene start and step, in time order.
export function boardEvents(tl: Timeline): BoardEvent[] {
  const out: BoardEvent[] = [];
  for (const s of tl.scenes) {
    if (!isBoard(s)) continue;
    out.push({kind: 'scene', t: s.start, scene: s.index});
    s.steps.forEach((step, i) => out.push({kind: 'step', t: s.start + (s.cues[i] ?? 0), scene: s.index, step}));
  }
  return out.sort((a, b) => a.t - b.t || (a.kind === 'scene' ? -1 : 1));
}

// Nodes a step talks about, in the order they should appear.
export function mentioned(step: BoardStep): string[] {
  const ids: string[] = [];
  const add = (id?: string) => {
    if (id && !id.includes('->') && !ids.includes(id)) ids.push(id);
  };
  (step.show ?? []).forEach(add);
  if (step.packet) [step.packet.from, ...(step.packet.via ?? []), step.packet.to].forEach(add);
  Object.keys(step.status ?? {}).forEach(add);
  (step.focus ?? []).forEach(add);
  (step.camera ?? []).forEach(add);
  add(step.note?.near);
  if (step.crowd && step.crowd !== 'off') [step.crowd.from, ...(step.crowd.via ?? []), step.crowd.to].forEach(add);
  Object.keys(step.meter ?? {}).forEach(add);
  Object.keys(step.clock ?? {}).forEach(add);
  return ids;
}

export function boardState(tl: Timeline, t: number, events = boardEvents(tl)): BoardState {
  const board = tl.board!;
  const nodes: Record<string, Vis> = {};
  for (const n of board.nodes) nodes[n.id] = {on: false, since: NEVER, off: NEVER};

  // Edges listed in a `show` appear only there; the rest follow their two nodes.
  const explicit: Record<string, Vis> = {};
  for (const ev of events) {
    if (ev.kind !== 'step') continue;
    for (const id of ev.step.show ?? []) if (id.includes('->')) explicit[id] = {on: false, since: NEVER, off: NEVER};
  }

  const status: FlowState['status'] = {};
  let focus: FlowState['focus'] = null;
  let note: FlowState['note'] = null;
  let camera: string[] | null = null;
  const packets: FlowState['packets'] = [];
  let crowds: FlowState['crowds'] = [];
  const meters: FlowState['meters'] = {};
  let clocks: FlowState['clocks'] = {};
  const edgeHidden: Record<string, number> = {}; // automatic edges hidden on purpose

  const set = (map: Record<string, Vis>, id: string, on: boolean, time: number) => {
    const v = map[id];
    if (!v) return;
    if (on && !v.on) map[id] = {on: true, since: time, off: v.off};
    if (!on && v.on) map[id] = {on: false, since: v.since, off: time};
  };

  for (const ev of events) {
    if (ev.t > t) break;
    if (ev.kind === 'scene') {
      // Highlights, notes and camera overrides belong to the scene that set them.
      focus = null;
      note = null;
      camera = null;
      // A crowd or a timer is a moment of its scene; meters, like statuses, carry over.
      crowds = [];
      clocks = {};
      continue;
    }
    const st = ev.step;
    const at = ev.t;
    const hidden = new Set(st.hide ?? []);
    let appeared = 0;
    for (const id of mentioned(st)) {
      if (hidden.has(id) || !(id in nodes) || nodes[id].on) continue;
      set(nodes, id, true, at + appeared * NODE_STAGGER);
      appeared++;
    }
    for (const id of st.show ?? []) if (id in explicit) set(explicit, id, true, at);
    for (const id of st.hide ?? []) {
      if (id in nodes) set(nodes, id, false, at);
      else if (id in explicit) set(explicit, id, false, at);
      else if (id.includes('->')) edgeHidden[id] = at;
    }
    if (st.focus) focus = st.focus.length ? {ids: new Set(st.focus), since: at} : null;
    if (st.camera) camera = st.camera.length ? [...st.camera] : null;
    for (const [id, s] of Object.entries(st.status ?? {})) status[id] = {status: s, since: at};
    if (st.note) note = {...st.note, since: at};
    if (st.packet) {
      const chain = [st.packet.from, ...(st.packet.via ?? []), st.packet.to];
      // If the packet's nodes just popped in, let them land first.
      const start = at + (appeared ? 0.25 + appeared * NODE_STAGGER : 0);
      packets.push({chain, label: st.packet.label, color: st.packet.color, start, seconds: PACKET_LEG_SECONDS * (chain.length - 1) + 0.25});
    }
    applyMetrics(st, at + (appeared ? 0.25 + appeared * NODE_STAGGER : 0), crowds, meters, clocks, Math.round(at * 100));
  }

  const edges: Record<string, Vis> = {};
  for (const e of board.edges) {
    const id = edgeId(e);
    if (explicit[id]) {
      edges[id] = explicit[id];
      continue;
    }
    const a = nodes[e.from];
    const b = nodes[e.to];
    if (!a || !b) continue;
    const v = {on: a.on && b.on, since: Math.max(a.since, b.since) + 0.25, off: Math.max(a.off, b.off)};
    if (id in edgeHidden && v.on) {
      v.on = false;
      v.off = edgeHidden[id];
    }
    edges[id] = v;
  }
  return {nodes, edges, status, focus, note, packets, crowds, meters, clocks, camera};
}

// ---------- layout + camera (cached per timeline and format) ----------

type Cache = {layout: FlowLayout; events: BoardEvent[]; keys: {t: number; target: Camera}[]};
const cache = new WeakMap<Timeline, Map<string, Cache>>();

export function boardBox(content: Box, format: 'vertical' | 'horizontal', hasNotes: boolean): Box {
  const room = hasNotes ? (format === 'vertical' ? 120 : 96) : 0;
  return {...content, h: content.h - room};
}

export function boardHasNotes(tl: Timeline): boolean {
  return tl.scenes.some((s) => isBoard(s) && s.steps.some((st) => st.note && !st.note.near));
}

function prepare(tl: Timeline, box: Box, vertical: boolean): Cache {
  const key = `${vertical}|${box.x},${box.y},${box.w},${box.h}`;
  let byKey = cache.get(tl);
  if (!byKey) {
    byKey = new Map();
    cache.set(tl, byKey);
  }
  const hit = byKey.get(key);
  if (hit) return hit;

  const layout = layoutWorld(tl.board!.nodes, tl.board!.edges, vertical, tl.board!.flowUp);
  const events = boardEvents(tl);
  const maxZoom = vertical ? 1.3 : 1.2;
  const minZoom = 0.3;

  // One camera target per moment something changes on the board.
  const times = [...new Set(events.map((e) => e.t))].sort((a, b) => a - b);
  const keys: Cache['keys'] = [];
  for (const time of times) {
    const st = boardState(tl, time + 0.001, events);
    const visible = Object.keys(st.nodes).filter((id) => st.nodes[id].on);
    let ids = st.camera ?? (st.focus ? [...st.focus.ids] : visible);
    // Follow a packet that starts now, so its whole trip is on screen.
    for (const p of st.packets) if (p.start >= time - 0.05 && p.start <= time + 1) ids = [...ids, ...p.chain];
    ids = [...new Set(ids)].filter((id) => st.nodes[id]?.on);
    if (!ids.length) ids = visible;
    if (!ids.length) {
      // Empty board: aim at whatever appears first, instead of the whole board.
      const next = events.find((e) => e.kind === 'step' && e.t > time && mentioned(e.step).length);
      if (next && next.kind === 'step') ids = mentioned(next.step).filter((id) => layout.nodes[id]);
    }
    const b = layoutBounds(layout, ids.length ? ids : undefined)!;
    const w = b.x1 - b.x0 + PAD.x * 2;
    const h = b.y1 - b.y0 + PAD.y * 2;
    const zoom = Math.max(minZoom, Math.min(maxZoom, box.w / w, box.h / h));
    keys.push({t: time, target: {x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2, zoom}});
  }
  const out = {layout, events, keys};
  byKey.set(key, out);
  return out;
}

const mix = (a: Camera, b: Camera, k: number): Camera => ({
  x: a.x + (b.x - a.x) * k,
  y: a.y + (b.y - a.y) * k,
  // Zoom in log space feels uniform.
  zoom: Math.exp(Math.log(a.zoom) + (Math.log(b.zoom) - Math.log(a.zoom)) * k),
});

export function boardCamera(keys: Cache['keys'], t: number): Camera {
  if (!keys.length) return {x: 0, y: 0, zoom: 1};
  // Each move starts from wherever the camera was when the move began.
  let from = keys[0].target;
  let to = keys[0].target;
  let since = keys[0].t;
  for (let i = 1; i < keys.length && keys[i].t <= t; i++) {
    from = mix(from, to, easeInOut(clamp01((keys[i].t - since) / CAMERA_MOVE)));
    to = keys[i].target;
    since = keys[i].t;
  }
  return mix(from, to, easeInOut(clamp01((t - since) / CAMERA_MOVE)));
}

// The zoom at which the whole board fits (what `camera: []` shows).
export function fullBoardZoom(board: {nodes: FlowNode[]; edges: FlowEdge[]; flowUp?: boolean}, box: Box, vertical: boolean): number {
  const b = layoutBounds(layoutWorld(board.nodes, board.edges, vertical, board.flowUp))!;
  return Math.max(0.3, Math.min(vertical ? 1.3 : 1.2, box.w / (b.x1 - b.x0 + PAD.x * 2), box.h / (b.y1 - b.y0 + PAD.y * 2)));
}

export type BoardView = {layout: FlowLayout; state: BoardState; camera: Camera; box: Box};

export function boardView(tl: Timeline, t: number, content: Box, format: 'vertical' | 'horizontal'): BoardView | null {
  if (!tl.board) return null;
  const box = boardBox(content, format, boardHasNotes(tl));
  const c = prepare(tl, box, format === 'vertical');
  return {layout: c.layout, state: boardState(tl, t, c.events), camera: boardCamera(c.keys, t), box};
}
