# Authoring guide: from an idea to a video spec

This is the guide Claude follows (via `/make-video`) to turn an idea, a topic or a
transcript into `videos/<pack>/<id>.json`. It holds the rules for **every** video and
the spec reference; each topic pack adds its own guide in `docs/packs/` (§3). The engine does everything else: layout, camera,
animation, timing, voice, sound effects, captions and rendering. **Your job is to write
a script people watch to the end, and to tie every sentence to something they see.**
Never write coordinates in pixels, durations or frame numbers.

---

## 1. The workflow

1. Read the idea and **pick the pack** (§3): `tech` for software and system design,
   `science` for the brain, biology, health, learning and languages. Read that pack's
   guide in `docs/packs/<pack>.md`. If it is a transcript, keep its facts and voice,
   but restructure it into scenes (rules below). If it is a topic, use correct facts;
   do not invent numbers you cannot justify.
2. **Script first.** Write a short draft — the question, the requirements and the scale
   estimate, a story map with what each step costs, each scene's title and narration with
   a one-line visual note, and the talking points — and get it approved before building
   anything. Template: `docs/DRAFT-TEMPLATE.md`. Text is cheap to iterate; diagrams,
   stills and reviews are not. Before writing, **choose the story shape and the hook**
   (`docs/SHAPES.md`) and run `npm run fingerprint` so the video does not repeat the last
   one. Before the user sees the narration, **have it reviewed** by someone who did not
   write it (`docs/REVIEWER.md`: a separate agent when possible). Then turn the approved
   narration (verbatim) into the spec.
3. Save the spec as `videos/<pack>/<id>.json` (`id` = kebab-case slug, unique across
   all packs) with `"pack"` set to that folder's name.
4. Run `npm run validate -- videos/<pack>/<id>.json`. Fix every ✖ error and every ⚠ cue
   warning (a cue warning means an animation will not be in sync with the voice). Then
   `npm run fingerprint -- videos/<pack>/<id>.json` (variety against the previous video)
   and the second reviewer pass on the spec and `out/<id>/script.md`.
5. Look at it without rendering: `npm run stills -- videos/<pack>/<id>.json` (contact sheets in
   `out/<id>/`), and the user reviews it with `npm run preview -- videos/<pack>/<id>.json` (Remotion
   Studio shows both compositions, "Vertical" and "Horizontal").
6. Render the MP4s only once it is approved: `npm run make -- videos/<pack>/<id>.json --format both`
   (or `--format horizontal` for a YouTube-only video).

