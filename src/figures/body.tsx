// A person seen from the side (facing right) with the nervous system drawn inside: the brain,
// the spinal cord down the back with a "gate" where the arm nerves enter, the arm nerve bundle
// (a fast myelinated fiber and a slow bare one) out to the hand, the biceps, and the leg nerve
// down to the foot. Made for science explainers about reflexes, pain, touch, movement and
// reaction times. Pure function of props: regions light up via `glow`, unlit ones fade via
// `dim`, `frame` drives the ambient motion (heat shimmer, flames, a flexing muscle), and
// `props` turns on optional objects (a hot pan on a stove under the hand).
import React from 'react';

export const BODY_VIEWBOX = {w: 800, h: 1100} as const;
export const BODY_REGIONS = ['brain', 'cord', 'gate', 'hand', 'elbow', 'arm', 'fast', 'slow', 'leg', 'foot', 'pan'] as const;
export type BodyRegion = (typeof BODY_REGIONS)[number];
export const BODY_PROPS = ['pan'] as const;

type Pt = {x: number; y: number};
const TAU = Math.PI * 2;
const f = (n: number) => Math.round(n * 10) / 10;
const clamp = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const P = (x: number, y: number): Pt => ({x, y});

// ---------------------------------------------------------------- geometry
const BRAIN_C = P(250, 132);
// Spinal cord: from the brainstem down the back to the lower back.
const CORD_PTS = [P(242, 206), P(236, 250), P(230, 296), P(228, 318), P(226, 380), P(226, 460), P(229, 540), P(232, 600)];
const GATE = P(228, 318); // where the arm nerves enter the cord
const LEG_ROOT = P(232, 600);
// The arm nerve bundle, from the cord to the fingertips (the center line of the bundle).
const ARM_NERVE = [GATE, P(268, 316), P(328, 348), P(402, 402), P(480, 426), P(556, 450), P(626, 474)];
const LEG_NERVE = [LEG_ROOT, P(244, 650), P(258, 760), P(270, 850), P(262, 950), P(256, 1030), P(298, 1056), P(334, 1060)];
const MOTOR = [GATE, P(268, 318), P(318, 344), P(336, 356)];
const BICEPS = P(334, 352);

