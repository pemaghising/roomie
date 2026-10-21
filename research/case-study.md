# Roomie: fair isn't equal

**Designing a household app that makes fairness visible, so nobody has to be the one who asks.**

`[IMAGE: Hero, Showcase Container 101:1051, or Home + Chores + Lock-screen screens on the dark #121212 canvas]`

| Role | Team | Timeline | Tools | Platform |
|---|---|---|---|---|
| Lead Graphic Designer (solo): research, strategy, IA, UI | Me, with feedback from Leapfrog UX Bootcamp mentors | 2 weeks | Figma, FigJam, AI-assisted synthesis | iOS & Android · Kathmandu Valley |

**TL;DR**
- **Problem:** Roommates keep things fair with memory, WhatsApp and a chart on the fridge. When schedules change, one person quietly takes on the extra work, and asking for help sounds like an accusation.
- **Solution:** Roomie weights chores by effort, keeps heavy tasks off your busy days, turns missed chores into a pool anyone can claim, and sends the reminder itself.
- **Impact:** A focused V1 of 27 hi-fi screens covering onboarding, chores, pantry and settings. I deliberately cut money and AI features to Phase 2. It hasn't been tested yet; the validation plan is below.

---

## 01 · Context

Roomie is a mobile app for people who share a flat: students, young professionals and friends splitting rent in Kathmandu, Lalitpur and Bhaktapur. Most households already have a system. It's usually a WhatsApp group, a verbal agreement and whoever notices the overflowing bin first.

**Business goal.** Freemium. Core coordination (chores, grocery list, reminders) is free forever, and a household subscription, *Roomie Plus*, unlocks smarter automation later. People acquire it through invitations: every household that signs up brings two or three more users.

**Constraints.**
- **Solo, bootcamp timeline.** Research, strategy and UI were all mine, in about two weeks.
- **Local context.** NPR, eSewa/Khalti/Fonepay for payments, and WhatsApp as the default channel for everything.
- **No engineering partner.** Every feature had to justify its build cost on paper first.
- **Public evidence first.** I built the research on competitor products and real app-store reviews, and treated my personas as hypotheses to test.

---

## 02 · Empathize

**Research goals.** How do households divide chores and costs today? Where does it break? What would make people trust an app to manage something this personal?

**Methods**
1. **Competitor audit:** 6 apps across three rings. Direct competitors are Flatastic, Sweepy, Nipto and Tody; indirect ones are Splitwise and Settle Up. The third ring was the real one: the *habits* (WhatsApp, Google Keep, memory).
2. **App-store review analysis:** for four apps with 94K+ ratings between them, I coded reviews as *Review → Problem → Insight → Opportunity*.
3. **5 Whys:** five problem chains ("one roommate feels they do more", "people forget to settle up"…) traced back to a root cause.

`[IMAGE: Competitive matrix, FigJam 12:647]`

**What I found**

- **The category already exists.** Flatastic already combines chores, shopping and expenses, so "all-in-one" isn't a differentiator.
- **Apps track; they don't manage.** Most answer *what, who, when*. None answer *why this is fair* or *what should change*.
- **Fair isn't equal.** Taking out the trash takes two minutes and a bathroom deep-clean takes forty-five. Counting tasks treats them the same.
- **The burden is thinking, not doing.** Sweepy reviewers describe relief from *not having to think* about cleaning, not from cleaning less.
- **Households aren't static.** Tody reviewers ask for the plan to bend when they travel or get sick.
- **Nobody wants a game imposed on them.** Nipto reviewers want control over the rules.
- **Money needs receipts.** In Settle Up's reviews, trust comes from seeing the breakdown, not just the total.

`[QUOTES: add 2–3 short verbatim lines from the Sweepy / Tody / Settle Up store pages, attributed "App Store review, Sweepy, 2026". Keep each under 20 words.]`

**The gap.** In my audit, no app did schedule-aware allocation or explained its fairness logic. And the strongest competitor wasn't an app at all: it was a group chat that costs nothing and that everyone already uses.

→ **Decision:** Don't position Roomie as "chores + expenses + groceries". Position it as a *neutral third party* that carries the mental and social load.

---

## 03 · Define

**Affinity mapping.** I clustered the review findings, competitor gaps and 5 Whys chains into five themes:

| Theme | What it means |
|---|---|
| The silent burden | One person notices everything and ends up doing it |
| Awkward money | Asking for Rs. 150 back costs more socially than it's worth |
| Grocery confusion | Nobody knows what's shared, what's personal, or what's already bought |
| Real life | Exams, late shifts and travel break fixed rotas |
| Mental load | Coordination lives in memory and a chat that scrolls away |

`[IMAGE: Pain-point clusters, File A 10:163–10:172]`

