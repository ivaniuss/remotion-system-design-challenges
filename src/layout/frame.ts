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

// When captions are off, the content area grows into their space.
export function frameFor(format: Format, captions: boolean): Frame {
  const f = format === 'vertical' ? VERTICAL : HORIZONTAL;
  if (captions) return f;
  const grow = format === 'vertical' ? 80 : 130;
  return {...f, content: {...f.content, h: f.content.h + grow}};
}
