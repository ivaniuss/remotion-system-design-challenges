# Draft: Why do big ticket sales crash?

`ticket-sale-v2` · en · pack tech · long video, horizontal 16:9 for YouTube · ~1,140 words · ~8 min of speech (150 words per minute)

This is the deep version of `ticket-sale`: the same approved story, with what the new rules ask for.
**Bold tags mark what is new or changed against the approved narration** (`ticket-sale.draft.md`);
every scene without a tag keeps its approved words.

- **Pack:** tech
- **Shape:** progressive (a "design X from scratch" story: simple version first, then one real question per turn).
- **Hook:** incident (the 2022 presale that overwhelmed the site, then "how would you design it?").
- **Theme:** light (the notebook look of the earlier videos). A first proposal used neon; it is a one-word change in the spec.
- **Variety check:** previous long videos are `async-report-504-en` (progressive · interview-question · light · opening TCBB) and `ticket-sale` v1 (progressive · incident · light · TCBB). This one differs in **opening** (TCLB: a requirements list sits third) and **signature visuals** (crowd, meter, clock, sequence, countUp; v1 used none). Same shape and hook as v1 on purpose: the topic is a design-from-scratch story and the first scene is now a real, sourced incident. (This is the third progressive long video in a row; a `post-mortem` shape would fit this topic if you want more variety later.)
- **Signature visuals used:** countUp (15), sequence (7, 14), clock (11, 12, 25), crowd (16, 20, 22), meter (16, 18, 20, 22). Meters and clocks show illustrative values, never measurements.

## Question

In 2022, a huge tour's presale overwhelmed the ticket site. So how would you design ticket sales? Like a
real project: start with something simple that works, and fix it only when it breaks.

## Requirements (what the design must satisfy)

| | Requirement | Number |
| --- | --- | --- |
| Functional | Show which seats are free | — |
| Functional | A fan picks a seat and buys it (the seat is held while they pay) | hold: a few minutes (product decision) |
| Non-functional | Consistency: never sell a seat twice | 0 double sales (hard rule) |
| Non-functional | Latency: a seat check answers fast | under 1 s (a target, stated as one) |
| Non-functional | Scale: starts small, then the big day | 500 seats, a few hundred fans over a day → 100k fans at the peak (example) |
| Non-functional | Availability: stays up on sale day | the requirement the big day breaks (said in scene 16: "stay up, still never sell twice") |

## Scale estimate (back of the envelope)

