# System design videos from an idea

Turn an idea, a topic or a transcript into an animated explainer video in the style of
ByteByteGo (clean animated diagrams) and Fazt Code (dark editor, code walkthroughs).
Vertical 9:16 for TikTok / Shorts / Reels and horizontal 16:9 for YouTube, from the
same file.

Topics come in **packs**, each with its own icons, guide and folder, on the same engine:

| Pack | Topics | Guide | Videos |
| --- | --- | --- | --- |
| `tech` (default) | system design, backend, programming | `docs/packs/tech.md` | `videos/tech/` |
| `science` | the brain, biology, health, learning, languages | `docs/packs/science.md` | `videos/science/` |
| `news` | current events as a broadcast report: real footage, maps, figures, quotes, sources | `docs/packs/news.md` | `videos/news/` |
| `brain` | Daily Brain: daily puzzle Shorts with a countdown, a reveal and a scorecard (`/make-brain`) | `docs/packs/brain.md` | `videos/brain/` |

A spec says `"pack": "science"` and may only use that pack's icons (plus the common
ones), so topics never mix. Everything else (commands, voice, sound, render) is shared.

```
/make-video "your idea or transcript"        (in Claude: app or Claude Code)
  idea / transcript ──(Claude follows docs/AUTHORING.md)──▶ videos/<pack>/<id>.json
                    ◀── validator errors, Claude fixes them ──┘
                                                            │  npm run make
                         voice ─▶ timeline ─▶ render ─▶ out/<id>/<theme>.vertical.mp4
                                                        out/<id>/<theme>.horizontal.mp4
```

The LLM only writes a small, high-level JSON spec (script + which scene shows what).
The engine computes layout, animation, timing, captions and audio sync, so a spec
cannot produce overlapping boxes or out-of-sync animations.

## Quick start

**In Claude** (no API key): run `/make-video` with your idea, topic or transcript.

```
/make-video Why your API needs a rate limiter (in Spanish)
/make-video ciencia: por qué llevas años estudiando un idioma y no lo hablas
/make-video <paste your transcript here>
```

Claude picks the pack from the topic and first writes a short script draft
(`videos/<pack>/<id>.draft.md`) for you to approve —
text is cheap to change. Then it writes `videos/<pack>/<id>.json`, validates and fixes it,
checks the look with a contact sheet of stills (seconds, not a full render), and
writes `out/<id>/script.md` (teleprompter + talking points) and `out/<id>/youtube.md`
(titles, description and chapters to paste). Then **you review it in the browser**:

```bash
npm run preview -- videos/<pack>/<id>.json     # timeline + voice, opens Remotion Studio
```

The Studio shows both compositions: **Vertical** (9:16) and **Horizontal** (16:9).

Tell Claude what to change; after each edit run
`npm run preview -- videos/<pack>/<id>.json --no-studio` and the open Studio reloads. When it
is right, render the MP4s (`npm run make -- videos/<pack>/<id>.json --format both`, with
voice) or ask Claude to render them.

The skill lives in `skills/make-video/SKILL.md`:
- **Claude app:** it is installed as an account skill (which defers to the project copy
  when that one is newer).
- **Claude Code** (terminal, in this folder): enable it once with
  `mkdir -p .claude/skills && cp -r skills/make-video .claude/skills/`.
- **Any other agent:** `AGENTS.md` (and `CLAUDE.md`) at the root point it to the skill
  and the guide.

Other skills in `skills/`: `make-news` (a current event as a sourced broadcast
report, `skills/make-news/SKILL.md`), `make-film` (a documentary short,
`skills/make-film/SKILL.md`) and `make-brain` (a Daily Brain puzzle Short,
`skills/make-brain/SKILL.md`). Same project, same commands.

**In a terminal:**

```bash
npm install
pip install edge-tts            # optional: free, natural neural voices (en/es/pt)

npm run preview -- videos/tech/async-report-504.json              # review in the browser (no render)
npm run make -- videos/tech/async-report-504.json --format both   # render 9:16 + 16:9 MP4s with voice
```

Requirements: Node 20+, and Python 3 for the optional voice. The first render
downloads a headless Chrome (needs internet). `ffprobe` (from ffmpeg) is used to
measure audio when available.

## Making a new video

**With Claude:** `/make-video <idea>` (see Quick start). Review with
`npm run preview`, iterate ("/make-video edit <id>: …"), render at the end.

**By hand:** write `videos/<pack>/<id>.json` following `docs/AUTHORING.md` and the
pack guide (`docs/packs/<pack>.md`), then
`npm run validate -- videos/<pack>/<id>.json` and `npm run make -- videos/<pack>/<id>.json --format both`.

Validation, voice and rendering are local and free, and a second format costs
nothing extra.

## Commands

