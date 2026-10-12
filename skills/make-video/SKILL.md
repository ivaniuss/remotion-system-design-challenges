---
name: make-video
description: Turn an idea, topic or transcript into a ByteByteGo / Fazt Code style animated explainer video (9:16 and 16:9) with the remotion-system-design-challenges project. Topic packs - tech (system design, backend, programming) and science (the brain, biology, health, learning, languages). Use for /make-video or any explainer video request.
---

# /make-video — from an idea to a finished video

The user gives an idea, a topic, notes or a transcript (`$ARGUMENTS`, or the message).
You are the "LLM step": you write the video spec. The project's engine does layout,
animation, timing, captions, voice and rendering. No API key is involved.

Project: `remotion-system-design-challenges` (on the user's Mac it lives at
`~/work/remotion-system-design-challenges`). The rules for every video and the spec
reference are in its `docs/AUTHORING.md`; each topic pack has its own guide in
`docs/packs/<pack>.md`.

## 0. Read the request

Decide, without asking unless it is truly ambiguous:
- **Pack** (by the topic, not the words): `tech` for software, backend, system design
  and programming; `science` for the brain, biology, health, learning, languages and
  habits. The user may say it ("/make-video ciencia: …"). If it fits neither, ask.
- **Language** of narration: **English by default** — the channel's audience is
  English-speaking, even though the user writes to you in Spanish. Narration, on-screen
  text, titles, descriptions and Shorts are all English. Use another language (`es`,
  `pt`) only when the user explicitly asks for that version. Talk to the user in their
  language (Spanish).
- **Format**: the pack's progressive format (§2A of its guide, typically 3–5 min) by
  default; its short format (§2B, 60–120 s) when they ask for a short. Clarity beats
  brevity.
- **Aspect ratios**: both 9:16 and 16:9 unless they ask for one.
- **Shape and hook** (long videos): choose them for the topic, not by habit. Menu in
  `docs/SHAPES.md` — shapes `progressive`, `post-mortem`, `request-journey`, `a-vs-b`,
  `numbers-first`, `code-first`; hooks `interview-question`, `incident`,
  `surprising-number`, `broken-thing`. Run `npm run fingerprint` first: it lists the recent
  videos and what has not been used lately. Shorts pick a *pattern* instead (`classic`,
  `contrast`, `decision`, `timeline`, `code`, `crowd`), different for each Short of a series.
- **Theme**: `light` by default, `dark` when code is central, `neon` for incidents,
  post-mortems and night-mode looks. Vary it when the last video used the same one.

Tell the user in one line what you are about to make (topic, pack, language, length).

**Script first (saves tokens and rounds).** Unless the user says "directo" or is
editing an existing video, do phase A and stop:
- **Phase A — draft.** Read `docs/AUTHORING.md` §2–3, `docs/SHAPES.md` and the pack guide
  (enough to write the script). For science, research and list the sources of every claim
  first. Pick the shape and the hook, run `npm run fingerprint` and name the ≥ 2 axes that
  differ from the previous video. Write `videos/<pack>/<id>.draft.md` from
  `docs/DRAFT-TEMPLATE.md`: the question, the requirements (functional and non-functional,
  with numbers), the scale estimate at the peak, the story map (the question that triggers
  each turn → what changes → **what it costs** → its limit), each scene as
  `title — narration` plus a one-line visual note (which crowd / meter / clock /
  sequence shows the number), the claims to verify, the talking points (with sources for
  science), the thumbnail (big words, picture, number), and the estimated length (words ÷ 3 s).
  A finished example: `videos/tech/async-report-504.draft.md`.
  **Reviewer pass before the user sees it** (`docs/REVIEWER.md`): start a separate agent
  with the role and rubric in that file and give it only the draft, the pack guide,
  `docs/SHAPES.md` and the fingerprint output — not your reasoning. If the platform cannot
  start an agent, re-read the draft cold against the rubric and write every finding before
  fixing anything. Apply the "must fix" items, then show the narration with a three-line
  summary of the review (fixed / left open and why). Iterate on text only.
