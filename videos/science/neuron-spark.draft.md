# Draft: How does one neuron *decide* to fire?

`neuron-spark` · `en` · 259 words · ~86 s of speech (~1:30 with pauses) · vertical Short (TikTok / Reels / Shorts)

- **Pack:** science
- **Shape / pattern:** Short, `classic` skeleton (title · figure · chart · chart · figure · callout · figure · summary). One mechanism, told as a single signal's trip. Not `progressive`: there is no "design" that grows, the neuron is the model. No `shape` field in the spec (Shorts have none).
- **Hook:** `surprising-number` (86 billion cells, each making a yes/no call; the real curiosity is "how does one cell decide?"). Ends in a real question, no brain clickbait.
- **Theme:** `neon` (dark tissue + glowing signal, same look as the source film "chispa").
- **Source material:** the artifact "chispa" (66 s, Spanish, 16:9 canvas film). Reused: the order of the story, the facts, the colour language (violet cell, amber signal) and, in the build phase, the neuron drawing itself (see "Engine work").
- **Variety check** (manual: there is no earlier Short in this series, so `npm run fingerprint` has nothing to compare; against the latest Short, `ticket-sale-short-4-payment`: contrast · broken-thing · neon · `TXBB` · compare):
  - hook: broken-thing → **surprising-number** ✔ differs
  - pattern: contrast → **classic** ✔ differs
  - opening: `TXBB` → **`TGHH`** ✔ differs
  - visuals: compare → **chart** (+ `countUp`) ✔ new
  - theme: neon → neon · same
  → 4 of 5 axes differ (2 needed). To be re-run on the real spec.
- **Signature visuals used:** `chart` ×2 (scenes 3 and 4), `figure` ×3 (scenes 2, 5, 7), `callout` with `countUp` (scene 6). No `crowd`/`meter`/`clock`: nothing here is load or waiting.

## Question

"Your brain has about eighty-six billion neurons. Each one keeps getting signals from other cells, and has to decide: pass it on, or stay silent. How does one tiny cell make that call?"

## What the viewer should leave with (replaces "Requirements" for a science Short)

| | Takeaway | Number on screen |
| --- | --- | --- |
| Model | A neuron adds up many small inputs (some push, some brake). | thousands of inputs |
| Mechanism | It fires only when the sum crosses a threshold; the spike is all-or-nothing. | rest ≈ −70 mV · threshold ≈ −55 mV |
| Limit / cost | A stronger push gives more spikes, not bigger ones; every spike costs energy. | ≈ 1 ms per spike |
| Journey | The spike runs down the axon (faster with myelin) and is handed on chemically. | up to ~120 m/s · gap ≈ 20 nm |

## Numbers (replaces "Scale estimate")

86 billion neurons (one study, ± 8 billion) → each listens to thousands of others → inputs are tiny (under 1 mV each), so many are needed → spike ≈ 1 ms → fastest wrapped axons ≈ 120 m/s, unwrapped ≈ 1 m/s → chemical gap ≈ 20 nm. All values are typical textbook values; they vary by cell type and species, and the video says "about", "near", "typical".

## Story map (internal; never said as "level" or "version")

| Step | The question that triggers it | What changes | **What it costs / its limit** |
| --- | --- | --- | --- |
| Hook | How does one cell decide? | the question, 86 billion as the scale | — |
| Signals in | What does it listen to? | dendrites collect thousands of inputs; some push, some brake; the cell body adds them up | model is simplified (said once, on screen) |
| Tipping point | When does "add up" become "fire"? | rest → threshold → spike | one signal alone does nothing: below the line, nothing happens |
| Same spike, more often | What is a spike? | Na⁺ in, K⁺ out, ≈ 1 ms, all-or-nothing | stronger push = more spikes, not bigger; pumps must reset the ions: energy |
| Down the axon | How does it get to the next cell? | the axon; myelin and its gaps | only some axons are wrapped; unwrapped is slower but works |
| Speed | How fast? | 120 m/s vs ~1 m/s | fastest axons only; most are slower |
| The handoff | And then? | electrical becomes chemical across a ~20 nm gap | it is one more input for the next cell: the loop closes |
| Close | — | adds up · threshold · chemical handoff | — |

