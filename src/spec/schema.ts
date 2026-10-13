import {z} from 'zod';
import {CAMERA_MOVES, CODE_LANGUAGES, COLORS, CROWD_DENSITY, FIGURES, HOOKS, ICONS, LANGS, PACKS, SFX, SHAPES, STATUSES, THEME_NAMES, TONES, WORLDS} from './vocab';

// The video spec is the ONLY thing an LLM writes. Everything visual (layout, camera,
// timing, animation) is derived from it by the engine, so the spec stays small and
// hard to get wrong.

const Id = z
  .string()
  .regex(/^[a-z0-9][a-z0-9_-]*$/, 'ids are lowercase kebab-case, e.g. "api" or "order-db"');
const Icon = z.enum(ICONS);
const Color = z.enum(COLORS);
const Tone = z.enum(TONES);
// A sound cue played at the same moment (see SFX in vocab.ts).
const Sfx = z.enum(SFX).optional();

// `at` = a short phrase copied verbatim from the scene's narration. The visual change
// happens when the voice says it. Optional: missing cues are spread evenly.
const Cue = z.string().min(1).max(80).optional();

const Narration = z.string().min(1).max(900);
// Starts a YouTube chapter at this scene (e.g. "The queue"). See out/<id>/youtube.md.
const Chapter = z.string().min(1).max(60).optional();
const Title = z.string().min(1).max(60);

// Text fields accept *emphasis* with asterisks, rendered in the accent color.
export const Item = z.object({
  text: z.string().min(1).max(90),
  icon: Icon.optional(),
  at: Cue,
  sfx: Sfx,
});

// A beat of the hook: a small card (icon + 1–3 words) that pops in when the voice says
// its cue, so the problem is drawn while it is told. A card without an icon shows its
// text big (e.g. "?").
export const TitleBeat = z.object({
  text: z.string().min(1).max(24),
  icon: Icon.optional(),
  at: Cue,
  sfx: Sfx,
});

export const TitleScene = z.object({
  type: z.literal('title'),
  chapter: Chapter,
  narration: Narration,
  tag: z.string().max(32).optional(),
  heading: z.string().min(1).max(90),
  subheading: z.string().max(120).optional(),
  icon: Icon.optional(),
  // 2–5 beats replace the static icon with a row of cards built in sync with the voice.
  beats: z.array(TitleBeat).max(5).optional(),
  sfx: Sfx,
});

export const CalloutScene = z.object({
  type: z.literal('callout'),
  chapter: Chapter,
  narration: Narration,
  title: Title.optional(),
  text: z.string().min(1).max(14),
  caption: z.string().max(80).optional(),
  tone: Tone.default('info'),
  icon: Icon.optional(),
  // Count the leading number up from zero ("50M ventas" runs 0 → 50M). Use it for
  // quantities that should feel big; never for codes like "504".
  countUp: z.boolean().default(false),
  sfx: Sfx,
});

export const ListScene = z.object({
  type: z.literal('list'),
  chapter: Chapter,
  narration: Narration,
  title: Title.optional(),
  numbered: z.boolean().default(true),
  items: z.array(Item).min(1).max(6),
});

const Panel = z.object({
  label: z.string().min(1).max(30),
  tone: Tone.default('neutral'),
  items: z.array(Item).min(1).max(5),
});

export const CompareScene = z.object({
  type: z.literal('compare'),
  chapter: Chapter,
  narration: Narration,
  title: Title.optional(),
  left: Panel,
  right: Panel,
});

export const CodeStep = z.object({
  at: Cue,
  lines: z.array(z.number().int().min(1)).min(1).max(30),
  note: z.string().max(70).optional(),
  sfx: Sfx,
});

export const CodeScene = z.object({
  type: z.literal('code'),
  chapter: Chapter,
  narration: Narration,
  title: Title.optional(),
  filename: z.string().max(40).optional(),
  language: z.enum(CODE_LANGUAGES).default('ts'),
  code: z.string().min(1).max(1400),
  steps: z.array(CodeStep).max(8).default([]),
});

// Grid position: row/col are coarse cells (0, 1, 2… halves allowed), not pixels.
// Written for 9:16 (rows go down); 16:9 transposes the grid automatically.
// Optional: without them the layout is computed from the edges.
const Cell = z.number().min(0).max(12).multipleOf(0.5);

export const FlowNode = z.object({
  id: Id,
  label: z.string().min(1).max(28),
  sub: z.string().max(32).optional(),
  icon: Icon,
  color: Color.optional(),
  row: Cell.optional(),
  col: Cell.optional(),
});

export const FlowEdge = z.object({
  from: Id,
  to: Id,
  label: z.string().max(24).optional(),
  dashed: z.boolean().optional(),
});