- **Phase B — build**, after the user approves: steps 1–5 below, using the approved
  narration verbatim.

## 1. Find the project and where you can run commands

Pick the first that applies:

**A. The project is in your working directory** (it, or a parent, contains
`docs/AUTHORING.md` and `scripts/make.ts`): local Claude Code, any other agent, or a
cloud container that already holds the project. Work there directly: `npm install` if
`node_modules` is missing, and every command below runs in place. Voice works where
the network reaches Microsoft's TTS service (`pip install edge-tts` once if
`python3 -c "import edge_tts"` fails; it is optional — without it, `--voice none`).
If rendering stills fails because no Chrome is available and `/opt/pw-browsers`
exists, use its headless shell (see 4B step 4).

**B. Claude app with the user's computer linked** (`mcp__remote-devices__*` tools).
- Find the project: `get_device_info` → connected folders. In `device_bash` they are
  mounted at `$HOME/mnt/<folder-name>` (for `~/work` it is
  `$HOME/mnt/work/remotion-system-design-challenges`; when the project folder itself is
  the connected folder, `$HOME/mnt/remotion-system-design-challenges`). If no connected folder
  contains it, call `device_request_folder_access` for
  `~/work/remotion-system-design-challenges` (or ask the user where it is).
- The computer's shell can read and write the project but **cannot render**
  (no Chrome) and **cannot reach the voice service**. Never `npm install` there (it is a
  Linux VM; the Mac needs its own binaries). So: read/write files there, and
  **validate and make stills in the cloud container** (step 4B).

**C. No project reachable**: say so and ask the user to link their computer or attach
the project. Do not rebuild the engine.

## 2. Learn the format (every time — the guides may have changed)

Read in full: `docs/AUTHORING.md`, `docs/SHAPES.md` and `docs/packs/<pack>.md`
(`docs/REVIEWER.md` when you run the review). Then read the example
spec closest to the request (the pack guide lists them under "Examples"). List
`videos/` (all pack folders) to avoid reusing an existing `id`.

## 3. Write the spec

Follow `docs/AUTHORING.md` and the pack guide exactly. The parts that matter most:

