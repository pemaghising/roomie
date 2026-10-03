# Figma inventory — Roomie

Access confirmed via `whoami` (Pema Ghising, pemaghising@lftechnology.com).
`get_metadata` and `get_figjam` failed on the large canvases (response too big), so I mapped them with read-only Plugin API calls. **No wireframes, hi-fi screens, prototypes or design-system variables exist in any of the three files**, so `get_variable_defs` returned nothing useful.

## File A: Roomie App — UX Bootcamp (`54WDfpLvnPKcWRnswVdOSd`), page "Primary Research" (0:1)

| Frame / section | ID | What it shows | Phase |
|---|---|---|---|
| roomie-user-personas | 2:4 | 4 personas: Aarav (busy professional), Sushmita (student), Prakash (responsible roommate), Nima (freelancer), each with a quote | Define |
| as-is-flow-diagram | 8:4 | Household-need loop: chore/grocery/expense → awkward conversation → mental load on one person → repeat | Define |
| Pain-point clusters | 10:163, 10:166, 10:169, 10:172 | 4 clusters: Ownership & Mental Load, Money & Groceries, Communication & Scheduling, Root Problem | Define (affinity) |
| pain-points-doc | 12:22 | 7 numbered pain points + final insight ⚠ claims "interviews and diary studies". Don't repeat that claim | Define |
| Journey Map — Aarav (27) | 18:304 | 5-stage grocery journey (trigger → resolution): actions, thoughts, emotion, touchpoints, pains, opportunities | Define |
| 5 Whys Summary | 18:505 | 5-level root-cause table | Define |
| Problem Statement | 18:510 | Canonical problem statement | Define |
| HMW: Main Challenge + 5 themes | 18:423, 18:436–18:456 | Core HMW, top 5 HMWs, HMWs per theme | Define |
| Impact vs Effort (4 quadrants) | 16:198, 16:209, 16:219, 16:228 | Feature matrix + reviewer note "change it to urgent vs important" | Ideate |
| MVP sticky | 18:727 | MVP = highest RICE: chore board, expense tracking, bill split, grocery list, rotation | Ideate |
| RICE table | 18:592 | 10 features scored | Ideate |
| As-Is Chore Flow (×2, duplicate) | 34:376 / 34:431 | "Memory & anxiety loop" (Aman forgets, Sneha does it silently, resentment) | Define |
| To-Be Chore Flow | 37:416 | "Positive reminder system": nudge, streak, shared pool, effort debt, zero nagging | Ideate / Prototype |
| Frame 1 | 34:377 | Empty | — |
| image | 140:1097 | Decorative isometric-tile graphic (possible cover art) | Hero? |

## File B: Roomie (`E0IAAoWXoQSHtyOkmRoNZz`), page "Discovery" (0:1)

| Frame | ID | What it shows | Phase |
|---|---|---|---|
| ROOMIE BMC | 1:2 | Business Model Canvas (9 blocks; freemium + Roomie Plus) | Context |

## File C: Roomie-Discovery FigJam (`m4FLaCbFyU3k9PtOq8CTdh`)

### Page "Discovery" (0:1)
| Section | ID | What it shows | Phase |
|---|---|---|---|
| Hypothetical-research banner | 1:13 | ⚠ "This is a hypothetical research simulation… do not present as real" | — |
| Research Goal / Objectives / Hypotheses | 1:18, 1:67, 1:106 | Research plan | Empathize |
| Target Participants table | 1:251 | P01–P05 (simulated) | Empathize |
| Participant Summaries + Response Matrix | 1:348, 1:378 | Simulated interview synthesis | Empathize |
| Secondary: Research Overview | 12:586 | Direct, indirect and habit competitors | Empathize |
| 01 Competitive Analysis | 12:647 | 6-app feature matrix + 4 findings | Empathize |
| 02 Ratings & Reviews Analysis | 12:860 | Review → insight → opportunity (Sweepy, Tody, Nipto, Settle Up) | Empathize |
| 5 Whys Hypothesis | 12:1631 | 5 problem chains → root causes | Define |
| Research Synthesis | 12:1066 | Six major insights | Define |
| Opportunity Space | 12:1112 | Value prop + 5 AI roles | Define / Ideate |
| Interview guidelines (×2) | 16:695–16:893 | Interview protocol | Empathize (method) |
| Participant 01: young professional, Kathmandu (×2 layouts) | 17:961–17:1080, 17:1209–17:1287 | Detailed single-participant profile with quotes. **Possibly a real interview (unconfirmed)** | Empathize |
| Personas | 26:934–26:1027 | Same 4 personas as File A | Define |
| Pain points, Impact/Effort (several iterations), Journey, HMW (several iterations), RICE | 29:*, 31:*, 32:*, 33:* | Iterations of File A content | Define / Ideate |

