# Draft: Who pulled your hand off the *hot pan*?

`hot-pan` · `en` · 685 words · ~263 s of speech (~4:45 with pauses) · YouTube long video (16:9 and 9:16) + 3 Shorts

- **Pack:** science
- **Shape:** `progressive` (pack §2A "from the problem to the mechanism"): the obvious model first (skin → brain → muscle), then honest questions that each add one piece to the same board, like the ticket-sale video grows from 500 seats to millions of fans.
- **Hook:** `incident` (something every viewer has lived: touching a hot pan). Ends in a real question, no brain clickbait.
- **Theme:** `dark` (the look of the neuron film; the last video was `neon`).
- **Variety check** (`npm run fingerprint`; previous long video = `neuron-spark`: unknown shape · surprising-number · neon · `TGHH` · chart):
  - hook: surprising-number → **incident** ✔ differs
  - theme: neon → **dark** ✔ differs
  - visuals: chart → **sequence, clock, board** ✔ differs
  - shape: (none) → progressive · not counted
  → 3 of 5 axes differ (2 needed). To be re-run on the real spec.
- **Signature visuals:** the `body` figure for the whole story (signals along the real nerves), a `chart` of the two pains over time (scenes 11–12), `callout` ×3 for the turns.
- **Everyday anchor:** the hot pan for the whole story; a bumped elbow / stubbed toe for the rubbing turn (we never suggest rubbing a burn).

## Question

"You touch a hot pan. Your hand jumps back before you decide anything, and the real burn hits a moment later. Who moved your hand? Let's start simple and improve the model as we go."

## What the viewer should leave with (replaces "Requirements" for science)

| | Takeaway | Number on screen |
| --- | --- | --- |
| Model | Skin sensors → nerve → brain → muscle works for deliberate moves, but deciding takes time. | heat sensors fire above ≈ 43 °C |
| Turn 1 | A reflex: the spinal cord pulls the hand back without waiting for the brain. | — |
| Turn 2 | Two pains, two fibers: a fast sting (thin myelin) and a slow burn (no myelin). | ≈ 1 m of nerve · a fraction of a second vs ≈ 1 s |
| Turn 3 | Touch can close a "gate" in the spinal cord, and the brain can turn pain down too. | — |

## Numbers (replaces "Scale estimate")

Fingertip → spinal cord ≈ 0.8–1 m of nerve in an adult (rough estimate, depends on height) → fast pain fibers 5–30 m/s ⇒ ≈ 0.03–0.2 s → slow fibers 0.4–2 m/s ⇒ ≈ 0.5–2 s, "about a second". Heat sensors (TRPV1) open above ≈ 43 °C; a pan on the stove is far hotter.

## Story map (internal; never said as "level" or "version")

| Step | The question that triggers it | What changes | **What it costs** | Its limit |
| --- | --- | --- | --- | --- |
| Start | How do you react to anything? | skin sensors → nerve → brain decides → arm muscle | deciding takes time; every moment on the pan is more damage | the hand moved *before* you decided |
| Reflex | "So who decided?" | the spinal cord: a relay neuron passes the signal straight to the motor nerve; the brain is told in parallel | a reflex doesn't think: it can make you drop what you hold | why does it hurt twice? |
| Two fibers | "Why would one touch hurt twice?" | two cables: thin-myelin fast fibers (sting) and unwrapped slow fibers (burn); race on a `sequence` | the burn lingers long after you let go | why does rubbing help? |
| Gate | "Why would touching it hurt less?" | touch fibers switch on inhibitory neurons in the spinal cord: a gate on the pain signal | it only turns the volume down; the injury is still there; the theory is simplified | — |
| Brain's hand | (continues) | signals from the brain can close the gate too: pain is the brain setting the volume | — (left open, see review) | — |
| Recap | — | one packet runs the whole path with `camera: []` | — | — |

## Scenes

