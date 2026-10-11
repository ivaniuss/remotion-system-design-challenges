import type {FlowEdge, FlowNode} from '../spec/schema';
import type {Box} from './frame';
import {curvePoints, grow, inside, Pt, Rect, trimPoints} from './geometry';

// Automatic layout for flow diagrams: a small layered (Sugiyama-style) layout.
// 1. break cycles, 2. assign layers by longest path, 3. order nodes inside each
// layer to reduce crossings, 4. scale everything to fit the content box,
// 5. route edges as gentle curves that avoid other cards.
// Long chains are wrapped in a zig-zag grid so they stay big on a phone.

export const CARD = {w: 250, h: 214};
// Space between cards of the author's grid. Tight enough that the full board fills the
// frame, loose enough that a packet label still fits on an edge.
export const GAP = {vertical: {x: 72, y: 104}, horizontal: {x: 140, y: 78}};

export type NodeLayout = {x: number; y: number; w: number; h: number; rect: Rect};
export type EdgeLayout = {id: string; from: string; to: string; pts: Pt[]};
export type FlowLayout = {scale: number; nodes: Record<string, NodeLayout>; edges: Record<string, EdgeLayout>};

export const edgeId = (e: {from: string; to: string}) => `${e.from}->${e.to}`;

type Orientation = 'TB' | 'LR';

function assignLayers(ids: string[], edges: FlowEdge[]): Map<string, number> {
  const out = new Map<string, string[]>();
  for (const id of ids) out.set(id, []);
  for (const e of edges) if (out.has(e.from) && out.has(e.to) && e.from !== e.to) out.get(e.from)!.push(e.to);

  // DFS in declaration order; edges into a node on the stack are back edges.
  const state = new Map<string, 0 | 1 | 2>();
  const dag: [string, string][] = [];
  const visit = (u: string) => {
    state.set(u, 1);
    for (const v of out.get(u)!) {
      const s = state.get(v) ?? 0;
      if (s === 1) dag.push([v, u]); // reverse the back edge
      else {
        dag.push([u, v]);
        if (s === 0) visit(v);
      }
    }
    state.set(u, 2);
  };
  for (const id of ids) if (!state.get(id)) visit(id);

  // Longest path from sources.
  const layer = new Map<string, number>(ids.map((id) => [id, 0]));
  for (let iter = 0; iter < ids.length; iter++) {
    let changed = false;
    for (const [u, v] of dag) {
      if (layer.get(v)! < layer.get(u)! + 1) {
        layer.set(v, layer.get(u)! + 1);
        changed = true;
      }
    }
    if (!changed) break;
  }
  return layer;
}

function orderLayers(ids: string[], edges: FlowEdge[], layer: Map<string, number>): string[][] {
  const count = Math.max(...ids.map((id) => layer.get(id)!)) + 1;
  const layers: string[][] = Array.from({length: count}, () => []);
  for (const id of ids) layers[layer.get(id)!].push(id);
  const nbrs = new Map<string, string[]>(ids.map((id) => [id, []]));
  for (const e of edges) {
    if (!nbrs.has(e.from) || !nbrs.has(e.to)) continue;
    nbrs.get(e.from)!.push(e.to);
    nbrs.get(e.to)!.push(e.from);
  }
  const pos = () => {
    const p = new Map<string, number>();
    layers.forEach((l) => l.forEach((id, i) => p.set(id, i - (l.length - 1) / 2)));
    return p;
  };
  for (let sweep = 0; sweep < 4; sweep++) {
    const down = sweep % 2 === 0;
    const order = down ? layers.map((_, i) => i) : layers.map((_, i) => layers.length - 1 - i);
    for (const li of order) {
      const p = pos();
      const ref = down ? li - 1 : li + 1;
      const bary = (id: string) => {
        const ns = nbrs.get(id)!.filter((n) => layer.get(n) === ref);
        if (!ns.length) return p.get(id)!;
        return ns.reduce((a, n) => a + p.get(n)!, 0) / ns.length;
      };
      const keyed = layers[li].map((id, i) => ({id, k: bary(id), i}));
      keyed.sort((a, b) => a.k - b.k || a.i - b.i);
      layers[li] = keyed.map((x) => x.id);
    }
  }
  return layers;
}

