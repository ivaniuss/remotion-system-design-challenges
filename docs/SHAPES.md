# Story shapes, hooks and the variety guard

Every video on the channel shares a **look** (the board, the icons, the voice, the sounds).
That is the brand, and it stays the same. What must **not** stay the same is the **shape of
the story** and the **kind of hook**: a viewer who has seen three videos should not be able
to predict the fourth. This guide gives a menu for both, a rule to keep the channel from
repeating itself, and a menu of patterns for Shorts.

Read it in Phase A (the draft), after `docs/AUTHORING.md` and the pack guide.

The news pack has its own shape, `news-report` (fact, who, where, how, reactions, what is
unknown, sources). It is described in `docs/packs/news.md` §3, not in this file.

## 1. How to choose

1. Run `npm run fingerprint` (§7). It lists the recent videos with their shape, hook, theme,
   scene pattern and signature visuals, and suggests what has not been used lately.
2. Pick the **shape** that fits the topic (the table below says when each one is the right
   tool; the default `progressive` is right for "design X from scratch", not for everything).
3. Pick the **hook** that fits the shape.
4. Write both in the spec (`"shape"`, `"hook"`) and at the top of the draft.
5. Run `npm run fingerprint -- videos/<pack>/<id>.json` before showing the draft: it warns
   when the new video repeats the last one too closely (§4).

Every rule that is not about the order of the story still applies to every shape: hook on
frame 0 with `beats`, nothing announced as "level" or "version", every piece says what it is
and why it is there **and what it costs**, blame the mechanism, name the alternatives,
verified claims, instructor voice, one analogy, a summary that ends on a question.

## 2. The shapes

| Shape | Use it when | Hook it pairs with | Signature visuals |
| --- | --- | --- | --- |
| `progressive` | "Design X": a system that grows from simple to scaled | `interview-question` | board that grows, scenario callouts, `crowd` at the high-traffic turn |
| `post-mortem` | Something that famously broke (an outage, a crash on sale day) | `incident` | `sequence` of the timeline, `meter` filling, `clock`, error peak |
| `request-journey` | "What happens when you press the button?" Latency, hops, failure points | `broken-thing` or `interview-question` | one packet across the board, `sequence`, `meter` as a latency budget |
| `a-vs-b` | A real choice (polling vs SSE vs WebSocket, SQL vs NoSQL, cache-aside vs write-through) | `incident` or `interview-question` | `compare`, the same board under 2–3 scenarios with `crowd`/`meter`, a decision `flow` |
| `numbers-first` | Capacity decides the design (feeds, chat, video, anything with "millions") | `surprising-number` | counting `callout`s, `chart`, `meter`, a back-of-the-envelope chain |
| `code-first` | The idea lives in a few lines (idempotency, locks, retries, a cache wrapper) | `broken-thing` | `code` scene, a `sequence` for the race, theme `dark` or `neon` |

### 2.1 `progressive` (the original)

Simplest version that works → "¿y qué pasa si…?" with a new number → what breaks → the
improvement, 2–4 turns on one board. Full skeleton in `docs/packs/tech.md` §2A.
Additions that apply since the other shapes exist:
- **Before the first design, a requirements beat** (long videos): one `list` scene of ~10 s,
  "Before designing: what must it do, and how well?" with 2 functional and 2–3 non-functional
  requirements, each non-functional one with a number (latency, availability, consistency, scale).
- **Each improvement says its cost** (§3).

### 2.2 `post-mortem`

Start at the outage and work backwards to the mechanism. The viewer is an investigator.

```
title      hook = incident: "At 9:00 the sale opened. By 9:01 the site was down."
callout    the symptom as a number ("3.5 billion requests", countUp)
board      "What the dashboards showed": the broken pieces in error/busy, meters at 100 %
sequence   "The first minutes": a timeline of events with elapsed time on the axis
board ×3   hypotheses, one per scene ("Was it the database?"): focus on a node, show why it
           is or is not the cause (ok / error), rule things out until one is left
board      root cause: the mechanism, named in one sentence ("servers scale, seats don't")
board ×2   the fix on the same board, then its cost (what it makes harder)
board      what would have caught it sooner (alerts, load test, a meter that was missing)
summary    the chain of causes and the one rule + a question
```

Rules: never blame a person or a company; state what is known versus assumed; if the incident
is real, cite the public source in `notes`.

### 2.3 `request-journey`

Follow one request. The board is the road; one packet is the car.

```
title      hook = broken-thing ("You pressed Buy. Nothing happened for 8 seconds.") or the
           open question ("What happens in the 200 ms after you press Buy?")
board      the minimal path, a packet crosses it once, end to end
board ×N   one scene per hop: what the hop does, why it exists, what it costs in milliseconds
           (a `meter` as the latency budget filling up: 40 ms, 90 ms, 120 ms…)
sequence   the whole trip over time, with the slow hop as a long bar (`spans`)
board      where it can fail at each hop (timeouts, retries, what the user sees)
summary    the budget table + a question
```

### 2.4 `a-vs-b`

A decision, not a build. The answer is "it depends on X, and here is the line".

