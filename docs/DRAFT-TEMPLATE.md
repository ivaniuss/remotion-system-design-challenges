# Draft template

Copy this to `videos/<pack>/<id>.draft.md` and fill it in. It is text only: iterate here, build
nothing until the user approves the narration. A finished example (progressive shape):
`videos/tech/async-report-504.draft.md`.

---

# Draft: <the open question or the incident, as the heading will read>

`<id>` · `<lang>` · <words> words · ~<seconds> s of speech (~<minutes> min with pauses)

- **Pack:** tech | science
- **Shape:** progressive | post-mortem | request-journey | a-vs-b | numbers-first | code-first
  (`docs/SHAPES.md`; why this one fits the topic, in one line)
- **Hook:** interview-question | incident | surprising-number | broken-thing
- **Theme:** light | dark | neon
- **Variety check:** paste the output of `npm run fingerprint -- <spec>` (or, before the spec
  exists, the last video's shape/hook/theme) and name the ≥ 2 axes that differ from it.
- **Signature visuals used:** crowd · meter · clock · sequence · code · chart · compare · flow
  (which ones, and on which scene)
- **Thumbnail:** the 2–6 big words (the hook, not the title), the picture (1–3 icons A → B, or
  a figure) and the number for the sticker, for the long video and for each Short.

## Question

The hook as the voice will say it: the situation in one sentence, the question, and the approach
in natural words.

## Requirements (what the design must satisfy)

| | Requirement | Number |
| --- | --- | --- |
| Functional | What it must do | — |
| Functional | … | — |
| Non-functional | Latency / response time | e.g. p95 < 300 ms |
| Non-functional | Availability / consistency | e.g. never sell the same seat twice |
| Non-functional | Scale | e.g. 10k fans, 3,300 req/s at peak |

## Scale estimate (back of the envelope)

One line per number, rounded, assumptions stated as assumptions: users → requests per second at
the **peak** → reads vs writes → data size.

## Story map (internal; never said as "level" or "version")

| Step | The question that triggers it | What changes | **What it costs** | Its limit |
| --- | --- | --- | --- | --- |
| Start | … | the simplest thing that works | — | when it stops being enough |
| 2 | "¿Y qué pasa si…?" + the new number | … | stale data / complexity / latency… | … |
| 3 | … | … | … | … |

Every row after the first has a cost in the fourth column. If you cannot fill it, the piece is
not understood yet.

## Scenes

1. **<title>** (title) — narration.
   _Visual:_ the beats and what is on frame 0.
2. **<title>** (callout) — narration.
   _Visual:_ the number (and whether it counts up).
3. **<title>** (board | sequence | compare | code | chart | flow) — narration.
   _Visual:_ one line per step: what appears / moves / fills (crowd, meter, clock…).

(Keep each scene ≤ 40–50 words. Cues are 2–4 words copied from the scene's own narration.)

## Alternatives named

The real alternatives for each choice, and the variable that flips it.

## Claims to verify

| Claim | Source / how verified |
| --- | --- |
| e.g. nginx default `proxy_read_timeout` is 60 s | official docs |

## Talking points (`notes`, said not shown)

5–12 items: the why, the trade-offs not shown, the follow-up questions, sources.

## Reviewer pass

Paste the report from `docs/REVIEWER.md` §4 and what was fixed. Left open items and why.