## Scenes

1. **Hook** (title) — "Your brain has about eighty-six billion neurons. Each one keeps getting signals from other cells, and has to decide: pass it on, or stay silent. How does one tiny cell make that call?" (33 words)
   _Visual:_ tag "Your brain", heading "How does one neuron *decide* to fire?" visible on frame 0. Beats: **86 billion** (icon brain) _eighty-six billion neurons_ → **Signals in** (neuron) _getting signals from_ → **Decide** (idea) _has to decide_ → **?** _How does one_.

2. **Signals in** (figure `neuron`) — "Here's a simplified neuron. Its branches, called dendrites, listen to thousands of other cells. Some signals push it to fire. Others hold it back. Everything flows into the cell body, which adds it all up." (35 words)
   _Visual:_ the whole neuron, drawn top to bottom (dendrites up, terminals down), faint pulses already running. _simplified neuron_ → note "A *simplified* neuron: real ones vary". _called dendrites_ → glow dendrites, dim the rest, label "Dendrites: inputs". _push it to_ → signal dendrites → cell body, label "go". _hold it back_ → second signal, label "brake". _the cell body_ → glow the cell body, label "Cell body".

3. **The tipping point** (chart, `schematic: true`) — "At rest, the inside sits near minus seventy millivolts, a tiny voltage. Each signal nudges it up or down. Reach about minus fifty-five, and the cell fires. Fall short, and nothing happens." (32 words)
   _Visual:_ voltage over time. Y ticks "rest ≈ −70 mV" and "threshold ≈ −55 mV" (typical values, the schematic tag says so). _At rest_ → baseline visible, note "Typical values; they vary by cell". _nudges it up_ → a small bump draws and fades back ("one weak push"). _Reach about minus_ → many small steps climb to the threshold line (mark "threshold"). _the cell fires_ → the spike shoots up and back (sfx `impact`). _nothing happens_ → focus the weak bump, note "Below the line: *nothing happens*".

4. **Same spike, more often** (chart, `schematic: true`) — "That's a spike: sodium ions rush in, then potassium ions flow out, in about a thousandth of a second. It's all or nothing. A stronger push gives more spikes, not bigger ones. And every spike costs energy: pumps push the ions back." (42 words)
   _Visual:_ _sodium ions rush in_ → one spike draws, mark on the rising edge "sodium in". _potassium ions flow out_ → mark on the falling edge "potassium out". _all or nothing_ → note "*All* or nothing". _A stronger push_ → a second line with three spikes of exactly the same height. _costs energy_ → note "Pumps reset the ions: *energy*" (warn).

5. **Down the axon** (figure `neuron`) — "The spike travels down the axon, the cell's long output cable. Many axons are wrapped in myelin, an insulating layer with small gaps. The spike jumps from gap to gap, which speeds it up." (34 words)
   _Visual:_ camera follows the cell down. _travels down the axon_ → signal cell body → terminals, label "Axon: output cable". _wrapped in myelin_ → glow the sheaths, label "Myelin". _small gaps_ → glow the gaps, label "Gap". _gap to gap_ → the pulse flashes each gap in turn. Note "Myelin: *faster*, but not on every axon".

6. **Speed** (callout, `countUp`, tone good) — "In the fastest axons, that's about a hundred and twenty meters per second. Without myelin, closer to one." (18 words)
   _Visual:_ "120 m/s" counting up; caption "fastest wrapped axons · unwrapped ≈ 1 m/s"; icon `neuron`.

7. **The handoff** (figure `neuron`) — "At the end, the signal changes form. Calcium enters, tiny packets release chemical messengers called neurotransmitters, and they cross a gap about twenty nanometers wide. For the next neuron, that is just one more input." (35 words)
   _Visual:_ zoom to the terminals and the next cell's membrane below. _signal changes form_ → glow terminals. _Calcium enters_ → label "Ca²⁺ in". _neurotransmitters_ → signal terminals → next cell, label "chemical". _twenty nanometers wide_ → label "Gap ≈ 20 nm". _one more input_ → glow the next cell, note "Next cell: *one more input*" (good). The camera ends where scene 2 began: the loop closes.