```
title      hook = incident ("Your team is split: polling or WebSockets?") or interview question
compare    the two (or three) options side by side, one real trade-off per item
board ×3   the SAME board under three scenarios (small, large, spiky): each option runs it;
           `crowd` and `meter` show who struggles when
flow       the decision tree: the one variable that decides first, then the next
summary    the rule of thumb + when the "wrong" option is the right one + a question
```

Rules: never declare a universal winner; name the variable that flips the answer.

### 2.5 `numbers-first`

Let the arithmetic design the system.

```
title      hook = surprising-number ("10,000 fans refreshing is 3,300 requests per second.")
callout ×2 the chain of numbers, counting up (users → requests/s → data/day → bandwidth)
chart      growth or load over time (`schematic: true` unless the numbers have a source)
board      what ONE machine can do vs what the number needs (a `meter` over 100 %)
board ×2   the design the numbers force, piece by piece, each justified by a number
summary    the formulas as takeaways (QPS = users × actions ÷ 86,400, …) + a question
```

Rules: round numbers, one line each, every assumption stated as an assumption.

### 2.6 `code-first`

The code is the protagonist; the board shows what each line does to the system.

```
title      hook = broken-thing: a snippet that works alone and fails in production
code       the 6–12 lines (≤ 44 chars per line), stepped line by line
board      what each line triggers (packets), the failure when two requests run at once
sequence   the race: two clients, one resource, interleaved over time
code       the fixed version (the changed line highlighted), then its cost
summary    the rule + a question
```

Use theme `dark` or `neon`. Keep the code short enough to read on a phone.

## 3. Cost per improvement (every shape)

Every piece added after the first design says **what it costs**, in the narration or on screen
(a note, a `compare`, a `meter`), never only in `notes`:

| Piece | Typical cost to say out loud |
| --- | --- |
| Load balancer, copies | more things to keep identical; the shared database is still one |
| Cache | stale data, invalidation, a cold start |
| Queue + worker | the answer is no longer immediate; retries and duplicates; one more thing to run |
| Waiting room | some fans wait; it is itself a target |
| Read replica | replication lag: a read can be behind a write |
| Sharding | cross-shard queries and hot partitions; hard to undo |
| Idempotency keys | storage for the keys, and a window after which they expire |

A design that shows only benefits is a sales pitch; the reviewer (`docs/REVIEWER.md`) fails it.

## 4. The variety guard

A new long video must differ from the **most recent long video** in at least **two** of these
five axes (the fingerprint prints them):

1. **Shape**
2. **Hook type**
3. **Theme** (`light`, `dark`, `neon`)
4. **Opening**: the first four scene types (e.g. `TCBB` vs `TQBB`)
5. **Signature visuals**: it must use at least one of `crowd`, `meter`, `clock`, `sequence`,
   `code`, `chart`, `compare`, `flow` that the previous long video did not

Shorts follow the same rule against the previous Short of the **same series**, using the Short
patterns below instead of "shape".

If the topic really demands the same shape as the last video (two "design X" videos in a row),
change at least the hook and one signature visual, and say so in the draft.

## 5. Hooks

The hook is the first sentence of the voice and the heading on frame 0. It always ends in a real
question, never in hype ("nobody tells you this", "almost everyone gets this wrong").

| Hook | Shape of the first line | Example |
| --- | --- | --- |
| `interview-question` | An open design question about the system | "Design the *annual sales report* export." |
| `incident` | Something that really happened, in one sentence, then why | "At 9:00 the sale opened. By 9:01 the site was down. Why?" |
| `surprising-number` | A number that sounds wrong, then the question | "10,000 fans refreshing is 3,300 requests a second. Can one server take that?" |
| `broken-thing` | A small thing that should work and does not | "You pressed Buy. Nothing happened for eight seconds. Where did they go?" |

The `title` still needs 3–5 `beats` drawn in sync with the voice (an alert → an error → "?" for an
incident; a number → a server → "?" for a surprising number).

## 6. Short patterns

A Short is 45–60 s, 5–6 scenes, vertical, ends on a question plus "the full video is on the
channel", no outro. Do not cut every Short from one skeleton. Pick a pattern:

| Pattern | Scene order | Use it for |
| --- | --- | --- |
| `classic` | title · board · board · board · board · summary | one turn of the story, as today |
| `contrast` | title · compare · board · board · summary | naive vs fix, side by side first |
| `decision` | title · list (requirements) · board · flow · summary | "when is the simple version enough?" |
| `timeline` | title · sequence · board · summary | anything about waiting, timeouts, retries |
| `code` | title · code · board · board · summary | one bug and its fix in 6 lines |
| `crowd` | title · board (crowd + meter) · board · callout · summary | "what happens when millions arrive" |

A series of three Shorts uses three different patterns.

## 7. Fingerprint

```bash
npm run fingerprint                      # the recent videos and what has not been used lately
npm run fingerprint -- videos/tech/new.json   # also checks the new spec against the last video
```

For videos written before `shape` and `hook` existed, the shape and hook are inferred and
marked `(inferred)`; set them in the spec to make the record exact.
