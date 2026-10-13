// Science / learning icons (the "science" pack): brain, nervous system, senses, biology,
// time and habits. Same drawing kit as every pack: 200x160 box, light fills, ink outline.
import React from 'react';
import {STROKE, T, F, S, L, ln, rnd, clampP, type IconProps} from '../draw';

const pulse = (frame: number, period: number) => 0.5 + 0.5 * Math.sin((frame / period) * Math.PI * 2);

// ---------- brain: side view, frontal lobe on the left ----------
const BRAIN =
  'M52 104 C28 100 22 72 38 58 C36 36 60 22 80 28 C92 14 120 14 132 26 C152 20 174 36 170 58 ' +
  'C184 70 180 98 160 104 C156 118 140 124 126 118 C116 128 96 128 88 118 C72 124 54 118 52 104 Z';
const GYRI = [
  'M66 48 Q82 54 78 72', 'M100 32 Q104 50 122 52', 'M142 42 Q130 60 148 72',
  'M58 88 Q78 80 96 92', 'M110 76 Q126 90 146 84', 'M96 108 Q106 98 118 106',
];
const ZONES: [number, number][] = [[64, 70], [104, 48], [148, 68], [110, 96]];
const BrainIcon: React.FC<IconProps> = ({state, frame, p}) => {
  const foggy = state === 'foggy';
  const lit = state === 'lit';
  const active = state === 'active';
  const on = active ? Math.floor(frame / 9) % ZONES.length : -1;
  return (
    <>
      <path d="M112 116 Q118 132 112 148 L130 148 Q126 130 134 114 Z" fill={foggy ? F.gray : F.red} {...ln} />
      <path d={BRAIN} fill={foggy ? F.gray : F.red} {...ln} />
      {ZONES.map(([x, y], i) => {
        const o = lit ? 0.95 : i === on ? 0.95 : active ? 0.25 : 0;
        return o > 0 ? <circle key={i} cx={x} cy={y} r={17} fill="#FFD84D" opacity={o} /> : null;
      })}
      {GYRI.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={L} strokeWidth={4} opacity={foggy ? 0.35 : 1} {...rnd} />
      ))}
      {lit &&
        [-60, -30, 0, 30, 60].map((a, i) => (
          <line
            key={i}
            x1={100}
            y1={-6}
            x2={100}
            y2={-6 - 10 * clampP(p * 2)}
            transform={`rotate(${a} 100 72)`}
            stroke={S.warn}
            strokeWidth={5}
            strokeLinecap="round"
          />
        ))}
      {foggy &&
        [52, 76, 100].map((y, i) => (
          <path
            key={i}
            d={`M${30 + ((frame + i * 20) % 30)} ${y} q12 -8 24 0 t24 0 t24 0 t24 0 t24 0`}
            fill="none"
            stroke="#8A8A8F"
            strokeWidth={5}
            opacity={0.7}
            {...rnd}
          />
        ))}
      {state === 'tired' && (
        <text x={168} y={30} fontFamily={T.sans} fontWeight={900} fontSize={26} fill={L} opacity={pulse(frame, 40)}>
          z
        </text>
      )}
    </>
  );
};

