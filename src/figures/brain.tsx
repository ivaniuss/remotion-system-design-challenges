// Large brain illustration (left lateral view, front of the head facing LEFT) for science
// explainers. Pure function of props: regions light up via `glow`, unlit ones fade via `dim`,
// and `frame` only drives a slow shimmer on lit regions (static when nothing glows).
import React from 'react';

export const BRAIN_VIEWBOX = {w: 1000, h: 760} as const;
export const BRAIN_REGIONS = ['frontal', 'parietal', 'temporal', 'occipital', 'cerebellum', 'stem', 'hippocampus'] as const;
export type BrainRegion = (typeof BRAIN_REGIONS)[number];

// A point inside each region (viewBox coords): label placement and signal endpoints.
export const BRAIN_ANCHORS: Record<BrainRegion, {x: number; y: number}> = {
  frontal: {x: 265, y: 255},
  parietal: {x: 650, y: 175},
  temporal: {x: 378, y: 500},
  occipital: {x: 848, y: 335},
  cerebellum: {x: 770, y: 585},
  stem: {x: 598, y: 655},
  hippocampus: {x: 560, y: 510},
};

// ---------------------------------------------------------------- geometry helpers
type P = readonly [number, number];
type Seg = {a: P; c1: P; c2: P; b: P};

const f = (n: number) => Math.round(n * 10) / 10;
const pt = (p: P) => `${f(p[0])} ${f(p[1])}`;