// Unscaled node centers. Uses the author's grid (row/col) when every node has one,
// otherwise a layered layout computed from the edges.
function rawCenters(nodes: FlowNode[], edges: FlowEdge[], vertical: boolean): Map<string, Pt> {
  const ids = nodes.map((n) => n.id);
  const raw = new Map<string, Pt>();

  if (nodes.length && nodes.every((n) => n.row !== undefined && n.col !== undefined)) {
    // Grid written for 9:16. On 16:9 it is transposed (rows go right) only when that
    // makes the whole diagram clearly bigger in the wide frame.
    let transpose = false;
    if (!vertical) {
      const rows = Math.max(...nodes.map((n) => n.row!));
      const cols = Math.max(...nodes.map((n) => n.col!));
      const fit = (w: number, h: number) => Math.min(2.6 / w, 1 / h); // 16:9 content box ≈ 2.6:1
      const keep = fit(cols * (CARD.w + GAP.horizontal.x) + CARD.w, rows * (CARD.h + GAP.horizontal.y) + CARD.h);
      const flip = fit(rows * (CARD.w + GAP.horizontal.x) + CARD.w, cols * (CARD.h + GAP.horizontal.y) + CARD.h);
      transpose = flip > keep * 1.15;
    }
    for (const n of nodes) {
      raw.set(
        n.id,
        vertical
          ? {x: n.col! * (CARD.w + GAP.vertical.x), y: n.row! * (CARD.h + GAP.vertical.y)}
          : transpose
            ? {x: n.row! * (CARD.w + GAP.horizontal.x), y: n.col! * (CARD.h + GAP.horizontal.y)}
            : {x: n.col! * (CARD.w + GAP.horizontal.x), y: n.row! * (CARD.h + GAP.horizontal.y)},
      );
    }
    return raw;
  }

  const validEdges = edges.filter((e) => ids.includes(e.from) && ids.includes(e.to) && e.from !== e.to);
  const orient: Orientation = vertical ? 'TB' : 'LR';
  const layers = orderLayers(ids, validEdges, assignLayers(ids, validEdges));
  const gapMain = orient === 'TB' ? 120 : 150;
  const gapCross = orient === 'TB' ? 56 : 60;
  const maxWidth = Math.max(...layers.map((l) => l.length));
  // Chains longer than this wrap into a zig-zag grid (bigger cards on a phone).
  const snakeAt = vertical ? 3 : 5;

  if (maxWidth === 1 && layers.length > snakeAt) {
    const cols = vertical ? 2 : Math.min(4, Math.ceil(layers.length / 2));
    layers.forEach((l, i) => {
      const r = Math.floor(i / cols);
      let c = i % cols;
      if (r % 2 === 1) c = cols - 1 - c;
      raw.set(l[0], {x: c * (CARD.w + 150), y: r * (CARD.h + 130)});
    });
  } else {
    layers.forEach((l, li) => {
      l.forEach((id, i) => {
        const cross = (i - (l.length - 1) / 2) * ((orient === 'TB' ? CARD.w : CARD.h) + gapCross);
        const main = li * ((orient === 'TB' ? CARD.h : CARD.w) + gapMain);
        raw.set(id, orient === 'TB' ? {x: cross, y: main} : {x: main, y: cross});
      });
    });
  }
  return raw;
}

