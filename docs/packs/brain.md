# Pack `brain` — Daily Brain (daily puzzles)

One challenge a day, as a Short: logic, numbers, perception, critical thinking, "spot the
mistake" and the cognitive biases behind a wrong first answer. The goal is not to keep people
watching; it is a game they enjoy, answer in the comments and come back to tomorrow.

Specs live in `videos/brain/`, are numbered (`brain-014-<slug>`, title "Daily Brain #014: …")
and use `"pack": "brain"`, `"shape": "daily-puzzle"`, `"hook": "challenge"`. Skill:
`skills/make-brain/SKILL.md` (`/make-brain`). Scene reference: `docs/AUTHORING.md` → "Puzzle
scenes".

## 1. Rules that are not negotiable

1. **Every answer is checked by a person before it is published.** Write in `notes` how you
   checked it (the arithmetic, the rule) and that a second solver — a person or a *different*
   model from the one that wrote the puzzle — got the same answer without seeing it.
2. **One answer only.** If a reasonable viewer can defend another answer, change the puzzle
   (add a term to the sequence, reword the question). Sequences: at least 4 given terms, and
   say in `notes` why other simple rules do not fit. A puzzle with two answers turns the
   comments into an argument and costs trust.
3. **Never write an AI's answer yourself.** "Beat the AI" / "Spot the AI's mistake" uses a real,
   logged output: the model and date in `claim.who` ("ChatGPT (GPT-5), 12 Oct 2026"), where
   the log or screenshot is kept in `claim.source`. The validator refuses an AI claim without a
   source. If the model no longer gets it wrong, drop the puzzle. Otherwise label the claim
   honestly ("A common answer", "Most people's first guess" only with a source).
4. **No brain-training promises.** Never say puzzles "make you smarter", "boost your IQ" or
   "prevent memory loss": the evidence for far transfer is weak (Simons et al., *Psychological
   Science in the Public Interest*, 2016) and the FTC fined Lumosity in 2016 for such claims.
   Say what the puzzle shows ("your fast answer skipped the check"), not what it does to you.
5. **Adults, not kids.** Do not mark videos "made for kids": it turns comments off, and comments
   are the game.
6. **Not a template farm.** YouTube demonetises mass-produced, repetitive content (the
   "inauthentic content" policy, July 2025). Rotate formats and themes (each format has its own
   look, below), write each explanation by hand, and never publish a batch of near-identical
   puzzles. `npm run fingerprint` reports the format of the last Shorts.

## 2. The formats

Each format has its own theme so the channel never looks like one template repeated.

| Format | Theme | Scenes | Length |
| --- | --- | --- | --- |
| **3 levels** (`levels`) | `light` | puzzle easy · reveal · puzzle medium · reveal · puzzle hard (`pause`) · reveal · score | 35–45 s |
| **Spot the mistake** (`spot-the-mistake`) | `dark` | puzzle with a `claim` · reveal with `verdict` · score (`card: false`) | 25–35 s |
| **Answer fast** (`choices`) — a bias or a trick question | `neon` | puzzle with `choices` · reveal with `correct` · score (`card: false`) | 25–35 s |
| **Answer tomorrow** (`teaser`) | any | puzzle with `"tomorrow": true` · score; the next video opens with its `reveal` | 15–20 s |

Examples: `videos/brain/brain-001-levels.json`, `brain-002-spot-the-mistake.json`,
`brain-003-fast-answer.json`.

**Answer tomorrow** is the most direct test of the daily habit: the reveal is in the next
episode, so a viewer who wants it has to come back. The next video's first scene is a `reveal`
with yesterday's `question` (and `sequence`/`choices`) written in it, then today's puzzle.

## 3. Timing: the think hold

- A `puzzle` scene holds `think` **silent** seconds after its voice, with a countdown ring (a
  soft tick each second, red in the last 3).
