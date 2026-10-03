# Decisions & assumptions log: Roomie case study

Format: **decision / assumption**, then source, confidence, and what would change it.

## Phase A: sourcing

1. **No Google Docs, Sheets or Slides links were provided; the four attached .docx files replace them.** I extracted their text to `sources/text/`. "Need access" list: none.
2. **`Day 3 - Primary Research/…docx` is an earlier draft** of `docs/Roomie_Primary_Research_UX_Research_Document.docx`. The only difference is the header, so the `docs/` version is canonical.
3. **`Roomie_Research.docx` is a superset of `Roomie_Problem_Framing_Research_Guide.docx`** (it adds the Business Model Canvas), so it is canonical for problem framing.
4. **Figma MCP `get_metadata` / `get_figjam` overflowed on the large canvases**, so I used read-only Plugin API scripts. Nothing was written to Figma.
5. **None of the three Figma files contains UI (wireframes, hi-fi screens, prototypes or variables).** Design output stops at IA, sitemap, user flows and a 38-screen inventory. This is the biggest gap. See Q2.

## Honesty constraints (non-negotiable)

6. **The 5 primary interviews (P01–P05) are a hypothetical simulation.** The research doc and FigJam 1:13 both say so explicitly. The case study will never present them as real. If you confirm no real interviews happened, I'll frame them as "assumption mapping / proto-personas" and move the weight onto secondary research, which is real: competitor audit and public app-store reviews.
7. **FigJam 39:4175 ("15 realistic raw quotes") is AI-generated sample text.** It will not be used as verbatim participant quotes.
8. **The claim "derived from user interviews and diary studies" (File A 12:22) is unsupported**, so it won't be repeated.
9. **Participant 01 (FigJam 17:961–17:1287) may be a real interview.** Its details differ from simulated P01: 2-bed apartment, one roommate, 1.5 years, uses Google Keep and Splitwise. `Roomie — Key Takeaways.docx` also has non-simulated-sounding findings ("remembering and noticing chores is also a mental burden"). Unconfirmed; see Q1. Until then it's treated as simulated.
10. **Review ratings (Sweepy 4.5★/17.6K, Tody 4.7★/21.3K, Nipto 4.5★/6.4K, Settle Up 4.7★/49K)** come from your FigJam. I'll re-verify them against the stores before publishing and date-stamp them.

## Inferred inputs

11. **Role: solo product designer (research → IA → flows)** within the Leapfrog UX Bootcamp. Sources: Figma file name "Roomie App - UX Bootcamp", "Day 3" folder, all Figma files owned by Pema. Confidence: medium. See Q3.
12. **Timeline: about July–September 2026.** Source: "Day 3" file dated 29 Jul 2026; latest docs dated 26 Sep 2026. Confidence: low–medium.
13. **Tools: Figma, FigJam, Google Docs; AI assistants for synthesis and drafting.** Source: FigJam blocks carry pasted "```xml" fences and "Portfolio Tip" text, which indicates AI-generated content. I'll mention AI-assisted synthesis honestly as a method, not hide it.
14. **Platform: native mobile app (iOS + Android).** Source: BMC channels (App Store, Google Play) and the screen inventory (push, deep links, bottom nav).
15. **Market: Kathmandu Valley, Nepal; NPR; eSewa, Khalti and Fonepay context.** Source: all docs.
16. **Business model: freemium + household subscription ("Roomie Plus").** Source: BMC.
17. **Confidential: no client names or numbers found.** This is a personal bootcamp project. Persona names are fictional and will stay.
18. **Recruiter one-liner (default, overridable):** "A designer who turns a messy social problem into a fair, explainable system, and knows the difference between fair and equal."

## Content decisions

