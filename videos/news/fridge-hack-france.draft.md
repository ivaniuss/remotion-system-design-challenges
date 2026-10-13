# Draft: Hackers heated French supermarket fridges to 50 °C

`fridge-hack-france` · `en` · ~430 words · ~145 s of speech (~2.5 min with pauses)

- **Pack:** news (new)
- **Shape:** news-report: what happened → who was hit → where → how → why it was possible →
  reactions → timeline → what is unknown → what to do → question → sources
- **Hook:** headline (the fact itself, stated plainly, then the question it raises)
- **Theme:** news (new broadcast look)
- **Signature visuals used:** media (real footage, user supplied) · stats · map · flow · chart ·
  quote · timeline · sources
- **Thumbnail:** "Hacked fridges hit *50 °C*" · fridge icon in error state · sticker "300+ stores"?
  → no: sticker "50 °C" (the one number every source agrees on).

Facts as of **Tuesday 13 October 2026**. The story is still moving: store counts and losses
are provisional and are said as such.

## Scenes

1. **Headline** (headline) — Overnight into Monday, hundreds of French supermarkets lost their
   cold. Nobody broke in. Someone, over the internet, pushed fridges and freezers to fifty
   degrees Celsius. How is that even possible?
   _Visual:_ breaking banner "CYBERATTACK · FRANCE", headline, dateline "Night of 11–12 Oct 2026";
   background: footage M1 (freezer aisle), darkened. Beats: Store → Fridge → 50 °C → ?

2. **The morning after** (media) — On Monday morning, staff found warm freezers and spoiled
   stock. Fresh and frozen food had to be thrown away. Paris prosecutors say the attack also
   caused fires.
   _Visual:_ M2 (discarded food / warm freezer), lower third "Supermarkets across France ·
   Monday 12 Oct".

3. **Who was hit** (stats) — The count is still moving. Intermarché and its Netto stores
   reported between one hundred eighty and three hundred. Carrefour said eighty. U stores, about
   eighty. Monoprix, around thirty. E.Leclerc, several.
   _Visual:_ five figures pop in on their names: "180–300", "80", "~80", "~30", "several".

4. **Across the country** (map) — It was nationwide. In La Haye, in Normandy, one store reported
   eighty degrees, enough to melt equipment. In Haguenau, in Alsace, two stores lost about two
   hundred seventy thousand euros.
   _Visual:_ map zooms from Europe to France; France fills; pins La Haye "80 °C reported",
   Haguenau "€270k, 2 stores". Photo M3 (store front) optional.

5. **How do you hack a fridge?** (flow) — Big stores run their cold cases from one central
   controller. To save trips, maintenance companies reach it over the internet. The attackers
   reached these controllers remotely too, and switched the cases into defrost mode.
   _Visual:_ technician → internet → controller → fridges (green); attacker appears on the same
   internet edge, packet "defrost 50 °C", fridges turn red.

6. **Defrost, stretched** (chart, schematic) — Defrosting is normal. Heaters melt the ice for a
   short while, and alarms expect it. In some stores, according to Le Monde, cycles were stretched
   from one hour to eight. The alarms stayed quiet while the food warmed.
   _Visual:_ temperature curve: normal fridge ~3 °C with short defrost bumps, then the attacked
   curve climbing to 50 °C for hours; mark "alarms delayed".

7. **Why these machines** (list) — The controllers are made by Danfoss, a Danish company. Danfoss
   says most units hit were old models that no longer get security updates. Some newer ones ran
   outdated software. And internet scans found France held about sixty percent of the exposed
   controllers worldwide.
   _Visual:_ 3 items: "Old models: *no more security updates*", "Newer units on *old firmware*",
   "France ≈ *60%* of exposed units found in scans".

8. **Reactions** (quote) — The head of Coopérative U called the attack unprecedented, and of
   extreme gravity. Intermarché's boss spoke of tens of millions of euros in losses nationwide, a
   figure not verified yet.
   _Visual:_ quote card "unprecedented … of extreme gravity" — Dominique Schelcher, CEO,
   Coopérative U; portrait M4 optional. Second line: "tens of millions of euros" — Thierry
   Cotillard, Intermarché (unverified tag).

9. **How it unfolded** (timeline) — The warnings came first. In August, researchers published
   flaws in a Danfoss controller, and updates fixed them. In September, Danfoss flagged another.
   Then came the night of October eleventh. On Monday, the national cyber agency issued an alert,
   and Paris prosecutors opened an investigation.
   _Visual:_ Aug · Sep 18 · Oct 11–12 (red) · Oct 12.

10. **Still unknown** (list, not numbered) — What we don't know yet: who did it, since nobody has
    claimed it. Exactly how they got in. And the final bill. Reports point to stores in other
    European countries too, but none is confirmed.