8. **Remember** (summary) — "So a neuron adds up its inputs, fires only past a threshold, and passes the message on. Which should I explain next: how neurons learn, or how a memory forms?" (30 words)
   _Visual:_ points "*Adds up* its inputs" · "Fires only *past a threshold*" · "Passes it on, *chemically*". CTA: "Learn or memory next? ▶". No outro. There is no long video to point to yet, so the closing line is the next-topic question.

(Total 259 words. Every scene ≤ 42 words; cues are 2–4 words copied from each scene's own narration and will be checked by `npm run validate`.)

## Alternatives named / honest limits

- Spiking is the classic model. Not every neuron behaves like this: some sensory neurons (e.g. in the retina) work with graded signals and no spikes; some synapses are electrical (gap junctions), not chemical. Said in `notes`, not in the voice (60–90 s).
- "Jumps from gap to gap" is the standard simplification of saltatory conduction: the signal is regenerated at each gap and spreads passively under the myelin.
- Thin or short axons are often unwrapped; they are slower but the job does not need speed.

## Claims to verify

| Claim | Status / source |
| --- | --- |
| About 86 billion neurons in a human brain | **Verified.** Azevedo et al. 2009, *J Comp Neurol* 513:532–541: 86.1 ± 8.1 billion neurons (4 adult male brains). Read via the MIT CBMM summary; PubMed blocked the fetch. Voice says "about". |
| A typical central neuron receives input from several thousand neurons; a single input is typically under 1 mV; inhibitory inputs fully or partially cancel excitatory ones | **Verified.** University of Washington open textbook, "Summation of synaptic potentials". |
| Rest ≈ −70 mV, threshold ≈ −55 mV | **Verified as typical example values** (rest "about −60 to −80", threshold 10–20 mV above rest). UEN/OpenStax-style A&P, "The Action Potential". Voice: "near", "about"; on screen: "typical values". |
| Peak of the spike (+40 mV in the source film) | **Softened: not stated.** Sources give anything from about +30 to the sodium equilibrium (~+55/+60). The chart shows it as "above zero" with no number. |
| Na⁺ in, then K⁺ out; ≈ 1 ms; all-or-none; stronger stimulus = higher frequency, not bigger spikes | **Verified.** Wikipedia "Action potential" (≈ "a thousandth of a second", "all-or-none", "frequency… correlated with the intensity of a stimulus"); confirm against Kandel / Purves before publishing. |
| Pumps restore the ion gradients and use energy | Standard textbook point (Na⁺/K⁺-ATPase uses ATP). The voice only says "costs energy". Confirm wording against a textbook. |
| Fastest myelinated fibers ≈ 80–120 m/s; unmyelinated ≈ 0.5–2 m/s | **Verified.** Wikipedia "Nerve conduction velocity" (table by fibre type). Voice says "fastest" and "closer to one". |
| Synaptic cleft ≈ 20 nm; Ca²⁺ enters through voltage-gated channels → vesicles fuse → neurotransmitter binds receptors | **Verified.** Wikipedia "Chemical synapse". Range in the literature is about 20–40 nm; voice says "about twenty". |

## Talking points (`notes`, said not shown)

1. 86 billion: Azevedo et al. 2009, *J Comp Neurol* — the isotropic-fractionator count (86.1 ± 8.1 billion), from four adult male brains; individuals differ.
2. Summation: a typical central neuron receives input from several thousand cells; one input is usually under 1 mV, so many must arrive close together in time and space. Inhibitory inputs partly or fully cancel excitatory ones (UW open textbook).
3. Where the spike starts: at the axon initial segment, next to the cell body, which is where the summed signal is checked against the threshold. The video says "cell body" as a simplification.
4. Typical values: rest around −70 mV (range roughly −60 to −80) and threshold 10–20 mV above it. They differ by cell type and species; the film used the textbook example.
5. The spike is all-or-none; intensity is coded by how often the cell fires, not by spike size.
6. After a spike there is a refractory period: that is why it does not run backwards and why firing has a maximum rate. Possible follow-up Short.
7. Cost: every spike lets sodium in and potassium out; the Na⁺/K⁺ pump has to restore the gradients using ATP. Signalling is a big part of the brain's energy budget — cite a source before adding any percentage.
8. Myelin: the signal is regenerated at the gaps (nodes of Ranvier) and spreads passively under the sheath; fastest wrapped fibres ≈ 80–120 m/s, unwrapped C fibres ≈ 0.5–2 m/s. Not every axon is wrapped.
9. Synapse: the chemical step adds a small delay and is probabilistic (a vesicle does not always release). Electrical synapses (gap junctions) also exist.
10. Follow-ups: "Why doesn't the spike run backwards?" · "How do neurons learn? (synaptic plasticity)" · "How does a memory form?" — the closing question collects votes for the next Short.
11. This is a simplified model of one neuron; real neurons vary a lot in shape and in these numbers. Health topics are out of scope: nothing here is clinical.

## Engine work (after the narration is approved; none of it has started)

The engine has no scene that plays an arbitrary canvas, and the only `figure` is the brain. To reuse the "chispa" drawing, add a `neuron` figure:

- `src/figures/neuron.tsx`: SVG port of the artifact's neuron (seeded dendrite tree, spines, cell body, axon, myelin sheaths with gaps, terminals, the next cell's membrane), drawn **top to bottom** so it fits 9:16. Regions: `dendrites`, `soma`, `axon`, `myelin`, `node`, `terminals`, `gap`, `next`. Violet cell, amber signal.
- `src/figures/index.ts`, `src/spec/vocab.ts` (`FIGURES`, `FIGURE_INFO`): register it for the science pack only.
- `src/scenes/FigureScene.tsx`: for a tall figure the labels must sit beside it (like 16:9 does) instead of in rows above and below; small change per figure (a `labels: 'sides'` flag). Probably also let the figure flash the gaps in turn while a signal travels (scene 5).
- Docs: `docs/AUTHORING.md` (figure section), `docs/packs/science.md` (§4, §7 first example), `skills/make-video/SKILL.md`; then `npm run schema`, `npm run typecheck`, `npm run check`.
- Charts (scenes 3–4): need to confirm that `chart` can draw the repeated spikes and the text ticks with `schematic: true`; if not, small tweak.