// Catmull-Rom spline through points -> cubic segments (shared by every region that uses a curve,
// so neighbouring regions meet on exactly the same edge).
const cr = (pts: readonly P[], closed = false, k = 1 / 6): Seg[] => {
  const n = pts.length;
  const out: Seg[] = [];
  const count = closed ? n : n - 1;
  for (let i = 0; i < count; i++) {
    const p0 = pts[closed ? (i - 1 + n) % n : Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[closed ? (i + 2) % n : Math.min(i + 2, n - 1)];
    out.push({
      a: p1,
      c1: [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k],
      c2: [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k],
      b: p2,
    });
  }
  return out;
};
const rev = (s: Seg[]): Seg[] => [...s].reverse().map((x) => ({a: x.b, c1: x.c2, c2: x.c1, b: x.a}));
const cmds = (s: Seg[]) => s.map((x) => `C${pt(x.c1)} ${pt(x.c2)} ${pt(x.b)}`).join('');
const open = (s: Seg[]) => `M${pt(s[0].a)}${cmds(s)}`;
const loop = (pts: readonly P[]) => `${open(cr(pts, true))}Z`;
const curve = (pts: readonly P[]) => open(cr(pts));

// Point on a cubic segment + tangent (used to build the hippocampus tube).
const bez = (s: Seg, t: number): P => {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [a * s.a[0] + b * s.c1[0] + c * s.c2[0] + d * s.b[0], a * s.a[1] + b * s.c1[1] + c * s.c2[1] + d * s.b[1]];
};

// ---------------------------------------------------------------- cerebrum outline
const CEREBRUM_PTS: P[] = [
  [90, 345], [99, 262], [138, 186], [204, 126], [290, 86], [390, 63], [496, 55], [602, 62], [702, 86],
  [792, 130], [860, 192], [902, 268], [919, 345], [911, 410], [882, 458], [832, 488], [770, 501],
  [704, 512], [654, 540], [612, 574], [542, 598], [452, 597], [382, 577], [332, 538], [306, 492],
  [314, 456], [335, 440], [290, 446], [220, 446], [152, 428], [106, 392],
];
const CEREBRUM = loop(CEREBRUM_PTS);

// Lobe boundaries (each defined once, split at junctions).
const SYL = cr([[335, 440], [392, 420], [452, 402], [520, 384], [586, 366], [632, 352], [668, 340]]);
const SYL_A = SYL.slice(0, 2); // notch -> central sulcus junction J
const SYL_B = SYL.slice(2); // J -> back end of the fissure
const CEN = cr([[566, 18], [536, 80], [516, 148], [500, 212], [480, 282], [468, 344], [452, 402]]);
const TP = cr([[668, 340], [722, 346], [771, 352]]);
const OCC = cr([[814, 18], [800, 112], [785, 232], [771, 352], [752, 442], [732, 507], [716, 600]]);
const OCC_A = OCC.slice(0, 3);
const OCC_B = OCC.slice(3);
// Separator in the (empty) notch between the frontal underside and the temporal pole.
const NS = cr([[335, 440], [292, 456], [200, 470], [-60, 470]]);

const REGION_D = {
  frontal: `M-60 470${cmds(rev(NS))}${cmds(SYL_A)}${cmds(rev(CEN))}L566 -60L-60 -60Z`,
  parietal: `M452 402${cmds(SYL_B)}${cmds(TP)}${cmds(rev(OCC_A))}L814 -60L566 -60L566 18${cmds(CEN)}Z`,
  occipital: `M814 18${cmds(OCC)}L716 820L1060 820L1060 -60L814 -60Z`,
  temporal: `M335 440${cmds(SYL)}${cmds(TP)}${cmds(OCC_B)}L716 820L-60 820L-60 470${cmds(NS)}Z`,
};
type Lobe = keyof typeof REGION_D;
const LOBES: Lobe[] = ['frontal', 'parietal', 'temporal', 'occipital'];

// Gyri / sulci inside each lobe.
const GYRI: Record<Lobe, string[]> = {
  frontal: [
    curve([[506, 74], [490, 136], [472, 198]]), // precentral sulcus (two pieces)
    curve([[458, 248], [442, 308], [430, 360]]),
    curve([[478, 170], [428, 158], [374, 172], [320, 156], [264, 168], [220, 198]]), // superior frontal
    curve([[456, 268], [408, 254], [356, 270], [300, 256], [250, 274], [206, 312]]), // inferior frontal
    curve([[392, 420], [378, 384], [390, 350]]), // ascending ramus
    curve([[366, 429], [330, 410], [296, 416]]), // horizontal ramus
    curve([[128, 254], [164, 232], [204, 240]]),
    curve([[118, 330], [152, 306], [190, 318], [212, 350]]),
    curve([[332, 96], [292, 112], [268, 136]]),
    curve([[154, 404], [206, 410], [252, 426]]),
  ],
  parietal: [
    curve([[604, 70], [584, 140], [568, 210], [553, 272], [543, 334]]), // postcentral sulcus
    curve([[568, 216], [616, 200], [662, 216], [708, 204], [760, 226]]), // intraparietal
    curve([[668, 340], [690, 314], [696, 286]]), // posterior ascending ramus
    curve([[640, 344], [640, 300], [668, 266], [708, 264], [732, 296], [730, 336]]), // supramarginal
    curve([[652, 110], [692, 142], [742, 134], [778, 162]]),
  ],
  temporal: [
    curve([[352, 468], [404, 450], [462, 446], [522, 432], [572, 424]]), // superior temporal (passes behind the hippocampus)
    curve([[702, 392], [732, 384], [760, 388]]),
    curve([[402, 562], [462, 576], [532, 573], [600, 556], [662, 522], [712, 480]]), // inferior temporal
  ],
  occipital: [
    curve([[800, 282], [840, 302], [880, 290], [906, 302]]),
    curve([[790, 402], [830, 422], [872, 410]]),
    curve([[816, 172], [850, 202], [880, 214]]),
  ],
};

// ---------------------------------------------------------------- cerebellum + stem
const CEREBELLUM = loop([
  [642, 518], [700, 476], [790, 468], [862, 488], [898, 532], [894, 590], [850, 632], [772, 652],
  [690, 642], [636, 612], [616, 570],
]);
// folia: shallow arcs that follow the lower contour (concave up), fanning toward the back
const FOLIA = [96, 122, 148, 174, 200, 226, 252].map((r) => {
  const cx = 742, cy = 404;
  const pts: P[] = [150, 125, 100, 75, 50, 25].map((deg) => {
    const a = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(a) * 1.5, cy + r * Math.sin(a)];
  });
  return curve(pts);
});
const FOLIA_MAIN = 2; // horizontal fissure (drawn heavier)

const STEM = loop([
  [560, 520], [650, 520], [656, 576], [642, 612], [635, 652], [633, 702], [589, 704], [588, 664],
  [564, 642], [544, 612], [540, 574], [548, 540],
]);
const STEM_LINES = [curve([[548, 626], [590, 640], [632, 628]])];