| Command | What it does |
| --- | --- |
| `npm run preview -- <spec> [--no-studio]` | The fast review loop: builds the timeline (with voice) and the script, then opens Remotion Studio. With `--no-studio` it only updates the timeline; an open Studio reloads by itself. |
| `npm run make -- <spec> [flags]` | Validate → voice → timeline → render the MP4s. Also writes `out/<id>/script.md`: narration with timestamps (teleprompter), what is on screen at each cue, and the talking points from `notes`. And `out/<id>/youtube.md`: title options and a description to paste into YouTube, with chapters timed from the voice (from the spec's `publish` and scene `chapter` fields). |
| `npm run thumbnail -- <spec>` | Only the designed thumbnail (`out/<id>/<theme>.thumbnail.png`, 1280×720) and the Short cover (`<theme>.cover.png`, 1080×1920), from the spec's `thumbnail` block. A few seconds. `make` and `stills` write them too. |
| `npm run stills -- <spec> [--format …] [--every 3]` | Quick visual check without rendering: one small frame every N seconds, tiled into `out/<id>/<theme>.<format>.sheet.png` (needs ffmpeg for the sheet). ~40 s for both formats. |
| `npm run validate -- <spec>` | Check a spec without rendering; prints the estimated length. |
| `npm run fingerprint [-- <spec>] [--last <id>]` | The variety guard: lists the recent videos (shape, hook, theme, opening, signature visuals) and what has not been used lately; with a spec, checks that it differs from the previous video in ≥ 2 of 5 axes (`docs/SHAPES.md` §4). |
| `npm run dev` | Remotion Studio with the last timeline built by `make` or `preview`. |
| `npm run check [-- <spec> ...] [--every N]` | Renders every other frame (or one in N) of every spec in both formats to markup and fails on NaN/undefined; flags diagrams that had to shrink a lot. A long video takes minutes: `--every 8` for a quick pass. |
| `npm run schema` | Regenerates `schema/video-spec.schema.json`. |
| `npm run typecheck` | TypeScript check. |

`make` flags:

| Flag | Meaning |
| --- | --- |
| `--format vertical\|horizontal\|both` | Default from `video.config.json` (`vertical`). |
| `--voice auto\|edge\|none` | `auto` (default) uses edge-tts when installed, otherwise a silent video with estimated timings. |
| `--audio <file> --words <file>` | Use your own recording (see below). |
| `--no-render` | Only build the timeline (handy with `npm run dev`). |

## Voice options

- **edge-tts (free, natural):** Microsoft Edge neural voices with word timings, so
  captions and animations follow the real voice. Voices per language live in
  `video.config.json` (`en-US-AndrewNeural`, `es-MX-JorgeNeural`, `pt-BR-AntonioNeural`).
  List others with `edge-tts --list-voices`. A spec can override with `"voice"`.
- **No voice:** `--voice none` renders a silent video with estimated timings
  (~3 words/s), useful as a teleprompter for recording yourself.
- **Your own recording:** record the narration of all scenes in one take, then get
  word timestamps with any Whisper tool that outputs words (for example
  `whisper voice.mp3 --word_timestamps True --output_format json`, or faster-whisper).
  Check the current docs of the tool you use, since flags change between versions.
  Then:
  ```bash
  npm run make -- videos/<pack>/<id>.json --audio voice.mp3 --words voice.json
  ```
  The transcript is aligned to the script, so small differences (missed words,
  "um"s) are fine. Accepted formats: `[{"w","start","end"}]`, `{"words": [...]}`,
  or Whisper's `{"segments": [{"words": [{"word","start","end"}]}]}`.

## Configuration (`video.config.json`)

```json
{
  "handle": "@yourhandle",        // small watermark; null to hide
  "cta": null,                    // default call to action for summary scenes
  "formats": ["vertical"],
  "captions": {"vertical": true, "horizontal": false},
  "voice": {"mode": "auto", "rate": "+10%", "voices": {"en": "…", "es": "…"}},
  "python": "python3",
  "sfx": true,                    // pops, whooshes, error buzz, success chime
  "music": null,                  // or {"file": "music/track.mp3", "volume": 0.12}
  "packs": {                      // optional: per-pack overrides (another channel)
    "science": {"handle": "@otherhandle", "cta": null, "voice": {"voices": {"es": "…"}}}
  }
}
```

Without `packs`, every pack shares the same settings. With it, a pack's values replace
the shared ones for its videos (handle, call to action, voices, music…).

Background music: put a track you have the rights to use in `public/music/` and point
`music.file` at it (path relative to `public/`). It loops, fades in and out, and ducks
under the voice automatically. The sound effects in `public/sfx/` are generated
procedurally by `scripts/make-sfx.sh` (no samples, no licenses).

The repo also ships a generated ambient track (no samples, no licenses): run
`node scripts/make-music.mjs` once to write `public/music/ambient.wav` (64 s, loops
without a seam; no ffmpeg needed), then set
`"music": {"file": "music/ambient.wav", "volume": 0.14}` in `video.config.json`.
Set `"music": null` to render without it.

To render with a local Chrome / headless shell instead of the one Remotion downloads,
set `REMOTION_BROWSER_EXECUTABLE=/path/to/headless_shell`.

## Scene types

`title` (hook, with optional animated `beats`) · `board` (one shared diagram for the whole video, with a camera) ·
`callout` (big number, laid over the board) · `flow` (a self-contained diagram) ·
`code` (editor with typing and line highlights) · `chart` (curves that draw themselves) ·
`figure` (a large illustration with regions that light up, labels and signals; the brain
in the science pack) · `sequence` (who talks to whom over time: timeouts, retries, a lost
message, with elapsed time as vertical space) · `list` · `compare` · `summary` ·
`shot` (the documentary look: a full-frame world the camera is inside of, see below).
Board and flow steps can also show load, capacity and waiting as pictures: a `crowd` of
dots piling onto a node, a `meter` bar under it, a `clock` ring running out; a `callout`
can `countUp`. Themes: `light`, `dark`, `neon`, `film`.
Full reference and writing rules: [`docs/AUTHORING.md`](docs/AUTHORING.md).
Story shapes, hooks and the variety guard: [`docs/SHAPES.md`](docs/SHAPES.md). The independent
review between draft and build: [`docs/REVIEWER.md`](docs/REVIEWER.md).


## The film look (documentary shorts)

`"theme": "film"` with `shot` scenes turns the same pipeline into a documentary: no
header or progress bar, full-frame worlds drawn on a canvas (a neuron, a membrane with its
ions, an axon, a synapse, a network), a slow camera, film grain, a serif title card, plain
subtitles and sounds that come from the world (a cell firing clicks like an electrode).
Voice, cues, music, `script.md`, `youtube.md` and every command are shared.
Guide: [`docs/FILM.md`](docs/FILM.md). Example: `videos/science/neuron-spark-film.json`
(the narration of `neuron-spark.json`, told as shots). Skill: `skills/make-film/SKILL.md`.

## Built for retention

The format is designed around what keeps people watching (`docs/AUTHORING.md` §2–3 has
the rules the spec writer follows):

- **A designed thumbnail:** every video gets `<theme>.thumbnail.png` (1280×720) and a Short
  cover `<theme>.cover.png` (1080×1920) from the spec's `thumbnail` block: a few big words,
  one clear picture, the number.
- **Never a still opening:** frame 0 shows the tag and the big heading at once; while
  the voice states the problem, `beats` draw it as cards that pop in on cue, joined by
  arrows, with a dot flowing through them.
- **A progressive build, like sprints:** the simplest version that works first, then
  "¿y qué pasa si…?" turns (a callout with the new number), what breaks and why, and
  the improvement — without ever announcing "levels". It is one of six story shapes
  (post-mortem, request journey, A vs B, numbers first, code first) with four kinds of
  hook, and `npm run fingerprint` keeps two videos in a row from looking alike.
- **Numbers you can see:** load is a crowd of dots, capacity a filling bar, a hold or a
  timeout a ring that runs out, waiting a sequence diagram, a big quantity a count-up.
- **Reviewed before it is built:** an expert-level rubric (why before what, trade-offs,
  clarity, structure from requirements to bottlenecks, accuracy) applied by someone who
  did not write the script, once on the draft and once on the spec.
- **One picture, built as you speak:** the `board` starts empty and each component pops
  in when the narration names it, saying what it is and why it is there; requests are
  labelled packets. Problem and fix happen on the same diagram.
- **A camera that follows the story:** it frames whatever is in focus or moving, and
  zooms out as the system grows; neighbours fade at the edges.
- **A felt failure:** an `error` status shakes the screen with a red blink and a buzz.
- **Sound design:** pops, whooshes, error and success sounds on every visual event,
  meaningful cues the author places (`clock`, `riser`, `cash`, `notify`, `alarm`,
  `impact`, `type`), and optional ducked background music.
- **Trust:** every component justified, the real mechanism blamed, alternatives named,
  the simple design shown as right while its scenario holds, a technical review of
  every claim, nuances in `notes`. No hype lines.
- **Endings:** a summary with a question for the comments; long YouTube videos add a
  short outro (comments, next topic, like and subscribe); shorts end on the question.

## How it works

```
src/spec/         schema (zod), vocabularies (icons, colors), normalization + validation
src/timeline/     word timings, cue resolution, timeline (pure functions)
src/layout/       safe areas per format, grid and layered graph layout, geometry
src/board/        the shared board: state over the whole video, camera
src/scenes/       one pure React component per scene type, f(scene, t); flowState.ts
                  (what a diagram looks like at time t: statuses, crowds, meters, clocks)
src/figures/      large illustrations for `figure` scenes (brain.tsx) + registry
src/worlds/       full-frame canvas worlds for `shot` scenes (film look): kit.ts (deterministic
                  noise, glows, paths, camera), render.ts (camera move, grain, vignette), one
                  file per world, index.ts (registry)
src/packs/        icon packs: draw.tsx (shared drawing kit), common/, tech/, science/, news/
                  (each: vocab.ts = names, aliases, colors, states; icons.tsx = drawings)
src/components/   icons.tsx (dispatcher over the packs), glyphs, *emphasis* text
src/code/         small deterministic syntax highlighter
src/video/        VideoFrame (whole picture at time t), Video (Remotion + audio),
                  animations, effects (shake/blink), sound (sfx timing, music ducking)
scripts/          preview, make, stills, validate, check, fingerprint, export-schema, tts_edge.py,
                  make-sfx.sh; lib/script.ts (script.md), lib/youtube.ts (youtube.md)
skills/make-video the /make-video skill (idea → draft → spec → video)
                  skills/make-news the /make-news skill (news → sourced draft → spec → broadcast report)
                  skills/make-film the /make-film skill (idea → shot scenes → documentary short)
                  skills/make-brain the /make-brain skill (verified puzzles → puzzle Short)
docs/             AUTHORING.md (rules for every video + spec reference), SHAPES.md (story
                  shapes, hooks, variety guard), REVIEWER.md (the review rubric),
                  DRAFT-TEMPLATE.md, packs/<pack>.md
videos/<pack>/    specs (input), one JSON per video, plus approved drafts (*.draft.md)
out/<id>/         one folder per video: <theme>.<format>.mp4, <theme>.<format>.sheet.png,
                  <theme>.thumbnail.png (1280×720), <theme>.cover.png (1080×1920),
                  stills/<theme>.<format>/, script.md, youtube.md (git-ignored)
public/fonts/     Inter + JetBrains Mono + Instrument Serif (film title cards; OFL), bundled
public/sfx/       sound effects (generated by scripts/make-sfx.sh)
```

Design rules that keep output consistent:

- **Specs are declarative and small.** No coordinates or durations in specs.
- **Everything is a pure function of time.** Scenes take `(scene, t)`; the SSR check
  and the renderer draw exactly the same frames.
- **Cues never break a video.** A cue phrase that is not found is placed evenly
  between its neighbours and reported as a warning.
- **Layout is computed:** boards use the author's coarse grid (`row`/`col`, transposed
  for 16:9 when it fits better); other diagrams are layered (Sugiyama-style), scaled
  to fit the safe area, and chains wrap into zig-zags on vertical video. Edges bend
  around cards.
