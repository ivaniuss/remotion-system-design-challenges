# Pack guide: tech (software and system design)

`"pack": "tech"` (the default) · specs live in `videos/tech/`. Read `docs/AUTHORING.md`
first (the rules for every video, and the spec reference); this file adds what is
specific to software, backend and system design videos.

## 1. Hook and voice

- **The hook is a real question about the system.** In the `progressive` shape it is an open
  interview question; the other shapes pair with an incident, a number or a broken thing
  (`docs/SHAPES.md` §5). The `title` has a tag
  ("Pregunta de entrevista", "System design interview") and a heading as a real
  interviewer would say it: open and about the system, not about a UI element
  ("Diseña la exportación del *reporte anual de ventas*", not "diseña el botón…",
  which sounds like frontend). The voice tells the situation in one sentence, asks the
  question and says the approach in natural words ("como en un proyecto real: primero
  algo simple que funcione, y lo mejoramos cuando haga falta").
- **Separate the given from the design.** What is fixed (the data, the time it takes,
  the traffic) arrives as a scenario — in the progressive format, the callout at each
  turn — and the voice asks about what you design. Never word it so the system already
  exists ("tu botón tarda cinco minutos…") or so the answer is "just optimize the query".
- **Instructor voice, interview reasoning as advice.** Like Fazt Code, ByteByteGo or
  midudev: "en una entrevista, lo primero es preguntar…", never a simulated dialogue
  between interviewer and candidate.

## 2. The formats

Six story shapes exist (`docs/SHAPES.md`: `progressive`, `post-mortem`, `request-journey`,
`a-vs-b`, `numbers-first`, `code-first`). §2A below is the `progressive` one: the right tool
for "design X from scratch", and the default only when nothing else fits the topic. Pick the
shape in the draft, record it in the spec (`"shape"`, `"hook"`) and run `npm run fingerprint`
so two videos in a row do not look alike.

### 2A. Progressive build (default for "design X")

The video builds the system the way a real project grows, sprint after sprint: first
the simplest version that works, then an honest question — "¿y qué pasa si…?" — that
brings a new scenario, what breaks, and the improvement. One company grows, one board
grows with it, and the viewer learns *why* each piece exists. It works for anyone, from
a beginner to someone preparing an interview.

```
title     the open interview question + the approach in natural words
            ("como en un proyecto real: primero algo simple que funcione, y lo
            mejoramos cuando haga falta")
callout   the starting scenario as a number ("10 mil ventas" · "5 personas lo usan")
list      long videos: "Antes de diseñar: ¿qué debe hacer y qué tan bien?" — 2 functional
            and 2–3 non-functional requirements, each non-functional one with a
            number (latency, availability, consistency, scale)            (≈ 10 s)
board ×3–4  build the minimum piece by piece: each piece says what it does and why
            (frontend → backend with its API → database), then how they talk
            (packets with labels: "GET /reporte", "reporte.csv"), then "¿hace falta
            más? no — esta versión funciona y ya la puedes entregar"
callout   the turn: "¿qué pasa si la empresa crece?" with the new number
            ("50M ventas") and a question back to the viewer ("¿aguanta este diseño?")
board ×N  what breaks (the mechanism, revealing anything hidden like a proxy), why
            the obvious patch is not enough, then the improvement one piece per scene
            (each with what / why / the alternatives), then "el flujo completo": one
            packet runs the whole system while the voice recaps each role
callout   the next turn ("¿y si 200 personas piden el mismo reporte?" · "×200")
board ×N  what breaks → the improvement (2–4 versions in total)
summary   the path: "empezamos simple, y cada pieza llegó cuando un problema real la
            pidió" + one line per version ("si tarda minutos → cola + worker") + a
            question ("¿tú qué habrías hecho distinto?")
list      outro (long YouTube videos only): comments, next topic, like + subscribe
```

Rules that make it teach:
- **Never announce the format.** No "en vivo", "por niveles", "nivel 1", "versión 2" in
  the narration or on screen. The structure shows itself: a version works, a question
  changes the scenario, the design improves. Scene titles name the topic ("La cola",
  "Qué se rompe"), not a level.
- **Every version works and could ship.** Close each one with why it is enough for
  its scenario before asking what would break it.
- **The turn is a real question.** "¿Y qué pasa si…?" names the new condition (more
  data, more people, the same request at once) and, when it helps, asks the viewer
  ("¿aguanta este diseño?"). Put the new number on screen as a `callout` over the
  dimmed board.
- **Every piece earns its place.** The first time a component or term appears, the
  narration says what it is and why it is there in one clause ("una cola: una lista
  de trabajos pendientes… guarda el pedido aunque tu servidor se reinicie"). If you
  cannot justify it in one clause, it does not go in the diagram.
- **Every piece says what it costs.** After the benefit, one clause with the price: the cache
  can serve stale data, the queue means the answer is no longer immediate, the waiting
  room makes some fans wait (`docs/SHAPES.md` §3 has the table). Say it in the voice or
  show it (a `note`, a `compare`, a `meter`); a design with only benefits is a sales pitch.
- **Show the number.** At the high-traffic turn, the load is a `crowd` of dots on the
  broken node and the capacity a `meter` at 100 %; a hold or timeout is a `clock`; a retry
  that duplicates a charge is a `sequence` scene (`docs/AUTHORING.md`, "Visible metrics").
- **Start from the real minimum.** The first version is frontend + backend (its API
  REST) + database, with no proxy, load balancer, cache or queue — and the video says
  it is enough while its scenario holds. Infrastructure that exists anyway (hosting
  router, Cloudflare, nginx) appears at the failure as "lo que tu diagrama no muestra".
- **Backend vs API.** Label the server box "Backend" (sub "API REST") and say the
  difference once: the backend is everything on your server, the API is its door (the
  routes the frontend calls). When a worker joins, the backend has two parts: "la API,
  que atiende al frontend, y el worker, que hace lo pesado".
- **Show how they talk.** Requests and responses are packets with short labels; name
  the style once ("pides y esperas en la misma conexión: eso es síncrono").
- **Same board all the way.** Hide what an improvement makes obsolete (`hide`), add
  what it needs, and use `camera: []` on recaps so the viewer sees the whole picture.
- Length: whatever it takes (typically 4–8 min, 16–28 scenes); depth beats brevity in
  the long video, because the Shorts are cut from it. For a short, cut one
  turn out of it (e.g. only "¿y si tarda minutos?") with its own hook.

Example: `videos/tech/async-report-504.json` (draft: `videos/tech/async-report-504.draft.md`).

### 2B. The short interview format (one decision, 60–120 s)

```
title     hook: the situation in one sentence + the question             (≈ 7 s)
list      "Primero, aclara los requisitos": 2–4 assumptions with numbers  (≈ 9 s)
board     "La versión simple": the simplest design that meets them       (≈ 10 s)
board     "Qué lo rompe": the variable that breaks it, one error status   (≈ 11 s)
callout   the failure in one word: "504" over the dimmed board           (≈ 2 s)
board     "La solución": hide what was wrong, add the pieces, camera []  (≈ 14 s)
flow      "¿Cuándo sí sirve lo simple?": decision tree with the variables  (≈ 14 s)
summary   2 takeaways + a question for the comments                      (≈ 8 s)
```

Optional extras when they earn their place: a `code` scene (the 6 key lines), a
`compare` scene (naive vs fix), a `list` of trade-offs. Each one costs ~8 seconds.

## 3. Think like an interviewer (what makes the content trustworthy)

Which beats apply to which format: in the **progressive build (§2A)** the scenario
callouts carry the numbers, a **long** video also opens with a short requirements `list`
(functional and non-functional, ≈ 10 s) right after the first callout, and each version's
"¿hace falta más? no — funciona" shows when the simple design is fine, so it has **no
decision tree**. In the **short format (§2B)** the requirements `list` and the decision
tree are both required.

- **Clarify requirements first, on screen.** Real interviews start vague on purpose;
  the first move of a good candidate is to ask (how many users / requests per second,
  how much data, how fast it must answer, is it the same for everyone). The video does
  the same: in the short format a `list` scene "Primero, aclara los requisitos" with the 2–4 numbers that
  decide the design. If the idea does not give them, choose realistic ones and present
  them as assumptions ("supongamos pocos usuarios al día").
- **Start with the simplest design that meets them.** No component appears without a
  requirement that forces it: with few users there is no load balancer, no cache, no
  cluster. Add each piece only when the story shows why ("cuando un servidor no
  alcanza…"). Viewers trust a video that does not over-engineer.

- **Justify every component in a few words.** If a load balancer, a cache or a queue
  appears, the narration says why it is there ("tu API corre en varias instancias
  detrás de un load balancer"). Nothing appears just because "that is how it is done".
- **Blame the mechanism, not the box.** Explain the real cause and that it is general
  ("cualquier proxy tiene un timeout"), so the viewer learns the principle and does
  not think the fix is "remove the load balancer" or "raise the timeout".
- **Name the alternatives when there is a real choice.** Notifications: polling, SSE,
  WebSocket or email. Queues: SQS, RabbitMQ, Kafka. Say the options in one phrase
  (and label the node with them) instead of implying there is only one answer; put
  the trade-offs in `notes`.
- **Never imply the simple design always fails.** Name the variable that breaks it and
  show when it works. In the scenario, state the numbers that matter (duration, data
  size, traffic) and say which one causes the failure: "el problema no es el tráfico:
  aunque lo pida una persona, recibe un error". A senior answer is "it depends on X,
  and here is the line".
- **The decision beat ("¿Cuándo sí sirve lo simple?"), short format.** A short ends its
  story with a small decision tree (`flow` scene, 3–5 nodes, `row`/`col`, edge labels
  "sí"/"no"): the question that decides first (¿supera el timeout?), then the next one
  (¿muchos a la vez?), and the outcomes (asíncrono / síncrono, más simple). Reveal it
  question by question with `show`. Long labels wrap to two lines on their own.
- **Do the back-of-the-envelope math on screen.** Capacity questions have a one-line
  answer an expert does in their head; show it as a note. Little's law: requests in
  flight = requests per second × duration ("*10/s × 20 s* = 200 en curso" vs
  "*1/min × 20 s* = menos de 1"). Others: QPS = daily users × requests per user /
  86,400; storage = items × size × retention. Round numbers, one line each.
- **Second-order twists: a next turn, or `notes`.** "If the report is the same for
  everyone, a nightly cron and no queue at all" is the next turn in the progressive format; in
  a short there is room for one decision, so keep it for the description, a pinned
  comment or the next video.
- **Technical review before saving.** List every concrete claim (defaults, limits,
  status codes, numbers). Each one must be correct and current; verify it (search the
  official docs when you can) or soften it ("suele", "por defecto en AWS"). Never
  invent benchmarks. Everything nuanced that does not fit the short goes to `notes`.

## 3B. Think like an architect (the depth an expert expects)

The viewer should come away thinking "this person has built real systems". Before the
draft, run the scenario through this list; show on the board what applies, and put the
rest in `notes`. Long YouTube videos have room for it (Shorts are cut from them later),
so never drop a step an expert would expect just to be shorter.

- **Capacity first.** Estimate the numbers that decide the design: users, requests per
  second at the **peak** (not the average), reads vs writes, data size. One line on
  screen ("10k fans × 20 refreshes/min ≈ 3,300 req/s").
- **Stateless vs stateful.** The stateless part (app servers that keep nothing between
  requests) scales out: run copies behind a **load balancer**. The stateful part (the
  database, one seat, one counter, one file, one hot key) can't be copied that easily,
  and that is where the bottleneck goes.
- **High-traffic turn = the standard scaling step first, then where the bottleneck
  moves.** Whenever a turn brings big traffic, show what any engineer does first, as its
  own scene: load balancer + copies of the backend, a CDN or cache for read-heavy content
  (and read replicas when it fits). Then show what is still slow and why ("servers scale,
  seats don't"), and only then the specialized fix (admission control / waiting room,
  queue + workers, sharding, precomputing, batching, back-pressure). Skipping the
  standard step makes the video look naive; skipping the "where it moved" step makes it
  look like a list of buzzwords.
- **Reads and writes are different problems.** Reads can often be cached or slightly
  stale: say how stale is fine and why ("the map can lag a second: the write decides").
  Writes to the same thing need one source of truth: atomic/conditional updates, locks,
  idempotency keys, a single owner.
- **Failure modes.** Ask what happens on a retry, a timeout, a double click, a server
  dying mid-request, a user closing the tab. The usual answers: idempotency, expiry/TTL,
  at-least-once delivery + deduplication, durable queues. Cover the ones the story
  touches.
- **Abuse** when the system is public: bots, rate limits per account/device/IP,
  quotas, purchase limits.
- **"Why not X?" in one clause.** When an obvious component is absent (load balancer,
  cache, queue, sharding, microservices, Kubernetes), say why in the narration or a note:
  "one server handles a few hundred fans", "more servers won't make one slow request
  faster", "sharding by event doesn't help when one event is the hot spot". Experienced
  viewers notice missing pieces; the reason is what makes it expert.
- **Name things correctly, then explain them in one clause**: stateless, horizontal
  scaling, race condition, atomic update, idempotency, hot partition, admission control,
  back-pressure, eventual consistency.
- **Notes carry the follow-ups**: sharding, replicas, consistency trade-offs, cost,
  observability, single points of failure, what changes at 10× more traffic.

Example of the full pattern: `videos/tech/ticket-sale.json` (simple → race condition →
hold with expiry → 3.5 billion requests: scale out + CDN → "servers scale, seats don't"
→ waiting room → token → bots).

## 4. Icons (tech + common)

Tech: `client` (browser / frontend) · `api` (server / backend) · `gateway` (load
balancer / API gateway / proxy) · `instances` (cluster) · `lambda` (serverless) ·
`container` (docker/k8s) · `db` · `replica` · `cache` (redis) · `storage` (S3/blob) ·
`queue` (SQS/RabbitMQ) · `broker` (Kafka/pub-sub) · `worker` · `scheduler` (cron) ·
`cdn` · `external` (third-party API) · `ratelimit` · `lock` (auth/security) · `code`.

Common (every pack): `user` · `users` · `mobile` · `file` · `mail` · `search`
(elasticsearch) · `bell` (notifications/websocket) · `chart` (metrics) · `ai` (LLM/model).

Synonyms (redis, kafka, s3, postgres, server, proxy…) map automatically. Animated
states by `status`: `busy` → db scans, worker gears spin, queue gets a message, client
spinner, gateway waits…; `error` → client ✕, gateway cut, cache miss, broker backlog…;
`ok` → client done, worker done, cache hit.

## 5. Checklist (tech, on top of the common one)

- [ ] The heading is an open interview question about the system, not a UI element.
- [ ] The scenario callouts (progressive) or a requirements beat (short) put the numbers on screen.
- [ ] Long video: a requirements `list` (2 functional, 2–3 non-functional with numbers) comes before the first design, and a peak-load estimate before the first scaling step.
- [ ] Every piece after the first design says what it costs (voice or screen), not only what it fixes.
- [ ] `shape` and `hook` are set and `npm run fingerprint` shows ≥ 2 axes different from the previous video.
- [ ] The big numbers are seen: `crowd` for load, `meter` for capacity, `clock` or `sequence` for waiting, `countUp` for scale.
- [ ] The first design is the real minimum (frontend + backend + database); every later piece is forced by the story.
- [ ] The server box is "Backend" (sub "API REST"); the backend vs API difference is said once.
- [ ] Real alternatives are named; no claim that the simple design always fails.
- [ ] The scenario states duration / data / traffic, and the video says which one breaks it.
- [ ] The video shows when the simple design is fine (a "¿hace falta más? no" beat, or a decision tree), with the math on screen or in notes.
- [ ] Defaults and limits (timeouts, status codes) verified against official docs or softened.
- [ ] Architect pass (§3B): peak numbers estimated; stateless vs stateful named; reads and writes handled separately; the failure modes the story touches are covered.
- [ ] A high-traffic turn shows the standard scaling step (load balancer + copies, CDN/cache) before the specialized fix, and says where the bottleneck moved.
- [ ] Every obvious component that is absent has a one-clause "why not".

## 6. Examples

- `videos/tech/async-report-504.json` — progressive build (§2A): one board that grows from
  frontend + backend + database to a queue, a worker, S3 and a nightly cron; every piece
  explained with what and why, a hidden proxy revealed at the failure, sound cues and
  notes (Spanish, light, ~5 min). Its approved draft: `videos/tech/async-report-504.draft.md`.
- `videos/tech/async-report-504-en.json` — the same video in English for YouTube only: a wide
  board (2 rows × 4 columns) that fills 16:9, animated hook `beats`, the outro, and
  `publish` + `chapter` for `out/<id>/youtube.md`.
- `videos/tech/cache-aside-redis.json` — progressive board + code: when you need no cache, cache-aside, invalidation on write, stampede, missing keys and Redis going down (Spanish, dark, ~4 min).
- `videos/tech/ticket-sale.json` — the architect pass (§3B) applied: capacity math, scale out before the specialized fix, payment failure modes, "why not shard", abuse (English, horizontal, ~7 min). Shorts: `ticket-sale-short-1…4`.
- `videos/tech/ticket-sale-pilot.json` — a 7-scene slice of `ticket-sale` rebuilt with the
  visible-metrics toolkit (`countUp` callout, `crowd` flood on the Backend, `meter` bars,
  a waiting-room crowd, `clock` rings for the seat hold and the walk-away, and the "Charged
  twice" scene as a `sequence`). Compare it with the same scenes in `ticket-sale.json`.
- `videos/tech/report-short-1-504.json`, `report-short-2-queue.json`,
  `report-short-3-cron.json` — three ~1 min vertical Shorts cut from
  `async-report-504`, each with its own hook and a tease to the next.
