import {CALCIUM, clamp, eio, glow, ground, lerp, MESSENGER, mulberry, noise1, Pt, SODIUM, SPARK, ss, TAU, through} from './kit';
import type {Events, World, WorldFrame} from './types';

// The end of an axon (the terminal, a bulb full of vesicles) facing the next cell
// across the synaptic cleft (~20 nm). Events: `arrive` (the spike reaches the terminal),
// `calcium` (Ca²⁺ channels open, calcium flows in), `release` (vesicles fuse and spill
// neurotransmitter into the cleft), `bind` (it binds receptors; the next cell responds).
// Missing events follow the previous one at a natural pace.

const geo = (f: Pick<WorldFrame, 'W' | 'H' | 'vertical'>) => {
  const BX = f.W / 2;
  const BY = f.vertical ? f.H * 0.36 : 345;
  const BRX = Math.min(330, f.W * 0.4);
  const BRY = 215;
  const cleft = BY + BRY;
  const half = f.W / 2;
  const postY = (x: number) => cleft + 63 - 18 * (1 - ((x - BX) / half) ** 2);
  const receptors = Array.from({length: 9}, (_, i) => BX - 240 + i * 60);
  return {BX, BY, BRX, BRY, cleft, postY, receptors};
};

function times(ev: Events) {
  const arrive = ev.first('arrive') ?? 0.2;
  const calcium = ev.first('calcium') ?? arrive + 1;
  const release = ev.first('release') ?? calcium + 1;
  const bind = ev.first('bind') ?? release + 1.3;
  return {arrive, calcium, release, bind};
}

type Vesicle = Pt & {s: number};
const vesCache = new Map<string, Vesicle[]>();
function vesicles(g: ReturnType<typeof geo>): Vesicle[] {
  const key = `${g.BX},${g.BY},${g.BRX}`;
  const hit = vesCache.get(key);
  if (hit) return hit;
  const r = mulberry(5);
  const out: Vesicle[] = [];
  for (let tries = 0; out.length < 22 && tries < 800; tries++) {
    const x = g.BX + (r() - 0.5) * (g.BRX * 1.7);
    const y = g.BY - 120 + r() * 290;
    if (((x - g.BX) / (g.BRX - 40)) ** 2 + ((y - g.BY) / (g.BRY - 40)) ** 2 > 1) continue;
    if (out.some((v) => Math.hypot(v.x - x, v.y - y) < 50)) continue;
    out.push({x, y, s: out.length});
  }
  vesCache.set(key, out);
  return out;
}

function released(g: ReturnType<typeof geo>, release: number) {
  return [...vesicles(g)]
    .sort((a, b) => b.y - a.y)
    .slice(0, 6)
    .map((v, k) => ({v, t0: release + k * 0.22, dock: {x: clamp(v.x, g.BX - 220, g.BX + 220), y: g.cleft - 26}}));
}