export const Packet = z.object({
  from: Id,
  to: Id,
  via: z.array(Id).max(4).optional(),
  label: z.string().max(24).optional(),
  color: Color.optional(),
});

// ---------- visible metrics: show load, capacity and waiting instead of only saying them.
// A crowd is a stream of dots from one node to another that piles up where it arrives.
// The dots picture the load; the real number goes in `label` ("×3.5B").
export const Crowd = z.object({
  from: Id,
  to: Id,
  via: z.array(Id).max(4).optional(),
  density: z.enum(CROWD_DENSITY).default('many'),
  label: z.string().max(14).optional(),
  color: Color.optional(),
});

// A fill bar under a node (queue depth, CPU, connections in use). Green → yellow → red
// by value unless `tone` is given. `"off"` removes it.
export const Meter = z.object({
  value: z.number().min(0).max(1),
  label: z.string().max(16).optional(),
  tone: Tone.optional(),
});

// A ring on a node that runs out (a hold expiring, a timeout, a TTL). `over` is how many
// seconds of VIDEO it takes; `label` carries the real duration ("10 min hold"); `end` is
// what it says when it reaches zero ("released"). `"off"` removes it.
export const Clock = z.object({
  label: z.string().max(14).optional(),
  over: z.number().min(0.5).max(8).default(2),
  end: z.string().max(14).optional(),
});

export const FlowStep = z.object({
  at: Cue,
  // ids of nodes or edges ("from->to"). Anything listed in a `show` starts hidden.
  show: z.array(z.string()).optional(),
  hide: z.array(z.string()).optional(),
  // Highlight these nodes and dim the rest. [] clears the highlight.
  focus: z.array(Id).optional(),
  packet: Packet.optional(),
  status: z.record(z.string(), z.enum(STATUSES)).optional(),
  // A crowd of dots from `from` to `to`. `"off"` clears every crowd of the scene.
  crowd: z.union([Crowd, z.literal('off')]).optional(),
  // Fill bars and timer rings, keyed by node id.
  meter: z.record(z.string(), z.union([Meter, z.literal('off')])).optional(),
  clock: z.record(z.string(), z.union([Clock, z.literal('off')])).optional(),
  note: z
    .object({text: z.string().min(1).max(60), tone: Tone.default('info'), near: Id.optional()})
    .optional(),
  sfx: Sfx,
});

export const FlowScene = z.object({
  type: z.literal('flow'),
  chapter: Chapter,
  narration: Narration,
  title: Title.optional(),
  nodes: z.array(FlowNode).min(1).max(9),
  edges: z.array(FlowEdge).max(14).default([]),
  steps: z.array(FlowStep).max(12).default([]),
});

// The board: ONE diagram shared by every `board` scene of the video. It starts empty;
// a node appears the first time a step mentions it (show, packet, status, focus,
// camera, note.near). State carries over from scene to scene, and a camera frames
// whatever the narration is talking about.
export const Board = z.object({
  nodes: z.array(FlowNode).min(1).max(14),
  edges: z.array(FlowEdge).max(24).default([]),
});

export const BoardStep = FlowStep.extend({
  // Frame these nodes without dimming the rest. [] = frame everything visible.
  camera: z.array(Id).optional(),
});

export const BoardScene = z.object({
  type: z.literal('board'),
  chapter: Chapter,
  narration: Narration,
  title: Title.optional(),
  steps: z.array(BoardStep).max(14).default([]),
});

export const SummaryScene = z.object({
  type: z.literal('summary'),
  chapter: Chapter,
  narration: Narration,
  title: Title.optional(),
  points: z.array(Item).min(1).max(5),
  cta: z.string().max(48).optional(),
});


// ---------- chart: curves that draw themselves (a forgetting curve, latency over time)
// x/y values are positions on the axes; label the ticks freely ("hoy", "1 semana").
const ChartTick = z.object({at: z.number(), label: z.string().min(1).max(14)});
const ChartAxis = z.object({
  label: z.string().max(24).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  ticks: z.array(ChartTick).max(8).optional(),
});

export const ChartSeries = z.object({
  id: Id,
  label: z.string().min(1).max(24),
  tone: Tone.default('info'),
  // [x, y] pairs with non-decreasing x. Two points with the same x make a vertical
  // jump (a review that brings memory back up).
  points: z.array(z.tuple([z.number(), z.number()])).min(2).max(60),
  dashed: z.boolean().default(false),
});

