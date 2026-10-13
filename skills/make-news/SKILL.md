---
name: "make-news"
description: "Turn a current news story (a cyberattack, El Niño, an economic or political event) into a broadcast-style news video (9:16 and 16:9) with real photos and clips, maps, key figures, quotes and on-screen sources, using the remotion-system-design-challenges project. Use for /make-news or any request for a news / noticiero video."
---

# /make-news — from a news story to a broadcast report

The user names a story ("el ciberataque en Francia", "El Niño"). You research it, write the
script, get it fact-checked and approved, gather real pictures with their licences, and build
`videos/news/<id>.json` on the project's news look. The engine does layout, timing, voice,
captions and rendering. Same project, commands and delivery as `/make-video`
(`skills/make-video/SKILL.md` §1, §4 and §5: finding the project, running commands locally or
from the Claude app with a linked computer, stills, delivery). Rules: `docs/packs/news.md`
and the "News scenes" section of `docs/AUTHORING.md`.

Talk to the user in Spanish. Narration in English by default (the channel's audience) unless
the user asks for another language.

## 1. Research (before writing a word)

- Search the story in primary sources and major outlets (the agency's alert, the prosecutor,
  the company's statement, AFP, Reuters, AP, Le Monde, BBC…). Note the date of each fact.
- Write down: what happened, when (check the weekday against the date), who and how many
  (with who gives each number), where (places with coordinates), how it worked, reactions
  (exact quotes, who, role), the timeline, what is unknown, what authorities advise.
- Where sources disagree, keep the range and who says what.

## 2. Draft and fact-check

- Write `videos/news/<id>.draft.md`: the `news-report` scenes of `docs/packs/news.md` §3,
  each as `title (type) — narration` with a one-line visual note, a **Claims** table (claim →
  source) and the talking points. ≤ 45 words per scene, 2–3 min in total.
- **Fact-check pass by a separate agent** (with web search) that gets only the draft: it
  re-verifies every claim, date, name and title, flags overstatements, and returns "Must fix"
  items with minimal rewordings and source URLs. Fix them before the user sees the script.
- Show the user the narration (short), plus the list of pictures you will look for. Iterate
  on text only until approved.

## 3. Pictures (real, licensed)

- Prefer Wikimedia Commons (public domain / CC), then Pexels or Pixabay, then the user's own
  material. Never agency (AFP, Reuters, AP, Getty) or TV footage without a licence.
- If the workspace shell cannot reach those sites, use the built-in browser on the user's
  computer: search the Commons API from a commons.wikimedia.org page with `fetch`, show the
  candidates as a grid and look at them, then **ask the user before downloading** (file names,
  source, size). Download with an `<a download>` click, request access to the Downloads
  folder, and copy the files into `public/media/<id>/` (`m1-…`, `m2-…`).
- Otherwise give the user the exact links and the folder and file names to use.
- Record each in the spec's `media` library: `file`, `alt`, `credit` ("Photo: <author> /
  Wikimedia Commons"), `license`, `url`, `focus`, and `illustrative: true` for anything not
  from the event itself.

## 4. Build

- `videos/news/<id>.json`: `"pack": "news"`, `"theme": "news"`, `"shape": "news-report"`,
  `"hook": "headline"`, `news` (`brand`, `date` of the facts, 3–5 `ticker` lines), `media`,
  `thumbnail` (2–6 big words, `media` behind them, a number), `notes` (sources and nuances),
  `publish`, chapters on the main turns. Narration verbatim from the approved draft; cues are
  2–4 words copied from their scene.
- Scenes: `headline` → `media` → `stats` → `map` → `flow`/`chart` → `list` → `quote` →
  `timeline` → `list` (still unknown) → `list` (what is advised) → `summary` (question) →
  `sources`.

## 5. Check and deliver

- `npm run validate` (no ✖, no cue ⚠), `npm run check -- <spec> --every 6`,
  `npm run stills -- <spec>`; look at both sheets and the thumbnail: labels overlapping on the
  map, text cut, credits readable, nothing important under the captions in 9:16.
- Deliver as in `/make-video` §5: sheets, thumbnail, `script.md`, `youtube.md` (sources and
  picture credits are listed there automatically), and the review command
  `npm run preview -- videos/news/<id>.json`. Render only when asked.
