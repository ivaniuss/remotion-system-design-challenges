// Software / system design icons (the "tech" pack). Drawn in a 200x160 box.
import React from 'react';
import {STROKE, T, F, S, L, ln, rnd, clampP, caption, type IconProps} from '../draw';

// ---------- client: browser window ----------
const ClientIcon: React.FC<IconProps> = ({state, frame}) => (
  <>
    <rect x={10} y={20} width={180} height={130} rx={10} fill={F.paper} {...ln} />
    <rect x={10} y={20} width={180} height={26} rx={10} fill={F.blue} {...ln} />
    <circle cx={26} cy={33} r={4} fill={L} />
    <circle cx={38} cy={33} r={4} fill={L} />
    <circle cx={50} cy={33} r={4} fill={L} />
    {state === 'idle' && (
      <>
        <rect x={60} y={66} width={80} height={52} rx={10} fill={F.blue} {...ln} />
        <path d="M100 76 V104 M88 94 L100 106 L112 94" fill="none" stroke={L} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      </>
    )}
    {state === 'loading' && (
      <>
        <g transform={`rotate(${frame * 12} 100 90)`}>
          <circle cx={100} cy={90} r={20} fill="none" stroke={L} strokeWidth={5} strokeDasharray="60 40" strokeLinecap="round" />
        </g>
      </>
    )}
    {state === 'error' && (
      <>
        <line x1={84} y1={72} x2={116} y2={104} stroke={S.bad} strokeWidth={10} strokeLinecap="round" />
        <line x1={116} y1={72} x2={84} y2={104} stroke={S.bad} strokeWidth={10} strokeLinecap="round" />
      </>
    )}
    {state === 'accepted' && (
      <>
        <polyline points="80,90 95,105 122,74" fill="none" stroke={S.ok} strokeWidth={10} {...rnd} />
      </>
    )}
    {state === 'done' && (
      <>
        <path d="M70 58 H116 L132 74 V136 H70 Z" fill={F.paper} {...ln} />
        <path d="M116 58 V74 H132" fill="none" {...ln} />
        <polyline points="82,100 94,112 118,86" fill="none" stroke={S.ok} strokeWidth={7} {...rnd} />
      </>
    )}
  </>
);

// ---------- api: 3-unit rack with LEDs ----------
const ApiIcon: React.FC<IconProps> = ({state, frame}) => {
  const busy = state === 'busy';
  const dx = busy ? Math.sin(frame * 1.6) * 1.5 : 0;
  const led = (i: number) => (busy ? (Math.floor(frame / 3 + i) % 2 === 0 ? S.bad : S.warn) : S.ok);
  return (
    <g transform={`translate(${dx} 0)`}>
      <rect x={20} y={20} width={160} height={120} rx={8} fill={F.gray} {...ln} />
      {[0, 1, 2].map((i) => {
        const y = 32 + i * 36;
        return (
          <g key={i}>
            <rect x={32} y={y} width={136} height={26} rx={4} fill={F.paper} {...ln} strokeWidth={3.5} />
            <line x1={44} y1={y + 13} x2={128} y2={y + 13} stroke={L} strokeWidth={3} strokeLinecap="round" />
            <circle cx={156} cy={y + 13} r={6} fill={led(i)} stroke={L} strokeWidth={2.5} />
          </g>
        );
      })}
      {busy &&
        [0, 1, 2].map((i) => {
          const x = i === 1 ? 192 : 8;
          const y = 20 + ((frame * 2 + i * 35) % 90);
          return (
            <path
              key={i}
              d={`M${x} ${y} Q${x + 6} ${y + 8} ${x} ${y + 12} Q${x - 6} ${y + 8} ${x} ${y} Z`}
              fill={F.blue}
              stroke={L}
              strokeWidth={3}
            />
          );
        })}
    </g>
  );
};

