# The film look: documentary shorts on the same engine

The explainer look (`light`, `dark`, `neon`) teaches with diagrams: cards, boards, packets,
labels in pills, a header and a progress bar. The **film look** (`"theme": "film"`) tells
the same story the way a nature or science documentary does: the camera is *inside* the
subject, a voice tells it from off screen, and the picture carries the idea.

Everything else is shared: the voice (edge-tts or your recording), word timings and cues,
music with ducking, `script.md`, `youtube.md`, `validate`, `check`, `stills`, `preview`,
`make`. A film spec is an ordinary spec with `"theme": "film"` and `shot` scenes.

Example: `videos/science/neuron-spark-film.json` is `neuron-spark.json` with the same
narration, word for word, told as shots. Compare them with `npm run stills`.

## When to use it

| Use the film look when… | Keep the explainer look when… |
| --- | --- |
| the subject is a *place* or a *process* you can show (a cell, a membrane, a synapse, a hive) | the subject is a *system* of named parts and arrows (backend, architecture) |
| the wonder is the point: scale, mechanism, a life cycle | the trade-offs are the point: what it costs, what breaks, the alternatives |
| a calm, narrated tone fits (long YouTube, a series) | a fast, punchy tone fits (interview prep, Shorts with a hook card) |

Science topics can use either; tech topics stay on the explainer look until a tech world
exists. Do not mix the two looks in one video.

## What changes on screen

- **No interface.** No header, no progress bar, no dot grid, no pop or whoosh sounds.
  Scenes cut through black (0.7 s in, 0.5 s out), never slide.
- **Full-frame worlds.** Each `shot` films a world from `src/worlds/`, drawn on a canvas
  that fills the frame, with a slow camera move, film grain and a vignette.
- **Few, thin labels.** A label is a hairline from a point of the world to a short text
  in monospace. 1–3 per shot.
- **The corner.** The shot's name (`title`) and its real scale (`scale`, "≈ 20 µm") sit
  small in the top-left corner: the one detail that tells the viewer where they are.
- **A title card.** Once, usually at the end of the cold open: a big serif title and a
  small subtitle over the picture (`card` on a step). The last shot can show it again.
- **Plain subtitles.** When captions are on (`video.config.json`), they are classic
  subtitles: one line group at a time, no highlighted word.
- **Sound from the world.** Worlds play their own sounds: `spike` (an electrode-style
  click with a low thump when a cell fires) and `tick` (an input arrives, an ion passes).
  Background music is the same ducked track as the explainer look.

## The `shot` scene

```json
{"type": "shot", "world": "soma", "title": "Cell body", "scale": "≈ 20 µm", "camera": "still",
 "narration": "At rest, the inside sits near minus seventy millivolts, a tiny voltage. Each signal nudges it up or down. Reach about minus fifty-five, and the cell fires. Fall short, and nothing happens.",
 "steps": [
   {"at": "At rest", "label": {"anchor": "rest", "text": "Rest ≈ −70 mV"}},
   {"at": "nudges it up", "event": "inputs"},
   {"at": "Reach about minus", "event": "threshold", "label": {"anchor": "threshold", "text": "Threshold ≈ −55 mV"}},
   {"at": "the cell fires", "event": "fire"},
   {"at": "Fall short", "event": "weak"}
 ]}
```

- `world`: one of the worlds below. A world from another pack is an error.
- `title` (optional, ≤ 60): the shot's name in the corner. Not a header: one or two words.
- `scale` (optional, ≤ 24): the real size of what is on screen. Units are written as
  they are (`µm`, `nm`, `mm`); they are never uppercased.
- `camera`: `push` (slow move in, default), `pull` (slow move out: openings and endings),
  `drift` (a slow slide: long, calm shots), `still`.
- Steps, each with `at` (2–4 words from the narration, in spoken order) and any of:
  - `event`: a named moment of the world (the cell fires, the vesicles release). The
    world animates by itself; events only say *when*. Missing events either do not
    happen or follow the previous one at a natural pace (each world says which).
  - `label`: `{"anchor", "text"}`, a label pinned to a named point (≤ 32 chars). It stays
    until the shot ends, and hides while the camera has the point off screen.
  - `card`: `{"title", "subtitle"}`, the title card (one per shot, from this cue on).
  - `sfx`: any sound cue, as in the explainer look (rarely needed: worlds have sounds).

## The worlds

All in the `science` pack. Each draws itself in a logical canvas of 1600×900 (16:9) or
900×1600 (9:16) and lays itself out for both; in 9:16 it keeps the action above the
subtitles and the platform's buttons.