- **Safe zones:** on vertical video nothing important goes in the top ~170 px or the
  bottom ~340 px (platform UI).

## Extending

- **New icon:** draw it in `src/packs/<pack>/icons.tsx` with the kit in
  `src/packs/draw.tsx` (200×160 box, light fill, ink outline) and add it to that
  file's `ICONS` map; then in `src/packs/<pack>/vocab.ts` add the name to `ICONS`, a
  default color to `COLOR`, its animated states to `STATES` and any synonyms to
  `ALIASES`. List it in the pack guide. Run `npm run schema`.
- **New pack** (e.g. `finance`): copy `src/packs/science/` as a starting point, register
  it in `src/spec/vocab.ts` (`PACKS`, `BY_PACK`, `PACK_ICONS`, the merged maps) and in
  `src/components/icons.tsx`, write `docs/packs/<pack>.md` (hook, formats, accuracy
  rules, icons, checklist, examples), add it to the tables in `docs/AUTHORING.md` §3
  and here, add a section to `skills/make-video/SKILL.md`, and create `videos/<pack>/`.
- **New figure:** draw `src/figures/<name>.tsx` with the brain's contract (a `<g>` in its
  own viewBox, named regions with `glow`/`dim`, an anchor per region), register it in
  `src/figures/index.ts` and in `FIGURE_INFO` (`src/spec/vocab.ts`, with its pack), and
  list it in the pack guide.
- **New world** (film look): `src/worlds/<name>.ts` implementing `World`, registered in
  `src/worlds/index.ts` and `WORLD_INFO` (`src/spec/vocab.ts`); see `docs/FILM.md` → "Adding a world".
- **New scene type:** add its zod schema to `src/spec/schema.ts`, its cue list to
  `src/timeline/cues.ts`, a component in `src/scenes/`, a case in
  `src/video/VideoFrame.tsx`, and document it in `docs/AUTHORING.md`.

## Remotion license

Remotion is free for individuals and small companies; larger teams need a company
license. Check the current terms at remotion.dev/license.