// ---------- db: cylinder with scan band ----------
const DbIcon: React.FC<IconProps> = ({state, frame}) => {
  const scan = state === 'scanning';
  const band = 40 + ((frame * 2) % 80);
  return (
    <>
      <path d="M30 40 V130 A70 16 0 0 0 170 130 V40 Z" fill={F.blue} {...ln} />
      <path d="M30 72 A70 16 0 0 0 170 72" fill="none" {...ln} />
      <path d="M30 100 A70 16 0 0 0 170 100" fill="none" {...ln} />
      <ellipse cx={100} cy={40} rx={70} ry={16} fill={F.blue} {...ln} />
      {scan && <rect x={34} y={band} width={132} height={12} fill={S.info} />}
      {scan &&
        [0, 1, 2].map((i) => (
          <rect
            key={i}
            x={52}
            y={58 + i * 22}
            width={60}
            height={6}
            rx={3}
            fill={L}
            opacity={Math.floor(frame / 4 + i) % 2 ? 1 : 0.15}
          />
        ))}
    </>
  );
};

// ---------- gateway: load balancer (1 input, 2 outputs) ----------
const GatewayIcon: React.FC<IconProps> = ({state, frame, p}) => {
  const cut = state === 'cut';
  const waiting = state === 'waiting';
  const a = ((frame * 4 + p * 90 - 90) * Math.PI) / 180;
  return (
    <>
      <rect
        x={30}
        y={30}
        width={140}
        height={100}
        rx={10}
        fill={F.orange}
        stroke={cut ? S.bad : L}
        strokeWidth={STROKE}
        strokeDasharray={cut ? '12 9' : undefined}
      />
      <path d="M38 80 H80 M80 80 C100 80 100 60 124 60 H158 M80 80 C100 80 100 100 124 100 H158" fill="none" {...ln} />
      <circle cx={80} cy={80} r={7} fill={L} />
      {cut && (
        <g stroke={S.bad} strokeWidth={9} strokeLinecap="round">
          <line x1={72} y1={60} x2={128} y2={108} />
          <line x1={128} y1={60} x2={72} y2={108} />
        </g>
      )}
      {waiting && (
        <g opacity={p}>
          <circle cx={160} cy={34} r={18} fill={F.paper} {...ln} strokeWidth={4} />
          <line x1={160} y1={34} x2={160 + Math.cos(a) * 11} y2={34 + Math.sin(a) * 11} stroke={L} strokeWidth={3.5} strokeLinecap="round" />
        </g>
      )}
    </>
  );
};

// ---------- queue: tube with compartments and an envelope ----------
const QueueIcon: React.FC<IconProps> = ({state, frame, p}) => {
  const msg = state === 'msg';
  const ex = 16 + 70 * clampP(p);
  const ey = 66 + Math.sin(frame / 6) * 3;
  return (
    <>
      <path d="M14 26 H88" fill="none" {...ln} strokeWidth={3.5} />
      <path d="M78 18 L90 26 L78 34" fill="none" {...ln} strokeWidth={3.5} />
      <rect x={10} y={56} width={180} height={50} rx={25} fill={F.yellow} {...ln} />
      <path d="M60 60 V102 M110 60 V102 M160 60 V102" stroke={L} strokeWidth={3} fill="none" />
      {msg && (
        <g>
          <rect x={ex} y={ey} width={36} height={24} rx={3} fill={F.paper} stroke={L} strokeWidth={3.5} />
          <path d={`M${ex} ${ey} L${ex + 18} ${ey + 14} L${ex + 36} ${ey}`} fill="none" stroke={L} strokeWidth={3} />
        </g>
      )}
    </>
  );
};

// ---------- worker: server with two gears and a progress bar ----------
const Gear: React.FC<{cx: number; cy: number; rot: number; dir: number}> = ({cx, cy, rot, dir}) => (
  <g transform={`rotate(${rot * dir} ${cx} ${cy})`}>
    <circle cx={cx} cy={cy} r={20} fill="none" stroke={L} strokeWidth={12} strokeDasharray="7 7" />
    <circle cx={cx} cy={cy} r={13} fill={F.paper} stroke={L} strokeWidth={3.5} />
  </g>
);

