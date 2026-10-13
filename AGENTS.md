# Instructions for AI agents

This project turns an idea, a topic or a transcript into an animated explainer video
(ByteByteGo / Fazt Code / midudev style), 9:16 and 16:9, with Remotion. Topics come in
**packs** on the same engine: `tech` (system design, backend, programming),
`science` (the brain, biology, health, learning, languages) and `news` (current events,
told as a broadcast report with real footage), each with its own icons,
guide (`docs/packs/<pack>.md`) and folder (`videos/<pack>/`).
You write one declarative JSON spec; the engine does layout, camera, timing, voice,
sound, captions and rendering. No API key is involved.

## When asked to make or edit a video

Follow **`skills/make-video/SKILL.md`** step by step (it is the `/make-video` skill).
It sends you to **`docs/AUTHORING.md`** (the rules for every video and the reference
for every scene type and field) and to the pack guide **`docs/packs/<pack>.md`** (hook,
formats, accuracy rules, icons). Read both in full before writing a spec; they change
as the format improves.

The short version of the workflow:

0. **Pick the pack** by the topic (`tech` or `science`; ask if neither fits).
1. **Script first.** Pick the story shape and the hook (`docs/SHAPES.md`) and run
   `npm run fingerprint`. Write `videos/<pack>/<id>.draft.md` (template:
   `docs/DRAFT-TEMPLATE.md`; a finished example: `videos/tech/async-report-504.draft.md`).
   Have it reviewed by someone who did not write it (`docs/REVIEWER.md`: a separate agent
   when possible), fix the "must fix" items, then show the narration, iterate on text
   only, and build nothing until the user approves it.
2. **Build** `videos/<pack>/<id>.json` with `"pack"` set, from the approved narration,
   verbatim (examples: `videos/tech/async-report-504.json` in Spanish,
   `videos/tech/async-report-504-en.json` in English for YouTube).
3. **Check:** `npm run validate -- videos/<pack>/<id>.json` (fix every ✖ and cue ⚠),
   `npm run fingerprint -- videos/<pack>/<id>.json` (≥ 2 of 5 axes differ from the previous
   video), then `npm run stills -- videos/<pack>/<id>.json` and look at the contact sheets
   in `out/`. Run the second reviewer pass on the spec and `out/<id>/script.md`.
4. **Review, don't render:** the user runs `npm run preview -- videos/<pack>/<id>.json`
   (Remotion Studio, both compositions). Render only when asked:
   `npm run make -- videos/<pack>/<id>.json --format both|horizontal|vertical`.
5. **Deliver** the sheets, the thumbnail and Short cover (`out/<id>/<theme>.thumbnail.png`,
   `<theme>.cover.png`), `out/<id>/script.md` (teleprompter + talking points) and
   `out/<id>/youtube.md` (titles, description, chapters timed from the voice).

## Documentary videos (the film look)

When asked for a documentary, cinematic or "cortometraje" version, follow
**`skills/make-film/SKILL.md`**: same pipeline and commands, `"theme": "film"`, every scene
a `shot` in a world from `src/worlds/` (guide: `docs/FILM.md`).

## News reports (the broadcast look)

When asked for a news video (a current event: a cyberattack, El Niño, an economic story),
follow **`skills/make-news/SKILL.md`**: research with sources first, a fact-check pass by a
separate agent, `"pack": "news"`, `"theme": "news"`, real photos and clips in a `media`
library with credits (guide: `docs/packs/news.md`).

## Rules the user cares about (details in the guide)

- **Videos are in English by default** (the channel's audience), even though the user
  writes in Spanish: narration, on-screen text, titles, descriptions and Shorts. Another
  language only when they ask for that version. Talk to the user in Spanish.
- The default shape is a progressive build, like sprints: the simplest version that works,
  then "¿y qué pasa si…?" ("what if…?") turns — write these patterns in the video's
  language. It is right for "design X", not for everything: choose among the shapes and
  hooks in `docs/SHAPES.md` and set `"shape"` and `"hook"` in the spec. The look is the
  brand; the story shape must not repeat video after video. Never announce "en vivo",
  "por niveles" or "nivel 1".
- Every component says what it is and why it is there **and what it costs**; blame the
  mechanism; name the real alternatives; never imply the simple design always fails.
- Numbers are seen, not only said: `crowd` (load), `meter` (capacity), `clock` (a hold or
  timeout), a `sequence` scene (waiting, retries), a `callout` with `countUp`.
- Long tech videos open with a requirements beat (functional and non-functional, with
  numbers) and a peak-load estimate before the first design.
- Instructor voice (one person teaching), no simulated interviewer/candidate dialogue.
- No hype lines. The hook is a real question (tech: an open interview question about
  the system; science: the viewer's real problem), never a still picture (title
  `beats`).
- End with a question; long YouTube videos add a short outro; shorts do not.
- Act as a senior system design architect: peak numbers, stateless vs stateful, reads vs
  writes, failure modes, abuse; at a high-traffic turn show the standard scaling step
  (load balancer, copies, CDN/cache) before the specialized fix, and say why any obvious
  missing component isn't needed yet. Long videos can be long; Shorts come from them.
- Verify every claim (defaults, limits, status codes, study findings) or soften it;
  science claims need a source in `notes`.
- One pack per video: only its icons (plus the common ones). Never borrow a tech icon
  for a science idea; add an icon to the pack instead.

## Working on the engine

- Everything is a pure function of time; `npm run typecheck` and `npm run check`
  (renders every other frame of every spec to markup; `--every 8` for a quick pass) must pass.
- New fields go in `src/spec/schema.ts` (then `npm run schema`), are documented in
  `docs/AUTHORING.md`, and taught in `skills/make-video/SKILL.md`. A new shape, hook or
  Short pattern is added to `docs/SHAPES.md`, `src/spec/vocab.ts` and
  `scripts/fingerprint.ts`.
- Icons live in `src/packs/<pack>/` (drawings + vocabulary); README → "Extending" says
  how to add an icon or a whole pack.
- Code, file names and docs are in English; video narration can be in any language
  (`es`, `en`, `pt`).
- See `README.md` for commands, configuration and the source layout.