- Easy: 3–5 s. Medium: 5–8 s. Hard: **no countdown** — `"pause": true`, `"think": 2`: a
  "Pause the video" tag; the viewer stops the video. A countdown longer than ~10 s loses people
  on a Short.
- The puzzle is the hook: the first scene is the puzzle itself, complete on frame 0 (no intro,
  no "welcome back"). Its first line names the challenge ("Three puzzles, up to six points.
  Easy one first: what comes next?").
- With your own recorded voice, leave the pause in the recording: the countdown uses whatever
  silence is there (never more than `think`).

## 4. Writing

- **Question on screen = what the voice asks**, shorter if needed. Numbers in tiles, money and
  units with symbols ("$1.10", "10¢").
- **Reveal**: the answer first ("Forty-two."), then 1–3 `why` lines on cue. The why is the
  value of the video: the rule, the trap, the bias by name.
- **Score / CTA**: one question that asks for a comment ("What's your score out of 6?", "Did
  your brain say 10¢ first?") and `next` with the next episode ("Daily Brain #002 · tomorrow").
- Levels and points: easy 1, medium 2, hard 3. The scorecard of the `score` scene adds them up
  from the video's puzzles.
- Sources for any fact (a named test, a bias, a statistic) go in `notes`.

## 5. Icons

`puzzle` (states: thinking, solved, wrong), `stopwatch` (running, done), `trophy` (shine), plus
the common icons (`user`, `users`, `ai`, `chart`…) and four borrowed from science: `brain`,
`eye`, `idea`, `target`. Used by the thumbnail and by the odd `title`/`callout`; the puzzle
scenes draw themselves.

## 6. Checklist before showing the user

- [ ] Answer checked by hand and by a second solver; how, in `notes`.
- [ ] Only one defensible answer; for sequences, ≥ 4 terms.
- [ ] Any AI claim is a real log with `source`; otherwise the claim is labelled honestly.
- [ ] No "smarter / IQ / prevents" claims.
- [ ] First scene is the puzzle, readable on frame 0.
- [ ] `npm run validate` clean; `npm run stills` sheets looked at (both formats).
- [ ] `publish.comment` is the question; `thumbnail` set (2–6 words, the number sticker).

## 7. The 30-day experiment: calendar and tuning

**Weekly rotation** (so every format gets a fair number of episodes to compare on day 30):

| Day | Format |
| --- | --- |
| Monday | 3 levels |
| Tuesday | Spot the mistake |
| Wednesday | Answer fast |
| Thursday | Answer tomorrow (no reveal) |
| Friday | Opens with Thursday's reveal, then a 3-levels puzzle |
| Saturday | Spot the mistake |
| Sunday | Hard puzzle of the week (`pause`) |

**The timings and the comment ask are starting hypotheses, not measured best practice.** No
reliable public data says how long a puzzle Short should hold or where to ask for comments.
The defaults: the puzzle is on screen while the voice reads it (3–4 s) and then holds `think`
seconds (easy 3, medium 5, hard `pause`); the comment question comes in the final `score`
scene and in `publish.comment` (pin it). After two weeks, check in YouTube Studio:

- **Retention curve**: a drop at the countdown or right at the reveal of the easy puzzle →
  raise `think` to 4–5 s.
- **Comments per 1,000 views** low → add a "Comment your answer ↓" tag during the countdown
  (asking before the reveal, when viewers most want to commit to an answer).
- **Comments like "too fast"** → same as the first point.
- **3 levels too long** (drop between the second and third puzzle) → alternate weeks of 3
  puzzles (~40 s) and 1 puzzle (~20 s).

## 8. Long videos (later)

Monthly compilations in 16:9 ("Daily Brain: October collection", 20–30 min): the same specs
re-rendered horizontally (the engine does both formats), longer think holds (10–20 s), a running
score, chapters by level, and 3–5 new bonus puzzles at the end so it is not a re-upload. A
`compile` command that joins N specs into one is the next engine step.
