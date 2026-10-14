import React from 'react';
import {ICON_DEFAULT_STATE, ICON_STATES, type IconName, type Status} from '../spec/vocab';
import type {IconProps} from '../packs/draw';
import {ICONS as COMMON} from '../packs/common/icons';
import {ICONS as TECH} from '../packs/tech/icons';
import {ICONS as SCIENCE} from '../packs/science/icons';
import {ICONS as NEWS} from '../packs/news/icons';
import {ICONS as BRAIN} from '../packs/brain/icons';

// Dispatcher over every icon pack (src/packs/<pack>/icons.tsx). The drawings live in
// the packs; scenes only use NodeIcon and iconState from here.
const MAP: Record<string, React.FC<IconProps>> = {...COMMON, ...TECH, ...SCIENCE, ...NEWS, ...BRAIN};

export const iconState = (icon: IconName, status: Status): string =>
  ICON_STATES[status]?.[icon] ?? ICON_DEFAULT_STATE[icon] ?? 'idle';

export const NodeIcon: React.FC<{icon: IconName; state: string; frame: number; p: number}> = ({icon, state, frame, p}) => {
  const C = MAP[icon];
  return C ? <C state={state} frame={frame} p={p} /> : null;
};