// ---------- neuron: dendrites, cell body, myelinated axon, terminals ----------
const NeuronIcon: React.FC<IconProps> = ({state, frame}) => {
  const firing = state === 'firing';
  const x = 76 + ((frame * 5) % 92);
  return (
    <>
      {['M48 66 L22 40 L12 44', 'M22 40 L20 22', 'M44 98 L18 120 L8 114', 'M18 120 L22 140', 'M40 80 L10 80'].map((d, i) => (
        <path key={i} d={d} fill="none" stroke={L} strokeWidth={STROKE} {...rnd} />
      ))}
      <line x1={70} y1={80} x2={160} y2={80} stroke={L} strokeWidth={STROKE} strokeLinecap="round" />
      {[84, 110, 136].map((mx) => (
        <rect key={mx} x={mx} y={72} width={20} height={16} rx={8} fill={F.yellow} {...ln} strokeWidth={3.5} />
      ))}
      {['M160 80 L182 58', 'M160 80 L188 80', 'M160 80 L182 102'].map((d, i) => (
        <path key={i} d={d} fill="none" stroke={L} strokeWidth={STROKE} {...rnd} />
      ))}
      {[[184, 56], [190, 80], [184, 104]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={6} fill={firing && x > 150 ? '#FFD84D' : F.purple} {...ln} strokeWidth={3} />
      ))}
      <circle cx={50} cy={80} r={24} fill={firing && x < 100 ? '#FFE27A' : F.purple} {...ln} />
      <circle cx={50} cy={80} r={8} fill={L} />
      {firing && (
        <>
          <circle cx={x} cy={80} r={13} fill="#FFD84D" opacity={0.5} />
          <circle cx={x} cy={80} r={6} fill={S.warn} />
        </>
      )}
      {state === 'blocked' && (
        <path d="M168 66 L196 94 M196 66 L168 94" stroke={S.bad} strokeWidth={8} strokeLinecap="round" />
      )}
    </>
  );
};

// ---------- ear: outer ear with sound waves arriving ----------
const EarIcon: React.FC<IconProps> = ({state, frame}) => {
  const listening = state === 'listening';
  const noise = state === 'noise';
  return (
    <>
      <path
        d="M104 26 C150 22 168 66 146 94 C134 108 132 122 120 134 C108 146 86 142 86 126 C86 112 96 108 98 96 C100 84 84 82 84 64 C84 42 94 28 104 26 Z"
        fill={F.orange}
        {...ln}
      />
      <path d="M106 54 C126 52 134 74 120 86 C112 94 110 102 104 110" fill="none" stroke={L} strokeWidth={4} {...rnd} />
      {[0, 1, 2].map((i) => {
        const o = listening ? 0.25 + 0.75 * pulse(frame - i * 6, 24) : noise ? 1 : 0.9;
        const x = 64 - i * 18;
        return noise ? (
          <path key={i} d={`M${x} ${48 - i * 8} l-8 10 l8 10 l-8 10 l8 10 l-8 10 l8 10`} fill="none" stroke={S.bad} strokeWidth={4.5} opacity={o} {...rnd} />
        ) : (
          <path key={i} d={`M${x} ${56 - i * 12} Q${x + 12} ${86} ${x} ${116 + i * 12}`} fill="none" stroke={L} strokeWidth={4.5} opacity={o} {...rnd} />
        );
      })}
    </>
  );
};

// ---------- speech: a speech bubble (speaking, producing) ----------
const SpeechIcon: React.FC<IconProps> = ({state, frame}) => {
  const talking = state === 'talking';
  const stuck = state === 'stuck';
  return (
    <>
      <path d="M44 22 H156 Q178 22 178 44 V96 Q178 118 156 118 H88 L58 144 L62 118 H44 Q22 118 22 96 V44 Q22 22 44 22 Z" fill={stuck ? F.gray : F.blue} {...ln} />
      {talking &&
        [0, 1, 2, 3, 4].map((i) => {
          const h = 10 + 36 * pulse(frame + i * 5, 14 + i * 2);
          return <line key={i} x1={60 + i * 20} y1={70 - h / 2} x2={60 + i * 20} y2={70 + h / 2} stroke={L} strokeWidth={8} strokeLinecap="round" />;
        })}
      {stuck &&
        [0, 1, 2].map((i) => (
          <circle key={i} cx={76 + i * 24} cy={70} r={7} fill={L} opacity={0.3 + 0.7 * (Math.floor(frame / 10) % 3 === i ? 1 : 0)} />
        ))}
      {!talking && !stuck &&
        [52, 72, 92].map((y, i) => <line key={y} x1={48} y1={y} x2={i === 2 ? 120 : 152} y2={y} stroke={L} strokeWidth={6} strokeLinecap="round" />)}
    </>
  );
};

