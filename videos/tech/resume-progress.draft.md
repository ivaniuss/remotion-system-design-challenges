# Draft: Design "continue where you left off"

`resume-progress` · en · ~1180 words · ~395 s of speech (~7 min with pauses)

- **Pack:** tech
- **Shape:** progressive — "design X" from scratch: the right home for resume state changes
  with each new requirement (one device → many devices → millions → conflicts).
- **Hook:** broken-thing — the tab closes and the student lands on the home page.
- **Theme:** dark (there is a code scene; the last two long videos were light).
- **Variety check:** last long video `fridge-hack-france` (news-report · headline · light ·
  chart, flow); last tech long `ticket-sale-v2` (progressive · incident · light · TCLB ·
  crowd, meter, clock, sequence). Differs from both in **hook** (broken-thing), **theme**
  (dark) and **signature visuals** (`code` and `compare`, unused in the last 4 long videos).
- **Signature visuals used:** `code` (scene 7, when to save) · `clock` (scene 14, login
  expires after 2 h idle) · `crowd` (scene 17, 20k writes/s) · `meter` (scenes 19–20,
  the database primary filling and draining) · `sequence` (scene 24, the out-of-order save)
  · `compare` (scene 26, when local is enough) · `countUp` callouts (scenes 2, 16).
- **Thumbnail:** long video: "Close the tab. Keep your place." · laptop → phone (client →
  mobile) · sticker "40:12". Shorts: "Don't save on close" (code icon, sticker "hidden");
  "Two kinds of session" (lock → client); "Which device wins?" (mobile vs client, sticker "?").

## Question

Forty minutes into a lesson, halfway through a quiz, the tab closes. You reopen it: home
page, empty quiz. How would you design continue where you left off? Start simple, improve
it only when needed.

## Requirements (what the design must satisfy)

| | Requirement | Number |
| --- | --- | --- |
| Functional | Reopen the app → the same lesson, at the same second | — |
| Functional | A half-finished quiz keeps its answers | — |
| Non-functional | Durability of progress | lose at most 30 s |
| Non-functional | Resume latency | adds < 100 ms to opening the app |
| Non-functional | Scale (final turn) | 1M students, 200k watching at the 8 pm peak |

## Scale estimate (back of the envelope)

- Start: 2,000 students, one laptop each → nothing to scale.
- Peak: 1M students, assume 20 % watching at 8 pm → **200k active**.
- Writes: one save every 10 s per active student → 200k ÷ 10 = **20k writes/s**.
- Reads: only on opening the app; assume each active student opens once per hour →
  200k ÷ 3,600 ≈ **55 reads/s**. Write-heavy, the opposite of most systems.
- After "save smarter" (every 30 s + on pause/lesson change/hide): ≈ 200k ÷ 30 ≈ **7k writes/s**.
- Data: one row per student and course, ~1 KB with a quiz draft → 1M students × 5 courses ×
  1 KB ≈ 5 GB. Still small: the problem is write rate, not size.
- Start check: 2,000 students ÷ 10 s = at most 200 writes/s → one database is plenty.

## Story map (internal; never said as "level" or "version")

| Step | The question that triggers it | What changes | **What it costs** | Its limit |
| --- | --- | --- | --- | --- |
| Start | One student, one laptop | Where you are goes in the URL; the browser keeps the last URL and the quiz draft in local storage; quiz saved a second after the last change, video position every few seconds, and a final save on `visibilitychange` → hidden | Lives in one browser: private mode / clearing data wipes it; shared computers (key by user, clear on logout) | A second device |
| 2 | "What if they continue on the phone?" | Progress table on the server (user, course, lesson, second, quiz answers, saved_at); GET on open, PUT every 10 s + a beacon on hide; local copy kept as cache/offline buffer | A write every 10 s per active student; needs a login; network failures (retry from the local copy) | Login expiry: the login page sends everyone home |
| 2b | "What if they stop using the app for 2 h?" | Separate the two sessions: auth session expires, progress does not; the login page returns to the requested page | The return path must be validated (own-site paths only) or it becomes an open redirect | — |
| 3 | "What if a million students, 200k at once?" | Load balancer + stateless backend copies → bottleneck moves to the single DB primary → save smarter (use the 30 s budget) → if saves outgrow one primary, a database built for writes by key, partitioned by student (or Postgres split by student) | Up to 30 s lost on a browser crash; one more database to run; cross-student queries move to analytics | Two devices disagree |
| 4 | "Phone and laptop both save. Which wins?" | Each save carries when it happened; conditional (atomic) update keeps only the newest | Device clocks can be wrong → many apps also ask "continue on lesson 4 or 3?" | — |