const pathD = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${f(p.x)} ${f(p.y)}`).join('');
// A smooth path through points (Catmull-Rom as cubic Béziers).
const smoothD = (pts: Pt[]) => {
  let d = `M${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = P(p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6);
    const c2 = P(p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6);
    d += `C${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return d;
};
// The same polyline moved sideways by `d` (positive = to the left of the direction of travel).
const offset = (pts: Pt[], d: number) =>
  pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return P(p.x - ((b.y - a.y) / len) * d, p.y + ((b.x - a.x) / len) * d);
  });
const lengthOf = (pts: Pt[]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p.x - pts[i].x, p.y - pts[i].y), 0);
const pointAt = (pts: Pt[], u: number): Pt & {ang: number} => {
  const total = lengthOf(pts);
  let d = clamp(u) * total;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (d <= seg || i === pts.length - 1) {
      const k = seg ? clamp(d / seg) : 0;
      return {x: lerp(pts[i - 1].x, pts[i].x, k), y: lerp(pts[i - 1].y, pts[i].y, k), ang: Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x)};
    }
    d -= seg;
  }
  return {...pts[pts.length - 1], ang: 0};
};
const FAST = offset(ARM_NERVE, 7); // drawn on the upper side of the bundle
const SLOW = offset(ARM_NERVE, -7);
const rev = (pts: Pt[]) => [...pts].reverse();
const cordBetween = (y0: number, y1: number) => {
  // Points of the cord between two heights, in travel order.
  const pts = CORD_PTS.filter((p) => p.y > Math.min(y0, y1) && p.y < Math.max(y0, y1));
  const a = pointOnCord(y0);
  const b = pointOnCord(y1);
  const mid = y0 < y1 ? pts : rev(pts);
  return [a, ...mid, b];
};
function pointOnCord(y: number): Pt {
  for (let i = 1; i < CORD_PTS.length; i++) {
    const a = CORD_PTS[i - 1];
    const b = CORD_PTS[i];
    if (y <= b.y) return P(lerp(a.x, b.x, clamp((y - a.y) / (b.y - a.y || 1))), y);
  }
  return CORD_PTS[CORD_PTS.length - 1];
}
const TO_BRAIN = [...cordBetween(GATE.y, 206), P(244, 178), BRAIN_C];

export const BODY_ANCHORS: Record<BodyRegion, Pt> = {
  brain: BRAIN_C,
  cord: P(227, 450),
  gate: GATE,
  hand: P(622, 474),
  elbow: P(404, 424),
  arm: BICEPS,
  fast: pointAt(FAST, 0.4), // the two fibers are labelled at different points so their labels never meet
  slow: pointAt(SLOW, 0.82),
  leg: P(266, 820),
  foot: P(322, 1062),
  pan: P(650, 556),
};

// Where a travelling signal goes, region to region: along the real nerves of the drawing.
export function bodyRoute(from: string, to: string, variant: number): Pt[] {
  const armIn = (nerve: Pt[]) => rev(nerve); // hand → cord
  const handPath = variant % 2 === 1 ? SLOW : FAST;
  const elbowIn = () => {
    // From the skin at the elbow, into the bundle, up to the cord.
    const k = ARM_NERVE.findIndex((p) => p.x >= 402);
    return [BODY_ANCHORS.elbow, ...rev(ARM_NERVE.slice(0, k + 1))];
  };
  const key = `${from}>${to}`;
  switch (key) {
    case 'hand>cord':
    case 'hand>gate':
      return armIn(handPath);
    case 'fast>cord':
    case 'fast>gate':
      return armIn(FAST);
    case 'slow>cord':
    case 'slow>gate':
      return armIn(SLOW);
    case 'hand>brain':
      return [...armIn(handPath), ...TO_BRAIN.slice(1)];
    case 'fast>brain':
      return [...armIn(FAST), ...TO_BRAIN.slice(1)];
    case 'slow>brain':
      return [...armIn(SLOW), ...TO_BRAIN.slice(1)];
    case 'cord>arm':
    case 'gate>arm':
      return MOTOR;
    case 'cord>brain':
    case 'gate>brain':
      return TO_BRAIN;
    case 'brain>cord':
    case 'brain>gate':
      return rev(TO_BRAIN);
    case 'brain>arm':
      return [...rev(TO_BRAIN), ...MOTOR.slice(1)];
    case 'elbow>gate':
    case 'elbow>cord':
      return elbowIn();
    case 'elbow>brain':
      return [...elbowIn(), ...TO_BRAIN.slice(1)];
    case 'pan>hand':
      return [BODY_ANCHORS.pan, BODY_ANCHORS.hand];
    case 'foot>cord':
    case 'leg>cord':
      return rev(LEG_NERVE);
    case 'foot>brain':
    case 'leg>brain':
      return [...rev(LEG_NERVE), ...cordBetween(LEG_ROOT.y, 206).slice(1), P(244, 178), BRAIN_C];
    case 'cord>leg':
    case 'cord>foot':
      return LEG_NERVE;
  }
  return [BODY_ANCHORS[from as BodyRegion] ?? BRAIN_C, BODY_ANCHORS[to as BodyRegion] ?? BRAIN_C];
}

// ---------------------------------------------------------------- palette
// A deep violet, glowing body (the look of the neuron film); the nervous system is bright and
// turns amber where it is lit. Reads on dark and on light backgrounds.
const SKIN = '#2B2366';
const SKIN_LINE = '#9C88FF';
const NERVE = '#B9A6FF';
const AMBER = '#FFC94D';
const OUTLINE = '#3A2A86';
const HALO: Record<BodyRegion, string> = {
  brain: '#FF8FC8', cord: '#FFB43C', gate: '#3DDC97', hand: '#FF7A45', elbow: '#7CC4FF', arm: '#FF7A7A',
  fast: '#6FB8FF', slow: '#FF9A5C', leg: '#FFB43C', foot: '#FF7A45', pan: '#FF8A3D',
};
const PHASE: Record<BodyRegion, number> = {brain: 0, cord: 1.1, gate: 2.2, hand: 3.3, elbow: 4.4, arm: 5.5, fast: 0.6, slow: 1.7, leg: 2.8, foot: 3.9, pan: 5};

type Look = {g: number; op: number};
const look = (r: BodyRegion, glow: number, dim: number, frame: number): Look => {
  const g0 = clamp(glow);
  const g = g0 > 0 ? g0 * (0.9 + 0.1 * Math.sin((frame / 44) * TAU + PHASE[r])) : 0;
  const fade = clamp(dim) * (1 - clamp(g0 / 0.3));
  return {g, op: 1 - 0.6 * fade};
};

const round = {fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};

// ---------------------------------------------------------------- body outline
const TORSO =
  'M255 55 C315 55 345 95 345 140 L357 168 L342 176 C342 200 336 222 316 232 C306 238 300 244 298 252 ' +
  'L302 285 C332 300 354 340 352 400 C350 470 332 560 320 640 L196 640 C190 540 196 420 200 330 ' +
  'C202 290 200 262 206 246 C182 230 165 195 165 150 C165 95 200 55 255 55 Z';
const UPPER_ARM = [P(268, 300), P(402, 410)];
const FOREARM = [P(402, 410), P(556, 452)];
const HAND =
  'M548 436 C580 430 622 440 650 460 C664 470 666 486 652 492 C630 500 600 496 574 488 C556 482 546 470 546 456 Z';
const THUMB = 'M566 440 C580 424 598 422 608 432';
const THIGH = [P(252, 628), P(272, 850)];
const SHIN = [P(272, 850), P(256, 1030)];
const FOOT = 'M226 1016 C222 1048 236 1072 264 1074 L338 1076 C356 1076 360 1056 342 1050 L288 1034 Z';
const BRAIN =
  'M190 132 C186 100 210 78 238 82 C252 66 284 70 294 86 C318 86 330 108 322 128 C334 146 320 172 296 170 ' +
  'C288 186 262 190 250 180 C232 192 204 186 200 168 C184 162 180 142 190 132 Z';
const GYRI = ['M214 110 Q228 120 222 140', 'M248 90 Q254 108 272 110', 'M290 104 Q280 122 298 136', 'M220 160 Q240 150 258 162', 'M266 140 Q282 152 300 148'];
const VERTEBRAE = [250, 290, 330, 370, 410, 450, 490, 530, 570, 610].map((y) => pointOnCord(Math.min(y, 600)));

const limb = (pts: Pt[], w: number, color: string, key: string) => (
  <path key={key} d={pathD(pts)} {...round} stroke={color} strokeWidth={w} />
);

// ---------------------------------------------------------------- component
export const BodyFigure: React.FC<{glow?: Partial<Record<BodyRegion, number>>; dim?: number; frame: number; props?: readonly string[]}> = ({
  glow = {},
  dim = 0,
  frame,
  props = [],
}) => {
  const time = frame / 30;
  const L = {} as Record<BodyRegion, Look>;
  for (const r of BODY_REGIONS) L[r] = look(r, glow[r] ?? 0, dim, frame);
  const pan = props.includes('pan');
  const bodyOp = 1 - 0.35 * clamp(dim);

  // Halos behind everything for the lit regions.
  const haloShape = (r: BodyRegion): React.ReactNode => {
    const c = HALO[r];
    switch (r) {
      case 'brain':
        return <path d={BRAIN} fill={c} transform="translate(250 130) scale(1.18) translate(-250 -130)" />;
      case 'cord':
        return <path d={smoothD(CORD_PTS)} {...round} stroke={c} strokeWidth={40} />;
      case 'gate':
        return <circle cx={GATE.x} cy={GATE.y} r={34} fill={c} />;
      case 'hand':
        return <path d={HAND} fill={c} transform="translate(600 465) scale(1.3) translate(-600 -465)" />;
      case 'elbow':
        return <circle cx={BODY_ANCHORS.elbow.x} cy={BODY_ANCHORS.elbow.y} r={42} fill={c} />;
      case 'arm':
        return <ellipse cx={BICEPS.x} cy={BICEPS.y} rx={60} ry={36} transform={`rotate(39 ${BICEPS.x} ${BICEPS.y})`} fill={c} />;
      case 'fast':
        return <path d={smoothD(FAST)} {...round} stroke={c} strokeWidth={22} />;
      case 'slow':
        return <path d={smoothD(SLOW)} {...round} stroke={c} strokeWidth={22} />;
      case 'leg':
        return <path d={smoothD(LEG_NERVE)} {...round} stroke={c} strokeWidth={30} />;
      case 'foot':
        return <path d={FOOT} fill={c} transform="translate(290 1056) scale(1.3) translate(-290 -1056)" />;
      case 'pan':
        return pan ? <ellipse cx={650} cy={566} rx={120} ry={40} fill={c} /> : null;
    }
  };

  // ---- the hot pan on a stove (optional prop)
  const flames = [600, 650, 700].map((x, i) => {
    const k = 1 + 0.12 * Math.sin(time * 9 + i * 2.1) + 0.06 * Math.sin(time * 15 + i);
    return (
      <g key={i} transform={`translate(${x} 632) scale(${2 - k} ${k}) translate(${-x} -632)`}>
        <path d={`M${x} 632 C${x - 22} 632 ${x - 26} 612 ${x - 16} 598 C${x - 10} 590 ${x - 6} 584 ${x - 6} 572 C${x + 6} 582 ${x + 18} 596 ${x + 20} 610 C${x + 22} 624 ${x + 16} 632 ${x} 632 Z`} fill="#FF8A3D" stroke={OUTLINE} strokeWidth={2.5} />
        <path d={`M${x} 630 C${x - 9} 630 ${x - 11} 620 ${x - 6} 612 C${x - 2} 606 ${x} 602 ${x} 596 C${x + 7} 604 ${x + 10} 614 ${x + 8} 622 C${x + 7} 628 ${x + 4} 630 ${x} 630 Z`} fill="#FFD84D" />
      </g>
    );
  });
  const heatWaves = [0, 1, 2].map((i) => {
    const u = (time * 0.55 + i / 3) % 1;
    const x = 615 + i * 34;
    const y = 540 - u * 46;
    return <path key={i} d={`M${x} ${f(y)} q8 -8 0 -16 q-8 -8 0 -16`} {...round} stroke="#FF8A3D" strokeWidth={4} opacity={(1 - u) * 0.8} />;
  });

  // ---- lit details
  const handHot = L.hand.g;
  const sensors = [P(640, 478), P(624, 488), P(604, 486), P(584, 480)].map((p, i) => {
    const a = handHot > 0.02 ? 0.45 + 0.55 * Math.abs(Math.sin(time * 5 + i)) : 0;
    return a > 0 ? <circle key={i} cx={p.x} cy={p.y} r={5} fill={AMBER} opacity={a * handHot} /> : <circle key={i} cx={p.x} cy={p.y} r={3} fill={NERVE} opacity={0.6} />;
  });
  const flex = 1 + 0.14 * L.arm.g * (0.6 + 0.4 * Math.sin(time * 6));
  const beads = Array.from({length: 13}, (_, i) => pointAt(FAST, 0.06 + i * 0.072));

  return (
    <g>
      <defs>
        <filter id="bf-halo" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16" /></filter>
        <filter id="bf-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="10" /></filter>
        <radialGradient id="bf-body" cx="0.45" cy="0.35" r="0.8"><stop offset="0" stopColor="#3A2F86" /><stop offset="1" stopColor="#221B52" /></radialGradient>
      </defs>

      {/* halos */}
      {BODY_REGIONS.filter((r) => L[r].g > 0).map((r) => (
        <g key={`h${r}`} filter="url(#bf-halo)" opacity={0.7 * L[r].g}>{haloShape(r)}</g>
      ))}

      {/* the stove and the pan, behind the hand */}
      {pan && (
        <g opacity={L.pan.op}>
          <line x1={520} y1={636} x2={798} y2={636} stroke={OUTLINE} strokeWidth={6} strokeLinecap="round" />
          {flames}
          <path d="M556 556 L570 588 L730 588 L744 556 Z" fill="#4A4A55" stroke={OUTLINE} strokeWidth={4} strokeLinejoin="round" />
          <ellipse cx={650} cy={556} rx={94} ry={14} fill="#6B6B78" stroke={OUTLINE} strokeWidth={4} />
          <path d="M742 560 L796 546" stroke={OUTLINE} strokeWidth={12} strokeLinecap="round" />
          {heatWaves}
        </g>
      )}

      {/* the body: a deep violet silhouette with a soft glow around it */}
      <g opacity={0.55 * bodyOp} filter="url(#bf-soft)">
        {limb(THIGH, 92, '#7B61FF', 'gth')}
        {limb(SHIN, 72, '#7B61FF', 'gsh')}
        <path d={TORSO} fill="#7B61FF" />
        {limb(UPPER_ARM, 74, '#7B61FF', 'gua')}
        {limb(FOREARM, 62, '#7B61FF', 'gfa')}
      </g>
      <g opacity={bodyOp}>
        {limb(THIGH, 84, SKIN_LINE, 'th0')}
        {limb(SHIN, 64, SKIN_LINE, 'sh0')}
        <path d={FOOT} fill={SKIN_LINE} stroke={SKIN_LINE} strokeWidth={8} strokeLinejoin="round" />
        {limb(THIGH, 76, SKIN, 'th1')}
        {limb(SHIN, 56, SKIN, 'sh1')}
        <path d={FOOT} fill={SKIN} />
        <path d={TORSO} fill="url(#bf-body)" stroke={SKIN_LINE} strokeWidth={4} strokeLinejoin="round" />
        {/* vertebrae along the back */}
        {VERTEBRAE.map((p, i) => (
          <rect key={i} x={p.x - 13} y={p.y - 11} width={26} height={22} rx={7} fill="#3B3190" stroke="#6E5CD6" strokeWidth={2} />
        ))}
      </g>

      {/* the brain */}
      <g opacity={L.brain.op}>
        <path d={BRAIN} fill={L.brain.g > 0 ? `rgb(255,${f(lerp(196, 176, L.brain.g))},${f(lerp(222, 210, L.brain.g))})` : '#F6C4DE'} stroke={OUTLINE} strokeWidth={3.5} strokeLinejoin="round" />
        {GYRI.map((d, i) => (
          <path key={i} d={d} {...round} stroke="#B9659A" strokeWidth={3} />
        ))}
        <path d="M244 176 L242 206" {...round} stroke={OUTLINE} strokeWidth={10} />
        <path d="M244 176 L242 206" {...round} stroke={L.cord.g > 0 ? AMBER : '#E8C46A'} strokeWidth={6} />
      </g>

      {/* the spinal cord */}
      <g opacity={L.cord.op}>
        <path d={smoothD(CORD_PTS)} {...round} stroke={OUTLINE} strokeWidth={13} />
        <path d={smoothD(CORD_PTS)} {...round} stroke={L.cord.g > 0 ? AMBER : '#E8C46A'} strokeWidth={8} />
      </g>

      {/* the leg nerve */}
      <g opacity={L.leg.op}>
        <path d={smoothD(LEG_NERVE)} {...round} stroke={L.leg.g > 0 ? AMBER : NERVE} strokeWidth={4 + 3 * L.leg.g} />
      </g>

      {/* the arm, drawn over the torso */}
      <g opacity={bodyOp}>
        {limb(UPPER_ARM, 66, SKIN_LINE, 'ua0')}
        {limb(FOREARM, 54, SKIN_LINE, 'fa0')}
        <path d={HAND} fill={SKIN_LINE} stroke={SKIN_LINE} strokeWidth={8} strokeLinejoin="round" />
        {limb(UPPER_ARM, 58, SKIN, 'ua1')}
        {limb(FOREARM, 46, SKIN, 'fa1')}
      </g>
      {/* the biceps */}
      <g opacity={L.arm.op}>
        <ellipse
          cx={BICEPS.x}
          cy={BICEPS.y}
          rx={46}
          ry={20 * flex}
          transform={`rotate(39 ${BICEPS.x} ${BICEPS.y})`}
          fill={L.arm.g > 0 ? '#FF8A80' : '#7A3F7E'}
          stroke={L.arm.g > 0 ? '#FFC2BC' : '#B072B4'}
          strokeWidth={3}
        />
        {[-14, 0, 14].map((o) => (
          <path key={o} d={`M${BICEPS.x - 26 + o * 0.3} ${BICEPS.y - 18 + o} q24 10 44 34`} {...round} stroke={L.arm.g > 0 ? '#FFD0CB' : '#B072B4'} strokeWidth={2} opacity={0.6} transform={`rotate(-8 ${BICEPS.x} ${BICEPS.y})`} />
        ))}
      </g>
      {/* the hand */}
      <g opacity={L.hand.op}>
        <path d={HAND} fill={handHot > 0 ? `rgb(${f(lerp(43, 255, handHot))},${f(lerp(35, 122, handHot))},${f(lerp(102, 69, handHot))})` : SKIN} />
        <path d={THUMB} {...round} stroke={SKIN_LINE} strokeWidth={4} />
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${602 + i * 14} ${486 - i * 2} q10 -4 18 -12`} {...round} stroke={SKIN_LINE} strokeWidth={2.5} opacity={0.6} />
        ))}
        {sensors}
      </g>
      {/* the elbow skin (touch, a bump) */}
      {L.elbow.g > 0.02 && (
        <g opacity={L.elbow.g}>
          {[0, 1].map((i) => {
            const u = (time * 0.9 + i / 2) % 1;
            return <circle key={i} cx={BODY_ANCHORS.elbow.x} cy={BODY_ANCHORS.elbow.y} r={12 + u * 26} {...round} stroke="#7CC4FF" strokeWidth={4} opacity={1 - u} />;
          })}
        </g>
      )}

      {/* the arm nerve bundle: a slow bare fiber and a fast fiber wrapped in myelin */}
      <g opacity={L.slow.op}>
        <path d={smoothD(SLOW)} {...round} stroke={OUTLINE} strokeWidth={5} opacity={0.5} />
        <path d={smoothD(SLOW)} {...round} stroke={L.slow.g > 0 ? '#FF9A5C' : NERVE} strokeWidth={3 + 2 * L.slow.g} />
      </g>
      <g opacity={L.fast.op}>
        <path d={smoothD(FAST)} {...round} stroke={OUTLINE} strokeWidth={5} opacity={0.5} />
        <path d={smoothD(FAST)} {...round} stroke={L.fast.g > 0 ? '#6FB8FF' : NERVE} strokeWidth={3 + 2 * L.fast.g} />
        {beads.map((b, i) => (
          <rect
            key={i}
            x={b.x - 8}
            y={b.y - 3.5}
            width={16}
            height={7}
            rx={3.5}
            transform={`rotate(${f((b.ang * 180) / Math.PI)} ${f(b.x)} ${f(b.y)})`}
            fill={L.fast.g > 0 ? '#E6F3FF' : '#E6DEFB'}
            stroke={OUTLINE}
            strokeWidth={1.6}
          />
        ))}
      </g>
      {/* the motor nerve to the biceps */}
      <path d={smoothD(MOTOR)} {...round} stroke={L.arm.g > 0 ? AMBER : NERVE} strokeWidth={3} opacity={L.arm.op * 0.9} />

      {/* the gate: a small relay neuron where the nerves enter the cord */}
      <g opacity={L.gate.op}>
        <circle cx={GATE.x} cy={GATE.y} r={10} fill={L.gate.g > 0 ? '#3DDC97' : '#B9A6FF'} stroke={OUTLINE} strokeWidth={3} />
        {L.gate.g > 0.05 && (
          <path d={`M${GATE.x + 22} ${GATE.y - 16} L${GATE.x + 22} ${GATE.y + 16}`} {...round} stroke="#3DDC97" strokeWidth={6} opacity={L.gate.g} />
        )}
      </g>

      {/* the foot (a stubbed toe glows) */}
      {L.foot.g > 0.02 && (
        <circle cx={BODY_ANCHORS.foot.x + 6} cy={BODY_ANCHORS.foot.y} r={12 + 4 * Math.sin(time * 6)} fill="#FF7A45" opacity={0.7 * L.foot.g} />
      )}
    </g>
  );
};