**Four insights**
1. **Fairness is effort, not count.** A fair system has to weigh tasks.
2. **The real chore is remembering.** Planning, assigning and following up is invisible work.
3. **A reminder from a friend reads as criticism.** The 5 Whys ended at the same place every time: there is no neutral intermediary. *This is still a hypothesis. I haven't validated it with users yet.*
4. **Automation is trusted only when it's explainable.** "Why me, why this week" has to be answerable.

**Proto-personas.** I wrote four personas as working hypotheses and focused on two who sit on either side of the fairness tension:

- **Aarav, 27, software engineer, Kathmandu.** Unpredictable hours. He doesn't want to become "the default apartment manager".
- **Prakash, 30, banker, Pokhara.** He notices every unfinished chore and ends up doing it himself rather than asking twice.

`[IMAGE: Personas, File A 2:4. Caption: "Proto-personas: assumptions to validate, not research findings."]`

**Current-state journey.** A grocery run shows the loop:
1. Someone notices supplies are low.
2. They post in WhatsApp and nobody replies.
3. They buy everything themselves.
4. They calculate each person's share and chase it.
5. Everyone pays, and it all happens again next week.

The chore version is worse. Someone forgets, the other roommate notices, weighs "remind them?" against "avoid drama", and cleans silently. The resentment builds without a word said.

`[IMAGE: Journey map, File A 18:304 + As-is chore loop 34:376]`

**Problem statement**
> Roommates struggle to manage shared chores and groceries fairly because they rely on memory, scattered chats and manual coordination. As schedules change, nobody is clearly responsible for what, which creates mental load, awkward conversations and repeated friction.

**How might we** help roommates share a home in a way that feels fair, effortless, and free from awkward conversations?
- HMW make chore distribution feel fair despite changing schedules?
- HMW reduce the mental load of remembering, coordinating and following up?
- HMW let the system do the reminding, so nobody has to?

**Success criteria** (targets, not results)
- A new household is set up in **under 60 seconds**.
- Every assignment can be explained in **one sentence** ("Heavy task moved off your busy Wednesday").
- **Zero** reminders sent person-to-person for tracked chores.
- In testing, **no participant** describes a nudge as nagging or shaming.

---

## 04 · Ideate

**Going wide.** I ran Crazy 8s against five HMW themes and generated about 25 ideas: a shared task pool, contribution rings, a pre-paid house wallet, "Ours vs. Mine" grocery lists, a 24-hour snooze, a Busy Mode, a WhatsApp bot, location-based reminders, and more.

`[IMAGE: Crazy 8s board, FigJam 39:4160]`

**Filtering.** I used two lenses: an impact/effort matrix for the ideas, and RICE scores for the resulting features.

`[IMAGE: Impact/effort matrix 39:3617–39:3639 + RICE table 18:592]`