## Scenes

1. **Design "continue where you left off"** (title) — Forty minutes into a lesson, halfway
   through a quiz, the tab closes. You reopen it: home page, empty quiz. How would you design
   continue where you left off? Start simple, improve it only when needed.
   _Visual:_ tag "System design interview", heading on frame 0. Beats on the voice: "Lesson 7 ·
   40:12" (client) → "Tab closed" (client) → "Home page" (client) → "?".

### Start: one laptop

2. **2,000 students** (callout) — Start small. An online course platform with two thousand
   students. Videos, readings and quizzes, and each student studies on their own laptop.
   _Visual:_ "2,000" counting up, caption "students · one laptop each", sfx impact.

3. **Before designing** (list) — Before designing: what must it do, and how well? Reopen the
   app, and you land on the same lesson, at the same second. A half-finished quiz keeps its
   answers. You lose at most thirty seconds of progress. And resuming adds no visible delay.
   _Visual:_ four items appear on the voice: "Same lesson, *same second*" · "Quiz answers
   *survive*" · "Lose ≤ *30 s* of progress" · "Resume adds < *100 ms*".

4. **What you already have** (board) — Your platform already has the usual pieces. The
   frontend, the app in the browser. The backend, with its REST API: the backend is everything
   on your server, the API is its door. And a database with courses and users.
   _Visual:_ Frontend (client) → Backend "REST API" → Database appear one by one; note
   "Backend = your server · API = its door".

5. **The URL is state** (board) — First idea, and it's free: put where you are in the URL.
   Lesson seven, minute forty. Refresh, go back or share the link, and you land in the same
   place. But close the tab and open the site fresh? Home page again.
   _Visual:_ note "/lesson/7?t=2412" near Frontend; packet Frontend → Backend "GET /lesson/7";
   frontend warn; note "Fresh open → *home page*".

6. **Local storage** (board) — So the browser remembers it. Local storage is a small key value
   store inside the browser, and it survives closing the tab. Save the last URL and the quiz
   draft there. On open, the frontend reads it and jumps straight back. No server change at all.
   _Visual:_ "Local storage" node under the Frontend; packet Frontend → Local storage "last URL +
   quiz"; packet back "lesson 7 · 40:12"; frontend ok.

7. **When to save** (code) — When do you save? Not when the page closes: on phones, that event
   often never fires. Save as they go: quiz answers a second after the last change, the video
   position every few seconds. And save when the page gets hidden: that's the last moment you
   can count on.
   _Visual:_ ~11 lines of TS: `save()` writes `{url, t, quiz}` to `localStorage`; the quiz input
   calls a 1 s debounced save; `setInterval(save, 5000)` while the video plays; a
   `visibilitychange` listener calls `save()` when `document.hidden`. Steps highlight the
   debounce, the interval, then the listener (note "Not *unload*: *visibilitychange*").

8. **Is anything else needed?** (board) — For one laptop, is anything else needed? No. No new
   servers, no new tables, and resuming is instant. The cost: it lives in one browser. Private
   mode or clearing data wipes it. On a shared computer, key it by user and clear it on logout.
   _Visual:_ camera on the whole board, frontend and local storage ok; notes "Ships today: *no
   server change*" → "Cost: *one browser only*".

### What if they switch devices?

