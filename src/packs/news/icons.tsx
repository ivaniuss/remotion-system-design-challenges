// News icons (the "news" pack): attackers and the machines they reach, stores and the cold
// chain, institutions, money, and weather. Same drawing kit as every pack: 200x160 box,
// light fills, ink outline, an animated state per status.
import React from 'react';
import {T, F, S, L, ln, rnd, clampP, type IconProps} from '../draw';

const wave = (frame: number, period: number, phase = 0) => 0.5 + 0.5 * Math.sin(((frame + phase) / period) * Math.PI * 2);

// ---------- hacker: hooded figure behind a laptop ----------
const HackerIcon: React.FC<IconProps> = ({state, frame}) => {
  const typing = state === 'typing';
  return (
    <>
      <path d="M58 132 C58 92 72 62 100 58 C128 62 142 92 142 132 Z" fill={F.gray} {...ln} />
      <path d="M70 76 C70 44 86 26 100 26 C114 26 130 44 130 76 C122 86 78 86 70 76 Z" fill="#3A3A40" {...ln} />
      <ellipse cx={100} cy={70} rx={20} ry={18} fill="#1D1D1F" />
      <circle cx={92} cy={68} r={3.5} fill={typing ? '#FF6B5E' : '#E9E9EE'} opacity={typing ? 0.5 + 0.5 * wave(frame, 10) : 1} />
      <circle cx={108} cy={68} r={3.5} fill={typing ? '#FF6B5E' : '#E9E9EE'} opacity={typing ? 0.5 + 0.5 * wave(frame, 10) : 1} />
      <path d="M44 104 L156 104 L148 138 L52 138 Z" fill={F.paper} {...ln} />
      <rect x={34} y={136} width={132} height={10} rx={4} fill={F.gray} {...ln} strokeWidth={4} />
      {typing &&
        [0, 1, 2].map((i) => (
          <rect key={i} x={64 + i * 26} y={114 + ((Math.floor(frame / 4) + i) % 3) * 6} width={18} height={4} rx={2} fill={S.bad} opacity={0.85} />
        ))}
      {!typing && <path d="M92 116 L108 128 M108 116 L92 128" stroke={L} strokeWidth={4} {...rnd} />}
    </>
  );
};

// ---------- internet: a globe of links with traffic running on it ----------
const InternetIcon: React.FC<IconProps> = ({state, frame}) => {
  const down = state === 'down';
  const busy = state === 'traffic';
  const nodes: [number, number][] = [[64, 62], [100, 40], [136, 62], [124, 106], [76, 106], [100, 80]];
  const links: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [5, 0], [5, 1], [5, 2], [5, 3], [5, 4]];
  return (
    <>
      <circle cx={100} cy={80} r={58} fill={F.blue} {...ln} />
      <ellipse cx={100} cy={80} rx={26} ry={58} fill="none" stroke={L} strokeWidth={3} opacity={0.35} />
      <line x1={42} y1={80} x2={158} y2={80} stroke={L} strokeWidth={3} opacity={0.35} />
      {links.map(([a, b], i) => (
        <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke={L} strokeWidth={3.5} strokeDasharray={down && i % 3 === 0 ? '6 8' : undefined} />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={7} fill={down && i === 5 ? S.bad : F.paper} {...ln} strokeWidth={3.5} />
      ))}
      {busy &&
        links.slice(0, 6).map(([a, b], i) => {
          const k = ((frame / 22 + i * 0.37) % 1 + 1) % 1;
          return <circle key={`p${i}`} cx={nodes[a][0] + (nodes[b][0] - nodes[a][0]) * k} cy={nodes[a][1] + (nodes[b][1] - nodes[a][1]) * k} r={4.5} fill={S.warn} />;
        })}
    </>
  );
};

