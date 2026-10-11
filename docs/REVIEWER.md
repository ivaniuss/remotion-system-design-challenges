# The reviewer pass

A second pair of eyes between the draft and the build. The writer is too close to the script to
see what a viewer will miss, so the review is done by **someone who did not write it**: a
separate agent when the platform can start one, or, if it cannot, a fresh pass by the writer that
reads the draft cold against this rubric and writes down every finding before fixing anything.

Run it twice per long video:

1. **On the draft** (`videos/<pack>/<id>.draft.md`), before the narration is shown to the user.
   Text only, cheap to fix.
2. **On the spec** (`videos/<pack>/<id>.json` + `out/<id>/script.md`), before the stills are
   delivered. It checks what the draft could not: what is on screen and when.

Shorts get one pass, on the spec.

## 1. What to give the reviewer

Only these, so it reads the work the way a viewer meets it:
- the draft (or the spec and `out/<id>/script.md`),
- `docs/packs/<pack>.md` and `docs/SHAPES.md`,
- the output of `npm run fingerprint -- <spec>`,
- this file.

Do **not** give it the writer's reasoning, earlier drafts or the conversation.

## 2. The role (use this as the system prompt)

> You are a Principal Software Architect and an elite technical educator. Review scripts and
> video specs about System Design and Software Architecture with the rigor of an expert from a
> large tech company and the clarity of a great teacher. You are not here to praise. Find what
> would make an expert viewer lose trust or a beginner get lost, and say exactly how to fix it,
> with the smallest edit that works.
>
> Write your review in the user's language (Spanish). Quote narration in the video's language.
> Never rewrite a whole script: propose minimal edits, and keep every cue phrase (`at`) valid:
> a cue must stay a 2–4 word phrase copied verbatim from its scene's narration.

## 3. The rubric

Score each pillar **pass**, **fix** or **missing**, with the scene number and the exact words that
justify the verdict. A pillar with no evidence is **missing**, not **pass**.

### 1. The "why" before the "what"
Nobody accepts a technology or pattern because it is the usual one. For every component and every
decision (Redis, Kafka, a queue, a load balancer, SQL or NoSQL…):
- the first time it appears, the narration says what it is and **the exact problem it solves**;
- that problem has already been shown to the viewer, on screen, before the piece arrives;
- an obvious piece that is absent has a one-clause "why not" (`docs/packs/tech.md` §3B).
**Fix** if a piece arrives "because that is how it is done". **Missing** if a main component has no reason.

### 2. Trade-offs
Every design has a price. The viewer must hear it, not find it in the notes:
- every improvement says **what it costs or makes harder** (`docs/SHAPES.md` §3), in the narration
  or on screen;
- the final design states its limits and when the simple version was enough;
- consistency, latency, cost and complexity are named when they are the real trade (eventual vs
  strong consistency, immediate answer vs queue, stale cache vs fresh read);
- the real alternatives are named once, with the variable that flips the choice.
**Fix** if the video reads as a sales pitch. **Missing** if any main piece shows only benefits.

### 3. Clarity and pedagogy
- Instructor voice, second person, direct; no simulated dialogue; no hype lines; no "level 1".
- Short sentences (6–14 words), jargon explained in the same sentence it appears.
- One everyday analogy for the hardest idea, **labelled as an analogy**, that does not distort the
  mechanism (an analogy that teaches something false is worse than none).
- ≤ 40–50 words per scene; something changes on screen every 2–3 s.
**Fix** for any of the above broken; list the offending sentences.

### 4. Logical structure
The expert order is: **requirements (functional and non-functional) → estimates of scale → high-level
design → key components → bottlenecks and mitigations.** Different shapes (`docs/SHAPES.md`) may
tell it in a different order, but every element must be present somewhere:
- functional requirements (what it must do) and non-functional ones (latency, availability,
  consistency, scale), with numbers;
- a capacity estimate on screen or in a callout: peak, not average; reads vs writes;
- stateless vs stateful named; the standard scaling step before the specialised fix;
- where the bottleneck moved, then the specific fix;
- failure modes the story touches (retry, timeout, double click, a crash mid-request) and abuse
  if the system is public.
**Missing** if a whole block (usually requirements or the estimate) is absent.

### 5. Accuracy
List every concrete claim (default timeouts, limits, status codes, numbers, study findings, real
incidents). Mark each **verified** (with source), **soften** or **wrong**. Never accept an invented
benchmark. Where the limit is fuzzy the script must say what makes it struggle instead of giving a
number it cannot defend.

### 6. Show it, do not only say it
Numbers, time and failure should be **seen**:
- load → a `crowd`; capacity → a `meter`; waiting or expiry → a `clock` or a `sequence`;
  a quantity that should feel big → a `callout` with `countUp`;
- a number that appears only in the voice (not on screen, not in a note) is a finding;
- a scene where nothing changes for more than ~3 s is a finding.

### 7. Variety
Read the fingerprint. Does the video differ from the most recent long video in at least two axes
(`docs/SHAPES.md` §4)? If not, name the two cheapest changes (usually the hook and one signature
visual).

## 4. The report

Reply in this format and nothing else:

```
## Review: <id> (<draft | spec>)

| Pillar | Verdict | Evidence (scene · words) |
| --- | --- | --- |
| 1 Why before what | pass / fix / missing | … |
| 2 Trade-offs | … | … |
| 3 Clarity | … | … |
| 4 Structure | … | … |
| 5 Accuracy | … | … |
| 6 Show it | … | … |
| 7 Variety | … | … |

### Must fix before building (max 7, most important first)
1. Scene N — problem — the smallest edit (quote the new words).

### Claims to verify
- claim → verified (source) / soften to "…" / wrong → "…"

### Nice to have
- …
```

**Blocking** (the video does not go to build until fixed): a missing pillar 1, 2 or 4; any wrong
claim; hype lines; an announced format; a main piece with no reason or no cost.

## 5. After the review

The writer applies the **must fix** items, re-runs `npm run validate` (cues!), and shows the user
the narration together with a three-line summary of the review: what was fixed, what was left and
why. One round, two at most: if a third would be needed, the problem is the shape, not the wording.
