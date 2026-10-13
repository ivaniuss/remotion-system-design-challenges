# Pack guide: science (the brain, biology, health, learning)

`"pack": "science"` · specs live in `videos/science/`. Read `docs/AUTHORING.md` first
(the rules for every video, and the spec reference); this file adds what is specific to
explaining how something works in the body or the mind: neuroscience, biology,
physiology, psychology of learning, habits, languages, sleep, nutrition science.

The engine is the same as tech, but **science is told with illustrations, not with boxes**.
The look is the one of the short film "chispa" and `neuron-spark`: a drawing of the real
thing (a body, a neuron, a brain) whose parts light up, get labels and pass glowing signals
as the voice speaks, plus curves (`chart`) that draw themselves and big numbers
(`callout`). The `board` (cards, arrows, packets) is the tech workhorse; in science it is
only for a model that has no drawing (kinds of memory, a habit loop), and never the main
picture of a video about the body. `npm run validate` warns when a science video is mostly
`board` scenes.

**Anchor it in everyday life**, like the ticket sale in tech: start from something every
viewer has lived (touching a hot pan, stubbing a toe, coffee at night, forgetting what you
studied) and explain the mechanism through it.

## 1. Hook and voice

- **The hook is the viewer's real problem or curiosity, in their words.** The `title`
  has a short tag ("Ciencia del aprendizaje", "Tu cerebro", "Biología") and a heading
  the viewer recognizes: "Llevas años estudiando un idioma y no lo hablas", "¿Por qué
  olvidas lo que estudiaste ayer?", "¿Qué hace tu cuerpo mientras duermes?". The voice
  says the situation in one sentence, asks the question, and says the approach ("vamos
  a ver qué pasa en tu memoria, y qué cambia el resultado").
- **No clickbait about the brain.** Never "tu cerebro te está engañando", "el truco que
  los científicos no quieren que sepas", "hackea tu cerebro". They cost trust and are
  usually false.
- **Blame the mechanism, never the person.** "No es falta de talento: es cómo
  practicas" — only when the evidence supports it, and without promising that one
  change fixes everything.
- **Instructor voice.** One person explaining to the viewer, warm and clear, second
  person, like a good science teacher or a Kurzgesagt narration: no lecture tone, no
  role-play.

## 2. The formats

The story shapes in `docs/SHAPES.md` apply here too where they fit: `a-vs-b` (two explanations
or two methods), `numbers-first` (a quantity the viewer can feel). `post-mortem`,
`request-journey` and `code-first` are tech shapes. Set `"hook"` and run
`npm run fingerprint` as for any video; the science hook is still the viewer's real
problem or curiosity, never brain clickbait. The visible-metrics toolkit (`meter`, `clock`,
`countUp`) suits "how long a memory lasts" or "how much sleep"; label invented values as
examples and keep real numbers only where a source supports them.

### 2A. From the everyday moment to the mechanism (recommended default)

The progressive idea of every pack, applied to the body or the mind: first the obvious
explanation of what the viewer lives, then an honest question that adds the next piece.
The same **figure** carries the whole story (like the board does in tech): each turn lights
other parts of the drawing, sends a signal along another path, or zooms in.

```
title     the everyday moment in the viewer's words + the approach; 3–5 beats draw it
            ("Hot pan" → "Hand jumps" → "Burn later" → "?")
callout   the number that makes it real ("43 °C", "86 billion"), no boxes
figure ×2–3  the obvious explanation on the drawing: what lights up, where the signal
            goes, said once as a simplified model
figure    why the obvious explanation is not enough (a note says the limit)
callout   the turn: "but there's a second mystery…", "why does rubbing help?"
figure ×N / chart  each new piece: a part of the drawing lights up, a signal takes a new
            path, a zoom shows the detail; a chart when the point is *time* or *how much*
            (two pains over a second, a forgetting curve, a voltage)
summary   the pieces as plain takeaways + a question
list      outro (long YouTube videos only)
```
The figure to use: `body` (reflexes, pain, touch, movement, anything from the skin or a
muscle to the brain), `neuron` (one cell: inputs, spike, myelin, synapse), `brain` (which
part does what, memory, sleep). Need a drawing that does not exist (an eye, the heart, a
gut)? Draw it once as a new figure (`src/figures/`): it stays for every later video.
Example: `videos/science/hot-pan.json`.

Rules that make it teach:
- **Never announce the format** (same as every pack). Scene titles name the idea ("Dos
  tipos de memoria", "Qué se olvida"), not a step number.
- **Every piece earns its place.** The first time a concept, organ or term appears,
  say what it is and why it matters here in one clause ("el hipocampo, la zona que
  ayuda a guardar recuerdos nuevos").
- **Show how they talk.** Signals travel along the drawing (`signal`, with a 1–2 word
  label: "heat!", "pull!", "sting"); parts light up (`glow`) when they act; `dim` keeps the
  eye on what matters; `zoom` for the detail (the gate in the spinal cord, the myelin).
- **Same drawing all the way.** The fix happens on the picture the viewer already
  understands; the recap plays the whole path on it once more.
- **Never imply the common approach is useless.** Say what it is good for and what it
  is not enough for ("estudiar gramática te ayuda a entender; no te entrena para
  hablar rápido"). Name the alternatives: there is rarely one method for everyone.
- Length: 3–6 min for YouTube, 15–22 scenes.

### 2B. The short (one myth or one mechanism, 60–120 s)

```
title     the question or the myth                                        (≈ 7 s)
callout   the number that makes it real                                   (≈ 3 s)
figure    the drawing: what is involved, lit as the voice names it        (≈ 12 s)
figure    the mechanism: the signal's path, the zoom on the detail        (≈ 14 s)
chart / compare  the curve over time, or myth vs what the evidence says   (≈ 12 s)
summary   1–2 takeaways + a question                                      (≈ 8 s)
```

## 3. Accuracy (stricter than tech)

Science content is where a confident simplification becomes misinformation. These rules
come before every retention rule.

- **Every claim has a source.** Before writing the draft, list each factual claim and
  find where it comes from (a review, a meta-analysis, a textbook, a university or
  health-agency page). Put the source in `notes` next to the point ("Cepeda et al.
  2006, meta-análisis sobre el efecto del espaciado: …"). No source, no claim.
- **Say how sure science is.** Strong, replicated findings: "está muy estudiado",
  "decenas de estudios lo muestran". Preliminary or debated: "algunos estudios
  sugieren", "todavía se discute". Never a vague "la ciencia dice".
- **A simplified drawing, said once.** The figures are simplified (one fiber of each kind,
  one relay neuron); say it once. Do not tie a function to a brain region unless that link
  is well established, and never say "esta zona se ilumina cuando…" as if it were the whole
  story.
- **Numbers only from sources.** Prefer rounded, honest ranges ("en pocos días olvidas
  buena parte") over invented precision ("olvidas el 70 % en 24 horas") unless the
  source says exactly that, for that kind of material.
- **Myths never stated as fact** (you may debunk them, with a source): we use only 10 %
  of the brain; left-brained vs right-brained people; learning styles (visual /
  auditory / kinesthetic) improve learning when matched; dopamine is "the pleasure
  molecule"; adults cannot learn languages / you must learn "like a child"; brain
  training games make you smarter in general; the Mozart effect; "21 days to form a
  habit" as a rule.
- **Analogies are labelled as analogies** ("es como…"), and never carry a claim the
  evidence does not.
- **Health topics: educational, never clinical.** No diagnosis, no doses, no
  supplements or treatments recommended; when it matters, "si te afecta, habla con un
  profesional".
- **Individual differences.** Say when results vary between people; never promise a
  result or a timeline.

## 4. What the visuals can show

- `figure: body` — a person seen from the side with the nervous system inside: `brain`,
  spinal `cord`, the `gate` (the relay neurons where the arm nerves enter the cord), the
  `hand` (skin sensors; it turns red-hot when lit), the `elbow` (skin: touch, a bump), the
  biceps (`arm`, it flexes when lit), the `fast` fiber (with myelin beads) and the `slow`
  one, the `leg` nerve and the `foot` (a stubbed toe glows), and the prop `pan` (a hot pan on
  a stove under the hand, switched on per scene with `"props": ["pan"]`). Signals follow the
  real nerves: hand → cord / brain (the second signal between the same two regions takes the
  slow fiber), cord or gate → arm (the motor nerve), brain ↔ gate, elbow → gate, foot → cord
  / brain. Use it for reflexes, pain, touch, movement and reaction times.
- `figure` for a close-up on a real illustration: the `brain` (lobes, cerebellum, stem,
  hippocampus) whose regions light up, get labels and pass signals, with zoom. Use it
  only for claims that are well established (e.g. the hippocampus helps form new
  memories; during sleep memories are reactivated and consolidated in the cortex — the
  leading model, Rasch & Born 2013). Never light a region to suggest "this is where X
  happens" without a source.
- `figure: neuron` for one cell, drawn top to bottom: dendrites, cell body (`soma`), axon,
  myelin sheaths with their gaps (`node`), terminals, the synaptic cleft (`gap`) and the
  next cell (`next`). Use it for the mechanism of a single signal's trip (inputs → sum →
  spike → axon → handoff). Say once that it is a simplified neuron; textbook numbers
  (rest ≈ −70 mV, threshold ≈ −55 mV, up to ≈ 120 m/s, cleft ≈ 20 nm) go on screen as
  "typical" and the sources in `notes`. The spike's peak is deliberately left without a
  number: sources differ.
- `chart` for curves over time (forgetting vs spaced review, progress over months), and for
  a neuron's voltage (a dashed threshold line, a spike drawn on its own cue).
  `schematic: true` unless the numbers come from a source.
- `callout` for the number that makes it real; `compare` for myth vs evidence or before
  vs after; `list` and `summary`.
- `board` only for a model that has no drawing (kinds of memory, a habit loop, the steps of
  a method), and not as the main picture of a video about the body.

Not yet: timelines. Show them with a chart, a list or a `sequence` until the scene type exists.

## 5. Icons (science + common)

Science, with the animated state each `status` gives:

| Icon | Means | busy | ok | error | warn |
| --- | --- | --- | --- | --- | --- |
| `brain` | mind, memory, cortex | zones light up in turn | all lit, glow | foggy | tired (z) |
| `neuron` | nerve, synapse, signal | impulse travels the axon | | blocked ✕ | |
| `ear` | listening, hearing, podcast | sound waves pulse | | noise | noise |
| `eye` | seeing, watching, reading | looks around | | closed | |
| `speech` | speaking, producing | voice bars | | stuck "…" | stuck |
| `chat` | conversation, practice with someone | turns of typing dots | | | |
| `book` | studying, reading, grammar, class | pages turn | | | |
| `calendar` | days, weeks, years | days crossed out | all crossed out | | |
| `clock` | time, hours of practice | hands run | | | |
| `repeat` | practice, review, habit, spaced repetition | spins | check | | |
| `moon` | sleep, rest | floating z's | | | |
| `idea` | understanding, insight | flickers on | on | off | |
| `target` | goal | arrow flies in | hit | miss | |
| `dna` | genes, genetics | helix turns | | | |
| `cell` | cell, organism | divides | | | |
| `heart` | heart, blood, emotion | beats | | grey | |
| `flask` | experiment, research, evidence | bubbles | | | |
| `globe` | world, languages, countries | spins | | | |
| `hand` | skin, touch, the senses in the skin | sensors pulse | | burned (jerks back, red) | |
| `flame` | heat, fire, a hot pan or stove | flickers (always) | | | |
| `spine` | spinal cord, reflexes, nerves to the body | a signal runs down the cord | | | |
| `muscle` | muscles, an arm, movement | flexes | flexed | | |

Common (every pack): `user` (person, student, patient) · `users` · `mobile` · `file`
(notes, paper) · `mail` · `search` · `bell` · `chart` (stats, a graph as an object) ·
`ai` (chatbot, LLM).

Synonyms map automatically within the pack (memory → brain, sleep → moon, practice →
repeat, conversation → chat, language → globe…). Icons from the tech pack are rejected
with a clear error. Need an icon that does not exist? Add it to the pack (README →
"Extending") instead of borrowing a tech one.

## 6. Checklist (science, on top of the common one)

- [ ] The heading is the viewer's real problem or curiosity; no brain clickbait.
- [ ] It looks like science: figures and charts carry the story (the `board` only for a model with no drawing); `validate` shows no "mostly board" warning.
- [ ] It starts from an everyday moment the viewer has lived.
- [ ] Every factual claim has its source in `notes`; strength words match the evidence.
- [ ] The model is called a simplification once; no shaky brain-region claims.
- [ ] No myth stated as fact; numbers only from sources, rounded honestly.
- [ ] The common approach is not called useless; alternatives and individual differences are said.
- [ ] Health topics stay educational (no diagnosis, doses or treatments).
- [ ] Analogies are labelled as analogies.

## 7. Examples

- `videos/science/hot-pan.json` — **the reference for a long science video** (English, `dark`,
  `progressive` + `incident`): "Who pulled your hand off the hot pan?" An everyday moment,
  told on the `body` figure (the obvious model → the reflex in the spinal cord → the two
  fibers → the gate that rubbing closes → the brain's control), with two `chart` scenes for
  the two pains over time. Its Shorts, one per turn and each with a different pattern:
  `hot-pan-short-1-reflex` (classic, `body`), `hot-pan-short-2-two-pains` (the leg and foot of
  `body` + the chart) and `hot-pan-short-3-rub-it` (contrast: `compare` + `body`).
- `videos/science/neuron-spark.json` — a vertical Short-style explainer (English, `neon`,
  `surprising-number` hook): `title` with beats → `figure: neuron` (inputs) → `chart`
  (threshold) → `chart` (the spike, all or nothing) → `figure: neuron` (axon and myelin) →
  `callout` with `countUp` → `figure: neuron` (the handoff) → `summary` with a next-topic
  question. Its `neuron-spark.draft.md` shows the script-first format for science (takeaways
  and numbers instead of requirements and a scale estimate).