// ---------- controller: a wall-mounted control unit with a screen ----------
const ControllerIcon: React.FC<IconProps> = ({state, frame}) => {
  const hacked = state === 'hacked';
  const warn = state === 'warn';
  const busy = state === 'busy';
  const screen = hacked ? '#3B0F12' : warn ? '#3A2C08' : '#0F2E22';
  const ink = hacked ? '#FF6B5E' : warn ? '#FFC24D' : '#5BE39B';
  const glitch = hacked ? Math.sin(frame * 1.7) * 3 : 0;
  return (
    <>
      <rect x={40} y={24} width={120} height={116} rx={14} fill={F.teal} {...ln} />
      <rect x={54} y={38} width={92} height={56} rx={6} fill={screen} {...ln} strokeWidth={4} />
      {hacked ? (
        <>
          <text x={100 + glitch} y={74} textAnchor="middle" fontFamily={T.mono} fontWeight={800} fontSize={24} fill={ink}>
            50°C
          </text>
          <rect x={58} y={48 + ((frame * 3) % 40)} width={84} height={3} fill={ink} opacity={0.5} />
        </>
      ) : (
        <>
          <text x={100} y={68} textAnchor="middle" fontFamily={T.mono} fontWeight={800} fontSize={20} fill={ink}>
            {warn ? 'DEFROST' : '-18°C'}
          </text>
          <path d={`M62 84 ${Array.from({length: 8}, (_, i) => `L${66 + i * 10} ${84 - (busy ? 6 * wave(frame + i * 6, 18) : 2 * (i % 2))}`).join(' ')}`} fill="none" stroke={ink} strokeWidth={3} {...rnd} />
        </>
      )}
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={70 + i * 30} cy={116} r={8} fill={i === 0 ? (hacked ? S.bad : S.ok) : F.paper} {...ln} strokeWidth={3.5} opacity={i === 0 && (hacked || busy) ? 0.4 + 0.6 * wave(frame, 12) : 1} />
      ))}
      <path d="M100 140 L100 152 M86 152 L114 152" stroke={L} strokeWidth={4} {...rnd} />
    </>
  );
};

// ---------- technician: a person with a cap and a wrench ----------
const TechnicianIcon: React.FC<IconProps> = ({state, frame}) => {
  const turn = state === 'working' ? Math.sin(frame / 5) * 14 : 0;
  return (
    <>
      <path d="M50 146 C50 108 72 94 96 94 C120 94 142 108 142 146 Z" fill={F.orange} {...ln} />
      <circle cx={96} cy={62} r={24} fill={F.paper} {...ln} />
      <path d="M70 56 C72 34 120 34 122 56 L132 58 L70 58 Z" fill={F.orange} {...ln} />
      <g transform={`rotate(${turn} 150 96)`}>
        <path d="M150 72 L150 122" stroke={L} strokeWidth={9} strokeLinecap="round" />
        <path d="M150 72 L150 122" stroke="#C9CCD3" strokeWidth={4} strokeLinecap="round" />
        <path d="M138 62 A14 14 0 1 0 162 62 L156 70 L144 70 Z" fill="#C9CCD3" {...ln} strokeWidth={4} />
      </g>
    </>
  );
};