- Small version: 500 seats, a few hundred fans over a whole day: well under 1 request per second on average. Any single server does this.
- Big day (an example, not the company's data): 100,000 fans × 20 refreshes per minute ÷ 60 = about 33,000 requests per second **at the peak**.
- Reads versus writes: almost all of it is people looking at the seat map (reads, cacheable). Purchases are few, and they all fight for the same fixed rows (writes).
- Real incident for scale: Ticketmaster reported 3.5 billion system requests for the Eras Tour Verified Fan presale (Nov 2022), "4x our previous peak". It is a total that includes bots and fans without codes, not a rate: 3.5 billion at 33,000 per second would take about 29 hours.

## Story map (internal; never said as "level" or "version")

| Step | The question that triggers it | What changes | **What it costs** | Its limit |
| --- | --- | --- | --- | --- |
| Start | Local band: 500 seats, a few hundred fans a day | Fans → backend → database (seat: free / sold) | — | Two clicks on one seat at once |
| Atomic | "Two fans click A12 at the same moment" | "Mark sold only if still free", one step | The second fan loses the race and picks again | Paying takes minutes |
| Group | "Fans want four seats together" | Sell all four in one transaction | Rows locked a little longer; other fans wait | — |
| Hold | "Paying isn't instant" | free → held (with expiry) → sold; a job frees expired holds | A held seat is blocked for everyone else, even if the fan walks away: a long hold blocks seats, a short one loses payers | Payment races |
| Payment | "The hold expires while paying" · "the backend crashes after charging" | Confirm only if the hold is still yours, else refund; idempotency key per payment | That fan is charged, then refunded; the provider must remember each key for a while | Millions arrive in the same minute |
| Scale out | "3.5 billion requests" (a total, not a rate; the 100k-fans example gives the rate) | Load balancer + stateless copies; seat map on a CDN | More machines to run and keep identical; the map can be a few seconds old; **still one database** | Writes for the same seats |
| Waiting room | "Servers scale, seats don't" | Waiting room: random order, let in at capacity, signed token; bots; the room hardened | Some fans wait; the room is itself a target; sign-up friction and limits that real fans hit too | When the simple version is enough: a local band |

## Board

```
[Fans] ── [Waiting room] ── [Load balancer] ── [Backend] ── [Payments]
[CDN]                                         [More copies]  [Database]
                                                             [Hold expiry]
```

Same board as the approved video (5 columns, horizontal only). Pieces appear when the story needs them:
the payment provider with the hold, the expiry job when a fan walks away, copies + load balancer + CDN
at the traffic turn, the waiting room last.

## Scenes

1. **Why do big ticket sales crash?** (title) **[changed: a real incident, not "every time"]** — In 2022, a huge tour's presale overwhelmed the ticket site. So how would you design ticket sales? Like a real project: start with something simple that works, and fix it only when it breaks.
   _Visual:_ tag "System design"; beats "Fans" → "Seats" → "Payment" → "?".

### Start simple

2. **500 seats** (callout) — Start small: a local band, five hundred seats, and a few hundred fans buying over a whole day.
   _Visual:_ "500 seats · a local band · a few hundred fans over a day".

3. **What it must do** (list) **[new; reworded after review]** — Before drawing anything, ask what it must do, and how well. It must show the free seats, and let a fan buy one. And it must never sell a seat twice, and answer in under a second. For now: five hundred seats, a few hundred fans.
   _Visual:_ five items pop with the voice: "Show the free seats" · "A fan picks a seat and buys it" · "Never sell a seat twice" · "Answer in under 1 second (target)" · "Now: 500 seats, a few hundred fans". Not numbered. The first two are the functional ones (what), the next two the non-functional ones (how well); "never twice" is highlighted as the hard rule.

4. **The simple version** (board) **[changed: backend vs API said once]** — The simple version is three pieces. Fans open the site and pick a seat. The backend is everything on your server; its API is the door the site calls. It checks the seat is free and marks it sold. And the database keeps every seat with its status.
   _Visual:_ shows fans, api, db; fans → api "buy A12"; api → db "A12 free?"; api → db "A12 = sold"; note "Seats: free or sold".

5. **Need anything else?** (board) — With a few hundred fans spread over a day, that's enough. No queue, no cache, no extra servers. This version works, and you could ship it today.
   _Visual:_ note "A few hundred fans: enough"; note "Every extra piece = one more thing to break"; note "Simple version: works and ships".

### Two fans, one seat

6. **Same seat** (callout) — But what happens when two fans click the same seat at the same moment?
   _Visual:_ "Same seat · two fans click A12 at the same moment".

7. **What breaks** (sequence) **[visual changed; "paid" fixed: nothing is paid yet]** — Both requests ask the database: is A12 free? Both get yes. Both mark it sold. Now two people have a ticket for one seat. That's a race condition: the check and the write were two separate steps.
   _Visual:_ a sequence diagram: actors "Fan 1", "Fan 2", "Database". Messages in order: Fan 1 → DB "A12 free?" · Fan 2 → DB "A12 free?" · DB → Fan 1 "yes" (return) · DB → Fan 2 "yes" (return) · Fan 1 → DB "A12 = sold" · Fan 2 → DB "A12 = sold" with error status and the note "1 seat, 2 tickets" (riser before it). The overlap of the two checks is the picture.

8. **One atomic step** (board) **[changed: atomic named; the price]** — The fix: make the check and the write one step, an atomic update. The backend tells the database: mark A12 sold, only if it's still free. The first request wins. The second changes zero rows, so that fan loses and picks another seat. That's the price of never selling twice.
   _Visual:_ note "Check + write = one step"; api → db "sold IF free"; db → api "updated: 1"; db → api "updated: 0"; note "Price: the loser picks again"; last, a small note "Also: row lock · version column".

9. **Four seats together** (board) **[changed: "sell", not "hold"; the price]** — Fans rarely buy one seat; they want four together. Sell them one by one, and the fan can end up with half a group. So sell all four in one transaction: all or nothing. The price: those rows stay locked a little longer, so other fans wait.
   _Visual:_ fans → api "4 seats"; note "Group: 4 seats together"; api → db "A12 ✓  A13 ✗"; note "Partial: half a group"; api → db "sell 4 IF all free"; note "All 4 or none"; note "Price: rows locked longer".

### Hold the seat

10. **Minutes** (callout) — Next problem: paying isn't instant. Between picking a seat and finishing the payment, a fan needs a few minutes.
    _Visual:_ "Minutes · between picking a seat and paying".

11. **Hold the seat** (board) — So you don't sell the seat at the click: you hold it. The seat goes from free to held, with an expiry time, while the fan pays. When the payment goes through, it becomes sold.
    _Visual:_ api → db "A12 = held"; note "free → held → sold"; a `clock` ring appears on the database with the label "~5 min hold" (an example length) and runs while the voice says "with an expiry time"; shows pay; api → pay "pay"; pay → api "paid"; api → db "A12 = sold" (the ring disappears); the alternative (a key with a time limit) is a talking point, not on screen.

12. **When they walk away** (board) **[changed: the price, with both extremes]** — And if the fan closes the tab? A small job checks for expired holds every minute and frees those seats. The price: a held seat is blocked for everyone else. A long hold blocks seats; a short one makes fans lose them mid-payment.
    _Visual:_ shows expiry; note "Expiry job: every minute"; the `clock` ring on the database runs out and says "expired"; expiry → db "free expired"; note "Expired hold → free again"; note "Price: held = blocked for others"; note "Long blocks seats; short loses payers".

### When the payment goes wrong

13. **Paid, but too late** (board) **[changed: the payment provider is introduced; the price]** — The fan pays through an outside payment provider, the company that charges the card. They pay in the last second, the hold expires, and another fan takes the seat. So confirm the sale only if the hold is still theirs; if not, refund. The price: that fan is charged, then refunded.
    _Visual:_ api → pay "pay"; note "Pays at the last second"; expiry → db "hold expired"; note "Money taken, seat gone"; (cash sound); api → db "sold IF mine"; note "Confirm only if the hold is yours"; pay → api "refund"; note "Not yours? Refund"; note "Price: charged, then refunded".

14. **Charged twice** (sequence) **[visual changed; labelled analogy and the price added]** — Say the backend crashes right after charging, before marking the seat sold. The retry must not charge again. So every payment carries an idempotency key. Analogy: a receipt number. Show it twice, and the provider returns the same receipt, not a second charge. The price: the provider remembers each key.
    _Visual:_ a sequence diagram: actors "Backend", "Payments", "Database". Messages: Backend → Payments "pay · key K1" · Payments → Backend "charged ✓" (return) · Backend → Database "mark sold" as a **lost** message (✕) with the note "Crash after charging" · after "+1 min": Backend → Payments "retry · key K1" with the note "Like a receipt number" · a span on Payments "K1 seen" · Payments → Backend "already paid" (return) · Backend → Database "sold IF mine" (arrives; the hold may have expired by then, as in 13) with the note "One charge, even with retries" (success sound) · last note "Price: the provider stores each key".

### Millions at once

15. **3.5 billion** (callout) **[changed: a sourced incident, not "the big one"]** — Remember that 2022 presale? It got three and a half billion requests: four times the ticket company's previous peak. What happens to our design?
    _Visual:_ "3.5 billion" counting up from zero (`countUp`) · caption "total system requests · 2022 presale · 4× its previous peak (Ticketmaster)". The callout has only a text and a caption, so the source rides in the caption.

16. **What breaks now** (board) **[changed: fans and bots; softer claim]** — Everybody arrives in the same minute, fans and bots, and keeps hitting refresh. The backend runs out of capacity. The database is flooded with seat checks. Some fans can even lose the seats in their cart.
    _Visual:_ first note "Goal: stay up, still never sell twice" (the availability requirement); a flood `crowd` from Fans onto the Backend labelled "fans + bots"; `meter` on the Backend ("CPU") rising to 100 % with the error status; a second crowd Backend → Database "A12? A13? A14?" and a `meter` on the Database ("connections") at 100 %; (alarm); note "Random errors, lost carts". Meters show illustrative values, not measurements.

17. **The numbers** (board) **[changed: a total is not a rate; "peak" said]** — That total doesn't tell us how fast, so let's size an example. A hundred thousand fans refreshing twenty times a minute make about thirty-three thousand requests per second. That's the peak. Most of it is reads: people looking at the seat map. Buying is a small part, fighting for fixed seats.
    _Visual:_ note "A total isn't a rate"; note "Example: 100k fans × 20 refreshes/min"; fans → api "33k req/s"; note "≈ 33k requests per second at the peak"; note "Mostly reads: the seat map"; note "Writes: few, same seats".

### Scale out first

18. **Scale out** (board) **[changed: stateless defined; shorter]** — The first move any engineer makes: scale out. The backend is stateless, meaning it keeps nothing between requests, so you can run many copies. A load balancer in front spreads the traffic across them.
    _Visual:_ note "Stateless: keeps nothing per request"; shows copies; shows lb; (impact); lb → copies "requests"; note "Load balancer = spreads the traffic"; the Backend `meter` drops (the load is shared).

19. **Cache what people look at** (board) **[changed: the price]** — Most of that traffic is people looking, not buying. So serve it from a CDN, servers close to the fans that keep a copy. The price: a few seconds of lag, so a fan may click a seat that's gone. The one-step write still decides who gets it.
    _Visual:_ shows cdn; fans → cdn "seat map"; note "Reads → CDN, not the backend"; note "Map can lag: some click a gone seat".

20. **Where it still breaks** (board) **[changed: stateful named; the mechanism instead of an invented number]** — But every purchase still ends in the same database, which is stateful: it holds the seats. You can add servers, but you can't add seats. The price of scaling out: more machines, still one database. The bottleneck moved: a flood of writes, all queuing on the same rows.
    _Visual:_ crowd copies → Database "buy A12"; `meter` on each copy low (about 40 %) while the Database `meter` is at 100 %; note "Database = stateful: it holds the seats"; note "Servers scale. Seats don't." (riser); note "Bottleneck: writes queue on same rows".

### Why not shard the database?

21. **Why not shard?** (board) **[changed: replica defined]** — Why not split the database into shards? Splitting by event helps with many events, but one huge event is a single hot spot: everyone fights for the same rows. And a read replica, a copy for reading, can't take the purchase: seat writes go to one place.
    _Visual:_ note "Sharding: split by event"; note "One event = one hot spot"; note "Replica = a copy for reading only"; note "Seat writes → one place".

### The waiting room

22. **The waiting room** (board) **[changed: the price; shorter]** — Put a waiting room in front. Before the sale, everyone waits on a simple page. At the start, each fan gets a random place in line, so arriving early doesn't help. Then you let people in at the rate your database can handle. The price: some fans wait.
    _Visual:_ shows room; (impact); note "Instead of error pages: a fair line"; a blue flood `crowd` Fans → Room (label "fans + bots"), note "Random order: no prize for refreshing"; the crowd is cleared and a calm packet goes Room → load balancer "next batch"; `meter` on the Database falls to about 55 % (labelled "headroom"); note "Let in what the database can take"; note "Price: some fans wait".

23. **A pass to get in** (board) **[changed: the bypass is shown first; "signed" explained]** — But a fan could skip the line by going straight to the load balancer. So each fan who's let in gets a signed token: a pass nobody can fake. The servers check it on every request. No token, no shopping.
    _Visual:_ fans → lb "skip the line" with the error status (the bypass works: nothing checks yet); then room → fans "token"; fans → lb "token ✓"; note "No token, no shopping"; note "Checked on the server: no skipping".

### Bots

24. **And the bots** (board) **[changed: "many"; rate limit explained; the price]** — One more enemy: bots. A script can open thousands of sessions and grab seats in milliseconds. So many big sales ask fans to register first and cap tickets per person. They also slow any account that acts too fast. The price: sign-up friction, and limits that real fans hit too.
    _Visual:_ fans → room "bot ×1000"; note "Pre-registration: known fans"; note "Limit: tickets per person"; note "Rate limit: per account and device"; note "Price: real fans get limits too".

25. **The room is a target too** (board) **[changed: softer claim]** — The waiting room is a target too. Serve it as a simple static page from the CDN, so it can take the crowd. Make the token expire after a few minutes and tie it to one fan. And give each fan one place in line, however many tabs they open.
    _Visual:_ fans → cdn "waiting page"; note "Room = static page on the CDN"; room → fans "token · expires" with a `clock` ring on the Waiting room (label "Token life", ends "expired"); note "Token expires"; note "Token tied to one fan"; fans → room "10 tabs"; note "10 tabs = 1 place".

### The full flow

26. **The full flow** (board) **[changed: shorter]** — Fans browse the seat map from the CDN, wait in the room, and get in with a token. The load balancer sends them to any copy of the backend, which holds the seat in one atomic step. They pay, and the seat becomes sold. Expired holds go back on sale.
    _Visual:_ one packet runs the whole path while the camera shows everything (`camera: []`): fans → cdn "seat map"; fans → room "wait"; room → lb "token ✓"; lb → copies "buy A12"; copies → db "held IF free"; api → pay "pay"; api → db "sold"; (success); expiry → db "free expired".

### Summary

27. **The path** (summary) **[changed: each piece with its price, and when the simple version was enough]** — Each piece came from a real problem, and each has a price. Two clicks: an atomic update, and the loser picks again. Payment: a hold, and blocked seats. Millions: copies and a CDN, still one database. The line: some fans wait. A local band never needs copies, a CDN or a waiting room. Random line, or first come, first served?
    _Visual:_ points as "problem → piece · price": "Two clicks, one seat → atomic update · the loser picks again"; "Payment takes minutes → hold + safe confirm · blocked seats"; "Millions at once → copies + CDN · still one database"; "Seats are the bottleneck → waiting room · some fans wait"; "A local band → the first version is enough".

### Before you go

28. **Before you go** (list) — Before you go: tell me in the comments how you'd make the line fair, and which system I should design next. If this helped, a like and a subscribe help the channel a lot.
    _Visual:_ items "How to make it fair → comments"; "Next video: you pick the system"; "Like and subscribe if it helped".

## Alternatives named

- Atomic step: a conditional update (the video); in the talking points of 8 (not on screen): row lock, version column.
- Hold: a timestamp on the seat (the video); in the talking points of 11 (not on screen): a key with a time limit.
- Payment race: confirm only if the hold is yours, else refund (the video); authorize first and charge after the seat is confirmed (talking points: it avoids the refund but needs more states).
- Spreading load: copies behind a load balancer (the video); sharding and read replicas are named and ruled out in 21.
- Too many fans at once: a waiting room (the video); error pages are named on screen in 22 and ruled out as random and unfair.
- Fair line: random (the video) or first come, first served; it is the closing question.

## Claims to verify

| Claim | Source / how verified |
| --- | --- |
| 3.5 billion system requests, "4x our previous peak", Eras Tour Verified Fan presale (sale on Nov 15, page dated Nov 19, 2022) | Ticketmaster, "Taylor Swift | The Eras Tour Onsale Explained" (business.ticketmaster.com/press-release/taylor-swift-the-eras-tour-onsale-explained). They are "system requests" and the page attributes the number to bot attacks and fans without codes; it gives no period or per-second rate. Reading it as "one presale" is a reasonable inference (the figure sits in the Verified Fan on-sale section). |
| "Overwhelmed the site" and "some fans can lose the seats in their cart" | Same page: about 15% of interactions had issues, and passcode validation errors made fans lose tickets they had carted. In scene 16 it is said as a symptom of overload ("can even lose"), not as that exact cause. |
| 100,000 fans × 20 refreshes/min ≈ 33,000 req/s | arithmetic: 100,000 × 20 ÷ 60 = 33,333; stated as an example and as "the peak" |
| A total is not a rate | arithmetic: 3.5 billion ÷ 33,333 per second ≈ 105,000 s ≈ 29 hours, so the two numbers are not equivalent (removed from the story map) |
| A conditional update (`... WHERE status = 'free'`) lets only one writer win; the second changes zero rows | PostgreSQL docs, transaction isolation (Read Committed): the second UPDATE waits for the first, then re-checks its WHERE on the new row (postgresql.org/docs/current/transaction-iso.html). Also why many writers on the same rows queue (scene 20). |
| Major payment providers accept an idempotency key and return the first result for a repeated key; they remember each key for a while | Stripe (docs.stripe.com/api/idempotent_requests: Idempotency-Key header, saved response, keys pruned after at least 24 h), Adyen (docs.adyen.com/development-resources/api-idempotency: keys valid 7–14 days), PayPal (developer.paypal.com/api/rest/reference/idempotency: PayPal-Request-Id; "not all APIs support the header"). Said as "the provider" without naming one. |
| "Many big sales ask fans to register first" | Only pre-registration is backed by the Ticketmaster page (Verified Fan: "over 3.5 million people pre-registered"). Per-person limits and rate limits are common practice with no source here, so the voice says "many" and presents them as measures, not as facts about one company. |
| "Under 1 second", "~5 min hold", meters (40 %, 55 %, 100 %) | stated on screen as a target, an example length and illustrative values, not as facts or measurements |

## Shorts (vertical, 45–60 s) — a different pattern each, from `docs/SHAPES.md` §6

Not built until the long video is approved. Today's four Shorts are all the `classic` pattern; the plan:

1. **"Two fans, one seat"** — pattern `code`: title · code (the 5-line conditional update, ≤ 44 chars per line) · board (two clicks, one wins) · summary. Q: "Have you ever been double-booked?"
2. **"Why ticket sites hold your seat"** — pattern `timeline`: title · sequence (pick → hold → pay → expired, with "a few minutes" on the axis) · board · summary. Q: "How long would you hold a seat?"
3. **"Why do big ticket sales crash?"** — pattern `crowd`: title · board (flood crowd + meter at 100 %) · board (waiting room, meter drops) · callout (3.5 billion, counting up) · summary. Q: "Random line or first come, first served?"
4. **"You paid, but the seat is gone?"** — pattern `contrast`: title · compare (naive confirm vs "confirm only if the hold is yours") · board · board · summary. Q: "What else could go wrong when paying?"

## Talking points (`notes`, said not shown)

Kept from the approved draft (1–14: the Ticketmaster explanation and source, conditional update vs row lock vs version column, hold implementations, idempotent payments, virtual waiting rooms, bots, reads vs writes, the fairness trade-off, payment races, webhooks and reconciliation, group locks in a consistent order, the capacity example, waiting-room hardening, general admission with an atomic decrement). **New:**

15. Requirements are the contract: "never sell a seat twice" is a hard rule (consistency over availability for the write); "under 1 second" is a target, not a measured number.
16. Price of each piece, in one line: atomic update → a fan loses the race; group hold → locks held longer; hold → a blocked seat; refund → a late payer is charged then refunded; idempotency key → the provider remembers it; copies → more to run and still one database; CDN → a map a few seconds old; waiting room → some fans wait and it becomes a target.
17. Why a sequence diagram for the race and for the double charge: both bugs live in the *order* and *timing* of messages, which boxes and arrows cannot show.

18. Hot rows: when many writers update the same rows, each UPDATE waits for the one before it (PostgreSQL, Read Committed). That is why "more servers" does not help: the line forms inside the database. No writes-per-second figure is claimed, because there is no source for one.
19. A total is not a rate: Ticketmaster's 3.5 billion is a total of system requests, bots included, with no period given. The 33,000 per second is our own example, labelled as such.
20. Authorize first, charge after: the provider holds the money on the card for a few days and you capture it once the seat is confirmed. It avoids the refund; the cost is more states to manage and an authorization that can expire.
21. Idempotency keys: Stripe, Adyen and PayPal document them (PayPal says not every API supports the header). A key is remembered only for a limited time (Stripe: at least 24 hours; Adyen: 7 to 14 days), so a retry has to arrive inside that window.
22. Sharding by section instead of by event would split a group of four seats across shards, and a cross-shard transaction is exactly the cost we avoid (see `docs/SHAPES.md` §3 on cross-shard writes).
23. Why a line and not error pages: rejecting the extra requests with errors means who gets in is random and rewards whoever retries fastest (often bots); a line is predictable, and a random draw at the start removes the advantage of arriving first.
24. Bots: pre-registration, per-person limits and rate limits each have a cost (friction for real fans, and limits that real fans hit too); none of them stops a determined bot alone, so they are layered.

## Reviewer pass (independent reviewer, `docs/REVIEWER.md`, before any build)

Verdicts on the first draft: **1 Why before what: pass · 2 Trade-offs: fix · 3 Clarity: fix · 4 Structure: fix · 5 Accuracy: fix · 6 Show it: fix · 7 Variety: pass.**

### Must fix: all 7 applied

1. **Scenes 1, 15 and the title: false claim.** "Every time a huge tour goes on sale, the site crashes" is a generalization, and the declared `incident` hook told no incident. Now: "In 2022, a huge tour's presale overwhelmed the ticket site…", the title is "Why do big ticket sales crash?", scene 15 is "Remember that 2022 presale?…", and the caption carries "Ticketmaster, Nov 2022". *Applied.*
2. **Scenes 16–17: a total is not a rate.** The 3.5 billion includes bots and fans without codes and has no period. Scene 16 says "fans and bots"; scene 17 says the total does not tell us how fast, sizes an example, and says "that's the peak". The equivalence "3.5B ≈ 33k req/s" is out of the story map, and the crowd label "×3.5B" became "fans + bots". *Applied.*
3. **Scenes 8, 18, 20: undefined jargon and an invented number.** "Atomic" is defined in 8, "stateless" in 18, "stateful" in 20. "Thousands of writes every second" is replaced by the mechanism (a flood of writes queuing on the same rows); no writes-per-second figure is claimed. *Applied.*
4. **Scenes 9, 12, 13, 19: every price said clearly.** 9 uses "sell" instead of "hold" (no clash with the hold in 11) and says other fans wait; 12 gives both extremes of the hold time; 13 says the fan is charged, then refunded; 19 says a fan may click a seat that is gone. *Applied.*
5. **Scenes 23–24: only benefits, jargon.** 23 now shows the bypass first ("skip the line" fails), then the token ("a pass nobody can fake"); 24 says "many big sales", explains the rate limit and names the price (friction and limits real fans hit). *Applied.*
6. **Scene 14: no everyday analogy in the whole script.** Added the labelled analogy "a receipt number" (same key, same receipt). *Applied.*
7. **Scene 27: 77 words and no "when the simple version was enough".** Now 60 words, with "A local band never needs copies, a CDN or a waiting room", and a fifth point on screen. *Applied.*

### Nice to have

- **Applied:** backend vs API said once (4); "two people have a ticket" instead of "paid" (7); the near-duplicate requirements merged (3); availability goal stated (16); replica defined (21); alternatives named in the talking points (8: row lock, version column; 11: key with a time limit); "instead of error pages" on screen (22); 22 and 26 trimmed to 48–50 words; a clock on "Token expires" (25); the last message of 14 labelled "sold IF mine"; meters and clocks marked as illustrative; the claims table and talking points extended.
- **Left open on purpose:** scenes 2, 6 and 10 are still static callouts (a `callout` has no steps in the engine; they are 14–19 words, about 5–7 s, so they stay short); the "authorize first, charge after" alternative lives in the talking points only (scene 13 is already full of notes); the `post-mortem` shape for more variety (not for this round: the third progressive long video in a row is a known repeat).

### Claims checked by the reviewer

Verified against the sources in the table above: Ticketmaster figures (3.5 billion system requests, "4x our previous peak", Nov 2022, 15% of interactions with issues); the conditional update (PostgreSQL docs); idempotency keys (Stripe, Adyen, PayPal). Softened: "every time" (removed), "most providers" (now "the provider"), "big sales ask…" (now "many"), "millions of visitors" (now "the crowd"). Wrong and removed: "3.5B ≈ 33k req/s"; "thousands of writes every second".