export const ChartStep = z.object({
  at: Cue,
  // Series that draw themselves from this cue. Series never listed in a `draw` are
  // visible from the start.
  draw: z.array(Id).optional(),
  // Highlight these series and dim the rest. [] clears it.
  focus: z.array(Id).optional(),
  // A pin on a series at x (or a vertical guide line when no series is given).
  mark: z.object({x: z.number(), label: z.string().min(1).max(24), series: Id.optional(), tone: Tone.optional()}).optional(),
  note: z.object({text: z.string().min(1).max(60), tone: Tone.default('info')}).optional(),
  sfx: Sfx,
});

export const ChartScene = z.object({
  type: z.literal('chart'),
  chapter: Chapter,
  narration: Narration,
  title: Title.optional(),
  // true = the shape is illustrative, not measured data: numeric ticks are hidden and
  // a small "esquema ilustrativo" tag is shown. Use it unless the numbers have a source.
  schematic: z.boolean().default(false),
  x: ChartAxis.default({}),
  y: ChartAxis.default({}),
  series: z.array(ChartSeries).min(1).max(4),
  steps: z.array(ChartStep).max(10).default([]),
});

// ---------- figure: a large illustration with named regions (the brain…)
// Regions light up, get labels and pass signals to each other, on cue.
export const FigureStep = z.object({
  at: Cue,
  // The regions that are lit from this cue on (replaces the previous set; [] = none).
  glow: z.array(z.string()).optional(),
  // Fade everything that is not lit (focus). false turns it off.
  dim: z.boolean().optional(),
  // A label with a leader line, pinned to a region. Labels stay until the scene ends.
  label: z.object({region: z.string(), text: z.string().min(1).max(28), tone: Tone.optional()}).optional(),
  // A glowing pulse that travels from one region to another.
  signal: z.object({from: z.string(), to: z.string(), label: z.string().max(18).optional()}).optional(),
  // Zoom the camera toward a region; null zooms back out.
  zoom: z.string().nullable().optional(),
  note: z.object({text: z.string().min(1).max(60), tone: Tone.default('info')}).optional(),
  sfx: Sfx,
});

export const FigureScene = z.object({
  type: z.literal('figure'),
  chapter: Chapter,
  narration: Narration,
  title: Title.optional(),
  figure: z.enum(FIGURES),
  steps: z.array(FigureStep).max(10).default([]),
});

// ---------- sequence: who talks to whom, over TIME (latency, timeouts, retries)
// Actors stand across the top with a dashed lifeline going down; time flows down. Each
// step draws one message. `gap` and `after` make elapsed time visible as vertical space,
// which is what boxes and arrows cannot show.
export const SeqActor = z.object({
  id: Id,
  label: z.string().min(1).max(18),
  sub: z.string().max(18).optional(),
  icon: Icon,
  color: Color.optional(),
});

export const SeqStep = z.object({
  at: Cue,
  from: Id.optional(),
  to: Id.optional(),
  label: z.string().max(24).optional(),
  // call = solid arrow, return = dashed arrow back, lost = a call that never arrives
  // (ends in an ✕), self = a loop on one actor (work done in place).
  kind: z.enum(['call', 'return', 'lost', 'self']).default('call'),
  // Time that passed before this message: a label on the time axis ("+5 min") ...
  after: z.string().max(12).optional(),
  // ... and extra vertical space (1 = a normal row, 2 = twice as much).
  gap: z.number().min(0.5).max(3).default(1),
  status: z.record(z.string(), z.enum(STATUSES)).optional(),
  note: z.object({text: z.string().min(1).max(60), tone: Tone.default('info')}).optional(),
  sfx: Sfx,
});

// A bar on an actor's lifeline from the message of step `from` to the one of step `to`
// (0-based indices): "blocked", "holding the connection". It grows while the voice runs.
export const SeqSpan = z.object({
  actor: Id,
  from: z.number().int().min(0),
  to: z.number().int().min(1),
  label: z.string().max(18).optional(),
  tone: Tone.default('warn'),
});

export const SequenceScene = z.object({
  type: z.literal('sequence'),
  chapter: Chapter,
  narration: Narration,
  title: Title.optional(),
  actors: z.array(SeqActor).min(2).max(5),
  steps: z.array(SeqStep).min(1).max(12),
  spans: z.array(SeqSpan).max(4).default([]),
});