Every `preview` and `make` also writes, in `out/<id>/` (one folder per video; `<theme>` is the
spec's theme, `light`, `dark`, `neon` or `film`, so a video rendered in two themes never mixes):
`script.md` (teleprompter with timestamps, what is on screen, talking points) and
`youtube.md` (title options and a description with chapters timed from the voice).

## 2. The retention playbook (what makes people watch to the end)

Short-form platforms rank videos by how many people keep watching and rewatch. Every
rule here exists to stop the swipe.

- **Hook in the first 2 seconds, on frame 0.** Scene 1 is a `title` with a short tag
  and a heading that states the problem. Each pack says what a good hook is (tech: an
  open interview question about the system; science: the viewer's real problem or
  curiosity). The heading is fully visible at once on frame 0, because that is what a viewer
  sees when the video starts in the feed. (The thumbnail is a separate designed still: see
  `thumbnail` below.) No greetings, no "en este video…".
- **Open a loop with a real question, not with hype.** The voice asks the concrete
  question the video answers: "¿Lo generas en la misma petición?", "¿Por qué olvidas lo
  que estudiaste ayer?". The viewer stays to find out. **Never** use generic hype or claims the
  video does not prove: "casi todos la responden mal", "nadie te dice esto", "esto te
  va a volar la cabeza", "el error que comete el 90 %". They sound machine-written and
  cost trust.
- **Something changes on screen every 2–3 seconds.** A node appears, a packet moves,
  a status flips, the camera moves. On the board, every sentence that names a
  component should make it appear or act. Long sentences with nothing happening are
  where people swipe.
- **Make the failure the peak.** The moment the naive design (or the common habit) breaks gets an `error`
  status (screen shake + red blink + buzz) and, often, a `callout` right after it
  ("504", "x2 cobro", "0 asientos") laid over the dimmed board.
- **Show the fix on the same picture.** Do not start a new diagram for the solution:
  keep building the board, hide what is wrong, add what fixes it. The viewer sees the
  difference instead of being told.
- **Show load, capacity and waiting; do not only say them.** A number that matters is
  seen: load is a `crowd` of dots piling onto a node, capacity is a `meter` filling up,
  a hold or a timeout is a `clock` ring running out, time between events is a `sequence`
  scene, and a quantity that should feel big is a `callout` with `countUp`. A number that
  exists only in the voice is a finding in the review (§4: "Visible metrics").
- **Every improvement says what it costs.** A cache brings stale data, a queue brings an
  answer that is no longer immediate, a waiting room makes some fans wait
  (`docs/SHAPES.md` §3). A design that shows only benefits is a sales pitch.
- **Do not make every video the same video.** The look is the brand; the *shape* of the
  story and the *kind of hook* are not. Pick them from the menus in `docs/SHAPES.md`,
  set `"shape"` and `"hook"` in the spec, and let `npm run fingerprint` check that the
  video differs from the previous one in at least two of five axes.
- **Context on screen, not only in the voice.** Right after the hook, a short
  "escenario" beat shows who wants what and the 1–3 numbers that matter ("50M filas",
  "~5 min", "10k pedidos/s") as nodes and a note. Many people watch muted or half
  listening; the picture has to tell the story on its own.
- **Clear first, then short.** The video lasts as long as it needs to be understood
  (typically 60–120 s for a short, 4–8 min for a progressive YouTube video, longer when the depth needs it). Length is never a reason to skip a step the viewer needs;
  cut only sentences that do not help understanding or move the story.
- **Sound with meaning.** Pops, whooshes, the error buzz and the success chime are
  automatic. Add 2–4 *meaningful* cues with `sfx` (clock while something waits, a
  riser into the failure, cash when resources are wasted, notify when the user is
  told). Never two cues in the same second; no cue that does not match the meaning.
- **Never a still opening.** While the voice states the problem, the hook draws it:
  `beats` on the `title` (3–5 small cards like "Ventas" → "Reporte anual" → "Usuario"
  → "?") pop in on their cues, arrows draw themselves and a dot keeps flowing through
  them. A title without beats is a picture the viewer waits through.
- **End with a question.** The `summary` closes with a question that invites comments
  ("¿SSE o WebSocket?") as its `cta`, and the narration asks it.
- **Shorts: no outro.** A "like and subscribe" card signals the end and people swipe
  before it, which hurts completion. What a Short does end with: the question, then
  one short line that points to the full video ("El diseño completo está en el
  canal" / "The full design is on the channel"); the summary `cta` is just that pointer.
- **Long YouTube videos: a short outro (≤ 15 s).** A last `list` scene ("Antes de irte" /
  "Before you go", `numbered: false`, 3 items) in one breath: answer in the comments,
  pick the next topic (give 2–3 examples: the next system to design, the next question
  about the brain…), and a like and subscribe "si te
  sirvió". Warm and brief; no begging, no "no olvides…" list. If the user has a
  channel handle, it goes in `video.config.json` → `handle` (a watermark the whole
  time); ask them once instead of inventing or editing it silently.
- **The voice of an instructor, not a role-play.** One person explains to the viewer,
  like Fazt Code, ByteByteGo or midudev: direct, conversational, a bit of energy,
  second person ("tu app", "lo que harías", "tu memoria"). Never a simulated dialogue.
- **Make it fun without losing rigor.** An everyday analogy for the hard idea (the
  waiter who takes your order and brings it later = 202 + cola; a path in the grass
  that gets clearer the more you walk it = practice), a relatable moment
  ("el usuario mirando el spinner"), a rhetorical question before a reveal ("¿y qué
  pasa al minuto?"), a pause to think ("¿tú qué harías?"), sound cues that land. At
  most one light joke; never at the cost of accuracy.
- **Spoken language.** Short sentences (6–14 words), plain words. When you use jargon,
  explain it in the same sentence.

### Shorts from a long video (the default way to grow a channel)

A new channel is discovered through Shorts; the long video is for people who want the
whole explanation. For every long video, also cut **2–3 Shorts**, one per turn of its
story (e.g. "why the 504", "queue + worker", "generate it once"):
- Each Short is its own spec, `videos/<pack>/<id>-short-<n>-<slug>.json`, vertical,
  **45–60 s of voice (≈ 140–170 words), 5–6 scenes**: a `title` hook with `beats` (a
  concrete mystery or question: "¿Por qué tu reporte da *error 504*?"), 3–4 `board`
  scenes, and a `summary` that ends on a question plus one line pointing to the full
  video on the channel (the question in the narration; `cta`: "Video completo en el
  canal ▶" / "Full video on the channel ▶"). No outro.
- Reuse the long video's approved narration and facts, cut down; the board only has
  the nodes that Short needs.
- **Do not cut every Short from one skeleton.** Pick a pattern (`classic`, `contrast`,
  `decision`, `timeline`, `code`, `crowd`; `docs/SHAPES.md` §6) and use a different one for
  each Short of a series.
- It must make sense alone (one sentence of context in the hook), but the last scene of
  Short n can tease Short n+1 ("te lo explico en el siguiente short").
- `publish` with 1–2 titles, a one-line description, an `extra` line pointing to the
  full video, the `comment` question and 2–3 hashtags. `make` skips chapters for videos under 2 minutes.
- Render: `npm run make -- videos/<pack>/<id>.json --format vertical`. Upload one per
  day; link Short n → n+1 → the long video with YouTube's "related video" field.
- Make them in the language of the channel they go to; for an English channel write
  English Shorts (`-en` suffix), not a dubbed Spanish one.
- Example: `videos/tech/report-short-1-504.json`, `-2-queue`, `-3-cron` (from
  `async-report-504`), and the English `report-short-*-en.json`.

### Length budget

| Format | Scenes | Words (total) | Result |
| --- | --- | --- | --- |
| Short (TikTok / Reels / Shorts) — default | 7–10 | 150–300 | ~60–120 s |
| YouTube (16:9) explainer | 14–28 | 450–1300 | 3–8 min |

These are typical ranges, not limits: clarity decides the length.

The same spec renders in both formats. Keep each scene's narration under ~40 words
(the validator warns at 75). The `title` scene is ≤ 35 words (≈ 10–14 s): the heading
is the short open question; the voice tells the whole situation in one sentence, asks
the question and says the approach, while the `beats` draw the problem.

### Narration rules (it is read by a TTS voice)

- Write numbers the way you want them heard only when it matters ("sesenta segundos");
  status codes and short numbers can stay as digits ("504", "202").
- No markdown, emojis, URLs, code or symbols like `->`, `/`, `&` in narration.
  Say "barra", "y", "a" instead, or rephrase.
- Use punctuation for rhythm: commas = short breath, periods = longer pause.
- `*asterisks*` are allowed in on-screen text (titles, items, notes) to highlight
  words. Never in narration.

## 3. Topic packs and formats

A **pack** is a topic family with its own icons, hook style, formats and accuracy
rules. The engine, the scene types and every rule in §2 are shared. Read the pack
guide before writing the draft.

| Pack | Topics | Guide | Specs |
| --- | --- | --- | --- |
| `tech` (default) | software, backend, system design, programming | `docs/packs/tech.md` | `videos/tech/` |
| `science` | the brain, biology, health, learning, languages, habits | `docs/packs/science.md` | `videos/science/` |
| `news` | current events: cyberattacks, economy, institutions, weather and climate | `docs/packs/news.md` | `videos/news/` |
| `brain` | Daily Brain: daily puzzles, brain teasers, spot the mistake, cognitive biases | `docs/packs/brain.md` | `videos/brain/` |

A video uses one pack: only that pack's icons (plus the common ones) are accepted, so
topics never mix by accident. Choose by the topic, not by the words ("memory leaks"
is tech; "why you forget" is science). If a topic fits no pack, ask the user rather
than forcing it, or add a pack (README → "Extending").

**The default shape, shared by every pack: a progressive build.** Start from the simplest
version that works (a system you could ship, a model that explains what the viewer
lives), then an honest question — "¿y qué pasa si…?", "¿entonces por qué…?" — brings what
breaks and the improvement, on the same board. It is right for "design X from scratch",
not for everything: `docs/SHAPES.md` has five more shapes (`post-mortem`,
`request-journey`, `a-vs-b`, `numbers-first`, `code-first`) and four kinds of hook.
In a long `progressive` video, the first design is preceded by a **requirements beat**
(one `list` scene of ~10 s: 2 functional and 2–3 non-functional requirements, each
non-functional one with a number). Rules for every pack and every shape:
- **Never announce the format.** No "en vivo", "por niveles", "nivel 1", "versión 2",
  "paso 3" in the narration or on screen. Scene titles name the topic.
- **Every piece earns its place.** The first time a component, concept or term
  appears, say what it is and why it is there in one clause. If you cannot justify it
  in one clause, it does not go in the diagram. Say also **what it costs** or makes
  harder, in the voice or on screen (a `note`, a `compare`, a `meter`), not only in `notes`.
- **Blame the mechanism, name the alternatives, never imply the simple version always
  fails.** Say which variable breaks it and when it is enough.
- **Accuracy over drama.** Verify every concrete claim (search official docs or
  sources) or soften it; when a limit is fuzzy, say what makes it struggle instead of
  inventing a number. Nuances and sources go to `notes`.

## 4. The spec format

```jsonc
{
  "id": "kebab-case-id",            // also the output file name
  "title": "Human title",
  "lang": "es",                     // "en" | "es" | "pt" (narration language)
  "pack": "tech",                   // "tech" (default) | "science": which icons and guide (§3)
  "theme": "light",                 // "light" = clean diagrams, "dark" = code/editor vibe, "neon" = dark with glowing active paths, "film" = documentary (docs/FILM.md), "news" = broadcast (docs/packs/news.md)
  "shape": "progressive",           // optional: progressive | post-mortem | request-journey | a-vs-b | numbers-first | code-first
  "hook": "interview-question",     // optional: interview-question | incident | surprising-number | broken-thing
  "board": { "nodes": [...], "edges": [...] },   // the shared diagram (see below)
  "scenes": [ /* 1..30 scenes */ ],
  "notes": [ "…" ]                  // talking points: said, not shown (see below)
}
```

**Themes.** `light` is the default look for diagrams. `dark` suits code. `neon` is `dark`
with a soft glow on active paths, packets with comet trails and a radial glow behind the
board: use it for incidents, post-mortems and code-first videos, and for variety. It
changes only colors and glow, never the layout, so any spec renders in any theme.
`film` is a different look, not only a palette: the documentary style of `docs/FILM.md`,
made of `shot` scenes (no header, no progress bar, grain, plain subtitles, a title card).
Use it with `shot` scenes only.

**`shape` and `hook`** are optional and change nothing on screen. They are the record that
`npm run fingerprint` reads to keep the channel from repeating itself, and they tell the
reviewer which skeleton to expect (`docs/SHAPES.md`). Set both on every long video.

**`notes`** — up to 20 talking points (≤ 900 chars each) that are better said than
shown: why each component is there, the alternatives and their trade-offs, how scale
changes the answer, failure handling, the follow-up questions an interviewer would
ask, and (science) the source of each claim. They never appear in the video; `make` writes them to
`out/<id>/script.md` together with the narration (a teleprompter with timestamps)
and what is on screen at each cue. Use them for a long version, the description or a
pinned comment. Write 5–12 (more for longer videos).

Every scene has `type` and `narration`. Most have an optional `title` (≤ 60 chars,
aim for ≤ 28) shown at the top. Visual changes are tied to the voice with **cues**: an
`at` field that holds **2–4 words copied exactly from that scene's narration**, in the
order they are spoken. When the voice says those words, the change happens. A cue
that is missing or wrong does not break the video (it is spread evenly), but then the
animation is not in sync, so get them right.

### `board` — ONE diagram for the whole video (the workhorse)

(The examples in this section use the tech pack; in science the nodes are organs,
processes, habits or kinds of memory, and the packets are information or signals.)

Declare every component once at the top level, then tell the story with `board`
scenes. The board starts **empty**; a node appears the first time a step mentions it
(in `show`, `packet`, `status`, `focus`, `camera` or `note.near`). Everything
persists from one board scene to the next: what you built in "the problem" is still
there in "the solution". A camera follows the action automatically: it frames the
`focus` nodes (or the `camera` nodes, or everything visible) and the trip of each
packet, and zooms out as the system grows.

```json
"board": {
  "nodes": [
    {"id": "user", "label": "Usuario", "icon": "client", "row": 0, "col": 0},
    {"id": "lb", "label": "Load balancer", "icon": "gateway", "row": 0, "col": 1},
    {"id": "api", "label": "Tu API", "icon": "api", "row": 0, "col": 2},
    {"id": "db", "label": "Base de datos", "sub": "millones de filas", "icon": "db", "row": 1, "col": 1},
    {"id": "queue", "label": "Cola", "icon": "queue", "row": 1, "col": 2}
  ],
  "edges": [
    {"from": "user", "to": "lb"}, {"from": "lb", "to": "api"},
    {"from": "api", "to": "db"}, {"from": "api", "to": "queue"}
  ]
}
```
```json
{"type": "board", "title": "La respuesta obvia",
 "narration": "Lo obvio: el usuario pide el reporte, pasa por el load balancer, y tu API lee millones de filas.",
 "steps": [
   {"at": "el usuario pide", "show": ["user"]},
   {"at": "el load balancer", "packet": {"from": "user", "to": "lb", "label": "GET /reporte"}},
   {"at": "tu API lee", "packet": {"from": "lb", "to": "api"}},
   {"at": "millones de filas", "packet": {"from": "api", "to": "db", "label": "SELECT *"}, "status": {"api": "busy", "db": "busy"}}
 ]}
```

**Placement (`row`, `col`)** — coarse grid cells, not pixels; halves are allowed
(`"col": 0.5` centers a node between two columns). Design it for the phone (9:16):
**at most 3 columns**, as many rows as you need (3–4 is ideal). Exception: a video for
16:9 only (YouTube) should lay the board out wide instead — 2 rows × up to 4 columns —
so the full system fills the frame; the validator's 4-column warning is expected there
(example: `videos/tech/async-report-504-en.json`). The main request path
goes along the top row or down the first column; the solution grows below or to the
right. The 16:9 version reuses the grid (transposed automatically when that fits
better). Give every node a row and col (all or none); without them the layout is
computed from the edges. Two nodes cannot share or overlap a cell.

**Bottom-up stories (`"flowUp": true` on the board).** 16:9 turns rows into columns, so row 0
ends up on the left. When the story flows from the bottom row up (skin → spinal cord → brain,
with the brain drawn on top), set `"flowUp": true`: the bottom row goes on the left in 16:9
and the path still reads left to right. 9:16 is unchanged.

**Board rules**
- 5–10 nodes in total. If a story needs more, it is two videos.
- Mention components in the order the narration introduces them; each new name in
  the narration = a node appearing at that cue.
- An edge appears when both its nodes are visible. To remove a wrong path in the
  solution, `hide` the edge (`"hide": ["api->db"]`) or the node.
- `focus` on the culprit when explaining a failure; `focus: []` to clear it.
  Focus and notes reset at every new board scene.
- `camera: []` in the payoff step zooms out to show the whole system.
- Reset statuses when the story moves on (`"status": {"api": "idle"}`).
- A `callout` placed right after a board scene is drawn over the dimmed board.

Step fields (all optional, combine freely in one step):

| Field | Effect |
| --- | --- |
| `at` | cue phrase from the narration |
| `show: [ids]` | nodes appear (they also appear when first mentioned elsewhere). Edge ids (`"from->to"`) in a `show` stay hidden until that step. |
| `hide: [ids]` | nodes or edges fade out |
| `focus: [nodeIds]` | highlight these, dim the rest, camera frames them. `[]` clears it. |
| `camera: [nodeIds]` | frame these without dimming. `[]` = frame everything visible. |
| `packet: {from, to, via?, label?, color?}` | a pill travels along the edges (`via` = intermediate nodes), in either direction (a response can go back along a request edge). Labels: aim for ≤ 14 chars, hard limit 24: `"GET /users"`, `"202 + jobId"`, `"SELECT *"`. |
| `status: {nodeId: idle\|busy\|ok\|error\|warn}` | badge + the icon animates. `error` = shake + red blink + buzz: use it once, at the peak. `ok` = success chime. Careful: naming a node in `status` (even `idle`) makes it appear, so only reset nodes that are already on the board. |
| `crowd: {from, to, via?, density?, label?, color?}` or `"off"` | a **crowd** of dots streams from `from` to `to` and piles up around the target (`density`: `few` · `many` · `flood`; `label` ≤ 14, the real number: `"×3.5B"`). It pictures the load, not a count. Stays until `"off"` or the end of the scene. |
| `meter: {nodeId: {value, label?, tone?} \| "off"}` | a **fill bar** under the node, `value` 0–1 (queue depth, CPU, connections in use); green → yellow → red unless `tone` is set; `label` ≤ 16. Persists across board scenes like a status; change it with a new value, remove it with `"off"`. |
| `clock: {nodeId: {label?, over?, end?} \| "off"}` | a **timer ring** on the node's corner that runs out (a seat hold, a timeout, a TTL). `over` = seconds of *video* the ring takes (0.5–8, default 2); `label` ≤ 14 carries the real duration (`"10 min hold"`); `end` ≤ 14 is what it says at zero (`"expired"`). Resets at the next scene. |
| `note: {text, tone?, near?}` | a callout under the diagram (or above node `near`). Aim for ≤ 40 chars, hard limit 60. It stays until the next note or the end of the scene, so give a new note when the idea changes. |
| `sfx: name` | a meaningful sound at this cue (see "Sound cues" below). |

Good board scenes have **2–5 steps**, each tied to a phrase, about one every 2–3 s.

**Visible metrics (`crowd`, `meter`, `clock`).** Use them where the voice says a number
that the viewer should *feel*; one or two per video turn, not on every step.
- **Load → `crowd`.** "Ten thousand fans open the page at once": a flood of dots from `fans`
  to `api` with the label `×10k`. Clear it (`"crowd": "off"`) when the idea moves on, or
  fix the system and let the next step send a calm packet through the same path.
- **Capacity → `meter`.** "The database is already at its limit": `meter: {"db": {"value": 0.95, "label": "connections"}}`.
  Meters are the fastest way to show a bottleneck *moving*: after the fix, the old meter
  drops and another one rises.
- **Waiting and expiry → `clock`.** "You have ten minutes to pay": `clock: {"db": {"label": "10 min hold", "over": 6, "end": "expired"}}`.
  `over` is how long the *video* takes to run the ring; the label says the real time.
- Real numbers go in labels and `notes`; the dots and bars are a picture of magnitude,
  never a measurement. Mark invented figures as examples.

### Sound cues (`sfx`)

Automatic, no markup needed: pop (something appears), whoosh (packet, scene change),
error buzz (an `error` status), success chime (an `ok` status), impact (hook and
callouts), typing (code scenes). Add `"sfx"` to a step, a list/summary/compare item,
a `title` or a `callout` only when the sound *means* something:

| `sfx` | Use it when… |
| --- | --- |
| `clock` | something waits or a timeout runs ("tarda cinco minutos") |
| `riser` | tension builds into a failure: put it on the step where things break; it starts ~1 s earlier and ends on the cue |
| `cash` | money or resources are spent or wasted ("sigue gastando recursos", "pagas el doble") |
| `notify` | a notification reaches the user (email, push, SSE, WebSocket) |
| `alarm` | an outage or incident (use sparingly) |
| `type` | code is being written outside a code scene |
| `impact` | a scenario card lands (the callout that opens a turn) or a hidden piece is revealed |
| `success` | a payoff moment that has no `ok` status (e.g. the download at the end of the full flow) |

`pop`, `whoosh` and `error` also exist but play automatically; you rarely need them.
2–4 cues per short, a few more in a long video (one per turn is plenty). A step with its own `sfx` does not also play the automatic
success/error sound.

### `title` — the hook
```json
{"type": "title", "tag": "System design interview", "heading": "Design the *annual sales report* export",
 "subheading": "optional, one line", "icon": "file",
 "beats": [
   {"text": "Sales", "icon": "db", "at": "has to generate"},
   {"text": "Annual report", "icon": "file", "at": "annual sales report"},
   {"text": "User", "icon": "user", "at": "deliver it to"},
   {"text": "?", "at": "How do you design"}
 ],
 "narration": "Interview question: your system has to generate the annual sales report and deliver it to the user. How do you design it? …"}
```
`heading` ≤ 90 chars (aim for ≤ 45); on the first scene the tag, heading and subheading
are visible on frame 0 (what the feed shows first), and the `beats` pop in afterwards with the
voice. `tag` ≤ 32 chars. `sfx` optional (plays at the start of the scene).

`beats` (2–5, recommended 3–4): the problem drawn while it is told. Each beat is a card
(`icon` + 1–3 words, `text` ≤ 24) that pops in on its `at` cue, with an arrow from the
previous one; after the last beat a dot keeps flowing through the row. A beat without
`icon` shows its text big — use it for the open question ("?"). Beats replace `icon`.

### `callout` — one big number or word
```json
{"type": "callout", "text": "504", "caption": "Gateway Timeout", "tone": "bad", "icon": "gateway", "sfx": "impact", "narration": "…"}
```
`text` ≤ 14 chars ("504", "10x", "50M ventas", "99.99%"). `caption` ≤ 80 chars. `tone`: good | bad
| info | warn | neutral. `icon` optional (shown above). After a board scene it is laid
over the dimmed board. Use it for turning points only: the starting scenario and each
"¿qué pasa si…?" turn in the progressive format (usually 3), or one punchline ("504")
in a short. Never for decoration.

`"countUp": true` counts the leading number up from zero while the callout appears
("3.5B requests" runs 0 → 3.5B; `50M ventas`, `10k`). Use it for quantities that should feel
big; never for codes like `504` or for a percentage.

### `flow` — a self-contained diagram for one scene

Use it for a side diagram that is not part of the main story (for example "how
consistent hashing places keys"). For the main system of the video, use the board.
Same step fields as the board, but nodes never listed in a `show` are visible from the
start, and nothing carries over to the next scene.
```json
{
  "type": "flow", "title": "The naive approach", "narration": "…",
  "nodes": [
    {"id": "user", "label": "User", "icon": "client"},
    {"id": "api", "label": "API", "sub": "Node.js", "icon": "api", "color": "purple"}
  ],
  "edges": [{"from": "user", "to": "api", "label": "HTTPS", "dashed": false}],
  "steps": [
    {"at": "sends a request", "packet": {"from": "user", "to": "api", "label": "GET /report"}},
    {"at": "scans millions", "status": {"api": "busy"}, "focus": ["api"], "note": {"text": "*5 min* query", "tone": "warn"}}
  ]
}
```
- **Layout is automatic.** List nodes in the order data flows; edges define the
  shape. Long chains wrap into a zig-zag on vertical video.
- **Keep it small: 2–6 nodes per scene** (max 9). Split big architectures into
  several flow scenes ("the request path", then "the async part"). Reusing the
  same ids/labels across scenes keeps continuity.
- `label` ≤ 18 chars reads best (max 28). `sub` ≤ 20 chars for a detail.
- `color` is optional (each icon has a sensible default): blue, green, orange,
  purple, red, yellow, teal, gray.
- Edge ids are `"from->to"` (used in `show`/`hide`).

Step fields (all optional, combine freely in one step):

| Field | Effect |
| --- | --- |
| `at` | cue phrase from the narration |
| `show: [ids]` | nodes/edges listed in any `show` start hidden and pop in here. Edges between two visible nodes appear automatically. Everything never listed in a `show` is visible from the start. |
| `hide: [ids]` | fade out |
| `focus: [nodeIds]` | highlight these, dim the rest. `[]` clears it. |
| `packet: {from, to, via?, label?, color?}` | a pill travels along the edges (`via` = intermediate nodes). Labels ≤ 14 chars read best: `"GET /users"`, `"202 + jobId"`, `"SELECT *"`. |
| `status: {nodeId: idle\|busy\|ok\|error\|warn}` | badge + the icon animates (db scans, worker gears spin, cache hit/miss, client spinner…) |
| `crowd`, `meter`, `clock` | same as on the board (see "Visible metrics" above); a `flow` scene starts them from nothing. |
| `note: {text, tone?, near?}` | a callout under the diagram (or above node `near`). ≤ 40 chars. |

Good flow scenes have **2–5 steps**, each tied to a phrase.

### `sequence` — who talks to whom, over time

Boxes and arrows cannot show that something *took five minutes*. A `sequence` scene
can: actors stand across the top with a dashed lifeline, time flows downward, and every
step draws one message. Use it for timeouts, retries, race conditions, a payment that
succeeds but is never recorded, anything where **the order and the waiting are the point**.
```json
{"type": "sequence", "title": "Charged twice",
 "narration": "…",
 "actors": [
   {"id": "api", "label": "Backend", "icon": "api"},
   {"id": "pay", "label": "Payments", "icon": "gateway"},
   {"id": "db",  "label": "Database", "icon": "db"}
 ],
 "steps": [
   {"at": "charges the card", "from": "api", "to": "pay", "label": "charge $80"},
   {"at": "payment goes through", "from": "pay", "to": "api", "kind": "return", "label": "ok"},
   {"at": "mark the seat sold", "from": "api", "to": "db", "kind": "lost", "label": "mark sold", "note": {"text": "The crash happens *here*", "tone": "bad"}},
   {"at": "a minute later", "from": "api", "to": "pay", "after": "+1 min", "label": "charge $80"}
 ],
 "spans": [{"actor": "pay", "from": 0, "to": 1, "label": "K1 seen", "tone": "good"}]}
```
- `actors`: 2–5, each with `id`, `label` ≤ 18, `icon` (optional `sub` ≤ 18, `color`).
- `steps` (1–12), each tied to a cue: `from` and `to` are actor ids. `kind`: `call`
  (solid arrow, default), `return` (dashed arrow back), `lost` (a call that never arrives,
  it ends in a red ✕), `self` (a loop on one actor; give `from` only). `label` ≤ 24.
- **Time is vertical space.** `after` (≤ 12 chars: `"+5 min"`) puts a label and a wavy
  break on the time axis before that message; `gap` (0.5–3, default 1) adds extra room.
  Keep the sum of the gaps below ~9 so it fits a phone.
- `spans` (≤ 4): a bar on an actor's lifeline from the message of step `from` to the
  message of step `to` (0-based indices) — "blocked", "holding the connection". It grows
  with the voice.
- `status` and `note` work as on the board; `error`/`lost` steps shake the screen and buzz.
- Keep the narration to ≤ 40 words and one cue per message: 3–8 messages is plenty.

### `code` — editor with typing + line highlights (Fazt style)
```json
{"type": "code", "title": "The code", "filename": "users.service.ts", "language": "ts",
 "code": "line 1\nline 2\n…",
 "steps": [{"at": "first you read", "lines": [2, 3], "note": "1. Check the cache"}],
 "narration": "…"}
```
`language`: ts, js, python, go, java, sql, bash, json, yaml, text. **≤ 12 lines and
≤ 44 characters per line** (vertical video); break long calls across lines. Lines are
1-based. The code types itself, then each step highlights its lines.

### `list` — numbered points
```json
{"type": "list", "title": "Watch out for", "numbered": true,
 "items": [{"text": "Stale data: use a *TTL*", "icon": "scheduler", "at": "stale"}], "narration": "…"}
```
1–6 items, aim for ≤ 40 chars each (hard limit 90). `icon` optional.

### `compare` — two columns (bad vs good, A vs B)
```json
{"type": "compare", "title": "Sync vs async",
 "left":  {"label": "Synchronous", "tone": "bad",  "items": [{"text": "Holds the connection", "at": "holds the connection"}]},
 "right": {"label": "Async job",   "tone": "good", "items": [{"text": "Answers in *ms*", "at": "answers in milliseconds"}]},
 "narration": "…"}
```
1–5 items per side, ≤ 40 chars. Narrate the left side first, then the right.

### `summary` — takeaways + call to action
```json
{"type": "summary", "title": "Key takeaways", "points": [{"text": "Return *202* + a job ID", "at": "return 202"}],
 "cta": "Follow for more system design", "narration": "…"}
```
2–4 points. `cta` optional (defaults per language).

### `chart` — curves that draw themselves
```json
{"type": "chart", "title": "Repasar *espaciado*", "schematic": true,
 "x": {"label": "tiempo", "max": 4.6, "ticks": [{"at": 0, "label": "Hoy"}, {"at": 1, "label": "1 día"}, {"at": 3, "label": "1 semana"}]},
 "y": {"label": "Lo que recuerdas", "min": 0, "max": 108},
 "series": [
   {"id": "once", "label": "Una sola noche", "tone": "bad", "points": [[0,100],[0.5,62],[1,46],[2,33],[3,26]]},
   {"id": "spaced", "label": "Con repaso", "tone": "good", "points": [[0,100],[1,52],[1,96],[3,72],[3,98]]}
 ],
 "steps": [
   {"at": "en una sola noche", "draw": ["once"]},
   {"at": "se olvida rápido", "mark": {"x": 1, "label": "ya se fue la mitad", "series": "once"}},
   {"at": "si lo repasas", "draw": ["spaced"], "focus": ["spaced"]},
   {"at": "dura mucho más", "focus": [], "note": {"text": "Espaciado > *atracón*", "tone": "good"}}
 ],
 "narration": "…"}
```
- `series` (1–4): `points` are `[x, y]` with x that never decreases; the curve is smooth
  between points. Two points with the **same x** make a vertical jump (a review that
  brings memory back up, a deploy that drops latency); a stretch between two jumps is
  drawn as a decay/growth curve (fast, then slower). `tone` colors it; `label` sits at
  its end; `dashed` for a projection.
- x and y are positions: put any labels on the axes with `ticks` (≤ 8, `label` ≤ 14).
- `schematic: true` = the shape is illustrative, not measured: numeric ticks are hidden
  and a small "Esquema ilustrativo" tag appears. **Use it unless every number comes
  from a source** (then cite it in `notes`). Ticks you list yourself still show (one tick
  on a level the voice says, such as "−70"); keep tick labels short because the left margin
  is narrow.
- A series can be a reference line: two points at the same y, `dashed`, drawn on a cue
  ("Threshold ≈ −55 mV"). Series can also continue each other (the next one starts where
  the previous ended), so each part of a curve draws on its own cue: a rise, a spike, a
  decay. A series label sits above the *end* of its curve; leave a flat stretch after a
  line that ends low so the label does not cover it.
- Steps: `draw` (series that draw themselves from that cue; series never in a `draw`
  are visible from the start), `focus` (highlight series, dim the rest; `[]` clears),
  `mark` (a pin on a series at x with a label, or a vertical guide without `series`),
  `note`, `sfx`. 3–6 steps, one per phrase.

### `figure` — a large illustration with regions (science)
```json
{"type": "figure", "figure": "brain", "title": "Y *dormir*",
 "steps": [
   {"at": "lo nuevo se guarda", "glow": ["hippocampus"], "dim": true},
   {"at": "del hipocampo", "label": {"region": "hippocampus", "text": "Hipocampo: lo nuevo"}},
   {"at": "mientras duermes", "signal": {"from": "hippocampus", "to": "frontal", "label": "recuerdo"}},
   {"at": "pasa a la corteza", "glow": ["frontal", "parietal", "temporal", "occipital"]},
   {"at": "donde dura más", "label": {"region": "frontal", "text": "Corteza: a largo plazo", "tone": "good"}}
 ],
 "narration": "…"}
```
- `figure`: a drawing from the pack. In science: `brain` (regions `frontal`, `parietal`,
  `temporal`, `occipital`, `cerebellum`, `stem`, `hippocampus`), `neuron`, drawn top
  to bottom (regions `dendrites`, `soma` = cell body, `axon`, `myelin` = the sheaths,
  `node` = the gaps between sheaths, `terminals`, `gap` = the synaptic cleft, `next` =
  the next cell's membrane), and `body`, a person seen from the side with the nervous
  system inside (regions `brain`, `cord`, `gate`, `hand`, `elbow`, `arm`, `fast`, `slow`,
  `leg`, `foot`, `pan`; details in `docs/packs/science.md` §4). A figure from another pack
  is an error.
- `props` (scene field): optional objects of the figure switched on for that scene, e.g.
  `"props": ["pan"]` puts a hot pan on a stove under the hand of `body`. A prop the figure
  does not have is an error.
- In science a figure is not only a close-up: it can carry the whole story (the same
  drawing in most scenes, like the board in tech). See `docs/packs/science.md` §2A.
- `neuron` is tall, so its labels sit beside it (left or right of the region, never in
  rows) and a `zoom` is clipped to the content area with soft top and bottom edges. A
  `signal` between two of its regions follows the cell (dendrites → cell body along the
  branches, cell body → terminals down the axon, terminals → next across the cleft); the
  second signal between the same two regions takes another branch ("go" and "brake"). While
  `node` is lit the gaps flash in turn; while `terminals` is lit calcium and
  neurotransmitter dots move; `next` turns its receptors pink.
- Steps: `glow` (the set of lit regions from this cue; `[]` = none), `dim` (true fades
  the unlit regions for focus), `label` (a pill with a leader line pinned to a region,
  ≤ 28 chars; labels stay for the scene, use 1–3), `signal` (a glowing pulse that
  travels from one region to another; the target flashes when it arrives), `zoom` (a
  region, or `null` to zoom out), `note`, `sfx`.
- Use it when *where* or *how parts talk* matters (memory moving from the hippocampus to
  the cortex, a reflex going through the spinal cord). In tech the `board` carries the
  story and a figure is rare; in science the figure carries the story and the board is
  the exception.

### `thumbnail` — the picture people click

The first frame is no longer the thumbnail. Every video gets a designed still in its own look:
`out/<id>/<theme>.thumbnail.png` (1280×720, the YouTube thumbnail) and
`out/<id>/<theme>.cover.png` (1080×1920, the cover of a Short or a TikTok). `make`, `stills`
and `npm run thumbnail -- <spec>` (a few seconds, only the two pictures) write them.
```json
"thumbnail": {
  "text": "Why ticket sales *crash*",
  "kicker": "System design",
  "number": "3.5 billion", "tone": "bad",
  "icons": [{"icon": "users"}, {"icon": "instances", "status": "error"}, {"icon": "db"}]
}
```
- `text`: 2–6 big words, ≤ 48 chars, in the video's language. It is the hook, not the
  title: the curiosity or the problem ("Paid, but *no seat*?", "Your report takes
  *minutes*"). `*emphasis*` gets the accent; a short emphasized phrase never breaks.
- `kicker`: the small tag above (default: the first title's tag).
- `number` (≤ 14 chars) + `tone`: a sticker with the number that makes it real ("504",
  "3.5 billion", "10k/s"). Only numbers the video says.
- The picture: `icons` (1 = one big card, 2 = A → B, 3 = A → B → C; `status` freezes an
  icon's state, `error` = broken) or `figure` (`{"name": "neuron", "glow": ["soma", "axon"]}`).
  Icons and figures must belong to the video's pack.
- `theme` overrides the video's look for the thumbnail only.
- Without the block the engine builds one from the first title (heading, tag, the first and
  last beat icons); write the block for anything you publish.
- Look at both files before delivering: the text must be readable at a small size and must not
  touch the picture.

### `shot` — a documentary shot (theme `film`)
```json
{"type": "shot", "world": "synapse", "title": "Synapse", "scale": "≈ 1 µm", "camera": "push",
 "steps": [
   {"at": "signal changes form", "event": "arrive", "label": {"anchor": "terminal", "text": "Axon terminal"}},
   {"at": "Calcium enters", "event": "calcium", "label": {"anchor": "calcium", "text": "Ca²⁺ in"}},
   {"at": "chemical messengers called", "event": "release"},
   {"at": "For the next neuron", "event": "bind"}
 ],
 "narration": "…"}
```
- `world`: a full-frame place from `src/worlds/` (`network`, `neuron`, `soma`, `membrane`,
  `axon`, `synapse`; all science). It animates by itself.
- Steps: `event` (a named moment of the world: when the cell fires, when calcium enters),
  `label` (`anchor` + `text` ≤ 32, a hairline label; 1–3 per shot), `card` (the title
  card, once), `sfx`.
- `title` (the shot's name, small in the corner), `scale` (its real size), `camera`
  (`push` | `pull` | `drift` | `still`).
- The worlds, their events and anchors, and the writing rules of the film look are in
  `docs/FILM.md`. A film is all shots: never mix shots with diagram scenes.

### News scenes (theme `news`, pack `news`; guide: `docs/packs/news.md`)

The broadcast look: a channel bug (`news.brand` + `news.date`) in the corner, scene titles as
red tabs, a red wipe at each cut, captions on a dark band, and, in 16:9 without captions, a
ticker (`news.ticker`, up to 8 lines). Real pictures come from a top-level `media` library:

```json
"news": {"brand": "NEWS", "date": "13 Oct 2026", "ticker": ["Paris prosecutors open an investigation…"]},
"media": {
  "m1": {"file": "media/<id>/m1-freezer-cabinet", "alt": "A supermarket chest freezer",
         "credit": "Photo: Leon Brooks / Wikimedia Commons", "license": "Public domain",
         "url": "https://commons.wikimedia.org/wiki/File:…", "illustrative": true, "focus": [0.5, 0.45]}
}
```
- `file`: under `public/`, extension optional (`.mp4 .webm .mov .jpg .jpeg .png .webp`).
  Missing → a "material pending" card; `make` lists them. Never a URL.
- `alt` (what it shows), `credit` (always on screen), `license`, `url` (listed in youtube.md).
- `illustrative: true`: not footage of the event (stock, archive): an "Illustrative image" tag.
- `focus`: the point kept in frame when cropping; `start`: seconds into a clip. Clips are muted.

**`headline`** — the opening. `banner` ("Breaking", ≤ 16), `kicker` (the red tab, ≤ 32),
`heading` (≤ 90, `*emphasis*`), `dateline` (≤ 60), `media` (darkened behind), `beats` (as in
`title`). Frame 0 shows everything, like `title`.

**`media`** — full-frame picture or clip with a slow move (`move`: in · out · left · right ·
still), the credit top-right and an optional `lower` third (`{title ≤ 48, sub ≤ 64}`). Steps:
`media` (cut to another item), `lower` (change it, or `"off"`), `sfx`. `title` is only for the
script and chapters.

**`map`** — `view` and optional `from` are boxes `[[west, south], [east, north]]` in degrees;
the camera flies from `from` to `view`. `highlight` lights countries from the start (English
Natural Earth names: "France", "United Kingdom", "Czechia"). Steps: `highlight` (more
countries), `pin` (`{lon, lat, label ≤ 28, sub ≤ 32, tone}`; 1–3 per map), `zoom` (a new box),
`note`, `sfx`.

**`stats`** — 1–6 `items` `{value ≤ 14, label ≤ 40, sub?, tone, icon?, countUp?, at}` as
cards; `footnote` ("Provisional counts as of…").

**`quote`** — 1–2 `quotes` `{text ≤ 170, who, role?, media? (portrait), tag? ("Translated
from French", "Not verified"), at}`.

**`timeline`** — 2–6 `items` `{when ≤ 18, text ≤ 70, tone, at}` on a line (down in 9:16,
across in 16:9); the current one is lit.

**`sources`** — 1–12 `items` `{name ≤ 40, detail ≤ 80}` and `asOf`. Its narration is one line
("Sources are on screen and in the description."); `youtube.md` lists them and every media
credit automatically.

The thumbnail of a news video can put a photo behind the words: `"thumbnail": {"media": "m1", …}`.

### Puzzle scenes (pack `brain`; guide: `docs/packs/brain.md`)

A daily-puzzle Short is built from three scene types. The puzzle is the hook: the first scene
is complete on frame 0.

**`puzzle`** — asks. `title` (the episode, "Mind Reps #014"; reveal and score keep it on
screen), `level` (`easy` · `medium` · `hard` → a badge "Easy · 1 pt"), `question` (≤ 160,
`*emphasis*`), and any of:
- `sequence`: 2–9 tiles (≤ 8 chars each, numbers may be written as numbers); exactly one `"?"`.
- `choices`: 2–4 answers, labelled A–D.
- `claim`: `{who ≤ 40, text ≤ 120, source?}` — an answer for the viewer to judge, drawn as a
  speech bubble. An AI's answer must be a real log: model + date in `who`, the log in `source`
  (the validator refuses it otherwise).

`think` (0–20 s, default 5): **silent** seconds held after the voice with a countdown ring and a
tick per second. `pause: true`: no countdown, a "Pause the video" tag (hard puzzles; `think` 2).
`tomorrow: true`: an "Answer: tomorrow" tag; no reveal in this video.

**`reveal`** — the previous puzzle, solved: the `"?"` tile flips to `answer`, the `correct`
choice (0 = A) turns green, the claim gets a ✓/✕ stamp from `verdict` (`right` · `wrong`); the
answer pops big, then 1–3 `why` lines (Items with `at` cues), then "Got it? +N pts" when the
puzzle had a level. A reveal that opens the next day's video has no puzzle before it: write the
puzzle's `question` (and `sequence`/`choices`/`claim`) in the reveal itself.

Sequences: `ops` on the reveal (one per gap, ≤ 6 chars: `["+4", "+6", "+8"]`) draws arrows with
the step between each pair of tiles once the answer flips in.

**`proof`** — the answer shown, not told: up to 4 horizontal `bars` on one scale
(`{id, label ≤ 28, value, tone, segments?}`; segments `{value, label?, tone?}` must add up to
the bar's value and split it into colored blocks — the bat = 5¢ + 100¢), `prefix` / `suffix`
for every value (`"$"`, `"¢"`, `" min"`), optional `max` (the scale). 1–8 `steps` on cue:
`show` (bars listed in any `show` start hidden and grow in), `set` (`{"ball": 10}`: the bar grows
or shrinks to it), `relabel`, `focus` (light these, dim the rest), `line` (≤ 48: a line of
working typed out beside the bars, `*emphasis*`). A proof with no bars is just the working.
It keeps the episode title of the puzzle before it.

```json
{"type": "proof", "prefix": "$", "bars": [
   {"id": "start", "label": "Start", "value": 100},
   {"id": "up", "label": "Up 50%", "value": 150, "tone": "good"},
   {"id": "down", "label": "Then down 50% of $150", "value": 75, "tone": "bad"}],
 "steps": [{"at": "One hundred", "show": ["start"]},
   {"at": "up half", "show": ["up"], "line": "100 × 1.5 = 150"},
   {"at": "Down half", "show": ["down"], "line": "150 × 0.5 = *75*"}],
 "narration": "One hundred, up half: one fifty. Down half of one fifty: seventy-five."}
```

**`score`** — `cta` (≤ 60, the comment question), `next` (≤ 48, "Mind Reps #015 ·
tomorrow"), and a scorecard of the video's puzzle levels with the total (`card: false` hides it
and shows a trophy).

```json
{"type": "puzzle", "title": "Mind Reps #001", "level": "medium", "question": "What comes *next*?",
 "sequence": ["2", "6", "12", "20", "30", "?"], "think": 5, "narration": "Medium, for two points. Same question."},
{"type": "reveal", "answer": "42", "why": [{"text": "Gaps: +4, +6, +8, +10…", "at": "The gaps grow"}],
 "narration": "Forty-two. The gaps grow by two, so next is plus twelve."}
```

### `publish` and `chapter` — what to paste into YouTube
Every `make` / `preview` also writes `out/<id>/youtube.md`: title options, and a
description ready to copy with the chapters timed from the real voice.

```json
"publish": {
  "titles": ["System Design Interview: Exporting a Report That Takes Minutes", "…", "…"],
  "description": "Opening paragraph: the question and the promise, 1–3 sentences.",
  "learn": ["Why a plain REST API + database is the right first answer", "…"],
  "extra": ["Real-world timeouts (defaults): nginx 60 s, AWS ALB 60 s, Cloudflare 125 s."],
  "comment": "What would you have done differently? Which system should I design next?",
  "hashtags": ["systemdesign", "backend"]
}
```
- `titles`: 1–3, the first is the recommended one. Honest and searchable: the problem
  or the concept the viewer would type ("504", "queue", "system design interview"),
  ≤ 70 characters, no clickbait the video does not pay off.
- `description`: the first lines show above "Show more", so they say what the video
  answers. `learn`: 4–6 bullets. `extra`: facts and deeper notes (from `notes`).
- Put `"chapter": "The queue"` on the scenes where a chapter should start (the hook
  gets one at 0:00). Without any, every scene becomes a chapter. Chapters shorter than
  10 s are merged automatically (YouTube needs ≥ 3 chapters of ≥ 10 s, first at 0:00).

### Icons

Each pack has its own icons, listed with their animated states in its guide
(`docs/packs/<pack>.md`). Every pack also has the common ones: `user` · `users` ·
`mobile` · `file` · `mail` · `search` · `bell` · `chart` · `ai`. Common synonyms are
mapped automatically within the pack (redis → cache in tech, sleep → moon in science).
An icon from another pack is an error that lists the valid ones.

## 5. Checklist before saving

These apply to every video; then go through the checklist in your pack's guide.

- [ ] `pack` is set and the file is in `videos/<pack>/`.
- [ ] A `thumbnail` block: 2–6 big words (the hook), one clear picture, the number if there is one.
- [ ] Frame 0 hooks: tag + the heading the pack asks for; understandable on its own.
- [ ] The hook tells the situation in one sentence and has 3–5 `beats` synced to the voice (never a still opening).
- [ ] The numbers that matter are on screen (a scenario callout or a note), not only in the voice.
- [ ] The narration never announces the format; each turn is a real question.
- [ ] Every component and term says what it is and why it is there, in one clause; the cause is the mechanism.
- [ ] No hype lines ("casi todos fallan", "nadie te dice esto"); the hook is a real question.
- [ ] Review done: every number, default and claim is correct (verified) or softened.
- [ ] Every step a viewer needs is there; nothing is cut just to be shorter; each scene ≤ 40 words.
- [ ] Instructor voice (no simulated dialogue); one analogy or relatable moment that makes it fun.
- [ ] 2–4 meaningful `sfx` cues, never two in the same second.
- [ ] 5–12 `notes` with the nuances, trade-offs, sources and follow-up questions.
- [ ] Every `at` is copied word for word from that scene's narration, in order.
- [ ] Something happens every 2–3 s (a step per sentence or clause).
- [ ] The main story lives on the `board`: ≤ 3 columns (2 rows × 4 for 16:9-only videos), 5–10 nodes, every node has row and col.
- [ ] One `error` peak (plus an optional `callout`), then the fix on the same board.
- [ ] The payoff step zooms out (`camera: []`) to the whole picture.
- [ ] Ends with a `summary` whose `cta` is a question for the comments; long YouTube videos add the short outro, shorts do not.
- [ ] `shape` and `hook` are set (`docs/SHAPES.md`) and `npm run fingerprint -- <spec>` shows at least 2 axes different from the previous video.
- [ ] Every piece added after the first design says what it costs (voice or screen), not only its benefit.
- [ ] Long video: a requirements beat (functional + non-functional with numbers) and a peak-load estimate before the first design (progressive shape).
- [ ] Load, capacity and waiting are *seen* (`crowd`, `meter`, `clock`, `sequence`, `countUp`), not only said.
- [ ] The reviewer pass (`docs/REVIEWER.md`) was run on the draft and on the spec; every "must fix" is fixed or explained.

## 6. Complete examples

Each pack guide lists its examples (`docs/packs/<pack>.md` → "Examples"). The most
complete one today: `videos/tech/async-report-504.json` (progressive build, Spanish,
~5 min) with its approved draft `videos/tech/async-report-504.draft.md` — the template
for any draft — and its English YouTube version `videos/tech/async-report-504-en.json`.