1. **Hook** (title) — "You touch a hot pan. Your hand jumps back before you decide anything, and the real burn hits a moment later. Who moved your hand? Let's start simple and improve the model as we go." (35 words)
   _Visual:_ Tag "Science of everyday life", heading "Who pulled your hand off the *hot pan*?" on frame 0. Beats: **Hot pan** (flame) _touch a hot pan_ → **Hand jumps** (hand) _hand jumps back_ → **Burn later** (clock) _real burn hits_ → **?** _Who moved your_.

2. **43 °C** (callout) — "Your skin has heat sensors. Many of them start firing above about forty-three degrees Celsius, the heat of a really hot bath. A pan on the stove is far hotter, so they fire hard." (34 words)
   _Visual:_ "43 °C" (no countUp: a temperature), caption "where many heat sensors start firing", icon flame, sfx `impact`.

3. **The obvious model** (board) — "Here's the obvious model. The sensors in your skin send a signal along a nerve to your brain. Your brain feels the heat, decides it's dangerous, and tells your arm muscles to pull back." (34 words)
   _Visual:_ Board appears: pan, skin, brain, muscle. Packet "heat!" skin → brain, then "pull!" brain → muscle. Note "Simplified model".

4. **Thinking first** (board) — "And for most things, that's how it works. Reaching for a cup, catching a ball: your brain sees, decides, then moves. Is anything missing? For those, no. But think about the pan." (32 words)
   _Visual:_ Brain `ok`; packet "reach" brain → muscle. Note "Deliberate moves: this works".

5. **Deciding takes time** (board) — "Deciding takes time. Your brain has to notice, recognize the danger and plan a move, and every moment on that pan means more damage. Yet your hand moved before you decided anything. So who decided?" (35 words)
   _Visual:_ Brain `busy`, a `clock` on the skin ticking "on the pan"; at _who decided_ brain `warn`, note "The hand moved *first*".

6. **The shortcut** (board) — "Your spinal cord, the thick bundle of nerves that runs down your back. The heat signal gets there first. A small relay neuron passes it straight to the nerve that moves your arm, without waiting for the brain." (38 words)
   _Visual:_ `cord` pops in between skin and brain, the direct edge hides; packet "heat!" skin → cord → muscle, sfx `whoosh`; focus cord. Note "Spinal cord: the *shortcut*".

7. **A reflex** (board) — "The signal also keeps going up to your brain, so you find out what happened. But by then your hand is often already moving. This loop is called a reflex: a shortcut that skips the decision." (36 words)
   _Visual:_ Packet cord → brain "FYI: hot"; muscle `ok`. Note "Reflex = no decision".

8. **The catch** (board) — "The catch? A reflex doesn't think. It can jerk your hand away even while you're holding something you'd rather not drop. Speed beats judgment here, and for heat, that's usually the right trade." (33 words)
   _Visual:_ Focus muscle, `warn`; note "Fast, but it doesn't *think*".

9. **Two pains** (callout) — "But there's a second mystery. You feel a quick, sharp sting, then, a moment later, a deeper burn. Why would one touch hurt twice?" (24 words)
   _Visual:_ "2 pains" with caption "a quick sting, then a slow burn", tone warn, sfx `impact`.

10. **Two cables** (board) — "Because the signal travels on two kinds of nerve fibers. Fast ones, wrapped in a thin layer of myelin, an insulation that speeds signals up. And slow ones, with no myelin at all. Same burn, two cables." (37 words)
   _Visual:_ `fast` and `slow` pop in between skin and cord; packets "sting" on fast and "burn" on slow (slow one visibly behind). Note "Myelin = insulation = *speed*".

11. **The race** (sequence) — "Let's race them. From your fingertip to your spinal cord is almost a meter of nerve. The fast fibers cover it in a small fraction of a second: that's the sting. The slow ones need about a second, sometimes more: that's the burn." (43 words)
   _Visual:_ Sequence actors Fingertip · Spinal cord · Brain. Steps: "sting" fingertip → cord → brain; `after: "+1 s"` then "burn" fingertip → cord → brain. Note "Rough estimate: ~1 m of nerve".