11. **What stores are told** (list) — The advice from France's cyber agency is direct. Take these
    controllers off the internet, or allow only trusted addresses. Install the fixes, or replace
    old models. And treat any exposed unit as already compromised.

12. **The question** (summary) — Nothing was stolen here. The damage was physical: heat, spoiled
    food, fires. So, should equipment like this be online at all? Tell me in the comments.
    _Visual:_ points "Remote heat, not stolen data", "Old, exposed controllers", "Investigation
    open, no claim yet"; cta "Should a fridge be online?"

13. **Sources** (sources) — Sources are on screen and in the description.
    _Visual:_ AFP · Le Monde · BFM TV · Reuters · TIME · CBS News · CERT-FR (ANSSI) · Danfoss.

## Claims to verify

| Claim | Source |
| --- | --- |
| Overnight 11→12 Oct 2026 (Sun→Mon), hundreds of stores | TIME, CBS, MacGeneration, SOCRadar |
| Defrost forced, 50 °C | BFM TV via TIME/CBS; Les Mousquetaires to Bloomberg (via SOCRadar) |
| Fires; Paris prosecutor investigation (OFAC) | CBS (Paris prosecutors), AFP via L'Avenir |
| Intermarché/Netto 180 (Mousquetaires to TIME) – 300 (BFM/AFP) | TIME, AFP |
| Carrefour 80 | Reuters via CBS |
| U: "fewer than 100", 80 per CEO on Tuesday | AFP via L'Avenir |
| Monoprix ~30, E.Leclerc several | AFP, TIME |
| La Haye (Normandy) store reported 80 °C | TIME |
| Two stores in Alsace (Haguenau) lost €270k | BFM via TIME; La Dépêche via MacGeneration |
| Defrost cycle extended 1 h → 8 h in some cases, delaying alarms | Le Monde via TIME |
| Danfoss AK-SM / AK-SC; most units legacy, no security updates; some AK-SM 800A on old firmware | Danfoss via CBS, SOCRadar |
| France ≈ 60 % of exposed controllers | U.K. Cyber Defence via TIME (Shodan ≈ 65 % per SOCRadar) |
| "unprecedented", "extreme gravity" — Dominique Schelcher | CBS, TIME, MacGeneration |
| "tens of millions of euros" — Thierry Cotillard (unverified) | BFM via TIME, AFP |
| Aug 2026 Claroty flaws in a Danfoss controller, fixed by updates | TIME, SOCRadar |
| 18 Sep Danfoss flagged a flaw (read/write access) | AFP via L'Avenir |
| CERT-FR alert 12 Oct; advice: disconnect or filter, apply fixes, treat exposed as compromised | SOCRadar summary of CERTFR-2026-ALE-012; ANSSI (Strubel) via AFP |
| No claim of responsibility; method not disclosed; other countries unconfirmed | TIME, SOCRadar, MacGeneration |

## Talking points (`notes`)

- Nobody has claimed it. Do not attribute it: a researcher (Bluetouff) warned that blaming a
  country without evidence is premature.
- An E.Leclerc in the Tarn reported a similar break on Dixell regulators (not Danfoss); a link is
  not established.
- Ahold Delhaize reported a separate "cybersecurity incident" the same day; no link established.
- Retailer losses: U's CEO said only a minority of its 80 stores threw stock away; tens of
  thousands of euros in a small store, €180–200k in a hypermarket.
- Insurance may not cover this kind of incident (Intermarché to AFP).
- Danfoss: AK-SM 800 end of life since 2021, AK-SC 355 phased out in 2016.
- Exposure is not compromise: a scan shows a reachable controller, not a hacked one.

## Reviewer pass (fact-check by a separate agent, 13 Oct 2026)

Must fix, all applied in the approved narration (see `fridge-hack-france.json`):
1. Scene 3: Intermarché counts attributed correctly — the owner says ~150–180 (Reuters, TIME); 300 comes from BFM/AFP.
2. Scene 6: Le Monde says the cycles were stretched *to delay* the alarms, not that alarms stayed quiet.
3. Scene 7: CERT-FR widened its alert on 13 Oct to Dixell xweb and Copeland xweb; the "60 %" figure (one firm, U.K. Cyber Defence) moved to notes.
4. Scene 11: CERT-FR advice reworded to its text — remove internet exposure, access only via VPN/protected network (IP filtering only as an emergency), update, change default passwords; exposed EOL units very likely compromised.
5. Scene 12: "Nothing was stolen" → "No data theft has been reported".

Also applied: attacks probably still ongoing (CERT-FR) in "Still unknown"; "some equipment caught fire"; La Haye attributed to an Intermarché; quote order as said; "flaws that updates had fixed".

Approved by the user on 13 Oct 2026.