// ---------- store: a shop front with an awning ----------
const StoreIcon: React.FC<IconProps> = ({state, frame}) => {
  const closed = state === 'closed';
  const busy = state === 'busy';
  return (
    <>
      <rect x={36} y={60} width={128} height={84} rx={4} fill={F.paper} {...ln} />
      <path d="M30 60 L42 28 L158 28 L170 60 Z" fill={F.yellow} {...ln} />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M${30 + i * 35} 60 Q${47 + i * 35} 74 ${65 + i * 35} 60`} fill={i % 2 ? F.red : F.paper} {...ln} strokeWidth={4} />
      ))}
      <rect x={50} y={84} width={50} height={36} rx={3} fill={F.blue} {...ln} strokeWidth={4} />
      <rect x={114} y={84} width={34} height={60} rx={3} fill={closed ? F.gray : F.teal} {...ln} strokeWidth={4} />
      {busy && [0, 1].map((i) => <circle key={i} cx={64 + i * 22} cy={102 + Math.sin(frame / 6 + i) * 3} r={6} fill={L} />)}
      {closed && (
        <g transform="rotate(-8 100 104)">
          <rect x={52} y={92} width={96} height={26} rx={5} fill={S.bad} stroke={L} strokeWidth={3.5} />
          <text x={100} y={111} textAnchor="middle" fontFamily={T.sans} fontWeight={900} fontSize={16} fill="#FFFFFF">
            CLOSED
          </text>
        </g>
      )}
    </>
  );
};

// ---------- fridge: a display freezer; cold (snowflake) or hot (red, heat waves) ----------
const FridgeIcon: React.FC<IconProps> = ({state, frame, p}) => {
  const hot = state === 'hot';
  const defrost = state === 'defrost';
  const inside = hot ? '#FFB4A8' : defrost ? '#FFE3A8' : '#D8ECFF';
  return (
    <>
      <rect x={46} y={22} width={108} height={124} rx={10} fill={hot ? F.red : F.blue} {...ln} />
      <rect x={58} y={34} width={84} height={86} rx={5} fill={inside} {...ln} strokeWidth={4} />
      <line x1={58} y1={63} x2={142} y2={63} stroke={L} strokeWidth={3.5} />
      <line x1={58} y1={92} x2={142} y2={92} stroke={L} strokeWidth={3.5} />
      {[[70, 50], [96, 52], [120, 78], [78, 80], [110, 108]].map(([x, y], i) => (
        <rect key={i} x={x - 8} y={y - 6} width={16} height={11} rx={2} fill={i % 2 ? F.green : F.orange} stroke={L} strokeWidth={2.5} />
      ))}
      <rect x={66} y={128} width={68} height={8} rx={4} fill={L} />
      {!hot && !defrost && (
        <g stroke="#2F6FEB" strokeWidth={4} strokeLinecap="round" opacity={0.85}>
          {[0, 60, 120].map((a) => (
            <line key={a} x1={160} y1={18} x2={160} y2={42} transform={`rotate(${a + frame * 0.6} 160 30)`} />
          ))}
        </g>
      )}
      {defrost &&
        [0, 1, 2].map((i) => (
          <path key={i} d={`M${74 + i * 26} ${118 - ((frame * 1.2 + i * 12) % 26)} q-4 6 0 10 q4 -4 0 -10`} fill="#6CB4FF" stroke={L} strokeWidth={2} opacity={0.9} />
        ))}
      {hot && (
        <>
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M${72 + i * 28} 20 q8 -8 0 -16 q-8 -8 0 -16`}
              transform={`translate(0 ${-4 * wave(frame, 20, i * 6)})`}
              fill="none"
              stroke={S.bad}
              strokeWidth={4.5}
              opacity={clampP(p * 3) * (0.5 + 0.5 * wave(frame, 20, i * 6))}
              {...rnd}
            />
          ))}
          <rect x={70} y={64} width={60} height={30} rx={8} fill="#FFFFFF" stroke={S.bad} strokeWidth={3.5} />
          <text x={100} y={86} textAnchor="middle" fontFamily={T.sans} fontWeight={900} fontSize={20} fill={S.bad}>
            50°C
          </text>
        </>
      )}
    </>
  );
};

