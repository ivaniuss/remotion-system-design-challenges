# Pack `brain` — Mind Reps (daily puzzles)

One challenge a day, as a Short: logic, numbers, perception, critical thinking, "spot the
mistake" and the cognitive biases behind a wrong first answer. The goal is not to keep people
watching; it is a game they enjoy, answer in the comments and come back to tomorrow.

The channel and the on-screen series are **Mind Reps** ("Mind Reps #014"; the pack, folder and
skill keep the working name `brain` / Daily Brain). Specs live in `videos/brain/`, are numbered (`brain-014-<slug>`, title "Mind Reps #014: …")
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

## 2. The game and the formats

**Every regular episode is the same game: three rounds, easy → medium → hard, worth 1 + 2 + 3
= 6 points.** One question is a quiz; three rising rounds with points are a game: a goal ("get
6/6"), a new open question at each round that keeps people watching, and a score to compare
in the comments and from one day to the next. The format is the kind of challenge in the
rounds, and each has its own theme so the channel never looks like one template repeated.

| Format | Theme | Rounds | Length |
| --- | --- | --- | --- |
| **3 levels** (`levels`) | `light` | three sequences; each reveal draws the step between tiles (`ops`: +4, ×2…) | 40–50 s |
| **Spot the mistake** (`spot-the-mistake`) | `dark` | three claims to judge, **at least one right**; `proof` after medium and hard | 50–60 s |
| **Answer fast** (`choices`) | `neon` | three trick questions with 3 choices, timers of 3–5 s; `proof` after medium and hard | 50–60 s |
| **Answer tomorrow** (`teaser`) | `dark` | one hard question, no reveal; the next episode opens with its answer | 15–25 s |
| **Hard puzzle of the week** | `neon` | one hard puzzle with `pause`, worked out in a `proof` | 30–40 s |

Examples: `videos/brain/brain-001-levels.json` (published before `ops` existed),
`brain-002-spot-the-mistake.json`, `brain-003-fast-answer.json`.

**Show why, don't only say it.** The answer is the moment of the video; the explanation is what
people remember and share. Medium and hard rounds get a `proof` scene: a bar model on one scale
(a price that rises 50% and falls 50% ends shorter than it started; the bat is the ball plus a
$1.00 block) with the working typed out beside it. Sequences draw their rule as arrows over the
tiles. Text `why` lines are for the easy round.

**Game design rules** (why the game works; criteria, not measured facts):
- **Traps are the opponent.** Every question has one intuitive wrong answer among its choices
  (10¢, "1st place", 100 minutes): the challenge is beating your own first answer.
- **No dominant strategy.** In "spot the mistake" at least one claim per episode is right, so
  answering "wrong" every time never wins; mix where it falls.
- **Difficulty rises, points rise.** Easy should be solved by most people (it keeps them in the
  game), hard by few (it is what they comment about).
- **The same 6-point scale every day**, so a viewer can compare today's score with yesterday's
  and with other people's.
- **Commit before the reveal.** The countdown is the moment to answer; the comment question asks
  for the score, which is only honest if they answered before seeing it.
- **A community round** (an idea for the weekly slot): "guess 2/3 of the average" — everyone
  comments a number 0–100, whoever is closest to 2/3 of the average wins, announced next
  episode. To win you have to guess what everyone else will say: comments plus a reason to come
  back.

**Answer tomorrow** is the most direct test of the daily habit: the reveal is in the next
episode, so a viewer who wants it has to come back. The next video's first scene is a `reveal`
with yesterday's `question` (and `sequence`/`choices`) written in it, then today's rounds.

**Vary the words.** The structure repeats on purpose (it is the game); the narration must not.
`npm run next` warns when a sentence is said word for word in 3 or more episodes (the final
score question excepted).

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

- **The episode number is on screen from frame 0**: the first puzzle's `title` is
  "Mind Reps #014" or "Mind Reps #014: Spot the mistake" (the reveal and score scenes keep
  it). It tells viewers this is a series and which episode they are on; the validator warns
  when it is missing.
- **Question on screen = what the voice asks**, shorter if needed. Numbers in tiles, money and
  units with symbols ("$1.10", "10¢").
- **Reveal**: the answer first ("Forty-two."), then 1–3 `why` lines on cue. The why is the
  value of the video: the rule, the trap, the bias by name.
- **Score / CTA**: one question that asks for a comment ("What's your score out of 6?", "Did
  your brain say 10¢ first?") and `next` with the next episode ("Mind Reps #002 · tomorrow").
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

## 7. The 30-day experiment: episode cycle and tuning

**The episode cycle.** The format of an episode follows from its **number**, not from the date,
so generating three at once or skipping a day never breaks the rotation. Episode *n* takes
slot (*n* − 1) mod 7 (`EPISODE_CYCLE` in `src/packs/brain/vocab.ts`):

| Slot | Episodes | Format | Theme |
| --- | --- | --- | --- |
| 1 | 001, 008, 015, 022, 029 | 3 levels | `light` |
| 2 | 002, 009, 016, 023, 030 | Spot the mistake | `dark` |
| 3 | 003, 010, 017, 024 | Answer fast | `neon` |
| 4 | 004, 011, 018, 025 | Answer tomorrow (no reveal) | `dark` |
| 5 | 005, 012, 019, 026 | Yesterday's answer + 3 levels | `light` |
| 6 | 006, 013, 020, 027 | Spot the mistake (another kind of trap) | `dark` |
| 7 | 007, 014, 021, 028 | Hard puzzle of the week (`pause`) | `neon` |

Over 30 episodes every format gets enough episodes to compare, and no two episodes in a row
share a format or a theme.

```bash
npm run next     # episodes written so far, their format, rendered or not, and what comes next
```

It reads `videos/brain/brain-NNN-*.json` (what is written) and `out/<id>/` (what is rendered on
this computer), flags an episode whose format does not match its slot, and prints the next
number, format, theme and how to build it. Whether an episode is **published** and its numbers
live in the "Mind Reps tracker" dashboard in claude.ai (link in the project notes).

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
