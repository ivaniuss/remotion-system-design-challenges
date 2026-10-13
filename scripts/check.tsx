// npm run check [-- videos/<pack>/<id>.json ...] [--every N]
// Renders every few frames of each spec (both formats) to static markup and fails on
// NaN / undefined / Infinity. Also flags diagrams that had to shrink a lot.
// --every N checks one frame in N (default 2; use 8 for a quick pass over every video).
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadSpec} from './lib/spec';
import {buildTimeline, estimateSpeech} from '../src/timeline/timeline';
import {frameFor, Format} from '../src/layout/frame';
import {layoutFlow} from '../src/layout/flow';
import {boardBox, boardHasNotes, fullBoardZoom} from '../src/board/board';
import {VideoFrame} from '../src/video/VideoFrame';
import {drawShot} from '../src/worlds/render';
import {setCanvasFactory} from '../src/worlds/kit';
import {mockContext} from './lib/mock-canvas';

// Worlds draw on a canvas, which static markup cannot show: they are checked by drawing
// every checked frame into a mock context that reports NaN/Infinity (no offscreen
// canvases in node, so glows use their gradient fallback).
setCanvasFactory(() => null);

const argv = process.argv.slice(2);
const everyIdx = argv.indexOf('--every');
const EVERY = Math.max(1, Math.floor(Number(everyIdx >= 0 ? argv[everyIdx + 1] : 2)) || 2);
const args = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--every');
// Every spec under videos/ (one folder per pack: videos/tech, videos/science, …).
const files = args.length
  ? args
  : (fs.readdirSync('videos', {recursive: true}) as string[]).filter((f) => f.endsWith('.json')).map((f) => path.join('videos', f)).sort();
const BAD = /NaN|undefined|Infinity/;
let failures = 0;

for (const file of files) {
  const spec = loadSpec(file);
  const {timeline} = buildTimeline(spec, estimateSpeech(spec), {handle: '@handle'});
  for (const format of ['vertical', 'horizontal'] as Format[]) {
    const frame = frameFor(format, format === 'vertical');
    const tl = {...timeline, captions: {vertical: true, horizontal: true}};
    for (const s of tl.scenes) {
      if (s.type !== 'flow') continue;
      const lay = layoutFlow(s.nodes, s.edges, frame.content, format === 'vertical');
      if (lay.scale < 0.6) console.log(`  ⚠ ${file} scene ${s.index + 1} (${format}): diagram scaled to ${lay.scale.toFixed(2)}; consider fewer nodes.`);
    }
    if (tl.board) {
      const box = boardBox(frame.content, format, boardHasNotes(tl));
      const zoom = fullBoardZoom(tl.board, box, format === 'vertical');
      if (zoom < 0.55) console.log(`  ⚠ ${file} board (${format}): the full board only fits at zoom ${zoom.toFixed(2)}; use fewer rows/cols or nodes.`);
    }
    const total = Math.ceil(tl.duration * 30);
    let count = 0;
    for (let f = 0; f <= total; f += EVERY) {
      const html = renderToStaticMarkup(<VideoFrame tl={tl} t={f / 30} frame={frame} />);
      count++;
      const m = html.match(BAD);
      if (m) {
        failures++;
        if (failures <= 8) console.error(`✖ ${file} ${format} frame ${f}: "${m[0]}" in markup`);
      }
    }
    let worldFrames = 0;
    for (const s of tl.scenes) {
      if (s.type !== 'shot') continue;
      let where = '';
      const ctx = mockContext(frame.width, frame.height, (what) => {
        failures++;
        if (failures <= 8) console.error(`✖ ${file} ${format} scene ${s.index + 1} (${s.world}) ${where}: ${what}`);
      });
      for (let f = Math.ceil(s.start * 30); f < (s.start + s.duration) * 30; f += EVERY) {
        where = `frame ${f}`;
        drawShot(ctx, s, f / 30 - s.start, frame);
        worldFrames++;
      }
    }
    console.log(`✔ ${file} ${format}: ${count} frames checked${worldFrames ? ` (+ ${worldFrames} world frames drawn)` : ''}`);
  }
}
if (failures) {
  console.error(`✖ ${failures} bad frames`);
  process.exit(1);
}