What I killed, and why:
- **Gamified leaderboard.** Competing for points turns housemates into rivals. It contradicts the "don't rank people" signal in the research.
- **Chore bounties** (rent discounts for doing someone's chore). They put a price on favours, which is exactly the tension I wanted to remove.
- **In-app eSewa transfers.** A huge legal and engineering lift. Once people know what they owe, they can scan a QR code in the wallet they already use.
- **AI meal planner.** It solves a problem nobody had. The pain was coordination, not cooking.

**The big bet: Smart Division.** One system answers the four insights:
1. **Effort weighting.** Every chore is Light, Medium or Heavy, and rotation balances total effort, not task count.
2. **Availability blocking.** Everyone marks their busy days, and heavy tasks never land on them.
3. **A shared pool.** Missed chores move to a pool anyone can claim, so nobody has to chase anyone.
4. **The app is the messenger.** Nudges come from Roomie, in a tone each person chooses.

**The hardest trade-off: cutting what my own scores ranked first.** My first MVP had six features, including *The Rolling Tab*: a background ledger that settles small expenses monthly. RICE ranked expense tracking joint first (62.5). I moved it, along with AI-based optimisation, to Phase 2 anyway:
- **Money is already served.** Splitwise and eSewa are good enough; the chore half is where nothing works.
- **Money needs a high trust bar.** Reviews show financial features only earn trust with complete, explainable breakdowns. A half-built ledger would cost more trust than it earns.
- **Rules before AI.** V1's rotation is rule-based (effort points + busy days). Rules are explainable by default, which is the trust foundation AI needs later.

→ **Result:** V1 = the chore loop + "Ours vs. Mine" pantry. Phase 2 = the Rolling Tab, Settle-Up QR codes, AI optimisation and receipt scanning.

`[IMAGE: V1 vs Phase 2 roadmap, File A 62:181]`

---

## 05 · Prototype

**Structure.** Four tabs: Home, Chores, Pantry, Profile. With Expenses out of V1, the navigation stays at four and every tab earns its place. I mapped a 38-screen inventory and an end-to-end flow (including the logic behind the screens) before drawing anything, then designed 27 hi-fi screens for the core paths.

`[IMAGE: Sitemap 42:5637 + User flow 75:1612]`

**Key screens: insight → decision**

**60-second onboarding** · *Insight:* if an app needs constant input, it becomes another chore.
Five common chores come pre-selected, and you tap to keep or remove them. You pick your busy days on a single screen and share a six-character code. The progress bar keeps it honest.

`[IMAGE: Onboarding flow 100:724]`

**Effort you can see** · *Insight:* fair isn't equal.
Adding a chore asks for an effort level (Light, Medium or Heavy) before anything else. Every task card carries its effort chip, so the balance is visible at a glance.

**Busy days** · *Insight:* households aren't static.
One promise, in plain words: *"We won't assign you heavy tasks on these days."*

**Missed by roommates → Claim** · *Insight:* reminders between friends read as criticism.
A missed chore doesn't trigger a reminder to the person who missed it. It moves to a "Missed by roommates" list that anyone can claim. The list shows what's undone, not who dropped it.

`[IMAGE: Chore Hub 102:2190: To-do, Add chore, Celebration]`

**Pantry boundaries** · *Insight:* grocery conflicts are about unspoken rules.
Three tabs: Shared, My items, Roommates. Personal items carry a tag: *Do not touch*, *Ask first* or *Shared*. A restock request becomes a claimable chore in the pool, which connects groceries to the chore system instead of building a second one.

`[IMAGE: Groceries 107:1033]`

**Nudges people choose** · *Insight:* nobody wants a game forced on them.
Each person picks a nudge style: *Motivate me* (streaks, emoji, warmth) or *Just the facts* (quiet, text only). The lock screen does the reminding: *"Gentle nudge: the bathroom is waiting for a quick wipe-down."*

`[IMAGE: Nudge Style 110:1038 + Lock-screen 109:2640]`

**Visual language.** My graphic-design background shaped this part. The product is about tension, so the interface is deliberately soft:
- a serif display face for warmth
- one pastel colour per roommate so ownership reads without names
- a small sprout that grows with the household's streak
- celebration moments ("Wonderful job. +1 day streak") that thank people without comparing them

Tone of voice was treated as a UX decision. Every nudge was written to sound like a flatmate who's on your side.

---

## 06 · Test: how I'd validate this

*Roomie hasn't been tested with users yet. This is the plan, not a result.*

**Round 1: moderated usability test** (5–6 people living with roommates in the Kathmandu Valley, ideally two full households; 30 minutes each on the Figma prototype)

| Task | Pass signal |
|---|---|
| Set up a new home and invite a roommate | Done in under 60s without help |
| Add a heavy chore and mark your busy days | Can explain why the chore won't land on those days |
| Claim a chore from "Missed by roommates" | Understands it without guidance; doesn't read it as blame |
| Request a pantry restock | Expects it to appear as a chore |

**The riskiest assumption: do streaks and effort debt feel motivating or shaming?** The research warns against ranking people, but V1 uses streaks and gives heavier loads to people who miss tasks. I'd show both nudge styles and the effort-debt state and ask one question: *"How would you feel if your roommate saw this?"* If more than one participant in five says "judged", streaks become opt-in and effort debt becomes private.

**Round 2: concierge pilot.** Before building anything, I'd run the Sunday chore plan by hand for two households over WhatsApp for two weeks. That tests whether a neutral planner actually reduces friction, which is the core bet, before the code does.

---

## 07 · Reflect

**Fair isn't equal changed how I design.** My first instinct as a visual designer was to make chores look nice. The real work was defining what fair means and making it visible: effort chips, busy days, and a pool with no names attached.

**Cutting my top-scoring feature was the most product-minded thing I did.** RICE said build expenses first. Context said the money half is already solved and needs a trust bar I couldn't reach in two weeks. The scores informed the decision; they didn't make it.

**What I'd do differently.** Everything I know about Roomie comes from public reviews, competitor products and structured reasoning. It's real evidence, but it isn't the people who'll use the app. Next time I'd put the concept in front of real roommates before hi-fi, not after. Two inconsistencies (fixed below) would also have been caught sooner:
- the profile screen shows a household **rank**, which cuts against the no-ranking principle
- the roommates screen lists "Mumbai" in a Kathmandu product

**Next**
1. Run the test plan.
2. Prototype the Sunday plan approval and the celebration moments in motion, where my background can do the most work.
3. Bring back the Rolling Tab in Phase 2, with every calculation explained line by line.