// ---------- thermometer: the column rises; hot = red and full ----------
const ThermometerIcon: React.FC<IconProps> = ({state, frame}) => {
  const hot = state === 'hot';
  const rising = state === 'rising';
  const level = hot ? 0.95 : rising ? 0.35 + 0.55 * clampP((frame % 90) / 70) : 0.3;
  const col = hot || rising ? S.bad : '#2F6FEB';
  const top = 30;
  const bottom = 108;
  const y = bottom - (bottom - top) * level;
  return (
    <>
      <rect x={86} y={22} width={28} height={98} rx={14} fill={F.paper} {...ln} />
      <rect x={94} y={y} width={12} height={bottom - y + 10} rx={6} fill={col} />
      <circle cx={100} cy={126} r={20} fill={col} {...ln} />
      {[40, 58, 76, 94].map((ty) => (
        <line key={ty} x1={118} y1={ty} x2={130} y2={ty} stroke={L} strokeWidth={4} strokeLinecap="round" />
      ))}
      {hot && [0, 1].map((i) => <path key={i} d={`M${54 + i * 92} 70 q8 -8 0 -16 q-8 -8 0 -16`} fill="none" stroke={S.bad} strokeWidth={4.5} opacity={0.4 + 0.6 * wave(frame, 18, i * 9)} {...rnd} />)}
    </>
  );
};

// ---------- fire: a flame that flickers ----------
const FireIcon: React.FC<IconProps> = ({frame}) => {
  const f = Math.sin(frame / 3) * 3;
  const g = Math.cos(frame / 4) * 3;
  return (
    <>
      <path d={`M100 ${20 + f} C120 52 150 66 146 104 C142 132 122 146 100 146 C78 146 58 132 54 104 C52 80 70 70 74 48 C86 62 88 72 92 76 C96 56 92 40 100 ${20 + f} Z`} fill={F.orange} {...ln} />
      <path d={`M100 ${74 + g} C112 92 126 102 122 120 C120 134 110 140 100 140 C90 140 80 134 78 120 C76 104 92 98 100 ${74 + g} Z`} fill={F.yellow} {...ln} strokeWidth={4} />
    </>
  );
};

// ---------- agency: a shield with a check (a security or public agency) ----------
const AgencyIcon: React.FC<IconProps> = ({state, frame}) => {
  const scan = state === 'scan';
  const ok = state === 'ok';
  const sy = 40 + ((frame * 2) % 80);
  return (
    <>
      <path d="M100 20 L152 38 C152 92 132 124 100 144 C68 124 48 92 48 38 Z" fill={F.blue} {...ln} />
      <path d="M100 34 L140 48 C140 90 124 114 100 130 C76 114 60 90 60 48 Z" fill={F.paper} stroke={L} strokeWidth={3} />
      <path d="M78 82 L94 98 L124 66" fill="none" stroke={ok ? S.ok : L} strokeWidth={ok ? 9 : 7} {...rnd} />
      {scan && <line x1={58} y1={sy} x2={142} y2={sy} stroke={S.info} strokeWidth={4} opacity={0.7} />}
    </>
  );
};

// ---------- justice: a gavel over its block ----------
const JusticeIcon: React.FC<IconProps> = ({state, frame}) => {
  const strike = state === 'strike';
  const a = strike ? -28 + 28 * Math.abs(Math.sin(frame / 8)) : -18;
  return (
    <>
      <rect x={44} y={122} width={112} height={18} rx={6} fill={F.purple} {...ln} />
      <g transform={`rotate(${a} 128 112)`}>
        <rect x={54} y={58} width={72} height={30} rx={8} fill={F.purple} {...ln} transform="rotate(-35 90 73)" />
        <path d="M100 82 L138 118" stroke={L} strokeWidth={10} strokeLinecap="round" />
        <path d="M100 82 L138 118" stroke="#C69A6B" strokeWidth={5} strokeLinecap="round" />
      </g>
      {strike && Math.abs(Math.sin(frame / 8)) > 0.92 && <path d="M60 116 l-12 -10 M70 110 l-4 -14 M140 116 l12 -10" stroke={L} strokeWidth={4} {...rnd} />}
    </>
  );
};

// ---------- government: a public building with columns ----------
const GovernmentIcon: React.FC<IconProps> = ({state, frame}) => {
  const busy = state === 'busy';
  return (
    <>
      <path d="M30 56 L100 20 L170 56 Z" fill={F.gray} {...ln} />
      <rect x={36} y={56} width={128} height={12} fill={F.paper} {...ln} strokeWidth={4} />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={46 + i * 24} y={72} width={12} height={52} fill={F.paper} {...ln} strokeWidth={4} />
      ))}
      <rect x={30} y={126} width={140} height={14} rx={3} fill={F.gray} {...ln} />
      {busy && <path d={`M100 20 L100 ${4 - 2 * wave(frame, 20)} L122 ${10 - 3 * wave(frame, 14)} L100 14`} fill={S.bad} stroke={L} strokeWidth={3} />}
    </>
  );
};