const WorkerIcon: React.FC<IconProps> = ({state, frame, p}) => {
  const working = state === 'working';
  const done = state === 'done';
  const rot = working ? frame * 4 : 0;
  const fillFrac = done ? 1 : working ? p : 0;
  return (
    <>
      <rect x={20} y={20} width={160} height={120} rx={10} fill={F.green} {...ln} />
      <Gear cx={70} cy={66} rot={rot} dir={1} />
      <Gear cx={130} cy={66} rot={rot} dir={-1} />
      <rect x={32} y={104} width={136} height={18} rx={9} fill={F.paper} {...ln} strokeWidth={3.5} />
      <rect x={36} y={108} width={Math.max(0, 128 * fillFrac)} height={10} rx={5} fill={S.ok} />
      {done && (
        <>
          <circle cx={172} cy={34} r={17} fill={F.paper} {...ln} strokeWidth={3.5} />
          <polyline points="164,34 171,41 182,27" fill="none" stroke={S.ok} strokeWidth={4.5} {...rnd} />
        </>
      )}
    </>
  );
};

// ---------- cache: box with a lightning bolt ----------
const CacheIcon: React.FC<IconProps> = ({state}) => {
  const cold = state === 'cold';
  const hit = state === 'hit';
  const miss = state === 'miss';
  return (
    <>
      <rect x={50} y={40} width={100} height={80} rx={8} fill={cold ? F.gray : F.yellow} {...ln} />
      {!cold && <polygon points="108,50 84,92 102,92 92,120 118,80 100,80 112,50" fill={L} />}
      {hit && (
        <>
          <circle cx={160} cy={40} r={20} fill={S.ok} {...ln} strokeWidth={3.5} />
          <polyline points="151,40 158,47 170,32" fill="none" stroke={L} strokeWidth={4} {...rnd} />
        </>
      )}
      {miss && (
        <>
          <circle cx={160} cy={40} r={20} fill={S.warn} {...ln} strokeWidth={3.5} />
          <line x1={152} y1={32} x2={168} y2={48} stroke={L} strokeWidth={4} strokeLinecap="round" />
          <line x1={168} y1={32} x2={152} y2={48} stroke={L} strokeWidth={4} strokeLinecap="round" />
        </>
      )}
    </>
  );
};

// ---------- cdn: globe with points of presence ----------
const CDN_POINTS = [
  {x: 62, y: 62},
  {x: 140, y: 56},
  {x: 112, y: 124},
];
const CdnIcon: React.FC<IconProps> = ({state, frame}) => {
  const serving = state === 'serving';
  return (
    <>
      <circle cx={100} cy={80} r={62} fill={F.blue} {...ln} />
      <path d="M60 60 Q80 48 98 62 Q92 82 70 84 Q52 78 60 60 Z M120 96 Q140 90 146 110 Q128 118 120 96 Z" fill={F.green} stroke={L} strokeWidth={3} />
      <path d="M62 62 L140 56 L112 124 Z" fill="none" stroke={L} strokeWidth={3} strokeDasharray="6 6" />
      {CDN_POINTS.map((q, i) => (
        <circle key={i} cx={q.x} cy={q.y} r={9} fill={F.orange} {...ln} strokeWidth={3} />
      ))}
      {serving &&
        CDN_POINTS.map((q, i) => {
          const ph = (frame * 2 + i * 7) % 24;
          return (
            <circle key={`s${i}`} cx={q.x} cy={q.y} r={12 + ph * 0.9} fill="none" stroke={S.warn} strokeWidth={3} opacity={1 - ph / 24} />
          );
        })}
    </>
  );
};