// ---------- chat: two bubbles (conversation, practice with someone) ----------
const ChatIcon: React.FC<IconProps> = ({state, frame}) => {
  const busy = state === 'busy';
  const turn = Math.floor(frame / 18) % 2;
  const dots = (cx: number, cy: number, on: boolean) =>
    [0, 1, 2].map((i) => (
      <circle key={i} cx={cx + (i - 1) * 16} cy={cy - (on ? 5 * pulse(frame + i * 4, 12) : 0)} r={5.5} fill={L} />
    ));
  return (
    <>
      <path d="M20 26 H112 Q128 26 128 42 V78 Q128 94 112 94 H56 L36 112 L38 94 H20 Q6 94 6 78 V42 Q6 26 20 26 Z" transform="translate(8 0)" fill={F.teal} {...ln} />
      <path d="M88 64 H180 Q194 64 194 80 V116 Q194 132 180 132 H162 L164 150 L144 132 H88 Q72 132 72 116 V80 Q72 64 88 64 Z" fill={F.yellow} {...ln} />
      {dots(74, 52, busy && turn === 0)}
      {dots(134, 98, busy && turn === 1)}
    </>
  );
};

// ---------- book: open book (studying, reading) ----------
const BookIcon: React.FC<IconProps> = ({state, frame}) => {
  const reading = state === 'reading';
  const ph = (frame % 40) / 40; // page flip 0..1
  const flipX = 100 + 70 * Math.cos(ph * Math.PI);
  return (
    <>
      <path d="M100 44 Q66 30 24 38 V136 Q66 128 100 142 Q134 128 176 136 V38 Q134 30 100 44 Z" fill={F.blue} {...ln} />
      <path d="M100 40 Q68 26 30 32 V128 Q68 122 100 136 Z" fill={F.paper} {...ln} />
      <path d="M100 40 Q132 26 170 32 V128 Q132 122 100 136 Z" fill={F.paper} {...ln} />
      {[56, 74, 92, 110].map((y) => (
        <g key={y}>
          <line x1={42} y1={y - 6} x2={88} y2={y + 2} stroke={L} strokeWidth={3.5} strokeLinecap="round" opacity={0.6} />
          <line x1={112} y1={y + 2} x2={158} y2={y - 6} stroke={L} strokeWidth={3.5} strokeLinecap="round" opacity={0.6} />
        </g>
      ))}
      {reading && ph < 0.95 && (
        <path d={`M100 40 Q${(100 + flipX) / 2} ${30 - 10 * Math.sin(ph * Math.PI)} ${flipX} 32 V128 Q${(100 + flipX) / 2} 122 100 136 Z`} fill={F.paper} {...ln} />
      )}
    </>
  );
};

// ---------- eye ----------
const EyeIcon: React.FC<IconProps> = ({state, frame}) => {
  const looking = state === 'looking';
  const closed = state === 'closed' || (looking && frame % 90 > 84);
  const dx = looking ? 22 * Math.sin(frame / 14) : 0;
  return closed ? (
    <path d="M16 84 Q100 132 184 84" fill="none" stroke={L} strokeWidth={6} strokeLinecap="round" />
  ) : (
    <>
      <path d="M14 80 Q100 10 186 80 Q100 150 14 80 Z" fill={F.paper} {...ln} />
      <circle cx={100 + dx} cy={80} r={34} fill={F.teal} {...ln} />
      <circle cx={100 + dx} cy={80} r={15} fill={L} />
      <circle cx={92 + dx} cy={72} r={5} fill="#fff" />
    </>
  );
};