9. **2 devices** (callout) — Now, what if they study on the laptop at night, and continue on the
   phone on the bus? Does this design hold?
   _Visual:_ "2 devices", caption "laptop at night · phone on the bus", over the dimmed board,
   sfx impact.

10. **What breaks** (board) — The phone has its own browser, and its own local storage. Empty.
    Your progress is stuck on a laptop at home. The code isn't the problem. Local storage
    belongs to a device, and progress belongs to a person.
    _Visual:_ "Phone" (mobile) appears; packet Phone → its storage "last URL?" returns
    "empty"; Phone error (riser); note "Device ≠ *person*".

11. **Progress on the server** (board) — So progress moves to where the person is: your
    server. A progress table, one row per student and course: the lesson, the second, the quiz
    answers, and when it was saved. On open, any device asks the API for it.
    _Visual:_ "Progress" table appears beside the database (sub "lesson · second · quiz");
    packet Phone → Backend "GET /progress" → "lesson 7 · 40:12"; Phone ok.

12. **Saving over the network** (board) — While they watch, the frontend saves the position
    every ten seconds. When the page gets hidden, it sends one last save as a beacon: a small
    request the browser keeps sending even as the page goes away.
    _Visual:_ packets Frontend → Backend "PUT /progress" twice, clock "every 10 s"; packet
    "beacon" on hide; note "*sendBeacon* or *fetch keepalive*".

13. **What it costs** (board) — This has a cost: a write every ten seconds per active student.
    At two thousand students, that's at most two hundred a second: one database is plenty. It
    needs a login, so you know whose progress it is. If the network fails, keep the local copy
    and send it later.
    _Visual:_ note "2,000 ÷ 10 s = *≤ 200 writes/s* → one DB"; note "Needs *login*"; packet
    Frontend → Backend "PUT" fails (warn), retried from local storage; note "Local = *fast copy
    + offline buffer*".

14. **The login expires** (board) — And if they just stop using the app for two hours? The
    login session expires, on purpose, for security. They log back in, and the login page sends
    everyone home. Progress is saved; the redirect forgot it.
    _Visual:_ "Login" (lock) node appears in front of the backend; clock on Login "2 h idle" →
    "expired" (sfx clock); packet Login → Frontend "/home"; frontend warn.

15. **Two kinds of session** (board) — The word session hides two things. Like a hotel: your
    key card expires, your stored luggage doesn't. Who you are should expire. Where you were
    should not. After login, send them back to the page they asked for. Only paths on your own
    site, or attackers can abuse it.
    _Visual:_ notes "Key card: who you are → *expires*" (near Login), "Luggage: where you were →
    *stays*" (near Progress); packet Login → Frontend "back to /lesson/7"; note "Return path:
    *own site only*".

### What if it grows?

16. **1M students** (callout) — The platform grows. One million students, and at eight in the
    evening, say two hundred thousand are watching at once. Does it hold?
    _Visual:_ "1M students" counting up, caption "say 200k watching at 8 pm", sfx impact.

17. **Do the math** (board) — Do the math first. Two hundred thousand students, a save every
    ten seconds: twenty thousand writes per second. Reads only happen when someone opens the
    app: a few dozen per second. This system is almost all writes.
    _Visual:_ crowd flood Frontend → Backend "×20k/s"; notes "200k ÷ 10 s = *20k writes/s*",
    "Reads: *~55/s*, one key lookup each", "Almost *all writes*".

18. **Scale out first** (board) — The standard first step: a load balancer, which spreads
    requests over several copies of your backend. That works because the backend is stateless:
    it keeps nothing between requests. Progress lives in the database, not in a server's
    memory, so any copy can take any save.
    _Visual:_ "Load balancer" (gateway) appears, Backend becomes copies (instances); packets
    spread across copies; note "Stateless: *any copy, any save*".

19. **Where it moved** (board) — But every copy writes to the same database. Its primary, the
    one copy that accepts writes, takes every save. The load grows with every student, and you
    can't just copy it. A read cache or replicas won't help: this is writes.
    _Visual:_ meter on Database 0.95 "writes" (red), Database error, riser; note "Servers scale.
    *One primary doesn't.*"; note "Read cache, replicas → *reads only*".