// ---------- money: a banknote and coins; loss = it drains away ----------
const MoneyIcon: React.FC<IconProps> = ({state, frame}) => {
  const loss = state === 'loss';
  const flow = state === 'flow';
  const drop = loss ? (frame % 40) / 40 : 0;
  return (
    <>
      <g transform={loss ? `translate(0 ${drop * 14}) rotate(${-6 + drop * 10} 100 70)` : undefined} opacity={loss ? 1 - drop * 0.5 : 1}>
        <rect x={36} y={40} width={128} height={64} rx={8} fill={F.green} {...ln} />
        <circle cx={100} cy={72} r={18} fill={F.paper} {...ln} strokeWidth={4} />
        <text x={100} y={81} textAnchor="middle" fontFamily={T.sans} fontWeight={900} fontSize={24} fill={L}>
          €
        </text>
      </g>
      {[0, 1, 2].map((i) => (
        <ellipse key={i} cx={70 + i * 30} cy={128 - (flow ? 6 * wave(frame, 16, i * 5) : 0)} rx={16} ry={8} fill={F.yellow} {...ln} strokeWidth={4} />
      ))}
      {loss && <path d="M150 22 L150 58 M140 48 L150 60 L160 48" fill="none" stroke={S.bad} strokeWidth={6} {...rnd} />}
    </>
  );
};

// ---------- factory: a plant with a chimney (infrastructure) ----------
const FactoryIcon: React.FC<IconProps> = ({state, frame}) => {
  const running = state === 'running';
  const down = state === 'down';
  return (
    <>
      <path d="M30 140 L30 76 L66 96 L66 76 L102 96 L102 76 L138 96 L138 40 L162 40 L162 140 Z" fill={F.gray} {...ln} />
      {[44, 80, 116].map((x) => (
        <rect key={x} x={x} y={110} width={14} height={14} rx={2} fill={down ? '#5C5C66' : F.yellow} {...ln} strokeWidth={3.5} />
      ))}
      {running &&
        [0, 1, 2].map((i) => {
          const k = ((frame / 30 + i / 3) % 1 + 1) % 1;
          return <circle key={i} cx={150 + k * 12} cy={34 - k * 26} r={6 + k * 8} fill="#D5D5DC" stroke={L} strokeWidth={2.5} opacity={1 - k} />;
        })}
      {down && <path d="M126 58 L176 108 M176 58 L126 108" stroke={S.bad} strokeWidth={7} {...rnd} />}
    </>
  );
};

// ---------- world: a globe with continents (international, countries) ----------
const WorldIcon: React.FC<IconProps> = ({state, frame}) => {
  const shift = state === 'spinning' ? ((frame * 0.8) % 60) - 30 : 0;
  return (
    <>
      <defs>
        <clipPath id="news-world-clip">
          <circle cx={100} cy={80} r={56} />
        </clipPath>
      </defs>
      <circle cx={100} cy={80} r={58} fill={F.blue} {...ln} />
      <g clipPath="url(#news-world-clip)">
        {[-60, 0, 60].map((o) => (
          <g key={o} transform={`translate(${o + shift} 0)`}>
            <path d="M58 52 C70 40 92 44 96 58 C100 70 86 74 84 86 C82 100 70 104 64 92 C58 80 50 64 58 52 Z" fill={F.green} stroke={L} strokeWidth={3.5} />
            <path d="M112 44 C126 38 142 48 138 62 C134 72 122 70 118 80 C114 92 124 104 116 116 C108 124 100 112 102 98 C104 84 100 56 112 44 Z" fill={F.green} stroke={L} strokeWidth={3.5} />
          </g>
        ))}
      </g>
      <circle cx={100} cy={80} r={58} fill="none" {...ln} />
    </>
  );
};

