import type {FlowScene} from '../spec/schema';
import type {ColorName, CrowdDensity, Status, Tone} from '../spec/vocab';
import {edgeId} from '../layout/flow';

// What a flow diagram looks like at scene time t, derived from its steps.

export type Vis = {on: boolean; since: number; off: number};
export type PacketRun = {chain: string[]; label?: string; color?: ColorName; start: number; seconds: number};
// A stream of dots from one node to another that piles up where it arrives. `end` is when
// an `off` step cleared it (null = still going). `seed` keeps every dot in the same place
// on every render: everything here is a pure function of time.
export type CrowdRun = {chain: string[]; density: CrowdDensity; label?: string; color?: ColorName; start: number; end: number | null; seed: number};
// A fill bar under a node; `prev` is the value it grows from.
export type MeterRun = {value: number; prev: number; label?: string; tone?: Tone; since: number};
// A ring that runs out over `over` seconds of video.
export type ClockRun = {label?: string; over: number; end?: string; since: number};
export type FlowState = {
  nodes: Record<string, Vis>;
  edges: Record<string, Vis>;
  status: Record<string, {status: Status; since: number}>;
  focus: {ids: Set<string>; since: number} | null;
  note: {text: string; tone: Tone; near?: string; since: number} | null;
  packets: PacketRun[];
  crowds: CrowdRun[];
  meters: Record<string, MeterRun>;
  clocks: Record<string, ClockRun>;
};

// Applies the crowd / meter / clock fields of one step (shared by flow scenes and the board).
export function applyMetrics(
  step: {crowd?: unknown; meter?: unknown; clock?: unknown},
  at: number,
  crowds: CrowdRun[],
  meters: FlowState['meters'],
  clocks: FlowState['clocks'],
  seed: number,
): void {
  const c = step.crowd as {from: string; to: string; via?: string[]; density: CrowdDensity; label?: string; color?: ColorName} | 'off' | undefined;
  if (c === 'off') {
    for (const run of crowds) if (run.end === null) run.end = at;
  } else if (c) {
    crowds.push({chain: [c.from, ...(c.via ?? []), c.to], density: c.density, label: c.label, color: c.color, start: at, end: null, seed});
  }
  for (const [id, m] of Object.entries((step.meter ?? {}) as Record<string, 'off' | {value: number; label?: string; tone?: Tone}>)) {
    if (m === 'off') delete meters[id];
    else meters[id] = {value: m.value, prev: meters[id]?.value ?? 0, label: m.label, tone: m.tone, since: at};
  }
  for (const [id, k] of Object.entries((step.clock ?? {}) as Record<string, 'off' | {label?: string; over: number; end?: string}>)) {
    if (k === 'off') delete clocks[id];
    else clocks[id] = {label: k.label, over: k.over, end: k.end, since: at};
  }
}

const NEVER = -1e9;
export const PACKET_LEG_SECONDS = 0.95;

export function flowState(scene: FlowScene, cues: number[], t: number): FlowState {
  const hiddenAtStart = new Set<string>();
  for (const st of scene.steps) for (const id of st.show ?? []) hiddenAtStart.add(id);

  const nodes: Record<string, Vis> = {};
  scene.nodes.forEach((n, i) => {
    nodes[n.id] = hiddenAtStart.has(n.id) ? {on: false, since: NEVER, off: NEVER} : {on: true, since: 0.1 + i * 0.07, off: NEVER};
  });
  const explicitEdges: Record<string, Vis> = {};
  for (const e of scene.edges) {
    const id = edgeId(e);
    if (hiddenAtStart.has(id)) explicitEdges[id] = {on: false, since: NEVER, off: NEVER};
  }

  const status: FlowState['status'] = {};
  let focus: FlowState['focus'] = null;
  let note: FlowState['note'] = null;
  const packets: PacketRun[] = [];
  const crowds: CrowdRun[] = [];
  const meters: FlowState['meters'] = {};
  const clocks: FlowState['clocks'] = {};

  const set = (map: Record<string, Vis>, id: string, on: boolean, time: number) => {
    const v = map[id];
    if (!v) return;
    if (on && !v.on) map[id] = {on: true, since: time, off: v.off};
    if (!on && v.on) map[id] = {on: false, since: v.since, off: time};
  };

  scene.steps.forEach((st, i) => {
    const at = cues[i] ?? 0;
    if (at > t) return;
    (st.show ?? []).forEach((id, j) => {
      const time = at + j * 0.1;
      if (id in nodes) set(nodes, id, true, time);
      else if (id in explicitEdges) set(explicitEdges, id, true, time);
    });
    for (const id of st.hide ?? []) {
      if (id in nodes) set(nodes, id, false, at);
      else if (id in explicitEdges) set(explicitEdges, id, false, at);
    }
    if (st.focus) focus = st.focus.length ? {ids: new Set(st.focus), since: at} : null;
    for (const [id, s] of Object.entries(st.status ?? {})) status[id] = {status: s, since: at};
    if (st.note) note = {...st.note, since: at};
    if (st.packet) {
      const chain = [st.packet.from, ...(st.packet.via ?? []), st.packet.to];
      packets.push({chain, label: st.packet.label, color: st.packet.color, start: at, seconds: PACKET_LEG_SECONDS * (chain.length - 1) + 0.25});
    }
    applyMetrics(st, at, crowds, meters, clocks, 1 + i);
  });

  // Edges without an explicit show appear once both ends are visible.
  const edges: Record<string, Vis> = {};
  for (const e of scene.edges) {
    const id = edgeId(e);
    if (explicitEdges[id]) {
      edges[id] = explicitEdges[id];
      continue;
    }
    const a = nodes[e.from];
    const b = nodes[e.to];
    if (!a || !b) continue;
    const on = a.on && b.on;
    edges[id] = {on, since: Math.max(a.since, b.since) + 0.25, off: Math.max(a.off, b.off)};
  }

  return {nodes, edges, status, focus, note, packets, crowds, meters, clocks};
}