20. **Save smarter** (board) — The cheap fix first. Your requirement allows losing thirty
    seconds, so use that budget. Save every thirty seconds, plus on pause, on lesson change and
    when the page is hidden. About a third of the writes. The cost: if the browser crashes, they lose
    up to thirty seconds.
    _Visual:_ crowd density drops to many "×7k/s"; meter drops to 0.4; note "20k → *~7k writes/s*";
    note "Cost: up to *30 s* lost on a crash".

21. **A store built for writes** (board) — If saves outgrow one primary, move progress to a
    database built for small writes by key: DynamoDB, Cassandra, or Redis with persistence on.
    Or split Postgres by student. Either way, each save touches one partition, and no single
    student is a hot spot.
    _Visual:_ "Progress store" (db icon, sub "DynamoDB · Cassandra · Redis") appears; Progress table hidden;
    packets Backend → store "user 42"; note "Partition key: *student*".

22. **What it costs** (board) — The cost: one more database to run and back up. And questions
    across students, like how many finished lesson three, get hard there. Send those as events
    to your analytics, and keep the main database for courses, users and payments.
    _Visual:_ notes "+1 database to *run*", "Cross-student queries → *analytics*"; Database
    meter off, Database ok.

### Which device wins?

23. **Which wins?** (callout) — One last question. The phone and the laptop both save progress.
    Which one wins?
    _Visual:_ "Which wins?", caption "two devices, two saves", sfx impact.

24. **Out of order** (sequence) — On the bus, the phone has no signal, so its saves wait. At home,
    the laptop moves you on to lesson four. Then the phone reconnects and sends lesson three, from
    an hour ago. Last write wins, so lesson three wins. You go back an hour.
    _Visual:_ actors Phone · Backend · Progress store · Laptop. Phone → Backend "lesson 3 · saved
    8 pm" (lost); Laptop → Backend → store "lesson 4 · saved 9 pm"; after "+1 h" Phone → Backend
    → store "lesson 3 · saved 8 pm" overwrites; note "Last write wins → *you go back*" (bad).

25. **Keep the newest** (board) — The fix: every save carries when it happened. The store keeps
    it only if it's newer than what it has, in one atomic step: check and write together,
    nothing in between. A late save is ignored. The cost: device clocks can be wrong, so many
    apps also ask: lesson four, or lesson three?
    _Visual:_ packet Phone → store "lesson 3 · 8 pm" bounces "ignored"; note "Write *only if
    newer*"; note "Clocks lie → *ask the user*".

26. **When is local enough?** (compare) — Careful: none of this is always needed. One device, no
    accounts, a form draft? Local storage is enough. Progress that follows a person across
    devices? That's the server. And at millions of saves, a store built for writes.
    _Visual:_ left "Local storage is enough": one device · no accounts · a form draft. Right
    "Server progress": many devices · logged-in users · millions → a write store.

27. **The path** (summary) — Look at the path. We started with the URL and local storage, and
    each piece came when a real problem asked for it. Another device: the server. Millions:
    save smarter and split by student. Two devices: keep the newest. What would you have done
    differently?
    _Visual:_ "One device → *URL + local storage*" · "Many devices → *progress on the server*" ·
    "Millions → *save smarter, split by student*" · "Two devices → *keep the newest*" + cta
    "What would you have done differently?".

28. **Before you go** (list, long YouTube video only) — Leave your answer in the comments, and
    tell me which system we design next: a URL shortener, a chat, or a payment system. If this
    helped, a like and a subscribe help the channel a lot. See you in the next one.
    _Visual:_ "Your answer → *comments*" · "Next video: *you pick the system*" · "*Like* and
    *subscribe* if it helped" (bell).

## Alternatives named

- **Where the state lives:** URL (shareable, survives refresh) · `sessionStorage` (one tab,
  gone when it closes) · `localStorage` (one browser) · IndexedDB (bigger, async; for offline
  apps) · server table (follows the person). Variable: one device or many.