// ---------- storage: bucket with files ----------
const StorageIcon: React.FC<IconProps> = ({state, p}) => {
  const up = state === 'uploading';
  return (
    <>
      <path d="M40 50 L55 140 H145 L160 50 Z" fill={F.blue} {...ln} />
      <ellipse cx={100} cy={50} rx={60} ry={12} fill={F.paper} {...ln} />
      <rect x={66} y={80} width={22} height={28} rx={3} fill={F.paper} {...ln} strokeWidth={3.5} />
      <rect x={100} y={74} width={26} height={34} rx={3} fill={F.orange} {...ln} strokeWidth={3.5} />
      {up && p < 1 && <rect x={89} y={8 + 44 * clampP(p)} width={22} height={28} rx={3} fill={F.yellow} {...ln} strokeWidth={3.5} />}
    </>
  );
};

// ---------- replica: primary and replica ----------
const Cyl: React.FC<{x: number; y: number; w: number; h: number; fill: string}> = ({x, y, w, h, fill}) => (
  <>
    <path d={`M${x} ${y} V${y + h} A${w / 2} 14 0 0 0 ${x + w} ${y + h} V${y} Z`} fill={fill} {...ln} />
    <ellipse cx={x + w / 2} cy={y} rx={w / 2} ry={14} fill={fill} {...ln} />
  </>
);
const ReplicaIcon: React.FC<IconProps> = ({state, p}) => {
  const lag = state === 'lagging';
  const sync = state === 'syncing';
  return (
    <>
      <Cyl x={72} y={18} w={100} h={100} fill={lag ? F.yellow : '#E3EEFF'} />
      <Cyl x={28} y={38} w={100} h={100} fill={F.blue} />
      {sync &&
        [0, 1].map((i) => {
          const y = 70 + i * 26;
          const len = 22 * clampP(p);
          return (
            <path
              key={i}
              d={`M136 ${y} H${136 + len} M${130 + len} ${y - 5} L${136 + len} ${y} L${130 + len} ${y + 5}`}
              fill="none"
              stroke={L}
              strokeWidth={4}
              {...rnd}
            />
          );
        })}
    </>
  );
};

// ---------- instances: racks in a row ----------
const InstancesIcon: React.FC<IconProps> = ({state, frame}) => {
  const busy = state === 'busy';
  const oneDown = state === 'one-down';
  return (
    <>
      {[0, 1, 2].map((i) => {
        const x = 12 + i * 58;
        const down = oneDown && i === 2;
        const ledC = down ? F.gray : busy ? (Math.floor(frame / 3 + i) % 2 ? S.bad : S.warn) : S.ok;
        return (
          <g key={i}>
            <rect x={x} y={30} width={56} height={100} rx={6} fill={down ? F.gray : F.blue} {...ln} />
            <circle cx={x + 28} cy={50} r={5} fill={ledC} />
            <line x1={x + 12} y1={70} x2={x + 44} y2={70} stroke={L} strokeWidth={3} strokeLinecap="round" />
            <line x1={x + 12} y1={90} x2={x + 44} y2={90} stroke={L} strokeWidth={3} strokeLinecap="round" />
            {down && <line x1={x - 4} y1={128} x2={x + 60} y2={28} stroke={L} strokeWidth={6} strokeLinecap="round" />}
          </g>
        );
      })}
    </>
  );
};

// ---------- broker: parallel tubes (partitions) with envelopes ----------
const BrokerIcon: React.FC<IconProps> = ({state, frame}) => {
  const flowing = state === 'flowing';
  const backlog = state === 'backlog';
  return (
    <>
      {[0, 1, 2].map((i) => {
        const y = 34 + i * 40;
        return (
          <g key={i}>
            <rect
              x={10}
              y={y}
              width={180}
              height={24}
              rx={12}
              fill={F.yellow}
              stroke={backlog ? S.warn : L}
              strokeWidth={backlog ? 6 : STROKE}
            />
            {backlog &&
              [0, 1, 2, 3, 4].map((j) => (
                <rect key={j} x={22 + j * 34} y={y + 6} width={22} height={12} rx={2} fill={F.orange} stroke={L} strokeWidth={2.5} />
              ))}
            {!backlog && flowing &&
              [0, 1].map((j) => {
                const x = 20 + ((frame * 2.5 + j * 90 + i * 30) % 150);
                return <rect key={j} x={x} y={y + 6} width={18} height={12} rx={2} fill={F.orange} stroke={L} strokeWidth={2.5} />;
              })}
            {!backlog && !flowing && <rect x={30} y={y + 6} width={18} height={12} rx={2} fill={F.orange} stroke={L} strokeWidth={2.5} />}
          </g>
        );
      })}
    </>
  );
};

