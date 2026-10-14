---
name: "make-brain"
description: "Turn a puzzle idea, a set of puzzles or a topic into a Daily Brain puzzle Short (9:16 and 16:9): number sequences in three levels, spot the mistake, answer-fast bias questions, answer-tomorrow teasers, with a countdown, a reveal and a scorecard, using the remotion-system-design-challenges project. Use for /make-brain or any request for a daily puzzle / brain teaser / acertijo / reto mental video."
---

# /make-brain — a Daily Brain puzzle Short

The user asks for an episode ("el #004", "un reto de lógica", "spot the mistake con porcentajes")
or gives puzzles. You write and **verify** the puzzles, then build `videos/brain/<id>.json`.
Same project, commands and delivery as `/make-video` (`skills/make-video/SKILL.md` §1, §4 and
§5: finding the project, running commands, stills, delivery). Rules: `docs/packs/brain.md`;
scene reference: `docs/AUTHORING.md` → "Puzzle scenes".

Talk to the user in Spanish. Narration and on-screen text in English (the channel's audience).

## 1. Pick the episode

- Run `npm run next`. It lists the episodes in `videos/brain/` and prints the next number, its
  format and theme from the episode cycle (`docs/packs/brain.md` §7: the format follows from the
  number, not the date) and how to build it. Make that one unless the user asks for another.
- If it flags an episode whose format does not match its slot, tell the user before writing.
- Slot 5 ("yesterday's answer + 3 levels") opens with a `reveal` of the previous episode's
  puzzle: copy its question / sequence / choices into the reveal.

## 2. Write and verify the puzzles (before any JSON)

- Write the puzzle(s), the answer, the rule, and why no other simple answer fits.
- **Verify**: solve it by hand (show the arithmetic in `notes`); then a second solver that did
  not write it — a separate agent or a different model — gets only the question and must reach
  the same answer. If it finds another defensible answer, change the puzzle.
- AI claims only from a real, logged output (model, date, where the log is). Never invent one.
- Show the user, in Spanish, a short table: puzzle · answer · why · how it was verified, plus
  the narration. Iterate on text until approved. Build nothing before.

## 3. Build

`videos/brain/<id>.json` with `"pack": "brain"`, the format's theme, `"shape": "daily-puzzle"`,
`"hook": "challenge"`, `notes` (verification + sources), `publish` (titles, description,
`comment` = the CTA question, hashtags) and `thumbnail` (2–6 words, a `number` sticker, brain
icons). Copy the closest example in `videos/brain/`.

## 4. Check and deliver

```bash
npm run validate -- videos/brain/<id>.json     # fix every ✖ and cue ⚠
npm run stills -- videos/brain/<id>.json       # look at both contact sheets in out/<id>/
```

Deliver the sheets, the thumbnail and cover, `out/<id>/script.md` and `out/<id>/youtube.md`.
The user previews with `npm run preview -- videos/brain/<id>.json` and renders when happy:
`npm run make -- videos/brain/<id>.json --format vertical`.
