// Icons shared by every pack: people, devices, documents, notifications, charts.
import React from 'react';
import {STROKE, T, F, S, L, ln, rnd, clampP, caption, type IconProps} from '../draw';

// ---------- user: single person ----------
const UserIcon: React.FC<IconProps> = ({state, p}) => {
  const s = state === 'surge' ? 1 + 0.08 * clampP(p) : 1;
  return (
    <g transform={`translate(100 80) scale(${s}) translate(-100 -80)`}>
      <path d="M52 146 Q52 92 100 92 Q148 92 148 146 Z" fill={F.blue} {...ln} />
      <circle cx={100} cy={52} r={28} fill={F.paper} {...ln} />
    </g>
  );
};

// ---------- users: silhouettes (millions of users) ----------
const Person: React.FC<{x: number; y: number; s: number; fill: string; op?: number}> = ({x, y, s, fill, op = 1}) => (
  <g opacity={op} transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-22 40 Q-22 -4 0 -4 Q22 -4 22 40 Z" fill={fill} {...ln} />
    <circle cx={0} cy={-20} r={15} fill={fill} {...ln} />
  </g>
);
const UsersIcon: React.FC<IconProps> = ({state, p}) => {
  const surge = state === 'surge';
  const s = surge ? 1 + 0.25 * clampP(p) : 1;
  return (
    <>
      <Person x={50} y={116} s={s} fill={F.blue} />
      <Person x={100} y={116} s={s} fill={F.orange} />
      <Person x={150} y={116} s={s} fill={F.green} />
      {surge && <Person x={18} y={120} s={0.6} fill={F.yellow} op={clampP(p)} />}
      {surge && <Person x={182} y={120} s={0.6} fill={F.yellow} op={clampP(p)} />}
    </>
  );
};

// ---------- mobile: phone ----------
const MobileIcon: React.FC<IconProps> = ({state, frame}) => (
  <>
    <rect x={64} y={10} width={72} height={140} rx={14} fill={F.paper} {...ln} />
    <rect x={75} y={28} width={50} height={92} rx={4} fill={state === 'error' ? F.red : F.blue} {...ln} strokeWidth={3.5} />
    <circle cx={100} cy={135} r={5} fill={L} />
    {state === 'loading' && (
      <g transform={`rotate(${frame * 12} 100 74)`}>
        <circle cx={100} cy={74} r={13} fill="none" stroke={L} strokeWidth={5} strokeDasharray="55 30" strokeLinecap="round" />
      </g>
    )}
  </>
);

// ---------- file: sheet with a folded corner ----------
const FileIcon: React.FC<IconProps> = () => (
  <>
    <path d="M50 20 H124 L150 46 V140 H50 Z" fill={F.paper} {...ln} />
    <path d="M124 20 V46 H150" fill="none" {...ln} />
    <path d="M66 72 H134 M66 92 H134 M66 112 H118" stroke={L} strokeWidth={4} fill="none" strokeLinecap="round" />
  </>
);

// ---------- mail: envelope ----------
const MailIcon: React.FC<IconProps> = () => (
  <>
    <rect x={20} y={40} width={160} height={100} rx={6} fill={F.orange} {...ln} />
    <path d="M20 40 L100 100 L180 40" fill="none" {...ln} />
  </>
);

// ---------- search: magnifier ----------
const SearchIcon: React.FC<IconProps> = ({state, frame}) => {
  const dx = state === 'busy' ? Math.sin(frame / 6) * 10 : 0;
  return (
    <g transform={`translate(${dx} 0)`}>
      <line x1={118} y1={100} x2={156} y2={140} stroke={L} strokeWidth={14} strokeLinecap="round" />
      <circle cx={88} cy={70} r={44} fill={F.yellow} {...ln} />
      <circle cx={88} cy={70} r={28} fill={F.paper} {...ln} strokeWidth={3.5} />
    </g>
  );
};

// ---------- bell: notifications / push ----------
const BellIcon: React.FC<IconProps> = ({state, frame}) => {
  const ring = state === 'busy' || state === 'ok' ? Math.sin(frame * 0.9) * 12 : 0;
  return (
    <g transform={`rotate(${ring} 100 24)`}>
      <path d="M100 22 C70 22 60 50 60 76 V102 L44 124 H156 L140 102 V76 C140 50 130 22 100 22 Z" fill={F.yellow} {...ln} />
      <circle cx={100} cy={138} r={11} fill={F.orange} {...ln} strokeWidth={3.5} />
      <circle cx={100} cy={18} r={7} fill={L} />
    </g>
  );
};

// ---------- chart: metrics / monitoring ----------
const ChartIcon: React.FC<IconProps> = ({state, frame, p}) => {
  const grow = state === 'busy' ? 0.8 + 0.2 * Math.abs(Math.sin(frame / 8)) : 1;
  const bars = [52, 86, 66, 104];
  const fills = [F.blue, F.green, F.orange, F.purple];
  return (
    <>
      <rect x={18} y={14} width={164} height={132} rx={10} fill={F.paper} {...ln} />
      {bars.map((h, i) => {
        const hh = h * grow * (0.6 + 0.4 * clampP(p + 0.6));
        return <rect key={i} x={38 + i * 36} y={132 - hh} width={24} height={hh} rx={3} fill={fills[i]} stroke={L} strokeWidth={3} />;
      })}
    </>
  );
};

// ---------- ai: model chip ----------
const AiIcon: React.FC<IconProps> = ({state, frame}) => {
  const glow = state === 'busy' ? Math.floor(frame / 4) % 4 : -1;
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <line x1={66 + i * 22} y1={14} x2={66 + i * 22} y2={34} stroke={L} strokeWidth={4} strokeLinecap="round" />
          <line x1={66 + i * 22} y1={126} x2={66 + i * 22} y2={146} stroke={L} strokeWidth={4} strokeLinecap="round" />
          <line x1={34} y1={47 + i * 22} x2={54} y2={47 + i * 22} stroke={glow === i ? T.state.warn : L} strokeWidth={4} strokeLinecap="round" />
          <line x1={146} y1={47 + i * 22} x2={166} y2={47 + i * 22} stroke={glow === i ? T.state.warn : L} strokeWidth={4} strokeLinecap="round" />
        </g>
      ))}
      <rect x={52} y={32} width={96} height={96} rx={14} fill={F.purple} {...ln} />
      <text x={100} y={93} textAnchor="middle" fontFamily={T.mono} fontWeight={800} fontSize={38} fill={L}>
        AI
      </text>
    </>
  );
};

export const ICONS: Record<string, React.FC<IconProps>> = {
  user: UserIcon,
  users: UsersIcon,
  mobile: MobileIcon,
  file: FileIcon,
  mail: MailIcon,
  search: SearchIcon,
  bell: BellIcon,
  chart: ChartIcon,
  ai: AiIcon,
};