// ---------- shot: the documentary look (theme "film", docs/FILM.md)
// A full-frame world the camera is inside of (a neuron, a membrane, a synapse…). The
// world animates by itself; steps only say WHEN its named moments happen (`event`), pin
// a few labels and, once per film, show the title card.
export const ShotStep = z.object({
  at: Cue,
  // A named moment of the world ("fire", "release"…; WORLD_INFO in vocab.ts lists them).
  event: z.string().min(1).max(24).optional(),
  // A label with a thin leader line, pinned to a named point of the world. Stays until
  // the shot ends. Keep it to 1–3 per shot: a documentary names, it does not annotate.
  label: z.object({anchor: z.string().min(1).max(24), text: z.string().min(1).max(32)}).optional(),
  // The title card: big serif title (+ small subtitle) over the picture, from this cue on.
  card: z.object({title: z.string().min(1).max(40), subtitle: z.string().max(80).optional()}).optional(),
  sfx: Sfx,
});

export const ShotScene = z.object({
  type: z.literal('shot'),
  chapter: Chapter,
  narration: Narration,
  // What the shot shows, small in the corner ("Cell body"). Not a header.
  title: Title.optional(),
  world: z.enum(WORLDS),
  // The real scale of what is on screen, under the title ("≈ 20 µm").
  scale: z.string().max(24).optional(),
  // A slow move on top of the world's own framing.
  camera: z.enum(CAMERA_MOVES).default('push'),
  steps: z.array(ShotStep).max(12).default([]),
});

export const Scene = z.discriminatedUnion('type', [
  TitleScene,
  CalloutScene,
  ListScene,
  CompareScene,
  CodeScene,
  FlowScene,
  BoardScene,
  SummaryScene,
  ChartScene,
  FigureScene,
  SequenceScene,
  ShotScene,
]);

// What to paste into YouTube: written by `make`/`preview` to out/<id>/youtube.md,
// with the chapters timed from the real voice.
export const Publish = z.object({
  titles: z.array(z.string().min(1).max(100)).min(1).max(3), // first = recommended
  description: z.string().min(1).max(1200), // the opening paragraph (above "Show more")
  learn: z.array(z.string().min(1).max(120)).max(8).optional(), // "You'll learn" bullets
  extra: z.array(z.string().min(1).max(400)).max(6).optional(), // paragraphs after the chapters
  comment: z.string().max(200).optional(), // the question that invites comments
  hashtags: z.array(z.string().min(1).max(40)).max(5).optional(),
});

export const VideoSpec = z.object({
  id: Id,
  title: z.string().min(1).max(100),
  lang: z.enum(LANGS).default('en'),
  // Topic pack: which icons (and which guide, docs/packs/<pack>.md) the video uses.
  // Only that pack's icons plus the common ones are accepted.
  pack: z.enum(PACKS).default('tech'),
  theme: z.enum(THEME_NAMES).default('light'),
  // Story shape and hook type (docs/SHAPES.md). Optional; recorded for the variety check.
  shape: z.enum(SHAPES).optional(),
  hook: z.enum(HOOKS).optional(),
  voice: z.string().optional(), // edge-tts voice name, overrides video.config.json
  board: Board.optional(), // required when any scene has type "board"
  // Talking points that are said but not shown (nuances, alternatives, follow-up
  // questions). Exported to out/<id>/script.md together with the narration.
  notes: z.array(z.string().min(1).max(900)).max(20).optional(),
  scenes: z.array(Scene).min(1).max(30),
  publish: Publish.optional(),
});

export type VideoSpec = z.output<typeof VideoSpec>;
export type VideoSpecInput = z.input<typeof VideoSpec>;
export type Scene = z.output<typeof Scene>;
export type SceneType = Scene['type'];
export type TitleScene = z.output<typeof TitleScene>;
export type CalloutScene = z.output<typeof CalloutScene>;
export type ListScene = z.output<typeof ListScene>;
export type CompareScene = z.output<typeof CompareScene>;
export type CodeScene = z.output<typeof CodeScene>;
export type FlowScene = z.output<typeof FlowScene>;
export type FlowNode = z.output<typeof FlowNode>;
export type FlowEdge = z.output<typeof FlowEdge>;
export type FlowStep = z.output<typeof FlowStep>;
export type BoardSpec = z.output<typeof Board>;
export type BoardStep = z.output<typeof BoardStep>;
export type BoardScene = z.output<typeof BoardScene>;
export type SummaryScene = z.output<typeof SummaryScene>;
export type ChartScene = z.output<typeof ChartScene>;
export type ChartSeries = z.output<typeof ChartSeries>;
export type FigureScene = z.output<typeof FigureScene>;
export type SequenceScene = z.output<typeof SequenceScene>;
export type SeqStep = z.output<typeof SeqStep>;
export type ShotScene = z.output<typeof ShotScene>;
export type ShotStep = z.output<typeof ShotStep>;
export type CrowdSpec = z.output<typeof Crowd>;
export type MeterSpec = z.output<typeof Meter>;
export type ClockSpec = z.output<typeof Clock>;
export type Item = z.output<typeof Item>;