- **How to save:** debounce on change · interval while playing · `visibilitychange` → hidden
  with `navigator.sendBeacon` / `fetch(..., {keepalive: true})`. Not `unload`/`beforeunload`.
- **Write store at scale:** keep Postgres and save less · Redis with persistence (AOF) · DynamoDB
  · Cassandra. Variable: write rate and how much you want to operate.
- **Conflicts:** last write wins · conditional "only if newer" · keep the furthest point (for a
  progress bar) · ask the user. Variable: how much a wrong answer costs.

## Claims to verify

| Claim | Source / how verified |
| --- | --- |
| `unload`/`beforeunload` are not reliably fired, especially on mobile; `visibilitychange` (hidden) is the last reliable event | MDN "Window: unload event", "Document: visibilitychange event"; web.dev / Chrome "Page Lifecycle API" |
| `navigator.sendBeacon` and `fetch` with `keepalive` deliver small requests while the page is being hidden/unloaded | MDN "Navigator: sendBeacon()", MDN `fetch` `keepalive` |
| `localStorage` survives closing the tab and the browser; `sessionStorage` is per tab and cleared when the tab closes | MDN "Window: localStorage", "Window: sessionStorage" |
| `localStorage` holds only a few MB per origin (≈ 5 MiB) and is synchronous, strings only | MDN "Storage quotas and eviction criteria" (said as "small" in narration) |
| Private mode and clearing site data wipe local storage; Safari can delete script-writable storage after 7 days of browser use without visiting the site | MDN storage docs; WebKit blog "Full Third-Party Cookie Blocking and More" (2020) — in notes only |
| Unvalidated return/redirect URLs are an open redirect vulnerability | OWASP "Unvalidated Redirects and Forwards Cheat Sheet" |
| A cache or read replicas don't absorb writes; every write goes to the primary | general (single-primary replication) |
| Redis (with AOF persistence), DynamoDB and Cassandra are commonly used for high write rates keyed by id | vendor docs; Netflix has written about Cassandra for viewing history (in notes, softened) |
| 20k writes/s and 55 reads/s | own estimate from stated assumptions (20 % online, save every 10 s, one open per hour) |

## Talking points (`notes`, said not shown)

- In an interview, ask first: one device or many? logged in or anonymous? how much progress
  can you lose? how many students at the peak? Those four answers pick the design.
- URL first: anything that defines "where you are" (lesson, tab, filters, page of results)
  belongs in the URL, because refresh, back, bookmarks and shared links then work for free.
  Local storage only remembers which URL was last.
- Storage options in the browser: sessionStorage is per tab and gone when it closes;
  localStorage is per origin, survives restarts, about 5 MiB, synchronous and strings only;
  IndexedDB is async and much bigger, for offline-first apps. Private mode, clearing site data
  and Safari's 7-day cap on script-writable storage (for sites not visited in 7 days of use)
  can wipe it: it is a convenience, not a source of truth.
- Why not save on unload/beforeunload: browsers don't guarantee those events, especially on
  mobile, where apps are backgrounded and killed without closing. MDN and the Page Lifecycle
  docs recommend visibilitychange (hidden) as the last reliable moment, with
  navigator.sendBeacon or fetch with keepalive to send it.
- Shared computers: key the local copy by user id and clear it on logout, so the next person
  never sees someone else's lesson or quiz answers.
- Why not keep progress in the server's session memory: that makes the backend stateful. With
  several copies you need sticky sessions, and a restart or deploy loses it. Progress is data;
  it belongs in a database.
- Two kinds of session: the auth session (a cookie or token) should expire for security; the
  work state should not. After login, redirect to the saved return path, but accept only
  relative paths on your own site (OWASP: unvalidated redirects let attackers send users to a
  phishing page with your domain in the link).