12. **Why keep the slow one** (board) — "So is the slow cable a flaw? Not really. That lasting burn is a good reminder to protect the spot. The price is a pain that lingers long after you've let go of the pan." (35 words)
   _Visual:_ Focus slow; note "The burn *lingers*" (warn).

13. **Rub it** (callout) — "Now something you do without thinking. Bump your elbow or stub your toe, and what do you do? You rub it. And it actually helps a little. Why would touching it make it hurt less?" (35 words)
   _Visual:_ "Rub it" with caption "bumped elbow · stubbed toe", tone info.

14. **The gate** (board) — "Touch travels on thick, fast fibers. When you rub, they switch on small neurons in your spinal cord that act like a gate, turning down the pain signal on its way up. That's an analogy: no real door, just neurons quieting neurons." (42 words)
   _Visual:_ `touch` and `gate` pop in; packet "rub" touch → cord; gate `ok`; the "pain" packet shrinks on its way up (label "pain ↓"). Note "Analogy: a *gate*".

15. **Only a dimmer** (board) — "Scientists call this the gate control theory. Today we know it's simplified, but touch really can dim pain. The catch: rubbing only turns the volume down. It doesn't fix the injury underneath." (32 words)
   _Visual:_ Note "Gate control theory (1965): *simplified*"; then "Dims it. Doesn't *fix* it" (warn).

16. **The brain's hand** (board) — "The gate has a second hand on it: your brain. Signals coming down from the brain can turn pain down too. That's part of why people with a serious injury sometimes feel no pain in the moment. Pain isn't just a signal arriving: it's your brain setting the volume." (49 words)
   _Visual:_ Packet brain → gate "turn it down"; brain `ok`. Note "Pain = the brain *setting the volume*".

17. **The whole path** (board) — "So, back to the pan. Your skin senses the heat. Your spinal cord pulls your hand back without waiting. Fast fibers bring the sting, slow fibers bring the burn, and touch and your brain can turn the volume down." (39 words)
   _Visual:_ `camera: []`: one packet runs pan → skin → cord → muscle while the voice recaps, then fast/slow → brain, then touch → gate.

18. **Remember** (summary) — "Reflexes skip the decision, pain comes on two cables, and a gate can dim it. Think about the last time you stubbed your toe: did you notice the sting, then the burn? Tell me in the comments." (37 words)
   _Visual:_ Points: "Reflexes *skip the decision*" · "Pain comes on *two cables*" · "A *gate* can dim it". CTA "Sting, then burn? Tell me ▶".

19. **Before you go** (list) — "Before you go: answer in the comments, and tell me what's next: why you can't tickle yourself, or why coffee keeps you awake? And if this helped, a like and a subscribe help a lot." (35 words)
   _Visual:_ Outro `list` "Before you go" (`numbered: false`): answer in the comments · next: tickling or coffee? · like & subscribe if it helped (icon bell).