// ---------- calendar: days going by (busy crosses them out) ----------
const CalendarIcon: React.FC<IconProps> = ({state, frame}) => {
  const n = state === 'passing' ? Math.floor(frame / 5) % 13 : state === 'done' ? 12 : 0;
  return (
    <>
      <rect x={30} y={26} width={140} height={120} rx={12} fill={F.paper} {...ln} />
      <path d="M30 38 Q30 26 42 26 H158 Q170 26 170 38 V56 H30 Z" fill={F.red} {...ln} />
      <line x1={64} y1={16} x2={64} y2={36} stroke={L} strokeWidth={6} strokeLinecap="round" />
      <line x1={136} y1={16} x2={136} y2={36} stroke={L} strokeWidth={6} strokeLinecap="round" />
      {Array.from({length: 12}, (_, i) => {
        const cx = 50 + (i % 4) * 33;
        const cy = 74 + Math.floor(i / 4) * 24;
        return i < n ? (
          <path key={i} d={`M${cx - 8} ${cy - 7} L${cx + 8} ${cy + 7} M${cx + 8} ${cy - 7} L${cx - 8} ${cy + 7}`} stroke={S.bad} strokeWidth={4.5} strokeLinecap="round" />
        ) : (
          <rect key={i} x={cx - 9} y={cy - 7} width={18} height={14} rx={3} fill={F.gray} />
        );
      })}
    </>
  );
};

// ---------- clock: time, hours of practice ----------
const ClockIcon: React.FC<IconProps> = ({state, frame}) => {
  const run = state === 'running';
  return (
    <>
      <circle cx={100} cy={80} r={62} fill={F.paper} {...ln} />
      {Array.from({length: 12}, (_, i) => (
        <line key={i} x1={100} y1={26} x2={100} y2={i % 3 ? 32 : 38} transform={`rotate(${i * 30} 100 80)`} stroke={L} strokeWidth={4} strokeLinecap="round" />
      ))}
      <line x1={100} y1={80} x2={100} y2={50} transform={`rotate(${run ? frame * 0.5 : 300} 100 80)`} stroke={L} strokeWidth={7} strokeLinecap="round" />
      <line x1={100} y1={80} x2={100} y2={34} transform={`rotate(${run ? frame * 6 : 60} 100 80)`} stroke={L} strokeWidth={5} strokeLinecap="round" />
      <circle cx={100} cy={80} r={6} fill={L} />
    </>
  );
};

// ---------- repeat: cycle arrows (practice, review, habit) ----------
const RepeatIcon: React.FC<IconProps> = ({state, frame}) => {
  const spin = state === 'spinning' ? frame * 4 : 0;
  return (
    <>
      <g transform={`rotate(${spin} 100 80)`}>
        <path d="M54 72 A48 48 0 0 1 140 52" fill="none" stroke={L} strokeWidth={13} strokeLinecap="round" />
        <path d="M146 88 A48 48 0 0 1 60 108" fill="none" stroke={L} strokeWidth={13} strokeLinecap="round" />
        <path d="M54 72 A48 48 0 0 1 140 52" fill="none" stroke="#7FD49A" strokeWidth={6} strokeLinecap="round" />
        <path d="M146 88 A48 48 0 0 1 60 108" fill="none" stroke="#7FD49A" strokeWidth={6} strokeLinecap="round" />
        <path d="M126 34 L152 48 L130 68 Z" fill={L} strokeLinejoin="round" stroke={L} strokeWidth={3} />
        <path d="M74 126 L48 112 L70 92 Z" fill={L} strokeLinejoin="round" stroke={L} strokeWidth={3} />
      </g>
      {state === 'ok' && <polyline points="84,80 96,92 118,68" fill="none" stroke={S.ok} strokeWidth={9} {...rnd} />}
    </>
  );
};