export const synapse: World = {
  draw(c, f) {
    const {t} = f;
    const g = geo(f);
    const T = times(f.ev);
    ground(c, f.W, f.H, '#0b0a22', '#07061a');
    // the next cell
    const top = g.postY(0);
    const pg = c.createLinearGradient(0, top - 20, 0, f.H);
    pg.addColorStop(0, '#3d3088');
    pg.addColorStop(1, '#1d1846');
    c.fillStyle = pg;
    c.beginPath();
    c.moveTo(0, g.postY(0));
    for (let x = 0; x <= f.W; x += 20) c.lineTo(x, g.postY(x));
    c.lineTo(f.W, f.H);
    c.lineTo(0, f.H);
    c.closePath();
    c.fill();
    c.strokeStyle = '#b7a0ff';
    c.lineWidth = 5;
    c.beginPath();
    for (let x = 0; x <= f.W; x += 20) (x ? c.lineTo(x, g.postY(x)) : c.moveTo(x, g.postY(x)));
    c.stroke();
    const resp = ss(T.bind, T.bind + 0.9, t) * (1 - ss(T.bind + 3.3, T.bind + 4.7, t));
    if (resp > 0) glow(c, g.BX, g.cleft + 75, lerp(150, 620, ss(T.bind, T.bind + 2.7, t)), SPARK, resp * 0.55);
    // the terminal
    const bg = c.createLinearGradient(0, g.BY - g.BRY, 0, g.BY + g.BRY);
    bg.addColorStop(0, '#2e2468');
    bg.addColorStop(1, '#4c3a9c');
    c.fillStyle = bg;
    c.fillRect(g.BX - 80, -20, 160, g.BY);
    c.beginPath();
    c.ellipse(g.BX, g.BY, g.BRX, g.BRY, 0, 0, TAU);
    c.fill();
    c.strokeStyle = '#b7a0ff';
    c.lineWidth = 5;
    c.beginPath();
    c.ellipse(g.BX, g.BY, g.BRX, g.BRY, 0, -Math.PI / 2 - 0.27, (3 * Math.PI) / 2 + 0.27, true);
    c.stroke();
    c.beginPath();
    c.moveTo(g.BX - 80, -20);
    c.lineTo(g.BX - 80, g.BY - g.BRY + 12);
    c.moveTo(g.BX + 80, -20);
    c.lineTo(g.BX + 80, g.BY - g.BRY + 12);
    c.stroke();
    c.fillStyle = bg;
    c.fillRect(g.BX - 77, g.BY - g.BRY - 4, 154, 30);
    // the spike arriving down the axon
    if (t < T.arrive + 1.6) {
      const y = lerp(-40, g.BY - 60, ss(T.arrive, T.arrive + 1, t));
      if (t >= T.arrive) glow(c, g.BX, y, 90, SPARK, 1 - ss(T.arrive + 1, T.arrive + 1.6, t));
    }
    const mem = ss(T.arrive + 0.8, T.arrive + 1.2, t) * (1 - ss(T.calcium + 1.5, T.calcium + 3, t));
    if (mem > 0) {
      c.save();
      c.globalAlpha = mem;
      c.strokeStyle = '#ffd27a';
      c.lineWidth = 6;
      c.beginPath();
      c.ellipse(g.BX, g.BY, g.BRX, g.BRY, 0, 0, TAU);
      c.stroke();
      c.restore();
    }
    // calcium channels and ions
    const caO = ss(T.calcium - 0.1, T.calcium + 0.1, t) * (1 - ss(T.calcium + 1.6, T.calcium + 2, t));
    for (const sd of [-1, 1]) {
      const a = sd > 0 ? 0.55 : Math.PI - 0.55;
      const cx = g.BX + Math.cos(a) * g.BRX;
      const cy = g.BY + Math.sin(a) * g.BRY;
      c.save();
      c.translate(cx, cy);
      c.rotate(a + Math.PI / 2);
      c.fillStyle = `rgba(${CALCIUM},0.85)`;
      for (const s of [-1, 1]) c.fillRect(s * (6 + caO * 8) - (s < 0 ? 16 : 0), -22, 16, 44);
      c.restore();
      if (caO > 0) glow(c, cx, cy, 60, CALCIUM, caO * 0.5);
      const nx = Math.cos(a);
      const ny = Math.sin(a);
      for (let k = 0; k < 5; k++) {
        const t0 = T.calcium + k * 0.17 + (sd > 0 ? 0.08 : 0);
        const u = (t - t0) / 1.1;
        const out = {x: cx + nx * 120 + (k - 2) * 16, y: cy + ny * 120};
        const inn = {x: cx - nx * (90 + k * 18), y: cy - ny * (60 + k * 10)};
        const q = u <= 0 ? out : u >= 1 ? {x: inn.x + (noise1(t, k + 60 + sd) - 0.5) * 20, y: inn.y + (noise1(t, k + 70 + sd) - 0.5) * 20} : through([out, {x: cx, y: cy}, inn], u);
        c.fillStyle = `rgb(${CALCIUM})`;
        c.beginPath();
        c.arc(q.x, q.y, 8, 0, TAU);
        c.fill();
      }
    }
    // vesicles: most wait; six dock, fuse and empty into the cleft
    const rel = released(g, T.release);
    for (const v of vesicles(g)) {
      let x = v.x + (noise1(t * 0.5, v.s) - 0.5) * 8;
      let y = v.y + (noise1(t * 0.5, v.s + 30) - 0.5) * 8;
      let r = 21;
      let open = 0;
      const R = rel.find((q) => q.v === v);
      if (R) {
        const u = (t - R.t0) / 0.6;
        if (u > 0) {
          const q = through([{x, y}, R.dock], Math.min(1, u));
          x = q.x;
          y = q.y;
        }
        const fz = (t - R.t0 - 0.6) / 0.35;
        if (fz > 0) {
          open = clamp(fz);
          y = lerp(R.dock.y, g.cleft - 8, open);
          r = lerp(21, 10, open);
        }
      }
      if (open >= 1) continue;
      c.strokeStyle = 'rgba(225,210,255,0.9)';
      c.lineWidth = 2.5;
      c.fillStyle = 'rgba(255,122,168,0.12)';
      c.beginPath();
      c.arc(x, y, r, 0, TAU);
      c.fill();
      c.stroke();
      if (open < 0.5)
        for (let m = 0; m < 5; m++) {
          const a = m * 1.26 + v.s;
          c.fillStyle = `rgb(${MESSENGER})`;
          c.beginPath();
          c.arc(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, 3.4, 0, TAU);
          c.fill();
        }
    }
    // neurotransmitter crossing the cleft, binding, then cleared away
    rel.forEach((R, k) => {
      const tf = R.t0 + 0.95;
      for (let m = 0; m < 5; m++) {
        const u = (t - tf) / 0.55;
        if (u < 0) continue;
        const rx = g.receptors[(k * 2 + m) % g.receptors.length] + (m % 2 ? -6 : 6);
        const st = {x: R.dock.x + (m - 2) * 6, y: g.cleft - 4};
        const en = {x: rx, y: g.postY(rx) - 10};
        let q: Pt;
        if (u < 1) q = {x: lerp(st.x, en.x, eio(u)) + Math.sin(u * 9 + m) * 6, y: lerp(st.y, en.y, eio(u))};
        else {
          const away = ss(T.bind + 2.9, T.bind + 4.1, t);
          q = {x: en.x + away * (m % 2 ? -50 : 50) * (1 + k * 0.2), y: en.y - away * 40};
        }
        const a = 1 - ss(T.bind + 3.7, T.bind + 4.5, t);
        if (a <= 0) continue;
        c.fillStyle = `rgba(${MESSENGER},${a})`;
        c.beginPath();
        c.arc(q.x, q.y, 4.5, 0, TAU);
        c.fill();
      }
    });
    // receptors: they open when bound and let ions into the next cell
    g.receptors.forEach((x, i) => {
      const y = g.postY(x) - 4;
      const on = ss(T.bind + i * 0.05, T.bind + 0.3 + i * 0.05, t) * (1 - ss(T.bind + 3.1, T.bind + 3.9, t));
      c.fillStyle = on > 0.3 ? `rgba(${MESSENGER},${0.6 + on * 0.4})` : '#8a76e0';
      c.fillRect(x - 14, y - 6, 8, 20);
      c.fillRect(x + 6, y - 6, 8, 20);
      if (on > 0) {
        glow(c, x, y + 6, 36, MESSENGER, on * 0.6);
        const u = (t * 1.4 + i * 0.3) % 1;
        c.fillStyle = `rgba(${SODIUM},${on * (1 - u)})`;
        c.beginPath();
        c.arc(x, y + lerp(-6, 60, u), 5, 0, TAU);
        c.fill();
      }
    });
    // a scale bracket on the cleft
    const bx = Math.min(f.W - 60, g.BX + g.BRX + 120);
    c.strokeStyle = 'rgba(220,210,255,0.7)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(bx - 10, g.cleft + 6);
    c.lineTo(bx + 10, g.cleft + 6);
    c.moveTo(bx, g.cleft + 6);
    c.lineTo(bx, g.postY(bx) - 4);
    c.moveTo(bx - 10, g.postY(bx) - 4);
    c.lineTo(bx + 10, g.postY(bx) - 4);
    c.stroke();
  },
  anchor(name, f) {
    const g = geo(f);
    switch (name) {
      case 'terminal':
        return {x: g.BX - 80, y: 110, dx: -180, dy: -30};
      case 'vesicles': {
        const v = [...vesicles(g)].sort((a, b) => a.x - b.x)[0];
        return {x: v.x, y: v.y, dx: -160, dy: -90};
      }
      case 'calcium': {
        const x = g.BX + Math.cos(0.55) * g.BRX;
        const y = g.BY + Math.sin(0.55) * g.BRY;
        return {x, y, dx: f.vertical ? -40 : 170, dy: f.vertical ? 170 : -40};
      }
      case 'gap': {
        const bx = Math.min(f.W - 60, g.BX + g.BRX + 120);
        return {x: bx, y: (g.cleft + g.postY(bx)) / 2, dx: f.vertical ? -60 : 40, dy: f.vertical ? 120 : 0};
      }
      case 'receptors':
        return {x: g.receptors[1], y: g.postY(g.receptors[1]) + 4, dx: -120, dy: 110};
      case 'next':
        return {x: g.BX, y: g.cleft + 200, dx: 0, dy: 90};
      default:
        return null;
    }
  },
  sounds(f) {
    const T = times(f.ev);
    const g = geo(f);
    return [
      {t: T.arrive + 0.95, kind: 'spike' as const, gain: 0.8},
      {t: T.calcium + 0.5, kind: 'tick' as const},
      ...released(g, T.release).map((R) => ({t: R.t0 + 0.6, kind: 'tick' as const, gain: 0.6})),
      {t: T.bind + 0.25, kind: 'spike' as const, gain: 0.55},
    ];
  },
};
