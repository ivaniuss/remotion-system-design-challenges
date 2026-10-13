---
name: make-film
description: Turn an idea, topic or an existing video spec into a documentary-style short (cinematic, narrated, full-frame worlds; 16:9 and 9:16) with the remotion-system-design-challenges project, using the film look (theme "film", shot scenes). Use for /make-film or when the user asks for a documentary, cinematic or cortometraje version.
---

# /make-film — a documentary short on the video engine

The user gives an idea, a topic, a transcript, or an existing spec to retell ("haz la
versión documental de neuron-spark"). You write the spec; the engine draws the worlds,
times everything to the voice, and renders. Same project, commands and voice as
`/make-video` (`skills/make-video/SKILL.md`): read that skill for finding the project,
running commands (locally or from the Claude app with a linked computer) and delivering.
This skill only says what is different.

## 0. Read the request

- **Look**: the film look (`docs/FILM.md`). If the topic has no world yet (anything that is
  not neurons: see the table in `docs/FILM.md`), say so and offer either the explainer look
  (`/make-video`) or adding a world first. Never fake a topic with an unrelated world.
- **Language**: English by default (the channel's audience), as in `/make-video`. Talk to
  the user in Spanish.
- **Retelling an existing video**: keep its narration word for word unless asked; map each
  scene to a shot (one place per shot), keep `notes` and `publish`, and save it as
  `videos/<pack>/<id>-film.json`. Example: `neuron-spark.json` → `neuron-spark-film.json`.

## 1. Script first (new videos)

As in `/make-video` phase A (draft, sources, reviewer pass, approval before building), with
the film rules of `docs/FILM.md` → "Writing a film": voice in off, cold open then the title
card, one place per shot (8–18 s), events on the verbs, 1–3 labels per shot, end on the
world. In the draft, write each shot as `world — narration` plus the events and labels.

## 2. Build the spec

Read in full: `docs/FILM.md`, the `shot` section of `docs/AUTHORING.md` and the pack guide.

- `"theme": "film"`, `"pack"` set, every scene `"type": "shot"`.
- First shot: usually `network` with `camera: pull`, a `cascade` event on the first
  number or image the voice gives, and the `card` on the last sentence of the hook.
- Each shot: `world`, `title` (one or two words), `scale` (honest: what is on screen),
  `camera`, steps with `at` cues copied from that shot's narration in spoken order.
- `event` names and `label.anchor` names must be the world's (`WORLD_INFO` in
  `src/spec/vocab.ts`; the validator lists them when one is wrong).
- Say in `notes` anything the picture simplifies or does not draw to scale.

## 3. Check

```bash
npm run validate -- videos/<pack>/<id>.json      # events, anchors, cues
npm run check -- videos/<pack>/<id>.json         # also draws every world frame (NaN check)
npm run stills -- videos/<pack>/<id>.json        # both formats; look at the sheets
```

Look at the sheets for: a label cut by the edge or pointing at nothing, an event that lands
before the voice says it, in 9:16 anything important under the subtitles, a shot where
nothing moves, a scale that does not match the picture. Fix the spec (or the world) and
run `stills` again. The user reviews with `npm run preview -- videos/<pack>/<id>.json`;
render with `npm run make -- … --format both` only when asked.

## 4. Deliver

The contact sheets (and, for a retelling, a side-by-side with the original), `script.md`,
`youtube.md`, and one line: shots in order (`world`), what was verified, the review
command. Ask what to change.
