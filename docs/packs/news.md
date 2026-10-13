# The news pack (and the broadcast look)

News reports about current events — cyberattacks, the economy, institutions, weather and
climate (El Niño, heat waves) — told like a TV news piece: the fact first, then who, where, how,
the reactions, what is still unknown, and the sources. `"pack": "news"`, `"theme": "news"`,
specs in `videos/news/`.

What makes it different from the explainer packs: **real footage and photos** (a `media`
library with credits), **maps**, **key figures**, **quotes**, a **dated timeline** and the
**sources on screen**. The diagram scenes of the engine (`flow`, `chart`, `list`, `compare`,
`callout`, `summary`) all work too, on the broadcast palette: use a `flow` for "how it
worked" and a `chart` for anything over time.

## 1. Accuracy rules (a news video lives or dies on them)

- **Every fact has a source**, written in the draft's "Claims" table and in `notes`. Prefer
  primary sources (the agency's alert, the court, the company's statement) and major outlets
  (AFP, Reuters, AP, Le Monde, BBC…). A blog is a lead, never the source.
- **Say the date the facts are from** (`news.date` on the bug, `asOf` on the sources scene).
  Stories move: "as of 13 October".
- **Provisional numbers are said as provisional**, with who gives them ("the owner says
  150 to 180; other reports say 300"). When sources disagree, show the range, not the
  number you like best.
- **Attribute quotes and claims**: who said it, their role. Translated quotes get the tag
  "Translated from French"; unverified figures get "Not verified".
- **Never speculate about who did it.** "Nobody has claimed it" is a fact; "probably
  Russia" is not, unless an official source says so (then: who says it).
- **What is unknown is part of the story**: a "Still unknown" beat (who, how, the final
  count) keeps the video honest and tells viewers what to watch for.
- **No hype.** The headline states the fact. A question in the narration ("How is that even
  possible?") is the hook, not adjectives.
- Have the draft fact-checked by someone who did not write it (a separate agent with web
  search): it re-verifies every claim against sources and checks dates and titles.

## 2. Footage and photos (the `media` library)

- Declare every photo or clip once at the top level, with its **credit and licence**; scenes
  refer to it by id. The credit is drawn on screen whenever the picture is.
- **Rights**: use your own footage, public-domain or Creative Commons material (Wikimedia
  Commons, Pexels, Pixabay, government sites), with credit. Agency pictures (AFP, Reuters,
  AP, Getty) and TV footage are **not** free to use.
- **`illustrative: true`** for anything that is not from the event itself (a stock freezer,
  a store that was not confirmed as hit): an "Illustrative image" tag is shown, so viewers
  never take it for footage of the story. Say it in `notes` too.
- Files go in `public/media/<video-id>/` (`m1-…`, `m2-…`); the extension is optional in the
  spec. Missing files render as a "material pending" card with what they should show, so the
  report can be reviewed before the footage arrives; `make` lists what is missing.
- Clips play muted (the voice carries the story). Give clips at least as long as the scene;
  `start` skips into a clip. `focus` keeps the important point in frame when cropping to
  9:16.

## 3. The shape: `news-report`

The default skeleton (2–3 min), one idea per scene:

1. `headline` — the fact in one line, banner + red tab + dateline, footage behind it; the
   voice states the fact and asks the question it raises. 3–4 `beats`.
2. `media` — what people saw (the morning after, the flooded street), lower third with
   place and day.
3. `stats` — who or how many, with who gives the numbers; `footnote` "Provisional…".
4. `map` — where; fly from a wide view, light the country, drop 1–3 pins with what happened
   there.
5. `flow` / `chart` — how it worked or how it evolved (the diagram scenes of the engine).
6. `list` — why it was possible / the context.
7. `quote` — reactions (1–2), attributed.
8. `timeline` — how it unfolded, 3–5 dates.
9. `list` (`numbered: false`) — still unknown.
10. `list` — what authorities advise / what happens next.
11. `summary` — ends on a question for the comments.
12. `sources` — on screen, with `asOf`.

Shorts (45–60 s): `headline` → `media` or `map` → one `stats` or `flow` → `summary` with
the question and "full report on the channel".

## 4. Scenes of the pack (reference in `docs/AUTHORING.md` → "News scenes")

`headline`, `media`, `map`, `stats`, `quote`, `timeline`, `sources`.

## 5. Icons

Common: `user` · `users` · `mobile` · `file` · `mail` · `search` · `bell` · `chart` · `ai`.

News (status → animated state):

| Icon | What | busy | error | other |
| --- | --- | --- | --- | --- |
| `hacker` | hooded attacker with a laptop | typing | | |
| `internet` | globe of links | traffic | down | |
| `controller` | control unit with a screen (PLC, IoT device) | busy | hacked (red, 50 °C) | warn = defrost |
| `technician` | maintenance worker with a wrench | working | | |
| `store` | shop front | busy | closed | |
| `fridge` | display freezer (cold, snowflake) | defrost | hot (red, heat waves) | ok = cold |
| `thermometer` | temperature | rising | hot | |
| `fire` | flame | flicker | | |
| `agency` | shield (cyber agency, police) | scan | | ok = check |
| `justice` | gavel (prosecutors, court) | strike | | |
| `government` | public building | busy | | |
| `money` | banknote and coins | flow | loss | |
| `factory` | plant, infrastructure | running | down | |
| `world` | globe with continents | spinning | | |
| `wave` | ocean swell (sea temperature, El Niño) | swell | swell (warm) | |
| `sun` | sun (heat, drought) | blaze | | |
| `rain` | cloud with rain (floods, storms) | pour | | |
| `pin` | map pin | pulse | | |

## 6. Checklist

- [ ] `"pack": "news"`, `"theme": "news"`, `news.date` set to the date of the facts.
- [ ] Every claim in the draft's Claims table with a source; reviewed by a separate fact-check pass.
- [ ] Provisional numbers said as provisional, with who gives them; ranges when sources disagree.
- [ ] Quotes attributed (name + role), translated ones tagged.
- [ ] No attribution of blame beyond what official sources say.
- [ ] A "still unknown" beat.
- [ ] Every media item has `credit` and `license`; stock or archive → `illustrative: true`.
- [ ] No agency or TV footage without a licence.
- [ ] A `sources` scene with `asOf`; `youtube.md` lists sources and credits automatically.
- [ ] Ends with a question; 2–3 min for a report, 45–60 s for a Short.

## 7. Examples

- `videos/news/fridge-hack-france.json` — the October 2026 attack on French supermarket
  refrigeration (headline, media, stats, map, flow, chart, quote, timeline, sources), with its
  draft `videos/news/fridge-hack-france.draft.md`.
