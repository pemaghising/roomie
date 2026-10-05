// Verbatim markup ported from roomie-case-study/index.html — see raw-section.tsx for why.
export const prototypeHtml = `
<section class="phase ph-pro" id="prototype">
  <div class="wrap">
  <header class="phase-head"><span class="phi" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="6.5" y="2.5" width="11" height="19" rx="2.8"/><path d="M10.5 18.5h3M9.5 7h5M9.5 10.5h5"/></svg></span><span class="num">04</span><h2>Prototype</h2><p>From information architecture and a 38-screen map, through lo-fi wireframes, to 27 hi-fi screens and a visual identity built to lower the temperature.</p></header>

  <div class="block">
    <h3>Information architecture</h3>
    <p class="muted narrow">A one-time onboarding, then four tabs. With Expenses moved to Phase 2, every tab earns its place.</p>
    <div class="tree">
      <div class="root">Roomie</div>
      <div class="branches">
        <div class="card" style="--bg:var(--lav);--fg:var(--lav-ink)"><span class="tab">🚀 Onboarding</span><p class="goal">First open only</p><ul><li>Create or join a home</li><li>Pick suggested chores</li><li>Mark busy days</li><li>Share invite code</li></ul></div>
        <div class="card" style="--bg:var(--sky);--fg:var(--sky-ink)"><span class="tab">🏠 Home</span><p class="goal">Reduce mental load</p><ul><li>Clean-streak card</li><li>Who has what today</li><li>Today’s tasks</li><li>Next up</li></ul></div>
        <div class="card" style="--bg:var(--mint);--fg:var(--mint-ink)"><span class="tab">🧹 Chores</span><p class="goal">No silent burden</p><ul><li>My tasks + effort chips</li><li>Missed by roommates → Claim</li><li>Add chore</li></ul></div>
        <div class="card" style="--bg:var(--peach);--fg:var(--peach-ink)"><span class="tab">🛒 Pantry</span><p class="goal">No grocery confusion</p><ul><li>Shared · My items · Roommates</li><li>Boundary tags</li><li>Restock → chore pool</li></ul></div>
        <div class="card" style="--bg:var(--rose);--fg:var(--rose-ink)"><span class="tab">👤 Profile</span><p class="goal">Adapt to real life</p><ul><li>My busy days</li><li>Nudge style</li><li>Roommates &amp; invite code</li></ul></div>
      </div>
    </div>
    <details class="orig"><summary>See the original sitemap from Figma</summary><div><img src="/assets/flows/ia-sitemap.png" alt="Original information architecture diagram from Figma" loading="lazy"></div></details>
  </div>

  <div class="block">
    <h3>User flow: from download to a working household</h3>
    <p class="muted narrow">Every decision point from the end-to-end flow, simplified. Returning users skip straight to Home.</p>
    <div class="card stack" style="gap:14px">
      <p class="stage-label">Getting in</p>
      <div class="chain">
        <div class="n start">App launch</div><span class="step"><i class="arr"></i><div class="n q">Signed in?<small>Yes → Home</small></div></span><span class="step"><i class="arr"></i><div class="n">Welcome</div></span><span class="step"><i class="arr"></i><div class="n">Sign up or log in</div></span><span class="step"><i class="arr"></i><div class="n q">In a household?<small>Yes → Home</small></div></span><span class="step"><i class="arr"></i><div class="n">Create a home<small>or join with a 6-digit code</small></div></span><span class="step"><i class="arr"></i><div class="n">Pick chores</div></span><span class="step"><i class="arr"></i><div class="n">Busy days</div></span><span class="step"><i class="arr"></i><div class="n">Invite roommates</div></span><span class="step"><i class="arr"></i><div class="n end good">Home</div></span>
      </div>
    </div>
    <p class="stage-label">From Home</p>
    <div class="hubs">
      <div class="card"><svg class="fcs" viewBox="0 0 320 494" style="max-width:320px" role="img" aria-label="Chores hub: done before Sunday gives a celebration and +1 day streak; otherwise the chore goes to the shared pool, a roommate claims it and +3 effort debt is logged. Both paths lead to the Sunday midnight rebalance."><g class="nd good"><rect x="60" y="2" width="200" height="38" rx="12"/><text class="t" x="160" y="27">Chores hub</text></g><path class="ln" d="M160 40V66"/><path class="ah" d="M155 59L165 59L160 66Z"/><g class="dm"><path d="M160 66L234 116L160 166L86 116Z"/><text x="160" y="113">Done before</text><text x="160" y="129">Sunday?</text></g><path class="ln" d="M86 116H88Q80 116 80 124V192"/><path class="ah" d="M75 185L85 185L80 192Z"/><text class="lb l" x="73" y="142">YES</text><g class="nd good"><rect x="8" y="192" width="144" height="54" rx="12"/><text class="t" x="80" y="217">Celebration</text><text class="s" x="80" y="234">+1 day streak</text></g><path class="ln" d="M234 116H232Q240 116 240 124V192"/><path class="ah" d="M235 185L245 185L240 192Z"/><text class="lb r" x="247" y="142">NO</text><g class="nd "><rect x="168" y="192" width="144" height="38" rx="12"/><text class="t" x="240" y="217">Shared pool</text></g><path class="ln" d="M240 230V256"/><path class="ah" d="M235 249L245 249L240 256Z"/><g class="nd "><rect x="168" y="256" width="144" height="56" rx="12"/><text class="t" x="240" y="281">A roommate</text><text class="t" x="240" y="299">claims it</text></g><path class="ln" d="M240 312V338"/><path class="ah" d="M235 331L245 331L240 338Z"/><g class="nd sys"><rect x="168" y="338" width="144" height="56" rx="12"/><text class="t" x="240" y="363">+3 effort debt</text><text class="t" x="240" y="381">logged</text></g><path class="ln" d="M80 246V404Q80 412 88 412H160"/><path class="ln" d="M240 394V404Q240 412 232 412H160"/><path class="ln" d="M160 412V438"/><path class="ah" d="M155 431L165 431L160 438Z"/><g class="nd sys"><rect x="60" y="438" width="200" height="54" rx="12"/><text class="t" x="160" y="463">Sunday midnight</text><text class="s" x="160" y="480">Next week rebalances</text></g></svg></div>
      <div class="card"><svg class="fcs" viewBox="0 0 320 330" style="max-width:320px" role="img" aria-label="Pantry hub: shared items are ticked restocked or requested, and requests land in the chore pool; personal items are added with a boundary tag."><g class="nd peach"><rect x="60" y="2" width="200" height="38" rx="12"/><text class="t" x="160" y="27">Pantry hub</text></g><path class="ln" d="M160 40V66"/><path class="ah" d="M155 59L165 59L160 66Z"/><g class="dm"><path d="M160 66L234 116L160 166L86 116Z"/><text x="160" y="113">Shared or</text><text x="160" y="129">mine?</text></g><path class="ln" d="M86 116H88Q80 116 80 124V192"/><path class="ah" d="M75 185L85 185L80 192Z"/><text class="lb l" x="73" y="142">SHARED</text><g class="nd "><rect x="8" y="192" width="144" height="54" rx="12"/><text class="t" x="80" y="217">Tick restocked</text><text class="s" x="80" y="234">or request a restock</text></g><path class="ln" d="M80 246V272"/><path class="ah" d="M75 265L85 265L80 272Z"/><g class="nd sys"><rect x="8" y="272" width="144" height="56" rx="12"/><text class="t" x="80" y="297">Request lands in</text><text class="t" x="80" y="315">the chore pool</text></g><path class="ln" d="M234 116H232Q240 116 240 124V192"/><path class="ah" d="M235 185L245 185L240 192Z"/><text class="lb r" x="247" y="142">MINE</text><g class="nd "><rect x="168" y="192" width="144" height="38" rx="12"/><text class="t" x="240" y="217">Add an item</text></g><path class="ln" d="M240 230V256"/><path class="ah" d="M235 249L245 249L240 256Z"/><g class="nd "><rect x="168" y="256" width="144" height="70" rx="12"/><text class="t" x="240" y="281">Set a boundary tag</text><text class="s" x="240" y="298">Do not touch</text><text class="s" x="240" y="314">Ask first · Shared</text></g></svg></div>
      <div class="card"><svg class="fcs" viewBox="0 0 320 348" style="max-width:320px" role="img" aria-label="Profile hub: edit busy days so next week’s plan adjusts, pick a nudge style, and manage roommates, invites and log out."><g class="nd rose"><rect x="60" y="2" width="200" height="38" rx="12"/><text class="t" x="160" y="27">Profile hub</text></g><path class="ln" d="M160 40V66"/><path class="ah" d="M155 59L165 59L160 66Z"/><g class="nd "><rect x="60" y="66" width="200" height="38" rx="12"/><text class="t" x="160" y="91">Edit busy days</text></g><path class="ln" d="M160 104V130"/><path class="ah" d="M155 123L165 123L160 130Z"/><g class="nd sys"><rect x="60" y="130" width="200" height="54" rx="12"/><text class="t" x="160" y="155">Next week’s plan adjusts</text><text class="s" x="160" y="172">No heavy chores on busy days</text></g><path class="ln" d="M160 184V210"/><path class="ah" d="M155 203L165 203L160 210Z"/><g class="nd "><rect x="60" y="210" width="200" height="54" rx="12"/><text class="t" x="160" y="235">Pick a nudge style</text><text class="s" x="160" y="252">Motivate me · Just the facts</text></g><path class="ln" d="M160 264V290"/><path class="ah" d="M155 283L165 283L160 290Z"/><g class="nd "><rect x="60" y="290" width="200" height="56" rx="12"/><text class="t" x="160" y="315">Manage roommates,</text><text class="t" x="160" y="333">invite, log out</text></g></svg></div>
    </div>
    <details class="orig"><summary>See the full end-to-end user flow from Figma</summary><div><img src="/assets/flows/user-flow.png" alt="Original end-to-end user flow from Figma with every screen and decision" loading="lazy" style="min-width:900px"></div></details>
  </div>

  <div class="block">
    <h3>One week inside the chore engine</h3>
    <p class="muted narrow">A swimlane of what Rahul, Aman and Roomie each do across a week when a chore gets missed. This is the part of the system that replaces the awkward conversation.</p>
    <div class="scroll">
      <div class="lanes" role="table" aria-label="Chore engine swimlane over one week">
        <div class="th"></div><div class="th">Setup</div><div class="th">Saturday</div><div class="th">Sunday deadline</div><div class="th">Monday</div><div class="th">Sunday midnight</div>
        <div class="who">Rahul<small>Does his share</small></div>
        <div class="cell lane-r"><div class="n r">Creates “Apt 4B”, shares code A3F 92K, sets busy days</div></div>
        <div class="cell lane-r"><div class="n r">Gets a nudge, cleans the bathroom, streak +1</div></div>
        <div class="cell lane-r empty"><div class="n"></div></div>
        <div class="cell lane-r"><div class="n r">Sees “Wipe counters” in the pool, claims it, +3 points</div></div>
        <div class="cell lane-r"><div class="n r">Gets a lighter week</div></div>
        <div class="who">Roomie<small>The neutral third</small></div>
        <div class="cell lane-s"><div class="n sys">Stores busy days, generates the weekly plan</div></div>
        <div class="cell lane-s"><div class="n sys">Sends the Saturday nudge to Rahul</div></div>
        <div class="cell lane-s"><div class="n sys">Detects the missed chore, moves it to the pool</div></div>
        <div class="cell lane-s"><div class="n sys">Logs +3 effort debt against Aman</div></div>
        <div class="cell lane-s"><div class="n sys">Rebalances: one extra heavy chore for Aman</div></div>
        <div class="who">Aman<small>Busy with exams</small></div>
        <div class="cell lane-a"><div class="n a">Joins with the code, sets busy days</div></div>
        <div class="cell lane-a empty"><div class="n"></div></div>
        <div class="cell lane-a"><div class="n a">Misses the deadline, streak resets</div></div>
        <div class="cell lane-a"><div class="n a">Gets a quiet note: the task went to the pool</div></div>
        <div class="cell lane-a"><div class="n a">Sees next week’s plan with the extra chore</div></div>
      </div>
    </div>
    <p class="cutnote"><span class="pill" style="background:var(--amber);color:var(--amber-ink)">Riskiest part</span> Nobody texts anybody, but effort debt could still feel like a penalty. That’s the first thing I’d test (section 05).</p>
    <details class="orig"><summary>See the original swimlane from FigJam</summary><div><img src="/assets/flows/swimlane.png" alt="Original swimlane flow chart from FigJam" loading="lazy" style="min-width:0;max-width:520px;margin-inline:auto"></div></details>
  </div>

  <div class="block">
    <h3>To-be journey: a month with Roomie</h3>
    <div class="scroll">
      <div class="tjourney" role="table" aria-label="To-be journey across a month">
        <div class="rh"></div>
        <div class="st" style="--bg:var(--lav);--fg:var(--lav-ink)">Setup</div>
        <div class="st" style="--bg:var(--sky);--fg:var(--sky-ink)">Daily habits</div>
        <div class="st" style="--bg:var(--peach);--fg:var(--peach-ink)">Grocery run</div>
        <div class="st" style="--bg:var(--rose);--fg:var(--rose-ink)">A missed chore</div>
        <div class="st" style="--bg:var(--mint);--fg:var(--mint-ink)">Sunday balance</div>
        <div class="st" style="--bg:#f3f4f6;--fg:var(--ink-2)">End of month<small>Phase 2</small></div>
        <div class="rh">People do</div>
        <div>Rahul downloads Roomie to avoid flat arguments and finishes setup in under a minute.</div>
        <div>Aman gets a morning nudge for a quick sweep and taps Complete.</div>
        <div>Rahul buys milk and eggs (shared) and protein powder (his).</div>
        <div>Aman is buried in exams and misses the bathroom deadline.</div>
        <div>Sunday arrives. Nobody writes a new rota.</div>
        <div>Rent is due and small expenses need settling.</div>
        <div class="rh">Roomie does</div>
        <div>Marks Mon and Wed as busy, invites Aman, generates the rotation.</div>
        <div>Gave Aman a light chore on his free day; logs a 1-day streak in the feed.</div>
        <div>Ticks shared items in Ours; adds protein to Mine with “Do not touch”.</div>
        <div>Moves the chore to the pool; Rahul claims it; effort debt is logged. No text sent.</div>
        <div>Gives Rahul a lighter week and Aman one extra heavy chore.</div>
        <div>The Rolling Tab shows one number, settled with a saved QR code.</div>
        <div class="rh">Feels</div>
        <div class="feel">😌 Relief<span>No house meeting needed.</span></div>
        <div class="feel">🎯 Rewarded<span>Aman feels done, Rahul feels seen.</span></div>
        <div class="feel">🧺 Organised<span>Everyone knows what’s shared.</span></div>
        <div class="feel">😮‍💨 Stress-free<span>Rahul doesn’t play the parent.</span></div>
        <div class="feel">⚖️ Vindicated<span>Balance restored, no argument.</span></div>
        <div class="feel">🤝 Harmonious<span>Bills paid, still friends.</span></div>
      </div>
    </div>
    <details class="orig"><summary>See the original end-to-end journey from Figma</summary><div><img src="/assets/flows/journey-e2e.png" alt="Original end-to-end user journey from Figma" loading="lazy" style="min-width:900px"></div></details>
  </div>

  <div class="block">
    <h3>Lo-fi wireframes</h3>
    <div class="wire"><img src="/assets/wireframes-crop.png" alt="Six greyscale wireframes: onboarding busy-day picker, dashboard, chores with shared pool, groceries with ours and personal items, expenses rolling tab, profile settings" loading="lazy"></div>
    <p class="cutnote"><span class="pill" style="background:var(--rose);color:var(--rose-ink)">Cut after lo-fi</span> The Expenses &amp; Rolling Tab screen (fifth from left) was designed, then moved to Phase 2. The navigation dropped from five tabs to four.</p>
  </div>

  <div class="block">
    <h3>Visual identity: calm by design</h3>
    <p class="muted narrow">The product is about tension, so the interface lowers the temperature. The brand deck’s rule: wellness-app calm over stressful gamification.</p>
    <div class="identity">
      <div class="card stack typepair">
        <p class="eyebrow">Typography pair</p>
        <div style="display:flex;gap:28px;align-items:baseline;flex-wrap:wrap"><span class="aa">Aa</span><span class="ab">Aa</span></div>
        <p style="font-size:15px"><strong>Playfair Display</strong> for warmth in headlines (“Wonderful job.”) · <strong>Inter</strong> for everything you act on.</p>
        <p class="eyebrow" style="margin-top:12px">Shape language</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap"><span class="pill" style="background:var(--ink);color:#fff;padding:12px 22px">Add to rotation</span><span class="pill" style="box-shadow:0 0 0 1.5px var(--mint-ink);background:var(--mint);color:var(--mint-ink)">Light</span><span class="pill" style="background:var(--amber);color:var(--amber-ink)">Medium</span><span class="pill" style="background:var(--peach);color:var(--peach-ink)">Heavy</span></div>
        <p class="muted" style="font-size:14px">Pills and generous curves everywhere: nothing sharp, nothing alarming.</p>
      </div>
      <div class="card stack">
        <p class="eyebrow">Palette</p><p class="muted" style="font-size:14px;margin-top:-8px">One pastel per roommate, so ownership reads without names.</p>
        <div class="swatches">
          <div class="swatch" style="background:var(--lav);color:var(--lav-ink)">Lavender<small>#F3E8FF</small></div>
          <div class="swatch" style="background:var(--peach);color:var(--peach-ink)">Peach<small>#FFEDD5</small></div>
          <div class="swatch" style="background:var(--mint);color:var(--mint-ink)">Mint<small>#D1FAE5</small></div>
          <div class="swatch" style="background:var(--sky);color:var(--sky-ink)">Sky<small>#DBEAFE</small></div>
          <div class="swatch" style="background:var(--rose);color:var(--rose-ink)">Rose<small>#FEE2E2</small></div>
          <div class="swatch" style="background:var(--ink);color:#fff">Ink<small>#111827</small></div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:18px;align-items:center;margin-top:8px"><img src="/assets/house.png" alt="Illustrated lavender house with peach roof and two trees" style="width:120px;mix-blend-mode:multiply"><img src="/assets/sprout.png" alt="Sprout mascot" style="width:56px"><p class="muted" style="font-size:14px;flex:1 1 180px">Soft illustration and a sprout mascot that grows with the household’s streak.</p></div>
      </div>
    </div>
    <div class="voice grid-3" style="display:grid">
      <div><b>Gentle, not alarmist</b><q>Gentle nudge: the living room floor is hoping for a quick sweep!</q></div>
      <div><b>Designs out blame</b><q>Aman’s trash duty is in the shared pool. Claim it for quick house karma?</q></div>
      <div><b>Celebration over competition</b><q>Wonderful job! The kitchen is looking lovely ✨</q></div>
    </div>
  </div>

  <div class="block">
    <h3>Exploring the streak card</h3>
    <p class="muted narrow">Four ways to show a 3-day streak in the same lavender language. I kept the simplest: one big number and the sprout. The streak should feel like a shared plant, not a scoreboard.</p>
    <div class="card crop-card"><div class="crop"><img src="/assets/streak-variations.png" alt="Four streak card variations: ring progress, weekday pills, milestone path, big number with trend" loading="lazy"></div></div>
  </div>

  <div class="block" style="gap:88px;margin-top:88px">
    <div class="feature">
      <div class="shots"><figure class="phone md"><img src="/assets/screens/06-suggested-chores.png" alt="Onboarding: suggested chores pre-selected" loading="lazy"></figure><figure class="phone md"><img src="/assets/screens/07-busy-days.png" alt="Onboarding: which days are you busiest" loading="lazy"></figure></div>
      <div><h4>A household in under a minute</h4>
        <div class="rows"><div><b>Insight</b><span>If an app needs constant input, it becomes another chore.</span></div><div><b>Decision</b><span>Five common chores come pre-selected; tap to keep or remove. Busy days on one screen, then a 6-character invite code.</span></div><div><b>Result</b><span>Setup is 8 screens with a visible progress bar, and the chore engine has everything it needs by the end.</span></div></div></div>
    </div>
    <div class="feature rev">
      <div class="shots"><figure class="phone md"><img src="/assets/screens/11-add-chore.png" alt="Add new chore with effort level Light, Medium, Heavy" loading="lazy"></figure><figure class="phone md"><img src="/assets/screens/10-chores.png" alt="To-do list with effort chips and a Missed by roommates section with Claim buttons" loading="lazy"></figure></div>
      <div><h4>Effort you can see, and nobody to blame</h4>
        <div class="rows"><div><b>Insight</b><span>Fair isn’t equal, and a reminder from a friend reads as criticism.</span></div><div><b>Decision</b><span>Effort level is the first question when adding a chore. Missed chores move to “Missed by roommates”, which shows what’s undone, not who dropped it.</span></div><div><b>Result</b><span>Every card carries its effort chip, and anyone can pick up slack with one tap on Claim.</span></div></div></div>
    </div>
    <div class="feature">
      <div class="shots"><figure class="phone md"><img src="/assets/screens/17-add-personal.png" alt="Add to pantry, personal, with Do not touch, Ask first, Shared tags" loading="lazy"></figure><figure class="phone md"><img src="/assets/screens/18-restock-to-chores.png" alt="Request restock sends the item to the chores pool with an effort level" loading="lazy"></figure></div>
      <div><h4>Boundaries without a confrontation</h4>
        <div class="rows"><div><b>Insight</b><span>Grocery fights are about unspoken rules.</span></div><div><b>Decision</b><span>Personal items carry a traffic-light tag: Do not touch, Ask first, Shared. A restock request becomes a claimable chore.</span></div><div><b>Result</b><span>Groceries plug into the chore system instead of becoming a second one.</span></div></div></div>
    </div>
    <div class="feature rev">
      <div class="shots"><figure class="phone md"><img src="/assets/screens/25-nudge-style.png" alt="Nudge style: Motivate me or Just the facts" loading="lazy"></figure><figure class="phone md"><img src="/assets/screens/27-lockscreen.png" alt="Lock screen with three gentle Roomie notifications" loading="lazy"></figure></div>
      <div><h4>The app plays the bad guy, gently</h4>
        <div class="rows"><div><b>Insight</b><span>Nobody wants a game forced on them.</span></div><div><b>Decision</b><span>Each person picks <em>Motivate me</em> (streaks, emoji) or <em>Just the facts</em> (quiet, text only). Copy is written like a flatmate who’s on your side.</span></div><div><b>Result</b><span>The reminder arrives from Roomie, not from Priya. Nobody has to send the awkward text.</span></div></div></div>
    </div>
  </div>

  <div class="block">
    <h3>All 27 screens</h3>
    <div class="gallery">
      <div><h4>Onboarding <span>8</span></h4><div class="strip" tabindex="0">
        <figure class="phone"><img src="/assets/screens/01-welcome.png" alt="Welcome" loading="lazy"></figure><figure class="phone"><img src="/assets/screens/02-register.png" alt="Register" loading="lazy"></figure><figure class="phone"><img src="/assets/screens/03-login.png" alt="Log in" loading="lazy"></figure><figure class="phone"><img src="/assets/screens/04-your-space.png" alt="Create or join a home" loading="lazy"></figure><figure class="phone"><img src="/assets/screens/05-name-home.png" alt="Name your home" loading="lazy"></figure><figure class="phone"><img src="/assets/screens/06-suggested-chores.png" alt="Suggested chores" loading="lazy"></figure><figure class="phone"><img src="/assets/screens/07-busy-days.png" alt="Busy days" loading="lazy"></figure><figure class="phone"><img src="/assets/screens/08-invite.png" alt="Invite roommates" loading="lazy"></figure>
      </div></div>
      <div><h4>Home &amp; chores <span>4</span></h4><div class="strip" tabindex="0">
        <figure class="phone"><img src="/assets/screens/09-home.png" alt="Home dashboard" loading="lazy"></figure><figure class="phone"><img src="/assets/screens/10-chores.png" alt="Chores hub" loading="lazy"></figure><figure class="phone"><img src="/assets/screens/11-add-chore.png" alt="Add chore" loading="lazy"></figure><figure class="phone"><img src="/assets/screens/12-celebration.png" alt="Celebration overlay" loading="lazy"></figure>
      </div></div>
      <div><h4>Pantry <span>9</span></h4><div class="strip" tabindex="0">
        <figure class="phone"><img src="/assets/screens/13-pantry-shared.png" alt="Pantry shared list" loading="lazy"></figure><figure class="phone"><img src="/assets/screens/20-fab-menu.png" alt="Pantry action menu" loading="lazy"></figure><figure class="phone"><img src="/assets/screens/16-add-shared.png" alt="Add shared item" loading="lazy"></figure><figure class="phone"><img src="/assets/screens/17-add-personal.png" alt="Add personal item" loading="lazy"></figure><figure class="phone"><img src="/assets/screens/14-restock-bridge.png" alt="Request restock" loading="lazy"></figure><figure class="phone"><img src="/assets/screens/19-request-sent.png" alt="Request sent" loading="lazy"></figure><figure class="phone"><img src="/assets/screens/15-roommates-shelves.png" alt="Roommates’ shelves" loading="lazy"></figure><figure class="phone"><img src="/assets/screens/21-add-item-unified.png" alt="Unified add item" loading="lazy"></figure><figure class="phone"><img src="/assets/screens/18-restock-to-chores.png" alt="Restock to chores" loading="lazy"></figure>
      </div></div>
      <div><h4>Profile, settings &amp; notifications <span>6</span></h4><div class="strip" tabindex="0">
        <figure class="phone"><img src="/assets/screens/22-profile.png" alt="Profile" loading="lazy"></figure><figure class="phone"><img src="/assets/screens/23-invite-modal.png" alt="Invite modal" loading="lazy"></figure><figure class="phone"><img src="/assets/screens/24-edit-busy-days.png" alt="Edit busy days" loading="lazy"></figure><figure class="phone"><img src="/assets/screens/25-nudge-style.png" alt="Nudge style" loading="lazy"></figure><figure class="phone"><img src="/assets/screens/26-roommates.png" alt="Manage roommates" loading="lazy"></figure><figure class="phone"><img src="/assets/screens/27-lockscreen.png" alt="Lock-screen notifications" loading="lazy"></figure>
      </div></div>
    </div>
  </div>
  </div>
</section>
`;