// ---------------------------------------------------------------- hippocampus (x-ray, medial)
const HIPPO_C = cr([
  [458, 506], [506, 520], [562, 518], [614, 502], [652, 474], [672, 440], [666, 406], [640, 390], [614, 398], [608, 424], [624, 438],
]);
const HIPPO_W = [60, 56, 48, 41, 35, 29, 24, 20, 16, 12, 9];
const hippo = (() => {
  const samples: {p: P; n: P; w: number}[] = [];
  const per = 8;
  const tangent = (s: Seg, t: number): P => {
    const u = 1 - t;
    const dx = 3 * u * u * (s.c1[0] - s.a[0]) + 6 * u * t * (s.c2[0] - s.c1[0]) + 3 * t * t * (s.b[0] - s.c2[0]);
    const dy = 3 * u * u * (s.c1[1] - s.a[1]) + 6 * u * t * (s.c2[1] - s.c1[1]) + 3 * t * t * (s.b[1] - s.c2[1]);
    const l = Math.hypot(dx, dy) || 1;
    return [dx / l, dy / l];
  };
  HIPPO_C.forEach((s, i) => {
    const last = i === HIPPO_C.length - 1;
    for (let j = 0; j <= (last ? per : per - 1); j++) {
      const t = j / per;
      const tg = tangent(s, t);
      const w = HIPPO_W[i] + (HIPPO_W[i + 1] - HIPPO_W[i]) * t;
      samples.push({p: bez(s, t), n: [-tg[1], tg[0]], w: w / 2});
    }
  });
  const N = samples.length;
  // underside of the head is scalloped (the "digitations" of the pes hippocampi)
  const bottom = samples.map((s, i) => {
    const u = i / (N - 1);
    const sc = u < 0.3 ? 1 + 0.16 * Math.abs(Math.sin(u * Math.PI * 10)) * (1 - u / 0.3) : 1;
    return [s.p[0] + s.n[0] * s.w * sc, s.p[1] + s.n[1] * s.w * sc] as P;
  });
  const top = samples.map((s) => [s.p[0] - s.n[0] * s.w, s.p[1] - s.n[1] * s.w] as P);
  const h = samples[0];
  const t0: P = [h.n[1], -h.n[0]]; // forward tangent
  const head: P[] = [-66, -33, 0, 33, 66].map((deg) => {
    const a = (deg * Math.PI) / 180;
    // a=-90 -> top side, 0 -> front tip, 90 -> bottom side
    const k = h.w * (1 + 0.08 * Math.cos(a));
    return [h.p[0] + k * (-t0[0] * Math.cos(a) + h.n[0] * Math.sin(a)), h.p[1] + k * (-t0[1] * Math.cos(a) + h.n[1] * Math.sin(a))] as P;
  });
  const e = samples[N - 1];
  const te: P = [e.n[1], -e.n[0]];
  const tip: P = [e.p[0] + te[0] * e.w * 1.3, e.p[1] + te[1] * e.w * 1.3];
  const ring: P[] = [...bottom, tip, ...[...top].reverse(), ...head];
  const lineAt = (i: number, k: number) => [samples[i].p[0] + samples[i].n[0] * samples[i].w * k, samples[i].p[1] + samples[i].n[1] * samples[i].w * k] as P;
  return {
    outline: `M${ring.map(pt).join('L')}Z`,
    smooth: loop(ring.filter((_, i) => i % 2 === 0 || i >= ring.length - head.length)),
    inner: curve([6, 14, 22, 30, 38, 46, 54, 62, 70].map((i) => lineAt(i, -0.2))),
    digits: [3, 8, 13].map((i) => curve([lineAt(i, -0.15), lineAt(i, 0.4), lineAt(i + 1, 0.85)])),
  };
})();

// ---------------------------------------------------------------- palette
const INK = '#1D1D1F';
const PAPER = '#FBFAF6';
type Pal = {base: string; lit: string; halo: string; deep: string};
const PAL: Record<BrainRegion, Pal> = {
  frontal: {base: '#CFE0FF', lit: '#8DB6FF', halo: '#3D86FF', deep: '#1D4FB8'},
  parietal: {base: '#E2D6FF', lit: '#BEA2FF', halo: '#8A5CFF', deep: '#5631B8'},
  temporal: {base: '#C8EEF0', lit: '#78DCE2', halo: '#13B5C2', deep: '#0B6F78'},
  occipital: {base: '#FFD9B8', lit: '#FFB476', halo: '#FF8A2B', deep: '#A84E0A'},
  cerebellum: {base: '#CDEBD3', lit: '#8ADBA2', halo: '#2EB860', deep: '#17703A'},
  stem: {base: '#E4E0D6', lit: '#F2CC8A', halo: '#E39A2E', deep: '#8A5A16'},
  hippocampus: {base: '#FFD84D', lit: '#FFD23A', halo: '#FFB300', deep: '#9A6A00'},
};

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const toHex = (v: number[]) => '#' + v.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');
const mix = (a: string, b: string, t: number) => {
  const A = hex(a), B = hex(b);
  return toHex(A.map((x, i) => x + (B[i] - x) * t));
};
const gray = (c: string) => {
  const [r, g, b] = hex(c);
  const y = 0.3 * r + 0.59 * g + 0.11 * b;
  return toHex([y, y, y]);
};
const clamp = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const PHASE: Record<BrainRegion, number> = {frontal: 0, parietal: 1.3, temporal: 2.6, occipital: 3.9, cerebellum: 5.2, stem: 0.7, hippocampus: 2};

