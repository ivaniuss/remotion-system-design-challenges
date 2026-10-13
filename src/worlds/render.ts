import type {Frame} from '../layout/frame';
import type {ShotScene} from '../spec/schema';
import {eio, hash, lerp, offscreen, Pt} from './kit';
import {WORLD_DRAW} from './index';
import {eventsOf, WorldFrame} from './types';

// Draws one frame of a `shot` scene into a canvas the size of the video: the world in
// its logical canvas, the slow camera move, then film grain and a vignette. Pure
// function of (scene, t): the Remotion component and `npm run check` both call it.

type Shot = ShotScene & {cues: number[]; duration: number};

export const logicalSize = (frame: Frame) => (frame.format === 'vertical' ? {W: 900, H: 1600} : {W: 1600, H: 900});

export function worldFrame(scene: Shot, t: number, frame: Frame): WorldFrame {
  const {W, H} = logicalSize(frame);
  return {t, dur: scene.duration, W, H, vertical: frame.format === 'vertical', ev: eventsOf(scene.steps, scene.cues)};
}

// The camera move of the shot, in logical units: scale about the centre plus a slide.
function move(scene: Shot, t: number, W: number) {
  const u = eio(t / Math.max(1, scene.duration));
  switch (scene.camera) {
    case 'pull':
      return {s: lerp(1.07, 1, u), dx: 0, dy: 0};
    case 'drift':
      return {s: 1.04, dx: lerp(-0.012, 0.012, u) * W, dy: 0};
    case 'still':
      return {s: 1, dx: 0, dy: 0};
    case 'push':
    default:
      return {s: lerp(1, 1.07, u), dx: 0, dy: 0};
  }
}

// Logical point -> video pixel (the same transform the canvas uses).
export function toPixel(scene: Shot, t: number, frame: Frame, p: Pt): Pt {
  const {W, H} = logicalSize(frame);
  const k = frame.width / W;
  const m = move(scene, t, W);
  return {x: k * (W / 2 + (p.x - W / 2) * m.s + m.dx), y: k * (H / 2 + (p.y - H / 2) * m.s + m.dy)};
}

let grainTile: HTMLCanvasElement | null | undefined;
function grain(): HTMLCanvasElement | null {
  if (grainTile !== undefined) return grainTile;
  const cv = offscreen(256, 256);
  const g = cv?.getContext('2d');
  if (!cv || !g) return (grainTile = null);
  const img = g.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) {
    const v = Math.floor(hash(i, 77) * 255);
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return (grainTile = cv);
}

export function drawShot(c: CanvasRenderingContext2D, scene: Shot, t: number, frame: Frame, fps = 30) {
  const f = worldFrame(scene, t, frame);
  const k = frame.width / f.W;
  const m = move(scene, t, f.W);
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = '#000';
  c.fillRect(0, 0, frame.width, frame.height);
  c.setTransform(k * m.s, 0, 0, k * m.s, k * (f.W / 2 * (1 - m.s) + m.dx), k * (f.H / 2 * (1 - m.s) + m.dy));
  c.save();
  WORLD_DRAW[scene.world].draw(c, f);
  c.restore();
  c.setTransform(1, 0, 0, 1, 0, 0);
  // vignette
  const r = Math.hypot(frame.width, frame.height) / 2;
  const v = c.createRadialGradient(frame.width / 2, frame.height / 2, r * 0.45, frame.width / 2, frame.height / 2, r);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.55)');
  c.fillStyle = v;
  c.fillRect(0, 0, frame.width, frame.height);
  // film grain: a fixed noise tile, shifted every frame (deterministic)
  const tile = grain();
  if (tile) {
    const n = Math.floor(t * fps);
    const pat = c.createPattern(tile, 'repeat');
    if (pat) {
      c.save();
      c.globalAlpha = 0.06;
      c.globalCompositeOperation = 'overlay';
      c.translate(-Math.floor(hash(n, 1) * 256), -Math.floor(hash(n, 2) * 256));
      c.fillStyle = pat;
      c.fillRect(0, 0, frame.width + 256, frame.height + 256);
      c.restore();
    }
  }
}