### Page "Ideation" (38:2967)
| Section | ID | What it shows | Phase |
|---|---|---|---|
| HMW by theme (Silent Burden, Awkward Money, Grocery Confusion, Real Life, Mental Load) | 38:2973–38:3081, 38:3295–38:3327 | Reframed HMWs | Define → Ideate |
| All ideas / Crazy 8s | 39:4140, 39:4160 | ~25 raw ideas across 5 HMWs | Ideate |
| ⚠ "15 realistic raw quotes" | 39:4175 | **AI-generated sample quotes. Must not be presented as participant quotes** | Do not use |
| Feature Prioritization Matrix | 39:3617, 39:3625, 39:3631, 39:3639 | Idea-level impact/effort (Ours vs Mine, Swap/Snooze, Rolling Tab, Contribution Visualizer; "don't build" in-app eSewa, AI meal planner) | Ideate |
| Problem statement shape | 39:4755 | Same statement | Define |
| Information Architecture (5 hubs) | 39:5356–39:5501 | Home, Chores, Groceries, Expenses, Profile: goals + components | Prototype (structure) |
| IA Sitemap diagram | 42:5637 | Sitemap tree | Prototype (structure) |
| "Smart Division" strategy | 44:6477 | Effort weighting, Sunday AI draft, human approval, Busy Mode, shared pool | Ideate (key decision) |
| User flow end to end | 54:974 | Auth → household → availability → chores → pantry → settings, with backend logic | Prototype (flow) |
| Screen inventory (38 screens, ×3 iterations) | 57:3292–58:4200 | 5 phases, 38 screens. ⚠ **No Expenses screens**, although RICE ranks expenses #1 | Prototype (scope) |
| Swimlane flow chart (Arun / system / Varun) | 59:4283 | Missed chore → shared pool → effort debt → Sunday rebalance | Prototype (flow) |

## Downloaded renders (`sources/figma/`)
- `uxbootcamp-page.png`: overview of File A
- `journey-map-aarav.png`: journey map 18:304
- `five-whys.png`: 5 Whys 18:505
- `image-140-1097.png`: decorative tile graphic

## Added after checkpoint: File A pages "Ideation" (27:375) and "Prototype" (85:740)

| Section | ID | What it shows | Phase |
|---|---|---|---|
| ❌ MVP Features – Discontinued | 34:486 | Earlier 6-feature MVP (incl. Rolling Tab) | Ideate (scope history) |
| V1 MVP vs Phase 2 Roadmap | 62:181 | Expenses + AI optimisation moved to Phase 2 | Ideate (trade-off) |
| ROOMIE – Wireframe | 51:1067 | Low-fi wireframes | Prototype |
| IA / End-to-End Journey / Screen list / User flow | 34:999, 44:1000, 72:1601, 75:1612 | Structure & flows | Prototype |
| Chore Engine: To-Be flow | 75:4347 | Chore logic | Prototype |
| inspirations / generated screen / variation-board | 94:1787, 102:2182, 101:744 | Visual exploration | Prototype (visual) |
| Brand Deck – Presentation Slides | 114:1018 | Brand system | Prototype (visual) |
| Showcase Container | 101:1051 | 1440×900 showcase, possible hero | Hero |
| **Final screens** | **166:1098** | 27 hi-fi screens: Onboarding 100:724 (8), Home 96:1798 (1), Chore Hub 102:2190 (3), Groceries 107:1033 (9), Profile & Settings 110:1038 (5), Lock-screen notifications 109:2347 (1) | Prototype |
