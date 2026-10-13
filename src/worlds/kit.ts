// Drawing kit shared by the worlds of `shot` scenes. Everything here is deterministic:
// no Math.random, no clocks. A world is a pure function of (time, events), like every
// other scene of the engine, so the Studio, the renderer and `npm run check` agree.

export const TAU = Math.PI * 2;
export const PI = Math.PI;
export const clamp = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
// Smoothstep between edges a and b.
export const ss = (a: number, b: number, x: number) => {
  const u = clamp((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};
export const eio = (u: number) => {
  const k = clamp(u);
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
};
export const eout = (u: number) => 1 - Math.pow(1 - clamp(u), 3);

// Integer hash -> [0, 1).
export function hash(i: number, j: number): number {
  let h = (Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
// Smooth value noise in [0, 1).
export function noise1(x: number, seed: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(hash(i, seed), hash(i + 1, seed), u);
}
// Seeded PRNG (for geometry built once at module load).
export function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function lerpAng(a: number, b: number, k: number) {
  const d = ((b - a + PI * 3) % TAU) - PI;
  return a + d * k;
}

// ---------- colors
const rgbCache = new Map<string, [number, number, number]>();
function rgbOf(hex: string): [number, number, number] {
  let v = rgbCache.get(hex);
  if (!v) {
    const s = hex.slice(1);
    v = [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16)) as [number, number, number];
    rgbCache.set(hex, v);
  }
  return v;
}
export function mix(a: string, b: string, k: number): string {
  const A = rgbOf(a);
  const B = rgbOf(b);
  const t = clamp(k);
  return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`;
}
export function ramp(stops: string[], k: number): string {
  const n = stops.length - 1;
  const x = clamp(k) * n;
  const i = Math.min(n - 1, Math.floor(x));
  return mix(stops[i], stops[i + 1], x - i);
}

// Light colors as "r,g,b" (used with rgba() and the glow sprites).
export const SPARK = '255,210,122'; // excitation, the spike
export const BRAKE = '111,182,255'; // inhibition
export const SODIUM = '255,154,77';
export const POTASSIUM = '83,214,196';
export const CALCIUM = '185,228,255';
export const MESSENGER = '255,122,168'; // neurotransmitter
export const VIOLET = '120,90,230';

// ---------- glow sprites (radial light, drawn additively)
// Offscreen canvases come from the browser. Outside one (the NaN check in node) the
// factory returns null and glows fall back to a plain radial gradient.
type CanvasFactory = (w: number, h: number) => HTMLCanvasElement | null;
let makeCanvas: CanvasFactory = (w, h) => {
  if (typeof document === 'undefined') return null;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  return cv;
};
export function setCanvasFactory(f: CanvasFactory) {
  makeCanvas = f;
  sprites.clear();
}
export const offscreen = (w: number, h: number) => makeCanvas(w, h);

const sprites = new Map<string, HTMLCanvasElement | null>();
function sprite(rgb: string): HTMLCanvasElement | null {
  if (sprites.has(rgb)) return sprites.get(rgb) ?? null;
  const cv = makeCanvas(128, 128);
  const g = cv?.getContext('2d');
  if (cv && g) {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.1, `rgba(${rgb},1)`);
    gr.addColorStop(0.35, `rgba(${rgb},0.35)`);
    gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
  }
  sprites.set(rgb, cv && g ? cv : null);
  return sprites.get(rgb) ?? null;
}

export function glow(c: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: string, a = 1) {
  if (!(a > 0.003) || !(r > 0)) return;
  const op = c.globalCompositeOperation;
  const ga = c.globalAlpha;
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = ga * Math.min(1, a);
  const s = sprite(rgb);
  if (s) c.drawImage(s, x - r, y - r, r * 2, r * 2);
  else {
    const gr = c.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${rgb},1)`);
    gr.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = gr;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  c.globalCompositeOperation = op;
  c.globalAlpha = ga;
}

// A dark, faintly lit ground: the inside of tissue.
export function ground(c: CanvasRenderingContext2D, W: number, H: number, top = '#0b0a20', bottom = '#05040f') {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  glow(c, W * 0.3, H * 0.4, Math.max(W, H) * 0.45, '90,60,200', 0.18);
  glow(c, W * 0.8, H * 0.7, Math.max(W, H) * 0.38, '60,40,160', 0.14);
}

// ---------- polylines with arc-length lookup (for pulses travelling along branches)
export type Pt = {x: number; y: number};
export type Path = {pts: Pt[]; cum: number[]; len: number};
export function mkPath(pts: Pt[]): Path {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return {pts, cum, len: cum[cum.length - 1]};
}
export function along(P: Path, u: number): Pt {
  const d = clamp(u) * P.len;
  let i = 1;
  while (i < P.cum.length - 1 && P.cum[i] < d) i++;
  const a = P.pts[i - 1];
  const b = P.pts[i];
  const f = (d - P.cum[i - 1]) / Math.max(1e-6, P.cum[i] - P.cum[i - 1]);
  return {x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f)};
}
// Waypoints joined with an ease per segment.
export function through(pts: Pt[], u: number): Pt {
  const n = pts.length - 1;
  const x = clamp(u) * n;
  const i = Math.min(n - 1, Math.floor(x));
  const f = eio(x - i);
  return {x: lerp(pts[i].x, pts[i + 1].x, f), y: lerp(pts[i].y, pts[i + 1].y, f)};
}

// A quadratic segment.
export type Seg = {x0: number; y0: number; cx: number; cy: number; x1: number; y1: number};
export function onSeg(s: Seg, u: number): Pt {
  const v = 1 - u;
  return {x: v * v * s.x0 + 2 * v * u * s.cx + u * u * s.x1, y: v * v * s.y0 + 2 * v * u * s.cy + u * u * s.y1};
}
export function strokeSeg(c: CanvasRenderingContext2D, s: Seg) {
  c.beginPath();
  c.moveTo(s.x0, s.y0);
  c.quadraticCurveTo(s.cx, s.cy, s.x1, s.y1);
  c.stroke();
}

// A pulse with a short comet tail along a path.
export function pulse(c: CanvasRenderingContext2D, P: Path, u: number, rgb: string, size = 14, a = 1) {
  if (u <= 0 || u > 1) return;
  for (let i = 4; i >= 0; i--) {
    const p = along(P, u - i * 0.012);
    glow(c, p.x, p.y, size * (i ? 1.6 : 3), rgb, a * (i ? 0.25 : 1));
  }
}

// ---------- camera: world point -> logical screen point (W×H), optional quarter turn
export type Cam = {cx: number; cy: number; zoom: number; rot: number; W: number; H: number};
export function applyCam(c: CanvasRenderingContext2D, k: Cam) {
  c.translate(k.W / 2, k.H / 2);
  if (k.rot) c.rotate(k.rot);
  c.scale(k.zoom, k.zoom);
  c.translate(-k.cx, -k.cy);
}
export function camPoint(k: Cam, x: number, y: number): Pt {
  const dx = (x - k.cx) * k.zoom;
  const dy = (y - k.cy) * k.zoom;
  const cs = Math.cos(k.rot);
  const sn = Math.sin(k.rot);
  return {x: k.W / 2 + dx * cs - dy * sn, y: k.H / 2 + dx * sn + dy * cs};
}
export function blendCam(a: Omit<Cam, 'W' | 'H'>, b: Omit<Cam, 'W' | 'H'>, k: number): Omit<Cam, 'W' | 'H'> {
  return {cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), zoom: lerp(a.zoom, b.zoom, k), rot: lerp(a.rot, b.rot, k)};
}

// Membrane voltage of one action potential, `dt` seconds after it starts from `v0`
// (screen time: about 300× slower than real life). Peak +40 mV, undershoot −80 mV.
export function spikeV(dt: number, v0 = -70, rise = 0.12, fall = 0.3, rec = 1.08): number {
  if (dt < 0) return v0;
  if (dt < rise) return lerp(v0, 40, eio(dt / rise));
  if (dt < rise + fall) return lerp(40, -80, eio((dt - rise) / fall));
  if (dt < rise + fall + rec) return lerp(-80, -70, eout((dt - rise - fall) / rec));
  return -70;
}
export const MINUS = '−';
export const mv = (v: number) => `${v > 0.5 ? '+' : v < -0.5 ? MINUS : ''}${Math.abs(Math.round(v))} mV`;
