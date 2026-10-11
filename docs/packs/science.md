# Pack guide: science (the brain, biology, health, learning)

`"pack": "science"` · specs live in `videos/science/`. Read `docs/AUTHORING.md` first
(the rules for every video, and the spec reference); this file adds what is specific to
explaining how something works in the body or the mind: neuroscience, biology,
physiology, psychology of learning, habits, languages, sleep, nutrition science.

The engine is the same: a board that is built as the voice speaks, packets that travel,
statuses that animate, callouts with numbers. What changes is what the boxes mean (an
organ, a process, a habit, a kind of memory, not a server) and how careful the claims
must be.

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

### 2A. From the problem to the mechanism (recommended default)

The progressive idea of every pack, applied to a model instead of a system: first the
simplest model that explains what the viewer lives, then an honest question that adds
the next piece. One board grows with the explanation.

```
title     the viewer's problem in their words + the approach; 3–5 beats draw it
            ("Clases" → "Años" → "Hablar" → "?")
callout   the relatable scenario as a number ("5 años" · "2 clases por semana")
board ×2–3  the simple model: the 2–4 pieces involved, what each does and how they
            connect (said once as a model: "simplificando mucho…")
board     what usually happens (the common habit) played on that model, and why it
            does not produce the result: the mechanism, one `error` at the peak
callout   the turn: "¿entonces qué sí funciona?" / "¿y por qué a algunos sí?"
board ×N  what changes it, one principle per scene: what it is, why it works on the
            model, and the evidence in one clause ("está muy estudiado: se llama…")
compare   (optional) what you do now vs what the evidence supports
summary   the principles as actions + a question ("¿cuál de estas ya haces?")
list      outro (long YouTube videos only)
```

Rules that make it teach:
- **Never announce the format** (same as every pack). Scene titles name the idea ("Dos
  tipos de memoria", "Qué se olvida"), not a step number.
- **Every piece earns its place.** The first time a concept, organ or term appears,
  say what it is and why it matters here in one clause ("el hipocampo, la zona que
  ayuda a guardar recuerdos nuevos").
- **Show how they talk.** Packets are information moving through the model: "palabra
  nueva", "repaso", "señal", "recuerdo". Statuses show what happens: `busy` = working,
  `ok` = it worked, `error` = it failed (a foggy brain, a stuck speech bubble), `warn`
  = struggling.
- **Same board all the way.** The fix happens on the model the viewer already
  understands: add the habit or the process that changes the result, hide what no
  longer applies, recap with `camera: []`.
- **Never imply the common approach is useless.** Say what it is good for and what it
  is not enough for ("estudiar gramática te ayuda a entender; no te entrena para
  hablar rápido"). Name the alternatives: there is rarely one method for everyone.
- Length: 3–6 min for YouTube, 15–22 scenes.

### 2B. The short (one myth or one mechanism, 60–120 s)

```
title     the question or the myth                                        (≈ 7 s)
callout   the number that makes it real                                   (≈ 3 s)
board     the model in 2–3 pieces                                         (≈ 12 s)
board     the mechanism: what actually happens, one error or ok peak      (≈ 14 s)
compare   myth vs what the evidence says (or before vs after)             (≈ 12 s)
summary   1–2 actions + a question                                        (≈ 8 s)
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
- **A model, not anatomy.** The board is a simplified model; say it once. Do not tie a
  function to a brain region unless that link is well established, and never say "esta
  zona se ilumina cuando…" as if it were the whole story.
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

- The `board` as the model of the whole video (organs, processes, habits, kinds of
  memory) with packets for information or signals.
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

Not yet: timelines. Show them with a board or a list until the scene type exists.

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

Common (every pack): `user` (person, student, patient) · `users` · `mobile` · `file`
(notes, paper) · `mail` · `search` · `bell` · `chart` (stats, a graph as an object) ·
`ai` (chatbot, LLM).

Synonyms map automatically within the pack (memory → brain, sleep → moon, practice →
repeat, conversation → chat, language → globe…). Icons from the tech pack are rejected
with a clear error. Need an icon that does not exist? Add it to the pack (README →
"Extending") instead of borrowing a tech one.

## 6. Checklist (science, on top of the common one)

- [ ] The heading is the viewer's real problem or curiosity; no brain clickbait.
- [ ] Every factual claim has its source in `notes`; strength words match the evidence.
- [ ] The model is called a simplification once; no shaky brain-region claims.
- [ ] No myth stated as fact; numbers only from sources, rounded honestly.
- [ ] The common approach is not called useless; alternatives and individual differences are said.
- [ ] Health topics stay educational (no diagnosis, doses or treatments).
- [ ] Analogies are labelled as analogies.

## 7. Examples

- `videos/science/neuron-spark.json` — a vertical Short-style explainer (English, `neon`,
  `surprising-number` hook): `title` with beats → `figure: neuron` (inputs) → `chart`
  (threshold) → `chart` (the spike, all or nothing) → `figure: neuron` (axon and myelin) →
  `callout` with `countUp` → `figure: neuron` (the handoff) → `summary` with a next-topic
  question. Its `neuron-spark.draft.md` shows the script-first format for science (takeaways
  and numbers instead of requirements and a scale estimate).
