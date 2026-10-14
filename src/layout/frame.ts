// Safe areas per output format. Every scene lays itself out inside `content`, so
// the same spec renders correctly in 9:16 and 16:9.

export type Format = 'vertical' | 'horizontal';
export type Box = {x: number; y: number; w: number; h: number};

export type Frame = {
  format: Format;
  width: number;
  height: number;
  progress: Box;
  handle: {x: number; y: number; align: 'left' | 'right'};
  header: Box; // scene title
  content: Box; // main area
  captions: Box;
  // The host (an animated presenter in a corner), when the video has one: its square sprite
  // box, whether it is mirrored to face the content, and the speech bubble that holds the
  // captions next to it (9:16).
  host?: {x: number; y: number; size: number; mirror: boolean; bubble?: Box};
  // Base font sizes; scenes scale from these.
  font: {h1: number; h2: number; body: number; small: number; caption: number};
};

const VERTICAL: Frame = {
  format: 'vertical',
  width: 1080,
  height: 1920,
  // TikTok/Shorts cover ~170 px at the top and ~340 px at the bottom with UI.
  progress: {x: 60, y: 120, w: 960, h: 10},
  handle: {x: 60, y: 172, align: 'left'},
  header: {x: 60, y: 200, w: 960, h: 140},
  content: {x: 50, y: 350, w: 980, h: 1060},
  captions: {x: 60, y: 1440, w: 960, h: 170},
  font: {h1: 96, h2: 62, body: 40, small: 30, caption: 58},
};

const HORIZONTAL: Frame = {
  format: 'horizontal',
  width: 1920,
  height: 1080,
  progress: {x: 0, y: 0, w: 1920, h: 8},
  handle: {x: 1860, y: 60, align: 'right'},
  header: {x: 120, y: 44, w: 1680, h: 110},
  content: {x: 110, y: 170, w: 1700, h: 740},
  captions: {x: 160, y: 940, w: 1600, h: 110},
  font: {h1: 104, h2: 58, body: 38, small: 28, caption: 46},
};

// With a host, the content area makes room for it. 9:16: the host stands bottom-left and
// the captions become its speech bubble, above the band the Shorts UI covers; content and
// bubble stop at x 930, clear of the like/comment/share column that TikTok, Shorts and
// Reels draw down the right edge. 16:9: bottom-right, the content narrower.
function withHost(f: Frame, side?: 'left' | 'right'): Frame {
  if (f.format === 'vertical') {
    const size = 460;
    const left = side !== 'right';
    const x = left ? 10 : f.width - 10 - size;
    const y = 1572 - Math.round(size * 0.905); // feet just above the covered band
    const rail = 930; // right edge of the area the platform buttons leave free
    const bubble = left ? {x: x + size - 60, y: 1290, w: rail - (x + size - 60), h: 250} : {x: 60, y: 1290, w: x + 60 - 60, h: 250};
    const content = {x: 60, y: f.content.y, w: rail - 60, h: 900};
    return {...f, content, captions: bubble, host: {x, y, size, mirror: left, bubble}};
  }
  const size = 440;
  const right = side !== 'left';
  const x = right ? f.width - size + 10 : -10;
  const y = f.height - 18 - Math.round(size * 0.905);
  const content = right ? {...f.content, w: 1430} : {...f.content, x: f.content.x + 270, w: 1430};
  const captions = right ? {...f.captions, x: 120, w: 1400} : {...f.captions, x: 400, w: 1400};
  return {...f, content, captions, host: {x, y, size, mirror: !right}};
}

// When captions are off, the content area grows into their space.
export function frameFor(format: Format, captions: boolean, host?: {side?: 'left' | 'right'} | null): Frame {
  const base = format === 'vertical' ? VERTICAL : HORIZONTAL;
  const f = host ? withHost(base, host.side) : base;
  if (captions || (host && format === 'vertical')) return f;
  const grow = format === 'vertical' ? 80 : 130;
  return {...f, content: {...f.content, h: f.content.h + grow}};
}