// ---------- moon: sleep (memory consolidation) ----------
const MoonIcon: React.FC<IconProps> = ({state, frame}) => {
  const sleeping = state === 'sleeping';
  return (
    <>
      <path d="M118 22 A60 60 0 1 0 172 102 A48 48 0 1 1 118 22 Z" fill={F.purple} {...ln} />
      {[[40, 32], [166, 38], [150, 140]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y - 8} L${x + 3} ${y - 3} L${x + 8} ${y} L${x + 3} ${y + 3} L${x} ${y + 8} L${x - 3} ${y + 3} L${x - 8} ${y} L${x - 3} ${y - 3} Z`} fill={F.yellow} stroke={L} strokeWidth={2.5} strokeLinejoin="round" opacity={0.5 + 0.5 * pulse(frame + i * 10, 30)} />
      ))}
      {sleeping &&
        [0, 1, 2].map((i) => {
          const k = ((frame / 30 + i / 3) % 1);
          return (
            <text key={i} x={140 + k * 30} y={90 - k * 70} fontFamily={T.sans} fontWeight={900} fontSize={16 + 10 * k} fill={L} opacity={1 - k}>
              z
            </text>
          );
        })}
    </>
  );
};

// ---------- idea: light bulb ----------
const IdeaIcon: React.FC<IconProps> = ({state, frame}) => {
  const on = state === 'on' || state === 'flicker';
  const off = state === 'off';
  const glow = state === 'flicker' ? 0.6 + 0.4 * pulse(frame, 8) : 1;
  return (
    <>
      {on &&
        [-70, -35, 0, 35, 70].map((a) => (
          <line key={a} x1={100} y1={10} x2={100} y2={0} transform={`rotate(${a} 100 66)`} stroke={S.warn} strokeWidth={6} strokeLinecap="round" opacity={glow} />
        ))}
      <path d="M100 18 C72 18 56 40 56 62 C56 82 72 92 76 108 H124 C128 92 144 82 144 62 C144 40 128 18 100 18 Z" fill={on ? '#FFE27A' : off ? F.gray : F.paper} {...ln} />
      <path d="M86 108 V86 L100 74 L114 86 V108" fill="none" stroke={L} strokeWidth={3.5} {...rnd} opacity={off ? 0.5 : 1} />
      <rect x={78} y={110} width={44} height={14} rx={4} fill={F.gray} {...ln} />
      <rect x={82} y={124} width={36} height={14} rx={4} fill={F.gray} {...ln} />
      <path d="M90 138 Q100 150 110 138" fill={L} />
    </>
  );
};

// ---------- target: goal ----------
const TargetIcon: React.FC<IconProps> = ({state, p}) => {
  const hit = state === 'hit';
  const miss = state === 'miss';
  const k = state === 'aiming' ? clampP(p) : hit || miss ? 1 : 0;
  const tx = miss ? 146 : 100;
  const ty = miss ? 36 : 80;
  const ax = 200 + (tx - 200) * k;
  const ay = -10 + (ty + 10) * k;
  return (
    <>
      <circle cx={100} cy={80} r={62} fill={F.paper} {...ln} />
      <circle cx={100} cy={80} r={42} fill={F.red} {...ln} />
      <circle cx={100} cy={80} r={22} fill={F.paper} {...ln} />
      <circle cx={100} cy={80} r={8} fill={S.bad} />
      {k > 0 && (
        <g>
          <line x1={ax} y1={ay} x2={ax + 40} y2={ay - 32} stroke={L} strokeWidth={6} strokeLinecap="round" />
          <path d={`M${ax + 34} ${ay - 38} l14 -2 l-2 14 Z`} fill={F.yellow} stroke={L} strokeWidth={3} strokeLinejoin="round" />
          <circle cx={ax} cy={ay} r={4} fill={L} />
        </g>
      )}
    </>
  );
};

// ---------- dna: double helix ----------
const DnaIcon: React.FC<IconProps> = ({state, frame}) => {
  const ph = state === 'spinning' ? frame / 8 : 0;
  const N = 9;
  const pts = Array.from({length: N}, (_, i) => {
    const x = 30 + (i * 140) / (N - 1);
    const a = i * 0.8 + ph;
    return {x, y1: 80 + 42 * Math.sin(a), y2: 80 - 42 * Math.sin(a), d: Math.cos(a)};
  });
  const strand = (k: 'y1' | 'y2') =>
    'M' + Array.from({length: 57}, (_, j) => {
      const x = 30 + (j * 140) / 56;
      const a = ((x - 30) / (140 / (N - 1))) * 0.8 + ph;
      const y = 80 + (k === 'y1' ? 42 : -42) * Math.sin(a);
      return `${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' L');
  return (
    <>
      {pts.map((q, i) => (
        <line key={i} x1={q.x} y1={q.y1} x2={q.x} y2={q.y2} stroke={i % 2 ? '#F2A33A' : '#5B8DEF'} strokeWidth={6} strokeLinecap="round" />
      ))}
      <path d={strand('y1')} fill="none" stroke={L} strokeWidth={7} {...rnd} />
      <path d={strand('y2')} fill="none" stroke={L} strokeWidth={7} {...rnd} />
    </>
  );
};

// ---------- cell: membrane, nucleus, organelles (busy = dividing) ----------
const CellIcon: React.FC<IconProps> = ({state, p}) => {
  const k = state === 'dividing' ? clampP(p) : 0;
  const one = (cx: number, r: number, key: string) => (
    <g key={key}>
      <ellipse cx={cx} cy={80} rx={r} ry={r * 0.82} fill={F.green} {...ln} />
      <circle cx={cx + r * 0.08} cy={78} r={r * 0.34} fill={F.purple} {...ln} />
      <circle cx={cx + r * 0.08} cy={78} r={r * 0.11} fill={L} />
      <ellipse cx={cx - r * 0.5} cy={98} rx={r * 0.16} ry={r * 0.08} fill={F.orange} stroke={L} strokeWidth={3} />
      <ellipse cx={cx + r * 0.52} cy={58} rx={r * 0.14} ry={r * 0.08} fill={F.orange} stroke={L} strokeWidth={3} />
    </g>
  );
  return k < 0.05 ? one(100, 74, 'a') : <>{[one(100 - 46 * k, 74 - 26 * k, 'l'), one(100 + 46 * k, 74 - 26 * k, 'r')]}</>;
};

// ---------- heart ----------
const HeartIcon: React.FC<IconProps> = ({state, frame}) => {
  const beat = state === 'beating' ? 1 + 0.09 * Math.max(0, Math.sin((frame / 22) * Math.PI * 2)) ** 6 : 1;
  return (
    <g transform={`translate(100 82) scale(${beat}) translate(-100 -82)`}>
      <path d="M100 142 C40 102 18 74 30 46 C42 20 82 20 100 50 C118 20 158 20 170 46 C182 74 160 102 100 142 Z" fill={state === 'error' ? F.gray : F.red} {...ln} />
      <path d="M52 52 Q60 40 74 40" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.8} />
    </g>
  );
};

// ---------- flask: experiment, study, evidence ----------
const FlaskIcon: React.FC<IconProps> = ({state, frame}) => {
  const bubbling = state === 'bubbling';
  return (
    <>
      <path d="M80 18 H120 M86 18 V62 L44 132 Q40 144 54 144 H146 Q160 144 156 132 L114 62 V18" fill={F.paper} {...ln} />
      <path d="M64 100 H136 L154 132 Q158 142 146 142 H54 Q42 142 46 132 Z" fill={F.green} stroke={L} strokeWidth={3.5} strokeLinejoin="round" />
      {bubbling &&
        [0, 1, 2].map((i) => {
          const k = ((frame / 36 + i / 3) % 1);
          return <circle key={i} cx={90 + i * 12} cy={128 - k * 86} r={5 + 3 * k} fill="none" stroke={L} strokeWidth={3} opacity={1 - k} />;
        })}
    </>
  );
};

// ---------- globe: world, languages, countries ----------
const GlobeIcon: React.FC<IconProps> = ({state, frame}) => {
  const off = state === 'spinning' ? (frame * 1.2) % 40 : 0;
  return (
    <>
      <circle cx={100} cy={80} r={62} fill={F.blue} {...ln} />
      {[-40, -20, 0, 20, 40].map((o) => {
        const x = ((o + off + 60) % 80) - 40;
        const rx = Math.abs(62 * Math.sin((x / 40) * (Math.PI / 2)));
        return <ellipse key={o} cx={100} cy={80} rx={Math.max(rx, 1)} ry={62} fill="none" stroke={L} strokeWidth={3.5} opacity={0.75} />;
      })}
      <ellipse cx={100} cy={80} rx={62} ry={20} fill="none" stroke={L} strokeWidth={3.5} opacity={0.75} />
      <line x1={38} y1={80} x2={162} y2={80} stroke={L} strokeWidth={3.5} />
      <circle cx={100} cy={80} r={62} fill="none" {...ln} />
    </>
  );
};

// ---------- hand: skin and its sensors (heat, touch) ----------
const HAND =
  'M72 150 L72 126 C60 118 46 102 42 90 C39 81 48 75 55 81 L72 98 ' +
  'L72 54 C72 43 86 43 86 54 L86 84 L88 84 L88 44 C88 33 104 33 104 44 L104 84 ' +
  'L106 84 L106 52 C106 41 122 41 122 52 L122 86 L124 86 L124 66 C124 56 138 56 138 66 ' +
  'L138 118 C138 136 128 150 118 150 Z';
const SENSORS: [number, number][] = [[79, 56], [96, 46], [114, 54], [131, 68], [92, 116], [118, 110]];
const HandIcon: React.FC<IconProps> = ({state, frame, p}) => {
  const burned = state === 'burned';
  const sensing = state === 'sensing';
  // A short jerk back when it gets burned (the reflex), then it settles.
  const dy = burned ? 10 * Math.sin(Math.PI * clampP(p * 2.2)) : 0;
  return (
    <g transform={`translate(0 ${dy})`}>
      <path d={HAND} fill={F.orange} {...ln} />
      {[86, 104, 122].map((x) => (
        <line key={x} x1={x + 1} y1={84} x2={x + 1} y2={96} stroke={L} strokeWidth={3} strokeLinecap="round" />
      ))}
      {SENSORS.map(([x, y], i) => {
        const on = sensing ? 0.4 + 0.6 * pulse(frame + i * 7, 26) : 0;
        return (
          <g key={i}>
            {on > 0 && <circle cx={x} cy={y} r={9} fill="#FFD84D" opacity={on * 0.6} />}
            <circle cx={x} cy={y} r={3.6} fill={sensing ? S.warn : L} opacity={sensing ? 1 : 0.55} />
          </g>
        );
      })}
      {burned && (
        <>
          <ellipse cx={96} cy={46} rx={22} ry={12} fill={S.bad} opacity={0.35} />
          {['M70 30 L62 18', 'M96 24 L96 8', 'M122 30 L130 18'].map((d, i) => (
            <path key={i} d={d} stroke={S.bad} strokeWidth={6} strokeLinecap="round" opacity={clampP(p * 3)} />
          ))}
        </>
      )}
    </g>
  );
};

// ---------- flame: heat, a hot pan, fire ----------
const FlameIcon: React.FC<IconProps> = ({state, frame}) => {
  const k = state === 'flicker' ? 1 + 0.06 * Math.sin(frame / 3.1) + 0.04 * Math.sin(frame / 1.7) : 1;
  const sway = state === 'flicker' ? 4 * Math.sin(frame / 5) : 0;
  return (
    <>
      <g transform={`translate(100 146) scale(${2 - k} ${k}) translate(-100 -146)`}>
        <path d={`M100 146 C58 146 42 116 52 88 C58 70 72 62 74 40 C88 52 92 66 90 78 C98 62 102 40 ${96 + sway} 14 C128 34 156 70 152 104 C150 130 132 146 100 146 Z`} fill="#FF8A3D" {...ln} />
        <path d={`M100 140 C80 140 72 124 78 108 C82 98 92 92 94 80 C104 90 ${110 + sway / 2} 100 110 112 C118 106 120 100 122 94 C132 108 130 140 100 140 Z`} fill="#FFD84D" stroke={L} strokeWidth={3.5} strokeLinejoin="round" />
      </g>
    </>
  );
};

// ---------- spine: the spinal cord inside the vertebrae, with nerves branching off ----------
const VERTEBRAE = [18, 46, 74, 102, 130];
const SpineIcon: React.FC<IconProps> = ({state, frame}) => {
  const signal = state === 'signal';
  const y = 12 + ((frame * 3.2) % 136);
  return (
    <>
      {VERTEBRAE.slice(1).map((vy, i) => (
        <g key={i} fill="none" stroke={L} strokeWidth={4} strokeLinecap="round">
          <path d={`M78 ${vy - 4} Q56 ${vy - 2} 42 ${vy + 8}`} />
          <path d={`M122 ${vy - 4} Q144 ${vy - 2} 158 ${vy + 8}`} />
        </g>
      ))}
      <rect x={95} y={8} width={10} height={146} rx={5} fill="#FFE27A" stroke={L} strokeWidth={3.5} />
      {VERTEBRAE.map((vy) => (
        <g key={vy}>
          <rect x={72} y={vy - 12} width={56} height={22} rx={9} fill={F.paper} {...ln} />
          <rect x={95} y={vy - 12} width={10} height={22} fill="#FFE27A" stroke="none" />
          <line x1={95} y1={vy - 12} x2={95} y2={vy + 10} stroke={L} strokeWidth={3} />
          <line x1={105} y1={vy - 12} x2={105} y2={vy + 10} stroke={L} strokeWidth={3} />
        </g>
      ))}
      {signal && (
        <>
          <circle cx={100} cy={y} r={13} fill="#FFD84D" opacity={0.55} />
          <circle cx={100} cy={y} r={6} fill={S.warn} />
        </>
      )}
    </>
  );
};

// ---------- muscle: a flexed arm (the muscle that pulls the hand back) ----------
const ARM =
  'M28 138 L118 138 C140 138 150 124 146 106 L136 56 C135 44 128 38 118 40 C106 42 104 52 108 60 ' +
  'L116 96 C104 76 64 70 48 88 C42 94 36 100 28 102 Z';
const MuscleIcon: React.FC<IconProps> = ({state, frame, p}) => {
  const contract = state === 'contract';
  const k = contract ? 1 + 0.08 * Math.max(0, Math.sin((frame / 18) * Math.PI)) : state === 'pulled' ? 1 + 0.08 * clampP(p * 2) : 1;
  return (
    <>
      <g transform={`translate(80 104) scale(1 ${k}) translate(-80 -104)`}>
        <path d={ARM} fill={F.red} {...ln} />
      </g>
      <path d="M58 98 Q74 86 92 90" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.75} />
      {(contract || state === 'pulled') && (
        <g stroke={S.warn} strokeWidth={5} strokeLinecap="round" opacity={contract ? pulse(frame, 18) : 1}>
          <line x1={66} y1={62} x2={60} y2={50} />
          <line x1={84} y1={58} x2={84} y2={44} />
          <line x1={102} y1={62} x2={108} y2={50} />
        </g>
      )}
    </>
  );
};

export const ICONS: Record<string, React.FC<IconProps>> = {
  brain: BrainIcon,
  neuron: NeuronIcon,
  ear: EarIcon,
  speech: SpeechIcon,
  chat: ChatIcon,
  book: BookIcon,
  eye: EyeIcon,
  calendar: CalendarIcon,
  clock: ClockIcon,
  repeat: RepeatIcon,
  moon: MoonIcon,
  idea: IdeaIcon,
  target: TargetIcon,
  dna: DnaIcon,
  cell: CellIcon,
  heart: HeartIcon,
  flask: FlaskIcon,
  globe: GlobeIcon,
  hand: HandIcon,
  flame: FlameIcon,
  spine: SpineIcon,
  muscle: MuscleIcon,
};