// ---------- wave: an ocean swell (sea temperature, El Niño) ----------
const WaveIcon: React.FC<IconProps> = ({state, frame}) => {
  const swell = state === 'swell';
  const amp = swell ? 14 : 8;
  const ph = frame / 6;
  const path = (y: number, k: number) =>
    `M24 ${y} ${Array.from({length: 9}, (_, i) => `Q${33 + i * 18} ${y - amp * Math.sin(ph + i + k)} ${42 + i * 18} ${y}`).join(' ')} L186 146 L24 146 Z`;
  return (
    <>
      <path d={path(72, 0)} fill={swell ? F.orange : F.teal} {...ln} />
      <path d={path(104, 1.4)} fill={F.blue} {...ln} />
    </>
  );
};

// ---------- sun: rays turn while it blazes ----------
const SunIcon: React.FC<IconProps> = ({state, frame}) => {
  const blaze = state === 'blaze';
  const rot = blaze ? frame * 1.5 : 0;
  return (
    <>
      <g transform={`rotate(${rot} 100 80)`}>
        {Array.from({length: 10}, (_, i) => (
          <line key={i} x1={100} y1={14} x2={100} y2={32} stroke={L} strokeWidth={6} strokeLinecap="round" transform={`rotate(${i * 36} 100 80)`} />
        ))}
      </g>
      <circle cx={100} cy={80} r={36 + (blaze ? 3 * wave(frame, 16) : 0)} fill={F.yellow} {...ln} />
    </>
  );
};

// ---------- rain: a cloud with falling drops ----------
const RainIcon: React.FC<IconProps> = ({state, frame}) => {
  const pour = state === 'pour';
  return (
    <>
      <path d="M56 92 C34 92 30 64 52 60 C52 40 78 30 92 44 C102 26 136 28 140 52 C164 50 172 88 146 92 Z" fill={F.gray} {...ln} />
      {[0, 1, 2, 3, 4].map((i) => {
        const k = pour ? ((frame / 14 + i * 0.29) % 1 + 1) % 1 : 0.3;
        return <path key={i} d={`M${62 + i * 20} ${100 + k * 40} l-5 12`} stroke="#2F6FEB" strokeWidth={5} strokeLinecap="round" opacity={pour ? 1 - k * 0.6 : 0.9} />;
      })}
    </>
  );
};

// ---------- pin: a map pin ----------
const PinIcon: React.FC<IconProps> = ({state, frame}) => {
  const k = state === 'pulse' ? (frame % 40) / 40 : 0;
  return (
    <>
      <ellipse cx={100} cy={138} rx={26 + k * 30} ry={8 + k * 8} fill="none" stroke={S.bad} strokeWidth={4} opacity={state === 'pulse' ? 1 - k : 0.4} />
      <path d="M100 140 C88 118 62 92 62 64 C62 40 80 22 100 22 C120 22 138 40 138 64 C138 92 112 118 100 140 Z" fill={F.red} {...ln} />
      <circle cx={100} cy={62} r={14} fill={F.paper} {...ln} strokeWidth={4} />
    </>
  );
};

export const ICONS: Record<string, React.FC<IconProps>> = {
  hacker: HackerIcon,
  internet: InternetIcon,
  controller: ControllerIcon,
  technician: TechnicianIcon,
  store: StoreIcon,
  fridge: FridgeIcon,
  thermometer: ThermometerIcon,
  fire: FireIcon,
  agency: AgencyIcon,
  justice: JusticeIcon,
  government: GovernmentIcon,
  money: MoneyIcon,
  factory: FactoryIcon,
  world: WorldIcon,
  wave: WaveIcon,
  sun: SunIcon,
  rain: RainIcon,
  pin: PinIcon,
};