// ---------- ratelimit: funnel with a counter ----------
const RateLimitIcon: React.FC<IconProps> = ({state, frame}) => {
  const thr = state === 'throttling';
  return (
    <>
      <path d="M18 34 H182 L118 96 V142 L82 126 V96 Z" fill={F.blue} {...ln} />
      <rect x={68} y={4} width={64} height={26} rx={6} fill={F.paper} {...ln} strokeWidth={3.5} />
      <text x={100} y={23} textAnchor="middle" fontFamily={T.mono} fontWeight={800} fontSize={20} fill={thr ? S.bad : L}>
        {thr ? '429' : '0'}
      </text>
      {thr &&
        [0, 1].map((i) => {
          const y = 40 + ((frame * 2 + i * 40) % 70);
          const x = 100 + Math.sin(frame / 5 + i) * 40;
          return <circle key={i} cx={x} cy={y} r={6} fill={S.bad} stroke={L} strokeWidth={2.5} />;
        })}
    </>
  );
};

// ---------- external: cloud with a padlock ----------
const ExternalIcon: React.FC<IconProps> = ({state, frame}) => {
  const slow = state === 'slow';
  const down = state === 'down';
  const hand = (frame * 2) % 360;
  const ha = (hand * Math.PI) / 180;
  return (
    <>
      <path
        d="M55 115 C25 115 25 75 55 75 C55 45 95 40 105 65 C120 50 150 60 150 90 C180 90 180 115 150 115 Z"
        fill={F.paper}
        {...ln}
      />
      <path d="M92 92 V84 A8 8 0 0 1 108 84 V92" fill="none" {...ln} />
      <rect x={88} y={92} width={24} height={20} rx={3} fill={F.orange} {...ln} strokeWidth={3.5} />
      {slow && (
        <>
          <circle cx={168} cy={32} r={18} fill={F.yellow} {...ln} strokeWidth={3.5} />
          <line x1={168} y1={32} x2={168 + Math.cos(ha) * 10} y2={32 + Math.sin(ha) * 10} stroke={L} strokeWidth={3} strokeLinecap="round" />
        </>
      )}
      {down && (
        <>
          <circle cx={168} cy={32} r={18} fill={S.bad} {...ln} strokeWidth={3.5} />
          <line x1={160} y1={24} x2={176} y2={40} stroke={L} strokeWidth={4} strokeLinecap="round" />
          <line x1={176} y1={24} x2={160} y2={40} stroke={L} strokeWidth={4} strokeLinecap="round" />
        </>
      )}
    </>
  );
};

// ---------- scheduler: clock with a gear ----------
const SchedulerIcon: React.FC<IconProps> = ({state, frame}) => {
  const tick = state === 'tick';
  const minute = tick ? Math.floor(frame / 8) * 30 : 0;
  return (
    <>
      <circle cx={80} cy={80} r={56} fill={F.paper} {...ln} />
      <line x1={80} y1={80} x2={80} y2={36} transform={`rotate(${minute} 80 80)`} stroke={L} strokeWidth={STROKE} strokeLinecap="round" />
      <line x1={80} y1={80} x2={104} y2={80} stroke={L} strokeWidth={STROKE} strokeLinecap="round" />
      <circle cx={80} cy={80} r={5} fill={L} />
      <g transform={`rotate(${frame * 1.5} 150 128)`}>
        <circle cx={150} cy={128} r={20} fill="none" stroke={L} strokeWidth={12} strokeDasharray="7 7" />
        <circle cx={150} cy={128} r={12} fill={F.orange} stroke={L} strokeWidth={3.5} />
      </g>
    </>
  );
};