(Total 685 words in 19 scenes. Every scene ≤ 49 words. Cues will be 2–4 words copied from each scene's own narration and checked by `npm run validate`.)

## Visual plan (as built)

The first build used a `board` (cards and arrows) and looked like a software diagram; it was
rebuilt with illustrations, like `neuron-spark`. Same approved narration, word for word.

- Scenes 3–8, 10, 14–17: the `body` figure (a person seen from the side, the nervous system
  inside, a hot pan on a stove under the hand). The heat signal runs up the arm nerve to the
  brain (the obvious model), turns around in the spinal cord (the reflex), the fast fiber
  with myelin and the slow bare fiber light up in turn, touch from the elbow closes the gate,
  a signal comes down from the brain, and the recap plays the whole path.
- Scenes 11–12: a `chart` of "how much it hurts" over time: a sharp sting in a split second,
  then a slow burn about a second later that lingers.
- Callouts (43 °C, 2 pains, Rub it), the hook, the summary and the outro as before.
- Theme `dark` (the look of the neuron film). Thumbnail: the `body` figure with the hand, the
  cord and the arm lit, "Who moved your *hand*?" and the sticker "2 pains".

## Shorts (built: `videos/science/hot-pan-short-*.json`; vertical, 50–70 s, own hook, end with a question + "the full video is on the channel")

| id | Hook | Pattern | Skeleton |
| --- | --- | --- | --- |
| `hot-pan-short-1-reflex` | "Your hand jumps off a hot pan before you decide anything. Who moved it?" | `classic` | title · board (obvious model) · board (spinal shortcut) · board (the catch: a reflex doesn't think) · summary |
| `hot-pan-short-2-two-pains` | "Stub your toe and it hurts twice: a sting, then a burn. Why?" | `timeline` | title · callout "≈ 1 m" · sequence (the race, "+1 s") · board (why keep the slow one) · summary |
| `hot-pan-short-3-rub-it` | "Why does rubbing a bumped elbow actually help?" | `contrast` | title · compare (don't rub vs rub) · board (the gate) · board (the brain's hand) · summary |

Three different patterns, one per turn of the story. `neuron-spark` can later end with "the full video is on the channel" too.

## Thumbnails (new engine feature, built while this draft is reviewed)

- Long video (1280×720): "WHO MOVED YOUR HAND?" + hand and flame icons + "0.03 s vs 1 s".
- Each Short gets a 1080×1920 cover with its own 2–4 words ("REFLEX", "IT HURTS TWICE", "WHY RUBBING WORKS").

## Engine work (after approval)

- Science icons: `hand`, `flame`, `spine`, `muscle` (used by the hook's beats and the callouts).
- A new figure, `body` (`src/figures/body.tsx`), reusable for reflexes, pain, touch and movement, with the prop `pan`.

## Alternatives named / honest limits

- Not every reaction is a reflex: deliberate moves (reaching for a cup) do go through the brain, and the video says that model works for them.
- The withdrawal reflex goes through one or more relay neurons (polysynaptic); some textbooks draw it as direct for simplicity.
- Gate control (Melzack & Wall, 1965) is called a simplified model in the voice; the basic effect, touch dimming pain through spinal inhibition, is what we show.
- No first-aid advice for burns (science pack: no treatments). The rubbing example uses a bumped elbow or a stubbed toe, never a burn.

## Claims to verify

| Claim | Status / source |
| --- | --- |
| Heat sensors (TRPV1) open above ≈ 43 °C | **Verified.** Wikipedia "TRPV1": activated by "temperature greater than 43 °C". Voice: "many of them… above about". |
| Touching a hot stove: receptors → sensory fiber → spinal cord → motor neuron → muscle, without thinking | **Verified.** OpenStax *Anatomy & Physiology 2e*, ch. 14 introduction (hot stove example); Wikipedia "Withdrawal reflex" (sensory neuron → interneurons → motor neurons, "without actively thinking about it"). |
| The brain is informed in parallel; the hand is often already moving | **Softened** with "often". Standard textbook point (the reflex loop is shorter than the path to conscious perception). |
| First pain (sharp, Aδ, myelinated) and second pain (burning, longer, C, unmyelinated) | **Verified.** MSU open textbook *Introduction to Neuroscience*, "Pain" (first/second pain, Aδ ≈ 25 m/s, C ≈ 1 m/s); Univ. of Iowa pressbook "Pain" (hammer example). |
| Aδ 5–30 m/s, C 0.4–2 m/s | **Verified.** Wikipedia "Nociceptor"; Wikipedia "Group C nerve fiber" (≤ 2 m/s). |
| Fingertip to spinal cord ≈ 1 m of nerve | **Estimate.** Arm length + shoulder; said as "almost a meter"; marked as a rough estimate in notes. |
| Rubbing / pressure near an injury dims pain via inhibitory interneurons in the dorsal horn (gate control, 1965, now considered simplified) | **Verified.** Wikipedia "Gate control theory"; Univ. of Iowa pressbook "Pain". |
| Descending signals from the brain can inhibit pain; people can have serious injuries and feel no pain in the moment | **Verified.** MSU open textbook "Pain" ("Individuals can have horrible injuries, yet not experience any pain in the moment"; descending pathways). |
| A reflex can make you drop what you hold | Plausible, not sourced; voice says "can". Look for a source or cut before rendering. |

## Talking points (`notes`, said not shown)

1. Heat: TRPV1 channels open above ≈ 43 °C; other nociceptors respond to higher heat, pressure or chemicals. A pan on the stove is far hotter.
2. The withdrawal reflex is polysynaptic: sensory neuron → one or more interneurons → motor neurons, which also relax the opposing muscle. OpenStax draws it simplified.
3. Why it is not "thinking": the loop hand → spinal cord → arm is far shorter than the path up to the brain and back, and it needs no decision.
4. Back-of-the-envelope race: ≈ 0.9 m / 25 m/s ≈ 0.04 s for the sting; ≈ 0.9 m / 1 m/s ≈ 1 s for the burn. Ranges: Aδ 5–30 m/s, C 0.4–2 m/s.
5. First pain is sharp and well located; second pain is dull, burning, longer and harder to locate (MSU textbook; hammer example).
6. Gate control theory (Melzack & Wall, 1965): large Aβ touch fibers excite inhibitory interneurons in the dorsal horn. Influential, now considered oversimplified.
7. Descending modulation: pathways from the brainstem (e.g. raphe nuclei, serotonin) can inhibit pain signals in the spinal cord. That is part of why injuries sometimes do not hurt in the moment.
8. Pain is an experience with sensory, emotional and cognitive parts; the same signal can hurt more or less depending on context. Kept short in the voice.
9. No first aid or treatment advice: if a burn or a pain worries you, see a professional.
10. Follow-ups for the next video: "Why can't you tickle yourself?" (prediction) and "Why does coffee keep you awake?" (adenosine).

## Reviewer pass

Done as a cold read against `docs/REVIEWER.md`, writing every finding before fixing (no separate agent was started in this session).

| Pillar | Verdict | Evidence |
| --- | --- | --- |
| 1 Why before what | pass | Spinal cord, relay neuron, reflex, myelin, gate are each introduced with their job in the same sentence. |
| 2 Trade-offs / costs | fix → fixed | Each piece now says its cost: deciding takes time; a reflex does not think; the burn lingers; rubbing only dims. Left open: the brain's control has no cost in the voice (possible line: "it can also turn pain up", needs a source). |
| 3 Clarity | pass | Instructor voice, sentences ≤ 20 words, one labelled analogy (the gate); "two cables" follows the real name (fibers). |
| 4 Structure | pass | Hook → scenario → obvious model that works → limit → three turns on one board → recap → summary → outro. |
| 5 Accuracy | fix → fixed | "A few hundredths of a second" → "a small fraction of a second" (5–30 m/s gives 0.03–0.2 s); "already moving" → "often already moving"; removed "for strong pain it barely helps" (no source); "that's why" → "that's part of why". Open: the "drop what you hold" line. |
| 6 Show it | pass | 43 °C callout, `clock` while the brain decides, `sequence` race with "+1 s", packets for every signal. |
| 7 Variety | pass | 3 of 5 axes differ from `neuron-spark`. |

**Must fix (applied):** costs on every piece; the race timing; the two unsourced lines.
**Left open:** a cost for the brain's control (needs a source), and a source for "drop what you hold" (or cut it).
