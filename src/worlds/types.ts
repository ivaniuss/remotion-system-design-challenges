import type {Pt} from './kit';

// A world is the full-frame place a `shot` scene films. It draws itself in a logical
// canvas of W×H units (1600×900 in 16:9, 900×1600 in 9:16) and lays itself out for
// either shape. The engine maps that canvas to pixels, adds the camera move, grain,
// vignette, labels and the title card.

// The named moments of a shot (from its steps' `event`), in scene-local seconds.
export type Events = {
  first(name: string): number | undefined; // first time the moment happens
  all(name: string): number[]; // every time, in order
};

export type WorldFrame = {
  t: number; // seconds since the shot began
  dur: number; // shot length in seconds
  W: number;
  H: number;
  vertical: boolean;
  ev: Events;
};

export type Anchor = Pt & {dx?: number; dy?: number};

export type SoundCue ={t: number; kind: 'spike' | 'tick'; gain?: number};

export type World = {
  draw(c: CanvasRenderingContext2D, f: WorldFrame): void;
  // Where a label is pinned, in logical units (null = not on screen right now). dx/dy
  // place the label text relative to the point; without them it goes outward.
  anchor(name: string, f: WorldFrame): Anchor | null;
  // The world's own sounds (a cell firing, ions passing), scene-local seconds.
  sounds?(f: Omit<WorldFrame, 't'>): SoundCue[];
};

export function eventsOf(steps: {event?: string}[], cues: number[]): Events {
  const map = new Map<string, number[]>();
  steps.forEach((st, i) => {
    if (!st.event) return;
    const list = map.get(st.event) ?? [];
    list.push(cues[i] ?? 0);
    map.set(st.event, list);
  });
  for (const list of map.values()) list.sort((a, b) => a - b);
  return {first: (n) => map.get(n)?.[0], all: (n) => map.get(n) ?? []};
}