// ---------- lambda: serverless function ----------
const LambdaIcon: React.FC<IconProps> = ({state, frame}) => (
  <>
    <path d="M100 12 L164 48 V112 L100 148 L36 112 V48 Z" fill={F.orange} {...ln} />
    <g opacity={state === 'busy' ? 0.55 + 0.45 * Math.abs(Math.sin(frame / 5)) : 1}>
      <path d="M76 44 H94 L128 118" fill="none" stroke={L} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M104 76 L76 118" fill="none" stroke={L} strokeWidth={10} strokeLinecap="round" />
    </g>
  </>
);

// ---------- container: stacked boxes on a whale-less base ----------
const ContainerIcon: React.FC<IconProps> = ({state, frame}) => (
  <>
    <rect x={22} y={82} width={156} height={56} rx={10} fill={F.teal} {...ln} />
    {[0, 1, 2].map((i) => (
      <rect key={`a${i}`} x={40 + i * 42} y={44} width={36} height={34} rx={4} fill={F.paper} {...ln} strokeWidth={3.5} />
    ))}
    {[0, 1].map((i) => (
      <rect key={`b${i}`} x={61 + i * 42} y={8} width={36} height={34} rx={4} fill={state === 'busy' && Math.floor(frame / 6 + i) % 2 ? F.yellow : F.paper} {...ln} strokeWidth={3.5} />
    ))}
    <path d="M40 110 H160" stroke={L} strokeWidth={3} strokeDasharray="8 8" />
  </>
);

// ---------- lock: auth / security ----------
const LockIcon: React.FC<IconProps> = ({state}) => {
  const open = state === 'ok';
  return (
    <>
      <path d={open ? 'M68 70 V48 A32 32 0 0 1 132 48 V30' : 'M68 70 V48 A32 32 0 0 1 132 48 V70'} fill="none" stroke={L} strokeWidth={12} strokeLinecap="round" />
      <rect x={50} y={70} width={100} height={78} rx={12} fill={state === 'error' ? F.red : F.yellow} {...ln} />
      <circle cx={100} cy={102} r={10} fill={L} />
      <rect x={96} y={104} width={8} height={24} rx={3} fill={L} />
    </>
  );
};

// ---------- code: editor window ----------
const CodeIcon: React.FC<IconProps> = ({state, frame}) => (
  <>
    <rect x={16} y={18} width={168} height={124} rx={10} fill={F.paper} {...ln} />
    <rect x={16} y={18} width={168} height={26} rx={10} fill={F.purple} {...ln} />
    <circle cx={32} cy={31} r={4} fill={L} />
    <circle cx={44} cy={31} r={4} fill={L} />
    <polyline points="78,68 58,90 78,112" fill="none" stroke={L} strokeWidth={7} {...rnd} />
    <polyline points="122,68 142,90 122,112" fill="none" stroke={L} strokeWidth={7} {...rnd} />
    <line x1={108} y1={62} x2={92} y2={118} stroke={state === 'busy' && Math.floor(frame / 8) % 2 ? T.state.info : L} strokeWidth={7} strokeLinecap="round" />
  </>
);

export const ICONS: Record<string, React.FC<IconProps>> = {
  client: ClientIcon,
  api: ApiIcon,
  db: DbIcon,
  gateway: GatewayIcon,
  queue: QueueIcon,
  worker: WorkerIcon,
  cache: CacheIcon,
  cdn: CdnIcon,
  storage: StorageIcon,
  replica: ReplicaIcon,
  instances: InstancesIcon,
  broker: BrokerIcon,
  ratelimit: RateLimitIcon,
  external: ExternalIcon,
  scheduler: SchedulerIcon,
  lambda: LambdaIcon,
  container: ContainerIcon,
  lock: LockIcon,
  code: CodeIcon,
};