19. **Canonical problem statement = FigJam / File A 18:510** ("Roommates struggle to fairly manage…"). Used verbatim, lightly tightened.
20. **Personas: the 4 in Figma (Aarav 27, Sushmita 22, Prakash 30, Nima 26) are canonical** over the doc versions (Aarav 26, Srijana 22), because Figma is later and more detailed. The case study features **Aarav (primary)** and **Prakash (the "silent burden" carrier)**, because they embody the two sides of the core fairness tension. Sushmita and Nima go into a compact strip.
21. **Affinity mapping exists** (5 themes in the research doc; 4 clusters in Figma). I'll merge them into 5 themes and show the method, not the stickies.
22. **Prioritisation exists** (RICE table + two impact/effort matrices). No reconstruction is needed.
23. **Key design decision to spotlight: "Smart Division"** (effort-weighted chores, Sunday AI draft, human approval, Busy Mode, shared pool). It is the clearest insight → decision chain, and it answers the "fair ≠ equal" finding.
24. **Tension to surface as a trade-off:** the To-Be flow uses streaks and "effort debt", while research says "don't shame or rank". I'll frame this as an open design risk unless told otherwise (Q5).
25. **Expenses are missing from the 38-screen inventory** even though RICE ranks expense tracking #1 (62.5). Assumption: deliberate scope cut, chores and pantry first, because Splitwise already covers money. See Q4.
26. **No usability testing exists.** I'll write a concrete "How I'd validate this" plan and flag it. No fake results.
27. **No metrics exist.** All numbers in Outcome will be labelled as targets.
28. **Visual direction: native to pemaghising.com.np** (dark #121212, Inter + Instrument Serif, purple #a855f7 accent, numbered mono labels, 12-col grid). Roomie's own brand colours are unknown because no UI exists; the tile graphic (140:1097) suggests blue/teal/violet, which sits well with the purple accent.

## Checkpoint answers (2026-09-26)

29. **Research framing = "lead with real data only" (Pema's choice).** Empathize is built on the competitor audit and public app-store reviews (real users' words). Personas are shown as *working hypotheses*. No simulated interview is presented as real, and no fabricated quotes are used. The "verbatim quotes" slot will use short, attributed app-store review lines (re-verified before publishing) instead of "P3, role, age".
30. **Screens exist.** File A has pages *Ideation* (27:375) and *Prototype* (85:740) that my first page listing missed. Final UI = section "Final screens" 166:1098: 27 hi-fi screens in 6 flows. Supersedes #5.
31. **Scope resolved (was Q4):** "V1 MVP vs Phase 2 Roadmap" (62:181) removes the Expense Tracker from V1. The Rolling Tab and Settle-Up QR codes, AI-based chore optimisation, automated cost splitting and receipt scanning all move to Phase 2. V1 = rule-based rotation with effort points + availability blocking + nudges/streaks + effort debt + Ours/Mine groceries. The *why* isn't written down; my inference is that Splitwise/eSewa already cover money, financial trust needs a high bar (Settle Up reviews), and V1 should prove the chore loop first. Presented as a trade-off.
32. **"AI" claims must match V1.** V1 is rule-based, so the case study won't say the V1 app "uses AI". AI features are framed as the Phase 2 direction.
33. **Team (was Q3): solo, with feedback from bootcamp mentors.** No names were given, so the credit line reads "with feedback from Leapfrog UX Bootcamp mentors". Timeline stays inferred as about Jul–Sep 2026 (#12).
34. **Streaks/effort debt vs "don't shame" (was Q5): framed as an open risk to test.** It goes into Test (validation plan) and Reflect.
35. **Recruiter one-liner confirmed: "Fair ≠ equal."** It supersedes the #18 draft and threads through the hero, Define and Reflect.
36. **Case study written (`case-study.md`).** It follows Context → Empathize → Define → Ideate → Prototype → Test → Reflect, because the prompt was truncated after section 4.
37. **Verbatim quotes slot left as a placeholder** for 2–3 real App Store review lines. Persona quotes are fictional, so they aren't used as quotes. Simulated interview data isn't cited; claims that came only from it are either sourced to the reviews, competitor audit or 5 Whys, or marked as hypotheses.
38. **The reasons for cutting Expenses (§04) are my inference** (see #31). Pema should confirm or reword them.
39. **"About ten weeks" and "94K+ ratings" need checking.** The first comes from file dates; the second sums the ratings recorded in FigJam and must be re-verified against the stores.
40. **UI issues found and named in Reflect:** the profile shows "#1 Rank" (110:745), and the roommates screen says "Flat 4B · Mumbai" (115:851). Fix both in Figma before publishing, or keep them as honest reflection. A third was found later: the Home screen's exported nav bar highlights Chores instead of Home. All three are now named in Reflect.

## Checkpoint answers (2026-09-27)

41. **Timeline confirmed: 2 weeks (Pema's correction).** Supersedes #12's "about July–September 2026" and closes #39's "needs checking" — the ~10-week span was a low-confidence inference from file dates, not the real duration. `case-study.md`, `decisions-log.md` and the site all now say 2 weeks. No exact start/end date was given, so none is stated; add one if it should appear.
