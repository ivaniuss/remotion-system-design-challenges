// Polyline helpers used by edges, packets and hand-drawn strokes.

export type Pt = {x: number; y: number};
export type Rect = {x0: number; y0: number; x1: number; y1: number};

export const inside = (p: Pt, r: Rect) => p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1;
export const grow = (r: Rect, d: number): Rect => ({x0: r.x0 - d, y0: r.y0 - d, x1: r.x1 + d, y1: r.y1 + d});

// Quadratic curve from a to b; `bend` pushes the control point to the right of the
// direction of travel (negative = left).
export function curvePoints(a: Pt, b: Pt, bend = 0, steps = 48): Pt[] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = (a.x + b.x) / 2 + (-dy / len) * bend;
  const cy = (a.y + b.y) / 2 + (dx / len) * bend;
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    out.push({x: u * u * a.x + 2 * u * t * cx + t * t * b.x, y: u * u * a.y + 2 * u * t * cy + t * t * b.y});
  }
  return out;
}

// Drops the points that fall inside the start and end boxes, so arrows touch borders.
export function trimPoints(pts: Pt[], a: Rect, b: Rect): Pt[] {
  let s = 0;
  while (s < pts.length - 1 && inside(pts[s], a)) s++;
  let e = pts.length - 1;
  while (e > 0 && inside(pts[e], b)) e--;
  if (s >= e) return [pts[0], pts[pts.length - 1]];
  return pts.slice(s, e + 1);
}

export function cumulative(pts: Pt[]): number[] {
  const out = [0];
  for (let i = 1; i < pts.length; i++) out.push(out[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return out;
}

export function pointAt(pts: Pt[], cum: number[], s: number): Pt {
  if (pts.length === 0) return {x: 0, y: 0};
  const total = cum[cum.length - 1];
  if (pts.length === 1 || total <= 0) return pts[0];
  const target = Math.min(Math.max(s, 0), total);
  let i = 1;
  while (i < cum.length - 1 && cum[i] < target) i++;
  const seg = cum[i] - cum[i - 1] || 1;
  const k = (target - cum[i - 1]) / seg;
  return {x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * k, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * k};
}

// Point at a fraction 0..1 of the polyline length.
export function pointAtFrac(pts: Pt[], frac: number): Pt {
  const cum = cumulative(pts);
  return pointAt(pts, cum, cum[cum.length - 1] * frac);
}

// Leading part of a polyline up to a fraction of its length (draw-on animation).
export function prefix(pts: Pt[], frac: number): Pt[] {
  if (frac >= 1 || pts.length < 2) return pts;
  const cum = cumulative(pts);
  const target = cum[cum.length - 1] * Math.max(0, frac);
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (cum[i] <= target) {
      out.push(pts[i]);
      continue;
    }
    out.push(pointAt(pts, cum, target));
    break;
  }
  return out;
}

export const pathD = (pts: Pt[]) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

// Unit direction of the last segment (for arrow heads).
export function endDirection(pts: Pt[]): Pt {
  const n = pts.length;
  if (n < 2) return {x: 1, y: 0};
  const a = pts[Math.max(0, n - 3)];
  const b = pts[n - 1];
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return {x: (b.x - a.x) / len, y: (b.y - a.y) / len};
}