| World | What the camera sees | Events | Anchors |
| --- | --- | --- | --- |
| `network` | many neurons wired to their neighbours, firing now and then; the camera pulls back | `cascade` (a chain spreads from the centre) | `center` |
| `neuron` | one whole cell; the camera moves to the dendrites, then to the soma | `dendrites`, `soma` (camera moves), `go` (amber inputs), `brake` (blue inputs), `fire` (spike down the axon) | `dendrites`, `soma`, `nucleus`, `axon`, `myelin`, `terminals` |
| `soma` | the cell body close up, next to an oscilloscope of its voltage | `inputs` (they arrive and add up), `threshold` (the −55 mV line), `fire`, `weak` (two inputs that fall short) | `soma`, `rest`, `threshold`, `spike` |
| `membrane` | the membrane edge-on: Na⁺ and K⁺ ions, channels, the pump, a small scope | `sodium`, `potassium` (one spike, paced by these two), `repeat` (three more spikes, same height), `pump` (3 Na⁺ out, 2 K⁺ in) | `outside`, `inside`, `sodium`, `potassium`, `pump`, `voltage` |
| `axon` | a myelinated axon (and, from `race` on, a bare one below) | `wave` (the spike jumps node to node, again every ~3 s), `race` (both start together) | `axon`, `myelin`, `node`, `fast`, `slow` |
| `synapse` | the axon terminal facing the next cell across the cleft | `arrive`, `calcium`, `release`, `bind` (each defaults to a natural pace after the previous one) | `terminal`, `vesicles`, `calcium`, `gap`, `receptors`, `next` |

Honesty notes the worlds already follow (keep them true when you write labels):
the voltage numbers are typical values (−70 rest, −55 threshold, +40 peak); time is
slowed down (a spike takes about 1 ms); the bare axon in `axon` is **not to scale** (at
1 m/s vs 120 m/s its signal would not visibly move): say the real numbers in labels or
narration, and note it in `notes`.

## Writing a film

The rules of `docs/AUTHORING.md` §2–3 about accuracy, sources, cues and narration still
apply. What changes:

- **Voice in off, not an instructor.** Third person or a calm second person, no "let's
  see", no "in this video". It describes what is on screen while it happens.
- **Cold open, then the card.** The first shot opens on the world (often `network`) with
  the hook in the voice; the `card` lands on the last sentence of the hook.
- **One idea per shot, 8–18 s.** A shot can be long: the world keeps moving. Split a
  shot when the *place* changes, not when the sentence does.
- **Events on the verbs.** Put `event` on the words that say what happens ("the cell
  fires", "calcium enters"), so the picture answers the voice.
- **Name, don't annotate.** 1–3 labels per shot, the first time a part is named. Numbers
  go in a label only when the voice says them.
- **End on the world.** The last shot pulls back (`network`, `camera: pull`); the question
  for the comments can be the card's subtitle and the last sentence.
- Thumbnails: the first frame is dark on purpose (a documentary fades in). Use the
  title-card frame for the thumbnail, or render one with `npm run stills`.

## Adding a world

A world is `src/worlds/<name>.ts` exporting a `World` (`src/worlds/types.ts`):

- `draw(c, f)`: draw the whole frame in logical units (`f.W × f.H`) from `f.t` and the
  event times in `f.ev`. Pure: no `Math.random`, no clocks (use `hash`, `noise1` and
  `mulberry` from `src/worlds/kit.ts`). Lay out for `f.vertical` too.
- `anchor(name, f)`: where a label is pinned, in logical units (`dx`/`dy` place the
  text; `null` hides the label).
- `sounds(f)` (optional): `spike`/`tick` cues in scene seconds.

Register it in `src/worlds/index.ts` and in `WORLD_INFO` (`src/spec/vocab.ts`: pack,
events, anchors), add it to the table above, then run `npm run typecheck`, `npm run
check -- <a spec that uses it>` (it draws every checked frame into a mock canvas and
fails on NaN/Infinity) and `npm run stills` in both formats.

The kit has what most worlds need: deterministic noise, glows (`glow`), paths with
arc-length lookup (`mkPath`, `along`, `pulse`), a camera (`applyCam`, `camPoint`) and an
action potential (`spikeV`). `neuronBody.ts` shows how to share a drawing between worlds.

**From Blender.** A world can also be a rendered plate: render a PNG sequence in Blender
(`blender -b scene.blend -P script.py`), put it under `public/`, and draw the frame for
`f.t` in `draw` with labels and events on top. Not built yet; the canvas worlds cover
the current topics.

## Checklist

- `"theme": "film"`, every scene a `shot`, one `card` in the opening shot.
- Each shot: one place, a `title` and an honest `scale`, events on the verbs, ≤ 3 labels.
- `npm run validate` (events and anchors are checked) and `npm run check -- <spec>`.
- `npm run stills -- <spec>`: in 9:16, nothing important under the subtitles.
- Claims and numbers have sources in `notes`; anything not to scale is said.
