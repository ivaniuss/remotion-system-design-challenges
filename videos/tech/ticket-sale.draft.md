# Draft: Why does every ticket sale crash?

`ticket-sale` · en · pack tech · long video ~7 min, 1031 words (horizontal) + 4 Shorts (vertical)

## Question

Every time a huge tour goes on sale, the site crashes. So how would you design ticket
sales? Like a real project: start with something simple that works, and fix it only
when it breaks.

## How this video teaches

- **Progressive build**: a version that works for a local band → "what if two fans click
  the same seat?" → "what if paying takes minutes?" → "what if millions arrive at once?"
- **Every piece earns its place**: atomic update, hold with expiry, expiry job, waiting
  room, signed token, each with what it is and why.
- **Blame the mechanism**: the crash isn't "bad servers": it's everyone arriving in the
  same minute for a fixed number of seats, and the database deciding who gets each one.
- **Never imply the simple design always fails**: 500 seats over a day needs none of this.

## Versions (internal map)

| Version | Question that triggers it | Design | Its limit |
| --- | --- | --- | --- |
| Simple | Local band: 500 seats, a few hundred fans over a day | Fans → backend → database (seat: free/sold) | Two clicks on the same seat at once |
| Atomic | "Two fans click A12 at the same moment" | "Mark sold only if still free" in one step | Paying takes minutes |
| Hold | "Paying isn't instant" | free → held (expires) → sold, a job frees expired holds | Payment races |
| Payments | "The hold expires while paying" / "the backend crashes after charging" | Confirm only if the hold is still yours, else refund; idempotency key per payment | Millions arrive in the same minute |
| Scale out | "3.5 billion requests" (≈ 33k req/s in the example) | Load balancer + stateless copies, seat map on a CDN | Writes for the same seats: the database is the hot spot (sharding by event doesn't help) |
| Waiting room | "Servers scale, seats don't" | Waiting room, random order, let in at capacity, signed token; bots; the room itself hardened (static on CDN, token expires and is tied to one fan, one place per fan) | — |

## Board

```
[Fans] ── [Waiting room] ── [Load balancer] ── [Backend] ── [Payments]
[CDN]                                         [More copies]  [Database]
                                                             [Hold expiry]
```
Icons: users (fans) · ratelimit (waiting room) · gateway (load balancer) · api (backend)
· instances (more copies) · external (payments) · cdn (seat map) · db (database: seats) ·
scheduler (hold expiry job). Pieces appear when the story needs them: payments with the
hold, the expiry job when a fan walks away, copies + load balancer + CDN at the traffic
turn, and the waiting room last. Horizontal only (5 columns).

## Scenes (long video)

1. **Why does every ticket sale crash?** (title) — Every time a huge tour goes on sale, the site crashes. So how would you design ticket sales? Like a real project: start with something simple that works, and fix it only when it breaks.
   _Visual:_ Tag "System design"; beats "Fans" → "Seats" → "Payment" → "?".

### Start simple

2. **500 seats** (callout) — Start small: a local band, five hundred seats, and a few hundred fans buying over a whole day.
   _Visual:_ "500 seats · a local band · a few hundred fans over a day".

3. **The simple version** (board) — The simple version is three pieces. Fans open the site and pick a seat. The backend checks that the seat is free and marks it sold. And the database keeps every seat with its status.
   _Visual:_ shows fans, api, db; fans → api "buy A12"; api → db "A12 free?"; api → db "A12 = sold"; note "Seats: free or sold".

4. **Need anything else?** (board) — With a few hundred fans spread over a day, that's enough. No queue, no cache, no extra servers. This version works, and you could ship it today.
   _Visual:_ note "A few hundred fans: enough"; note "Every extra piece = one more thing to break"; note "Simple version: works and ships".

### Two fans, one seat

5. **Same seat** (callout) — But what happens when two fans click the same seat at the same moment?
   _Visual:_ "Same seat · two fans click A12 at the same moment".

6. **What breaks** (board) — Both requests ask the database: is A12 free? Both get yes. Both mark it sold. Now two people paid for one seat. That's a race condition: the check and the write were two separate steps.
   _Visual:_ fans → api "A12 ×2"; db → api "free · free"; api → db "sold ×2"; (riser); note "1 seat, 2 tickets"; note "Race condition: check, then write".

7. **One atomic step** (board) — The fix: make the check and the write one step. The backend tells the database: mark A12 sold, only if it's still free. The first request wins. The second changes zero rows, and that fan picks another seat.
   _Visual:_ note "Check + write = one step"; api → db "sold IF free"; db → api "updated: 1"; db → api "updated: 0"; note "Second fan: pick another seat".

8. **Four seats together** (board) — And fans rarely buy one seat; they want four together. If you hold them one by one, the second can fail after the first succeeded, and the fan is left with half a group. So hold all four in one transaction: all or nothing.
   _Visual:_ fans → api "4 seats"; note "Group: 4 seats together"; api → db "A12 ✓  A13 ✗"; note "Partial: half a group"; api → db "hold 4 IF all free"; note "All 4 or none".

### Hold the seat

9. **Minutes** (callout) — Next problem: paying isn't instant. Between picking a seat and finishing the payment, a fan needs a few minutes.
   _Visual:_ "Minutes · between picking a seat and paying".

10. **Hold the seat** (board) — So you don't sell the seat at the click: you hold it. The seat goes from free to held, with an expiry time, while the fan pays. When the payment goes through, it becomes sold.
   _Visual:_ api → db "A12 = held"; note "free → held → sold"; note "Held, with a timer"; shows pay; api → pay "pay"; pay → api "paid"; api → db "A12 = sold".

11. **When they walk away** (board) — And if the fan closes the tab? A small job checks for expired holds every minute and frees those seats, so nobody keeps a seat they never paid for.
   _Visual:_ shows expiry; note "Expiry job: every minute"; expiry → db "free expired"; note "Expired hold → free again".

### When the payment goes wrong

12. **Paid, but too late** (board) — Now a nastier case. The fan pays in the last second, the hold expires while the payment is processing, and another fan takes the seat. Money taken, seat gone. So when the payment confirms, mark the seat sold only if the hold is still theirs. If it isn't, refund.
   _Visual:_ api → pay "pay"; note "Pays at the last second"; expiry → db "hold expired"; note "Money taken, seat gone"; (cash); api → db "sold IF mine"; note "Confirm only if the hold is yours"; pay → api "refund"; note "Not yours? Refund".

13. **Charged twice** (board) — And the backend can crash right after charging, before it marks the seat sold. When the request is retried, it must not charge again. So every payment carries an idempotency key, and the provider returns the first result instead of charging twice.
   _Visual:_ api → pay "pay · key K1"; note "Crash after charging"; api → pay "retry · key K1"; note "Idempotency key: same key, same result"; pay → api "already paid"; note "One charge, even with retries"; (success).

### Millions at once

14. **3.5 billion** (callout) — Now the big one. In 2022, one presale got three and a half billion requests: four times the ticket company's previous peak. What happens to our design?
   _Visual:_ "3.5 billion · requests in one presale · 4× the previous peak".

15. **What breaks now** (board) — Everybody arrives in the same minute and keeps hitting refresh. The backend runs out of capacity, the database is flooded with seat checks, and some fans even lose the seats already in their cart.
   _Visual:_ fans → api "×millions"; fans → api "refresh"; api → db "A12? A13? A14?"; (alarm); note "Random errors, lost carts".

16. **The numbers** (board) — Let's size it, with an example. A hundred thousand fans, each refreshing twenty times a minute, is about thirty-three thousand requests per second. And almost all of it is reads: people looking at the seat map. Buying is a small part, fighting for a fixed number of seats.
   _Visual:_ note "Example: 100k fans × 20 refreshes/min"; fans → api "33k req/s"; note "≈ 33k requests per second"; note "Mostly reads: the seat map"; note "Writes: few, same seats".

### Scale out first

17. **Scale out** (board) — The first move any engineer makes: scale out. The backend doesn't keep anything between requests, so you can run many copies of it, and put a load balancer in front to spread the traffic across them.
   _Visual:_ note "Stateless backend → add copies"; shows copies; shows lb; (impact); lb → copies "requests"; note "Load balancer = spreads the traffic".

18. **Cache what people look at** (board) — And most of that traffic is people looking, not buying: the seat map, refreshed again and again. So serve it from a CDN, servers close to the fans that keep a copy. If the map is a few seconds old, that's fine: the one-step write still decides who gets the seat.
   _Visual:_ shows cdn; fans → cdn "seat map"; note "Reads → CDN, not the backend"; note "Map can lag: the write decides".

19. **Where it still breaks** (board) — But every purchase still ends in the same database, fighting for the same seats. You can add servers, but you can't add seats. The bottleneck moved: now it's thousands of writes for the same rows, every second.
   _Visual:_ api → db "buy A12"; copies → db "buy A12"; note "Servers scale. Seats don't."; (riser); note "Bottleneck: writes on the same rows".

### Why not shard the database?

20. **Why not shard?** (board) — Why not split the database into shards? Sharding by event helps when there are many events, but one huge event is a single hot spot: everyone fights for the same rows. And a read replica can't take the purchase: writes for a seat go to one place.
   _Visual:_ note "Sharding: split by event"; note "One event = one hot spot"; note "Replicas help reads, not the write"; note "Seat writes → one place".

### The waiting room

21. **The waiting room** (board) — So you control how many get in. Put a waiting room in front. Before the sale, everyone waits on a simple page. At the start, they get a random place in line, so arriving early doesn't help. Then you let people in at the rate your database can handle.
   _Visual:_ shows room; (impact); fans → room "wait"; note "Random order: no prize for refreshing"; room → lb "next batch"; note "Let in what the database can take".

22. **A pass to get in** (board) — Each fan who's let in gets a signed token: a pass the servers check on every request. No token, no shopping, so nobody can jump the line by going straight to the load balancer.
   _Visual:_ room → fans "token"; fans → lb "token ✓"; note "No token, no shopping"; note "Checked on the server: no skipping".

### Bots

23. **And the bots** (board) — One more enemy: bots. A script can open thousands of sessions and grab seats in milliseconds. So big sales ask fans to register before the sale, limit tickets per person, and rate-limit each account, so a bot can't take the whole line.
   _Visual:_ fans → room "bot ×1000"; note "Pre-registration: known fans"; note "Limit: tickets per person"; note "Rate limit: per account and device".

24. **The room is a target too** (board) — The waiting room is a target too. Serve it as a simple static page from the CDN, so it can take millions of visitors. Make the token expire after a few minutes and tie it to one fan. And give each fan one place in line, however many tabs they open.
   _Visual:_ fans → cdn "waiting page"; note "Room = static page on the CDN"; room → fans "token · expires"; note "Token expires"; note "Token tied to one fan"; fans → room "10 tabs"; note "10 tabs = 1 place".

### The full flow

25. **The full flow** (board) — Let's run it once. Fans browse the seat map from the CDN, wait in the room, and get in with a token. The load balancer sends them to any copy of the backend, which holds the seat in one atomic step. They pay, and the seat becomes sold. Expired holds go back on sale.
   _Visual:_ fans → cdn "seat map"; fans → room "wait"; room → lb "token ✓"; lb → copies "buy A12"; copies → db "held IF free"; api → pay "pay"; api → db "sold"; (success); expiry → db "free expired".

### Summary

26. **The path** (summary) — Notice the path: we started simple, and each piece arrived when a real problem asked for it. Two clicks on one seat: an atomic update. Payment takes minutes: a hold that expires, and a safe confirm. Millions of visitors: more copies and a CDN. And when the bottleneck moves to the seats themselves: a waiting room. Would you make the line random, or first come, first served?
   _Visual:_ Points: "Two clicks, one seat → atomic update"; "Payment takes minutes → hold + safe confirm"; "Millions of visitors → copies + CDN"; "Seats are the bottleneck → waiting room".

### Before you go

27. **Before you go** (list) — Before you go: tell me in the comments how you'd make the line fair, and which system I should design next. If this helped, a like and a subscribe help the channel a lot.
   _Visual:_ Items: "How to make it fair → comments"; "Next video: you pick the system"; "Like and subscribe if it helped".

## Shorts (vertical, ~50 s, each ends with a question + "full video on the channel")

1. **"Two fans, one seat"** — race condition → one atomic step ("mark sold only if still free"). Q: "Have you ever been double-booked?"
2. **"Why ticket sites hold your seat"** — paying takes minutes → hold with expiry → a job frees expired holds. Q: "How long would you hold a seat?"
3. **"Why every big ticket sale crashes"** — 3.5 billion requests → everyone at once → waiting room, random order, let in at capacity, signed token. Q: "Random line or first come, first served?"
4. **"You paid, but the seat is gone?"** (`ticket-sale-short-4-payment`) — hold expires while paying → confirm only if the hold is yours, else refund → idempotency key for retries. Q: "What else could go wrong when paying?"

## Talking points (said, not shown) — with sources

1. Ticketmaster's own explanation (Nov 19, 2022) of the Eras Tour Verified Fan onsale (Nov 15): 3.5 million pre-registrations, ~1.5 million invited, "3.5 billion total system requests – 4x our previous peak", a "staggering" number of bot attacks, about 15% of interactions had issues, including passcode validation errors that made some fans lose tickets in their carts; still, over 2 million tickets sold that day. Source: business.ticketmaster.com/press-release/taylor-swift-the-eras-tour-onsale-explained.
2. The atomic step is a conditional update (`UPDATE seats SET status='sold' WHERE id='A12' AND status='free'`, then check the affected row count). Alternatives: a row lock (`SELECT … FOR UPDATE`) inside a transaction, or a version column (optimistic locking).
3. Hold implementation: a `held_until` timestamp on the seat (and treat expired holds as free when reading), or a key with a TTL in Redis. The expiry job is optional if reads ignore expired holds; it keeps the data clean. Hold length is a product decision (often a few minutes).
4. Payments: never charge before the hold is confirmed; make the payment call idempotent so a retry doesn't charge twice (next video?).
5. Virtual waiting rooms (e.g. Queue-it): visitors over capacity wait on a separate page; for scheduled sales, early visitors are randomized at the start ("neutralizing any advantage to arriving early"), later arrivals are first come, first served; people are let in at a configured throughput and return with a signed token. A check done only in the browser can be skipped; checks at the server, CDN or load balancer can't.
6. Bots: pre-registration (Ticketmaster's Verified Fan), CAPTCHAs, rate limits per account and device, purchase limits per person.
7. More servers do help the read side (seat maps can be cached and served from a CDN); the contention is on the write: each seat can be sold once.
8. Fairness trade-off: random order is fair to everyone who arrived before the start; first-come rewards whoever has the fastest connection and the most tabs (or bots).
9. Payment races: store who holds the seat and until when (held_by, held_until). Confirm with a conditional update (sold WHERE held_by = this fan AND held_until > now). If the hold was lost while the payment was processing, refund. Many sites also extend the hold while a payment is in progress.
10. Payments are asynchronous too: providers confirm with webhooks that can arrive late or twice, so deduplicate by event id. Use an idempotency key per payment attempt (the provider returns the first result), and a reconciliation job that compares payments with seats to catch the leftovers (charged but not sold, or sold but not charged).
11. Group purchases: hold the seats in one transaction, all or nothing. When several buyers lock overlapping seats, lock them in a consistent order (for example sorted by seat id) to avoid deadlocks.
12. Capacity: 100,000 fans x 20 refreshes per minute = about 33,000 requests per second; this is an illustrative example, not Ticketmaster's data. The point is the ratio: almost all requests are reads (cacheable), while the writes compete for a fixed set of seats. Size for the peak, not the average.
13. Waiting room hardening: serve the room as a static page from a CDN so it does not fall over itself; tokens are signed, short-lived and bound to one fan; one place per account or device so opening ten tabs gives ten chances to nobody. Once inventory hits zero, serve a cached 'sold out' page so the system stops doing seat checks.
14. General admission (no numbered seats): a counter with an atomic decrement (for example Redis DECR) can replace per-seat rows; the rule is the same, one writer decides and the check and the write are one step.