type Look = {g: number; fill: string; lines: string; lineOp: number; fade: number};
const look = (r: BrainRegion, glow: number, dim: number, frame: number): Look => {
  const g0 = clamp(glow);
  // slow shimmer (period 1.6 s) only while lit
  const g = g0 > 0 ? g0 * (0.9 + 0.1 * Math.sin((frame / 48) * Math.PI * 2 + PHASE[r])) : 0;
  const fade = clamp(dim) * (1 - clamp(g0 / 0.3));
  const p = PAL[r];
  let fill = mix(p.base, p.lit, g);
  fill = mix(fill, mix(gray(fill), PAPER, 0.55), fade * 0.85);
  return {g, fill, lines: mix(INK, p.deep, g * 0.75), lineOp: 1 - 0.68 * fade, fade};
};

// ---------------------------------------------------------------- component
export const BrainFigure: React.FC<{
  glow?: Partial<Record<BrainRegion, number>>;
  dim?: number;
  frame: number;
}> = ({glow = {}, dim = 0, frame}) => {
  const L = {} as Record<BrainRegion, Look>;
  for (const r of BRAIN_REGIONS) L[r] = look(r, glow[r] ?? 0, dim, frame);
  const anyFade = Math.max(...BRAIN_REGIONS.map((r) => L[r].fade));
  const outlineOp = 1 - 0.3 * anyFade;
  const stroke = {fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  const regionShape = (r: BrainRegion) =>
    r === 'cerebellum' ? <path d={CEREBELLUM} /> : r === 'stem' ? <path d={STEM} /> : r === 'hippocampus' ? <path d={hippo.smooth} /> : (
      <g clipPath="url(#brainfig-clip-cerebrum)"><path d={REGION_D[r]} /></g>
    );
  const hippo_ = L.hippocampus;
  const hp = PAL.hippocampus;
  const hippoOn = clamp(hippo_.g * 3);

  return (
    <g>
      <defs>
        <clipPath id="brainfig-clip-cerebrum"><path d={CEREBRUM} /></clipPath>
        <clipPath id="brainfig-clip-cerebellum"><path d={CEREBELLUM} /></clipPath>
        <clipPath id="brainfig-clip-stem"><path d={STEM} /></clipPath>
        {LOBES.map((r) => (
          <clipPath key={r} id={`brainfig-clip-${r}`}><path d={REGION_D[r]} /></clipPath>
        ))}
        <filter id="brainfig-halo" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        <filter id="brainfig-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <linearGradient id="brainfig-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.5" />
          <stop offset="0.45" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="1" stopColor="#1D1D1F" stopOpacity="0.13" />
        </linearGradient>
        <radialGradient id="brainfig-hippo-shade" cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* halos behind the whole drawing */}
      {BRAIN_REGIONS.filter((r) => r !== 'hippocampus' && L[r].g > 0).map((r) => (
        <g key={r} filter="url(#brainfig-halo)" opacity={0.85 * L[r].g} fill={PAL[r].halo}>
          {regionShape(r)}
        </g>
      ))}

      {/* brainstem (behind cerebellum and temporal lobe) */}
      <path d={STEM} fill={L.stem.fill} />
      <path d={STEM} fill="url(#brainfig-shade)" />
      <g clipPath="url(#brainfig-clip-stem)">
        {L.stem.g > 0 && <path d={STEM} {...stroke} stroke={PAL.stem.halo} strokeWidth={34} opacity={0.5 * L.stem.g} filter="url(#brainfig-soft)" />}
      </g>
      <g stroke={L.stem.lines} strokeWidth={3.5} opacity={L.stem.lineOp} {...stroke}>
        {STEM_LINES.map((d, i) => <path key={i} d={d} />)}
      </g>
      <path d={STEM} {...stroke} stroke={INK} strokeWidth={6} opacity={outlineOp} />

      {/* cerebellum */}
      <path d={CEREBELLUM} fill={L.cerebellum.fill} />
      <path d={CEREBELLUM} fill="url(#brainfig-shade)" />
      <g clipPath="url(#brainfig-clip-cerebellum)">
        {L.cerebellum.g > 0 && <path d={CEREBELLUM} {...stroke} stroke={PAL.cerebellum.halo} strokeWidth={40} opacity={0.5 * L.cerebellum.g} filter="url(#brainfig-soft)" />}
        <g stroke={L.cerebellum.lines} opacity={L.cerebellum.lineOp} {...stroke}>
          {FOLIA.map((d, i) => <path key={i} d={d} strokeWidth={i === FOLIA_MAIN ? 4.5 : 3} />)}
        </g>
        {L.cerebellum.g > 0 && (
          <g stroke="#FFFFFF" opacity={0.55 * L.cerebellum.g} strokeWidth={1.4} {...stroke} transform="translate(0 -4)">
            {FOLIA.map((d, i) => <path key={i} d={d} />)}
          </g>
        )}
      </g>
      <path d={CEREBELLUM} {...stroke} stroke={INK} strokeWidth={6} opacity={outlineOp} />

      {/* cerebrum: paper base, lobes, depth, sulci, outline */}
      <path d={CEREBRUM} fill={PAPER} />
      <g clipPath="url(#brainfig-clip-cerebrum)">
        {LOBES.map((r) => <path key={r} d={REGION_D[r]} fill={L[r].fill} />)}
        {LOBES.filter((r) => L[r].g > 0).map((r) => (
          <g key={r} clipPath={`url(#brainfig-clip-${r})`}>
            <path d={REGION_D[r]} {...stroke} stroke={PAL[r].halo} strokeWidth={46} opacity={0.55 * L[r].g} filter="url(#brainfig-soft)" />
          </g>
        ))}
        <path d={CEREBRUM} fill="url(#brainfig-shade)" />
        {LOBES.map((r) => (
          <g key={r} stroke={L[r].lines} strokeWidth={3.8} opacity={L[r].lineOp} {...stroke}>
            {GYRI[r].map((d, i) => <path key={i} d={d} />)}
          </g>
        ))}
        {LOBES.filter((r) => L[r].g > 0).map((r) => (
          <g key={r} clipPath={`url(#brainfig-clip-${r})`} stroke="#FFFFFF" strokeWidth={1.5} opacity={0.6 * L[r].g} {...stroke} transform="translate(0 -3)">
            {GYRI[r].map((d, i) => <path key={i} d={d} />)}
          </g>
        ))}
      </g>
      {/* lobe boundaries: lateral + central sulci (heavy), the arbitrary ones lighter */}
      <g {...stroke} stroke={INK} opacity={outlineOp}>
        <path d={open(TP)} strokeWidth={3.5} />
        <g clipPath="url(#brainfig-clip-cerebrum)">
          <path d={open(OCC)} strokeWidth={3.5} />
          <path d={open(CEN)} strokeWidth={5} />
        </g>
        <path d={open(SYL)} strokeWidth={5.5} />
      </g>
      <path d={CEREBRUM} {...stroke} stroke={INK} strokeWidth={6} opacity={outlineOp} />

      {/* hippocampus, x-ray inside the temporal lobe */}
      {hippo_.g > 0 && (
        <g filter="url(#brainfig-halo)" opacity={0.95 * hippo_.g}>
          <path d={hippo.smooth} fill={hp.halo} stroke={hp.halo} strokeWidth={14} />
        </g>
      )}
      {/* continuous blend: faint dashed "x-ray" outline (g=0) -> solid yellow organ (g>=~0.35) */}
      <g opacity={1 - 0.6 * hippo_.fade}>
        <path d={hippo.smooth} fill={mix('#FFFFFF', hp.lit, hippoOn)} fillOpacity={0.3 + 0.7 * hippoOn} />
        {hippoOn > 0 && <path d={hippo.smooth} fill="url(#brainfig-hippo-shade)" opacity={hippoOn} />}
        <g {...stroke} stroke={mix(INK, hp.deep, 0.4 * hippoOn)} opacity={0.45 + 0.55 * hippoOn}>
          {[hippo.inner, ...hippo.digits].map((d, i) => <path key={i} d={d} strokeWidth={2.8} />)}
        </g>
        {hippoOn < 1 && <path d={hippo.smooth} {...stroke} stroke={INK} strokeWidth={3} strokeDasharray="9 8" opacity={0.6 * (1 - hippoOn)} />}
        {hippoOn > 0 && <path d={hippo.smooth} {...stroke} stroke={INK} strokeWidth={4.2} opacity={hippoOn} />}
      </g>
    </g>
  );
};