- The math: 1M students, 20 % online at 8 pm = 200k; one save every 10 s = 20k writes/s; one
  open per hour = ~55 reads/s. Data is tiny (~500 MB). The problem is write rate, not size, and
  that is why caching and read replicas don't help.
- A single tuned Postgres primary can take thousands of small updates per second; whether 20k/s
  fits depends on hardware and indexes. The point is that it is the one piece that doesn't scale
  by adding copies, and the load grows with every student. Before changing databases, save
  less: it is free.
- Write-heavy alternatives: Redis with AOF persistence (fast, memory-bound, flush to Postgres
  periodically = write-behind; the cost is losing what wasn't flushed if it dies), DynamoDB
  (managed, partitioned by key, pay per write), Cassandra (built for heavy writes; Netflix has
  written about using it for viewing history). Partition key = student id: no student is hot.
- Conflicts: last write wins is simple but wrong when saves arrive late. A conditional update
  ("UPDATE ... WHERE saved_at < :new") keeps the newest in one atomic step. Device clocks drift,
  so use the server time when the save is online, the client time only for queued offline saves,
  or keep the furthest position per lesson. Many apps show "continue on lesson 4 or 3?".
  In DynamoDB it is a condition expression; in Redis a Lua script; in Cassandra a conditional
  write is a lightweight transaction (Paxos, several round trips, expensive at 7k/s), so the
  cheap way is writing with USING TIMESTAMP = saved_at and letting its last-write-wins keep the
  newest. On opening the app, local copy vs server copy: same rule, newest wins.
- Beacon details: navigator.sendBeacon always sends a POST and can't set custom headers (auth
  goes in the cookie), so the endpoint must accept POST; fetch with keepalive allows PUT and
  headers, with a body limit of about 64 KiB. Avoid unload handlers: they also break the
  back/forward cache.
- Abuse: the server takes the user id from the session, never from the request body (otherwise
  anyone can overwrite someone else's progress: an IDOR). Rate limit PUT /progress per user. If
  progress unlocks certificates, the position the client sends can't be trusted: validate it on
  the server (watched time, not just "t").
- Redis with AOF fsync everysec can lose about one second of writes on a crash, well inside the
  30 s budget.
- Follow-ups an interviewer may ask: how long do you keep progress (forever: it's tiny)? what
  about privacy and deleting an account (delete the rows)? how do you know saves are failing
  (alert on the error rate of PUT /progress)? offline mode (IndexedDB queue + sync on reconnect)?

## Reviewer pass

Separate agent, `docs/REVIEWER.md` rubric. Verdicts: 1 fix · 2 fix (minor) · 3 fix · 4 fix ·
5 fix · 6 fix · 7 pass. No blocking items left after the fixes.

Fixed (all 7 must-fix):
1. Scene 11: the server row now stores the quiz answers (the quiz requirement held only on one
   device); data estimate → ~5 GB.
2. Scene 7: a 1 s debounce never fires while a video plays → quiz debounced, position every few
   seconds, final save on hidden.
3. Scene 14: the cause was wrong (progress was already on the server) → "the login page sends
   everyone home. Progress is saved; the redirect forgot it."
4. Scenes 19/21: "a read cache or replicas"; the new store gets a db icon and its names on the
   node; the trigger is "if saves outgrow one primary"; Postgres split by student is named.
5. Scene 13: adds the "one database is plenty" beat (≤ 200 writes/s at 2,000 students).
6. Timestamps unified (lesson 7 · 40:12; "saved 8 pm / 9 pm"); thumbnail → "Keep your place"
   (the video admits up to 30 s of loss).
7. Scene 19 trimmed and "primary" explained; scene 25 "atomic" explained; scene 15 gets the
   labelled hotel analogy (key card vs stored luggage).

Also applied: "REST API" order, "say 200k" as an assumption, "about a third", softened beacon
wording, abuse / beacon / Cassandra notes.

Left open: scene 18 has no explicit cost clause for the load balancer (scene 19 says it right
after: every copy still shares one database). Opening is TCLB like `ticket-sale-v2`; variety
still passes on hook, theme and visuals.
