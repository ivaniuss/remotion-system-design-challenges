import type React from 'react';
import {FIGURE_INFO, type FigureName} from '../spec/vocab';
import {BRAIN_ANCHORS, BRAIN_REGIONS, BRAIN_VIEWBOX, BrainFigure} from './brain';
import {NEURON_ANCHORS, NEURON_REGIONS, NEURON_VIEWBOX, NeuronFigure, neuronRoute} from './neuron';

// Large illustrations for `figure` scenes. Each one is a <g> drawn in its own viewBox,
// with named regions that can glow, and an anchor point per region for labels and
// signals. To add one: draw src/figures/<name>.tsx with the same contract, register it
// here and in FIGURE_INFO (src/spec/vocab.ts), and document it in the pack guide.
export type FigureDraw = {
  viewBox: {w: number; h: number};
  anchors: Record<string, {x: number; y: number}>;
  Component: React.FC<{glow?: Record<string, number>; dim?: number; frame: number}>;
  // Optional hints for figures that are not wide like the brain.
  layout?: {
    padX?: number; // room beside the figure (viewBox units) in 9:16
    padY?: number; // room above/below the figure in 9:16
    labels?: 'rows' | 'sides'; // 9:16 labels go in rows above/below (default) or beside the figure
    clip?: boolean; // clip the drawing to the content area (needed when it is zoomed)
    zoom?: number; // zoom factor of a `zoom` step (default 1.55)
  };
  // A signal follows these waypoints (figure coordinates) instead of an arc. `variant` counts the
  // earlier signals of the scene between the same two regions.
  route?: (from: string, to: string, variant: number) => {x: number; y: number}[];
};

export const FIGURE_DRAW: Record<FigureName, FigureDraw> = {
  brain: {viewBox: BRAIN_VIEWBOX, anchors: BRAIN_ANCHORS, Component: BrainFigure as FigureDraw['Component']},
  neuron: {
    viewBox: NEURON_VIEWBOX,
    anchors: NEURON_ANCHORS,
    Component: NeuronFigure as FigureDraw['Component'],
    layout: {padX: 200, padY: 30, labels: 'sides', clip: true, zoom: 1.5},
    route: neuronRoute,
  },
};

// The region lists in vocab.ts (used by the validator) must match the drawings.
for (const r of BRAIN_REGIONS) if (!FIGURE_INFO.brain.regions.includes(r)) throw new Error(`brain region ${r} missing in FIGURE_INFO`);
for (const r of NEURON_REGIONS) if (!FIGURE_INFO.neuron.regions.includes(r)) throw new Error(`neuron region ${r} missing in FIGURE_INFO`);