// Layout in world units (cards at their natural size). Edges are routed here, so the
// same routes can be scaled to a box (flow scenes) or moved by a camera (board).
export function layoutWorld(nodes: FlowNode[], edges: FlowEdge[], vertical: boolean): FlowLayout {
  const ids = nodes.map((n) => n.id);
  const raw = rawCenters(nodes, edges, vertical);
  const out: Record<string, NodeLayout> = {};
  for (const id of ids) {
    const p = raw.get(id)!;
    const w = CARD.w;
    const h = CARD.h;
    out[id] = {x: p.x, y: p.y, w, h, rect: {x0: p.x - w / 2, y0: p.y - h / 2, x1: p.x + w / 2, y1: p.y + h / 2}};
  }

  const validEdges = edges.filter((e) => ids.includes(e.from) && ids.includes(e.to) && e.from !== e.to);
  const edgeOut: Record<string, EdgeLayout> = {};
  const pairs = new Set(validEdges.map(edgeId));
  for (const e of validEdges) {
    const a = out[e.from];
    const b = out[e.to];
    const others = ids.filter((id) => id !== e.from && id !== e.to).map((id) => grow(out[id].rect, 16));
    // Two edges between the same pair (a->b and b->a) bend apart.
    const base = pairs.has(`${e.to}->${e.from}`) ? 34 : 0;
    let best: Pt[] | null = null;
    let bestScore = Infinity;
    for (const k of [0, 1, -1, 2, -2, 3, -3, 4, -4]) {
      const pts = curvePoints(a, b, base + k * 80, 48);
      let hits = 0;
      for (const p of pts) for (const r of others) if (inside(p, r)) hits++;
      const score = hits * 1000 + Math.abs(k);
      if (score < bestScore) {
        bestScore = score;
        best = pts;
      }
      if (hits === 0) break;
    }
    edgeOut[edgeId(e)] = {id: edgeId(e), from: e.from, to: e.to, pts: trimPoints(best!, grow(a.rect, 12), grow(b.rect, 12))};
  }
  return {scale: 1, nodes: out, edges: edgeOut};
}

export function layoutBounds(layout: FlowLayout, ids?: string[]): Rect | null {
  const list = (ids ?? Object.keys(layout.nodes)).map((id) => layout.nodes[id]).filter(Boolean);
  if (!list.length) return null;
  return {
    x0: Math.min(...list.map((n) => n.rect.x0)),
    y0: Math.min(...list.map((n) => n.rect.y0)),
    x1: Math.max(...list.map((n) => n.rect.x1)),
    y1: Math.max(...list.map((n) => n.rect.y1)),
  };
}

// Flow scenes: the world layout scaled and centered to fit the content box.
export function layoutFlow(nodes: FlowNode[], edges: FlowEdge[], box: Box, vertical: boolean): FlowLayout {
  const world = layoutWorld(nodes, edges, vertical);
  const b = layoutBounds(world)!;
  const scale = Math.max(0.42, Math.min(1.3, (box.w - 20) / (b.x1 - b.x0), (box.h - 20) / (b.y1 - b.y0)));
  const ox = box.x + box.w / 2 - ((b.x0 + b.x1) / 2) * scale;
  const oy = box.y + box.h / 2 - ((b.y0 + b.y1) / 2) * scale;
  const tp = (p: Pt): Pt => ({x: ox + p.x * scale, y: oy + p.y * scale});
  const nodesOut: Record<string, NodeLayout> = {};
  for (const [id, n] of Object.entries(world.nodes)) {
    const c = tp(n);
    const w = n.w * scale;
    const h = n.h * scale;
    nodesOut[id] = {x: c.x, y: c.y, w, h, rect: {x0: c.x - w / 2, y0: c.y - h / 2, x1: c.x + w / 2, y1: c.y + h / 2}};
  }
  const edgesOut: Record<string, EdgeLayout> = {};
  for (const [id, e] of Object.entries(world.edges)) edgesOut[id] = {...e, pts: e.pts.map(tp)};
  return {scale, nodes: nodesOut, edges: edgesOut};
}

// Path a packet follows from node to node: along existing edges when possible.
export function packetPath(chain: string[], layout: FlowLayout): Pt[] {
  let pts: Pt[] = [];
  for (let i = 0; i < chain.length - 1; i++) {
    const a = chain[i];
    const b = chain[i + 1];
    const fwd = layout.edges[`${a}->${b}`];
    const back = layout.edges[`${b}->${a}`];
    let leg: Pt[];
    if (fwd) leg = fwd.pts;
    else if (back) leg = back.pts.slice().reverse();
    else {
      const na = layout.nodes[a];
      const nb = layout.nodes[b];
      if (!na || !nb) continue;
      leg = trimPoints(curvePoints(na, nb, 0, 32), na.rect, nb.rect);
    }
    pts = pts.length ? pts.concat(leg) : leg.slice();
  }
  return pts;
}