### Every pack
- **Hook on frame 0**: a `title` with a short tag and the heading the pack asks for.
  The voice tells the situation in one sentence, asks the question and says the
  approach. No greetings and no hype lines ("casi todos la responden mal", "nadie te
  dice esto"): they sound machine-written. ≤ 35 words.
  **Never a still opening**: give the title 3–5 `beats` (cards with an icon + 1–3
  words, the last one often "?") whose `at` cues follow the voice, so the problem is
  drawn while it is told.
- **Tell it in the shape you chose** (`docs/SHAPES.md`; set `"shape"` and `"hook"` in the
  spec). The default, `progressive`, is the simplest version that works (a system you
  could ship, a model that explains what the viewer lives), then a real question ("¿y qué
  pasa si…?", "¿entonces por qué…?") with the new number on a `callout`, what breaks
  and why, and the improvement: 2–4 turns, and the summary recaps the path. The other
  shapes (post-mortem, request journey, A vs B, numbers first, code first) have their own
  skeletons; every rule below that is not about the order of the story applies to all.
  Do not default to `progressive` out of habit, and do not copy the previous video's
  scene pattern: `npm run fingerprint -- videos/<pack>/<id>.json` must show ≥ 2 axes
  different from it.
- **Requirements before the first design** (long videos, `progressive`): one `list` scene of
  about 10 s right after the scenario callout — "Before designing: what must it do, and
  how well?" — with 2 functional and 2–3 non-functional requirements, each non-functional
  one with a number (latency, availability, consistency, scale). Then the peak-load
  estimate (peak, not average; reads vs writes) on a `callout` or a note.
- **Every piece says what it costs**, in the voice or on screen, not only in `notes`
  (`docs/SHAPES.md` §3: cache → stale data; queue → no immediate answer; waiting room →
  some fans wait). A design that shows only benefits fails the review.
- **Show it, do not only say it**: load is a `crowd`, capacity a `meter`, a hold or timeout a
  `clock`, waiting and retries a `sequence` scene, a number that should feel big a
  `callout` with `countUp`. Syntax in `docs/AUTHORING.md` ("Visible metrics", `sequence`).
  One or two per turn, only where the voice says the number.
- **Never announce the format**: no "en vivo", "por niveles", "nivel 1", "versión 2"
  in narration, titles or cards. Scene titles name the topic.
- **Every piece earns its place**: the first time a component, concept or term
  appears, say what it is and why it is there in one clause. Show how pieces talk with
  labelled packets.
- **One board for the whole story.** Declare everything once in the top-level `board`
  (5–10 nodes, ≤ 3 columns, every node with `row`/`col`). Break it with `focus` on the
  culprit + one `error` status, fix it on the same picture (`hide` what is obsolete,
  add the new pieces), and recap with `camera: []` (one packet runs the whole path
  while the voice recaps each role). For a horizontal-only YouTube video, lay the board
  out wide (2 rows × up to 4 columns, ignore the 4-column warning) so it fills the
  16:9 frame; render with `--format horizontal`.
- **Use only the pack's icons** (listed in its guide, plus the common ones). Set
  `"pack"` in the spec; the validator rejects icons from another pack.
- **Blame the mechanism, name the alternatives, never imply the simple version always
  fails**: say which variable breaks it and when it is enough.
- **Review every claim**: list each concrete claim (defaults, limits, numbers, study
  findings). Verify it (web search, official docs, sources) or soften it. Never invent
  numbers or benchmarks. **Accuracy over drama**: when a limit is fuzzy, say what makes
  it struggle and put the numbers you can justify in `notes`.
- **Something happens every 2–3 s**: one step per sentence or clause. Give a step a
  new `note` when the idea changes, so an old note does not linger.
- **Clear first**: never skip a step the viewer needs to understand; cut only what does
  not help. ≤ 40–50 words per scene; split a scene rather than cram it.
- **Instructor voice**: one person explaining to the viewer — direct, conversational,
  a bit of energy, second person. Never a role-played dialogue.
- **Fun without losing rigor**: one everyday analogy for the hard idea (labelled as an
  analogy), a relatable moment, a rhetorical question before a reveal, a "¿tú qué
  harías?" pause. At most one light joke.
- **Sound with meaning**: a few `sfx` cues (`clock` for waiting or time passing,
  `riser` on the step where it breaks, `cash` for wasted money/resources, `notify` for
  notifications, `alarm` for outages, `impact` for a scenario card, `success` for a
  payoff). Automatic pops/whooshes/buzz/chime need no markup.
- **Cues**: every `at` is 2–4 words copied verbatim from that same scene's narration,
  in spoken order. Double-check each one.
- **Language**: the Spanish examples in these rules are patterns; write their natural
  equivalent in the video's language.
- **`notes`**: 5–12 talking points that are said, not shown — the why, the
  alternatives and trade-offs, the nuances, the follow-up questions, and (science) the
  source of each claim. They go to `out/<id>/script.md`.
- If the input is a **transcript**: keep its facts and voice; restructure into this
  format; cut filler (move useful asides to `notes`).
- Narration has no symbols, URLs, code or markdown (TTS reads it). `*emphasis*` only
  in on-screen text. Code scenes: ≤ 12 lines, ≤ 44 chars per line.
- End with a `summary` whose `cta` is a question for the comments, asked in the
  narration too. **Shorts**: nothing after it. **Long YouTube videos**: add a short
  outro (≤ 15 s), a `list` "Antes de irte" / "Before you go" (`numbered: false`):
  answer in the comments, pick the next topic (2–3 examples), and a like and subscribe
  "si te sirvió" (icon `bell`). Warm and brief, no begging.
- **Shorts**: for every long video, offer 2–3 Shorts cut from it (one per turn of the
  story, 45–60 s, 5–6 scenes, own hook, ends on a question plus one line "the full
  video is on the channel", no outro, vertical). Use a different pattern for each Short
  of the series (`docs/SHAPES.md` §6), not the same skeleton every time. See
  `docs/AUTHORING.md` → "Shorts from a long video"; examples:
  `videos/tech/report-short-*.json`. If the user asks only for a short, build one the
  same way.
- **YouTube metadata**: add `publish` (2–3 honest, searchable `titles`, the first
  recommended; an opening `description`; 4–6 `learn` bullets; `extra` facts from the
  notes; the `comment` question; 2–4 `hashtags`) and a `chapter` on the scenes that
  start a section. `make`/`preview` then write `out/<id>/youtube.md` with the
  description and the chapters timed from the real voice, ready to paste.
- **Thumbnail**: add a `thumbnail` block to every video and every Short (`docs/AUTHORING.md`
  → "thumbnail"): 2–6 big words that are the hook (not the title), the icons or the figure
  that tell the story at a glance (A → B), and the sticker with the number. `stills`, `make`
  and `npm run thumbnail` write `out/<id>/<theme>.thumbnail.png` (1280×720) and
  `out/<id>/<theme>.cover.png` (1080×1920). Look at both before delivering.

### Tech pack (`docs/packs/tech.md`)
- **The hook is a real question about the system.** In the `progressive` shape it is an open
  interview question ("Diseña la exportación del *reporte anual de ventas*", not
  "diseña el botón…"), with the approach in natural words ("como en un proyecto real:
  primero algo simple que funcione, y lo mejoramos cuando haga falta"). Other shapes pair
  with an `incident`, a `surprising-number` or a `broken-thing` hook (`docs/SHAPES.md` §5);
  all of them end in a question, never in hype.
- **Every version works and could ship**: say "¿hace falta algo más? no" while its
  scenario holds. Start from the real minimum: frontend + backend (its API REST) +
  database. No proxy, load balancer, cache or queue until the story forces it;
  infrastructure that exists anyway (hosting, Cloudflare, nginx) appears at the failure
  as "lo que tu diagrama no muestra".
- **Backend vs API**: label the server box "Backend" with sub "API REST", and say it
  once: the backend is everything on your server; the API is its door. When a worker
  appears: "tu backend queda en dos partes: la API… y el worker…" (sub "también
  backend").
- **Think like an architect** (`docs/packs/tech.md` §3B): estimate the peak numbers;
  name stateless vs stateful; treat reads (cacheable, can lag) and writes (one source of
  truth) separately; cover the failure modes the story touches (retries, double clicks,
  crashes, timeouts) and abuse (bots, rate limits). **A high-traffic turn first shows the
  standard scaling step** (load balancer + copies of the backend, CDN/cache, replicas),
  then where the bottleneck moved ("servers scale, seats don't"), then the specialized
  fix. When an obvious component is missing, say why in one clause. Depth beats brevity
  in the long video: the Shorts are cut from it.
- **Think like an interviewer**: blame the mechanism, not the box ("un proxy no espera
  para siempre"); say why the obvious patch is not enough ("¿y subir el timeout?");
  name the real alternatives (polling, SSE o WebSocket). In the short format add the
  decision beat (a `flow` "¿Cuándo sí sirve lo simple?"); back-of-the-envelope math
  (Little's law) on screen or in `notes`. Teach the reasoning as advice ("en una
  entrevista, lo primero es preguntar…").

### Science pack (`docs/packs/science.md`)
- **The hook is the viewer's real problem or curiosity** ("Llevas años estudiando un
  idioma y no lo hablas"), never brain clickbait ("tu cerebro te engaña", "hackea tu
  cerebro").
- **Told with illustrations, not boxes**: science looks like the neuron film, not like a
  software diagram. The same `figure` carries the story (`body` for reflexes, pain, touch
  and movement; `neuron` for one cell; `brain` for which part does what): regions glow, get
  labels, pass signals along the real nerves, zoom. `chart` scenes for anything over time or
  "how much" (`schematic: true` unless the numbers have a source), `callout` for the number.
  The `board` only for a model with no drawing (kinds of memory, a habit loop);
  `npm run validate` warns when a science video is mostly boards. A missing drawing is drawn
  once as a new figure and reused. Say once that the drawing is simplified; no shaky "this
  region lights up" claims.
- **An everyday anchor**, like the ticket sale in tech: tell the mechanism through something
  every viewer has lived (a hot pan, a stubbed toe, coffee at night), not through anatomy
  first. Example draft: `videos/science/hot-pan.draft.md`.
- **Sources for every claim**, in `notes`; strength words match the evidence ("está
  muy estudiado" vs "algunos estudios sugieren"); numbers only from sources, rounded
  honestly. Never state a myth as fact (the guide lists them: 10 % of the brain,
  learning styles, "dopamine = pleasure", "adults cannot learn languages"…).
- **Never call the common approach useless**: what it is good for, what it is not
  enough for, and the alternatives; results vary between people.
- **Health topics stay educational**: no diagnosis, doses or treatments; "si te afecta,
  habla con un profesional".

Save it as `videos/<pack>/<id>.json` in the project (2-space JSON) with `"pack"` set.
Never overwrite an existing spec unless the user asked to edit that video.

## 4. Validate, inspect (no full render by default)

The default loop is **review, not render**: you check the look with stills (≈ 1–2 min);
the user reviews it in Remotion Studio (`npm run preview`) and asks for changes.
Render the MP4s only when the user asks for them ("render", "listo", "ya está").

### 4A. Local (case A)
```bash
npm run validate -- videos/<pack>/<id>.json     # fix every ✖ and every ⚠ cue warning
npm run fingerprint -- videos/<pack>/<id>.json  # ≥ 2 of 5 axes differ from the previous video
npm run stills -- videos/<pack>/<id>.json       # out/<id>/<theme>.vertical.sheet.png + horizontal + thumbnail
```
Then open the Studio for the user: `npm run preview -- videos/<pack>/<id>.json`
(timeline with voice + script). After later edits: add `--no-studio`.
Final render, when asked: `npm run make -- videos/<pack>/<id>.json --format both`.

### 4B. Claude app (case B): validate and inspect in the cloud container
1. Copy the project into the container. With `device_bash`, list the files to bring:
   ```bash
   cd $HOME/mnt/<folder>/remotion-system-design-challenges && \
   find . -type f -not -path './node_modules/*' -not -path './out/*' \
     -not -path './public/generated/*' -not -path './.git/*' | sed 's|^\./||'
   ```
   Stage them with `device_stage_files` (absolute device paths, at most 50 per call).
   They land under `/mnt/user-data/uploads/…`; copy them to a writable working
   directory in the container (e.g. your scratchpad), keeping the folder structure.
2. In that copy: `npm install` (a few minutes the first time).
3. `npx tsx scripts/validate.ts videos/<pack>/<id>.json` → fix the spec until clean, then
   `npx tsx scripts/fingerprint.ts videos/<pack>/<id>.json` (the container copy has the
   same file dates for every spec, so pass `--last <id>` to name the previous video).
4. Stills with the preinstalled headless Chromium (use `headless_shell`, not `chrome`):
   ```bash
   export REMOTION_BROWSER_EXECUTABLE=$(find /opt/pw-browsers -type f -name headless_shell | head -1)
   npx tsx scripts/make.ts videos/<pack>/<id>.json --voice none --no-render   # timeline + script.md
   npx tsx scripts/stills.ts videos/<pack>/<id>.json     # add --format horizontal for YouTube-only
   ```
   Look at the sheets and the thumbnail (step "Inspect" below) and fix the spec until they are right.
5. Write the final `videos/<pack>/<id>.json` to the computer (in `device_bash`, or
   `device_commit_files` from `/mnt/user-data/outputs/…`), plus `out/<id>/script.md`
   and the thumbnail PNGs.
   The user previews on their Mac with `npm run preview -- videos/<pack>/<id>.json`
   (with voice, because their Mac can reach the voice service).
   **Before writing back, check the computer has not changed since you copied it**: other
   sessions and the user edit the project too. Compare hashes (`shasum -a 256` there,
   `sha256sum` here) or list files newer than your copy (`find . -newer <file>`); for every
   file that changed there, start from their version and re-apply your edits, never
   overwrite it with your older copy.
   Stage every copy from a **new** folder (`/mnt/user-data/outputs/v<N>/…`): a reused
   staging path can deliver an old version. After committing, compare `shasum -a 256`
   on the device with the container's `sha256sum` for every text file. Binary files
   (PNG, WAV) can change bytes in transit; check they still decode (`ffmpeg -v error
   -i file -f null -`), and regenerate sounds on the device with `scripts/make-sfx.sh`.
6. Full render only when asked: `npx tsx scripts/make.ts videos/<pack>/<id>.json --voice none
   --format both` (silent: the voice service is not reachable from the cloud; ~4 min
   per format per 100 s of video, run it with `nohup … &` and poll), then commit the
   MP4s to `out/`. A voiced render is one command on their Mac:
   `npm run make -- videos/<pack>/<id>.json --format both` (`--format horizontal` for a
   YouTube-only video: there is no spec field for it, the format is always chosen on the
   command line).

### Inspect (both cases)
Look at `out/<id>/<theme>.vertical.sheet.png` and `out/<id>/<theme>.horizontal.sheet.png` (one frame
every 3 s). Look for: text that overflows or is cut, a board that is too small in the
final overview (too many rows/cols), packets or notes covering labels, notes that
linger after the idea changed, a still opening (the title beats must appear with the
voice), long stretches where nothing moves, empty scenes, wrong language, a number that
is only spoken (should it be a `crowd`, `meter`, `clock` or `countUp`?), crowds or clock
rings covering a label. Also look at `<theme>.thumbnail.png` and `<theme>.cover.png`: the
big words readable at a small size, nothing touching the picture. Fix the spec and run
`stills` again. `npm run check` also flags diagrams that had to shrink a lot.

**Second reviewer pass, on the spec** (`docs/REVIEWER.md`): give a separate agent the spec,
`out/<id>/script.md`, the pack guide and the fingerprint output. It checks what the draft
could not — what is on screen and when, the sheets, the variety — and returns the report.
Fix its "must fix" items before delivering.

## 5. Deliver

- Send the contact sheets, the thumbnail and cover (`out/<id>/<theme>.thumbnail.png`,
  `<theme>.cover.png`), `out/<id>/script.md` and `out/<id>/youtube.md` to the user
  (in the app: `SendUserFile`), and the MP4s only if you rendered them.
- One short message: the topic and estimated length, the shape and hook you chose (and how
  it differs from the previous video), the scene list in one line, the claims you verified
  (with sources for science), the reviewer's verdict in one line, and the one command to review it:
  `npm run preview -- videos/<pack>/<id>.json` (first time: `npm install`; `pip install
  edge-tts` is optional, for the voice). In the Studio both compositions are there:
  "Vertical" (9:16) and "Horizontal" (16:9). Ask what to change.
- Iterate on their feedback by editing the spec ("/make-video edit <id>: …"); they
  refresh with `npm run preview -- videos/<pack>/<id>.json --no-studio`.
- When they approve: `npm run make -- videos/<pack>/<id>.json --format both` on their
  Mac (with voice), or render it yourself if they ask (silent in the cloud). For their
  own recording: `--audio voice.mp3 --words voice.json` (see the README).