Not reused: the film's Web Audio sound (pad, clicks, bells). The Short gets the project's voice, music and sfx instead. The Spanish captions of "chispa" stay as they are in the artifact.

## Reviewer pass

Done as a cold read against `docs/REVIEWER.md` (no separate agent was started in this session), writing every finding before fixing. Rubric adapted to the science pack: "requirements / scale estimate" → takeaways and numbers.

| Pillar | Verdict | Evidence |
| --- | --- | --- |
| 1 Why before what | fix → fixed | Scene 2 said "cell body" without its job. Now: "…the cell body, which adds it all up." Every other term (dendrites, threshold, spike, axon, myelin, neurotransmitters) is introduced with its job in the same sentence. |
| 2 Trade-offs / costs | pass | Scene 4: all-or-nothing and the energy cost; scene 5 note: myelin not on every axon; scene 3: one weak push does nothing. Gap: the chemical step is not said to be slower/probabilistic (only in `notes`). Nice to have. |
| 3 Clarity | pass | Sentences 5–14 words, instructor voice, no hype, no format announced. One image is carried by the figure itself (a cable wrapped in insulation); no spoken analogy was added because words are at the limit. |
| 4 Structure | pass | question → model → decision → mechanism and limit → journey → handoff → recap. Every block present. |
| 5 Accuracy | fix → fixed | The film's "+40 mV" peak removed (sources vary). "Several thousand" and "about" hedges kept. Remaining to confirm before rendering: wording of the pump/energy line against a textbook. |
| 6 Show it | pass | Each number is on screen: beat "86 billion", chart ticks, `countUp` "120 m/s", label "Gap ≈ 20 nm". Longest static stretch is the first 2 s of scene 4 (spike draws immediately, so ok). |
| 7 Variety | pass | 4 of 5 axes differ from the latest Short (above). |

**Must fix before building (all applied):** (1) say what the cell body does; (2) drop the unsourced peak value.
**Left open:** the energy wording (confirm against a textbook), and whether to say in the voice that the chemical step is slower (kept out for length).
