// Verbatim markup ported from roomie-case-study/index.html — see raw-section.tsx for why.
export const prototypeHtml = `
<section class="phase ph-pro" id="prototype">
  <div class="wrap">
  <header class="phase-head"><span class="phi" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="6.5" y="2.5" width="11" height="19" rx="2.8"/><path d="M10.5 18.5h3M9.5 7h5M9.5 10.5h5"/></svg></span><span class="num">04</span><h2>Prototype</h2><b class="ess">Designed to lower the temperature.</b><p>From information architecture and a 38-screen map, through lo-fi wireframes, to 62 hi-fi screens and a visual identity built to lower the temperature.</p></header>

  <div class="block">
    <h3>Information architecture</h3>
    <p class="muted narrow">A one-time onboarding, then four tabs. With Expenses moved to Phase 2, every tab earns its place.</p>
    <div class="tree">
      <div class="root">Roomie</div>
      <div class="branches">
        <div class="card ia-onb"><span class="tab"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 4h3a2 2 0 0 1 2 2v14M2 20h3M13 20h9M10 12v.01M13 4.56v16.16a1 1 0 0 1-1.24.97L5 20V5.56a2 2 0 0 1 1.52-1.94l4-1A2 2 0 0 1 13 4.56Z"/></svg>Onboarding</span><p class="goal">First open only</p><ul><li>Create or join a home</li><li>Name your home</li><li>Pick suggested chores</li><li>Mark busy days</li><li>Choose a nudge style</li><li>Invite roommates</li></ul></div>
        <div class="card ia-home"><span class="tab"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .71-1.53l7-6a2 2 0 0 1 2.58 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>Home</span><p class="goal">Reduce mental load</p><ul><li>House streak card</li><li>Shared pool → Claim</li><li>Your tasks today</li><li>Why these chores</li><li>Coming up</li></ul></div>
        <div class="card ia-chores"><span class="tab"><svg viewBox="0 0 24 24" aria-hidden="true"><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M12 11h4M12 16h4M8 11h.01M8 16h.01"/></svg>Chores</span><p class="goal">No silent burden</p><ul><li>Mine&nbsp;· Whole house&nbsp;· Shared pool</li><li>Effort tags: Light, Medium, Heavy</li><li>Calendar · week &amp; month</li></ul></div>
        <div class="card ia-pantry"><span class="tab"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 10a4 4 0 0 1-8 0M3.1 6.03h17.8"/><path d="M3.4 5.47a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.67a2 2 0 0 0-.4-1.2l-2-2.67A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/></svg>Pantry</span><p class="goal">No grocery confusion</p><ul><li>Shared&nbsp;· My items&nbsp;· Roommates</li><li>Running low → I’ll get it</li><li>Boundary tags</li><li>Restock → chore pool</li></ul></div>
        <div class="card ia-profile"><span class="tab"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>Profile</span><p class="goal">Adapt to real life</p><ul><li>Home name &amp; roommates</li><li>House chores</li><li>Invite code</li><li>Busy days &amp; nudge style</li><li>Notifications &amp; account</li></ul></div>
      </div>
      <p class="tree-add"><span class="plus" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span>The + button sits beside the nav on every tab: add a chore, a pantry item, a restock or a roommate.</p>
    </div>
  </div>

  <div class="block">
    <h3>User flow: from download to a working household</h3>
    <p class="muted narrow">Every decision point from the end-to-end flow, simplified. Returning users skip straight to Home.</p>
    <div class="card ufv">
      <svg class="fcs" viewBox="0 0 410 1046" style="max-width:410px" role="img" aria-label="Getting in: app launch; if signed in, go to Home. Otherwise welcome, then sign up or log in. If already in a household, welcome back to Home. Otherwise choose new or join: new homes are named and pick chores, joiners enter a 6-character code or scan a QR. Both paths mark busy days, choose a nudge style, invite roommates and land on Home."><g class="nd start"><rect x="100" y="2" width="120" height="38" rx="19"/><text class="t" x="160" y="27">App launch</text></g><path class="ln" d="M160 40V66"/><path class="ah" d="M155 59L165 59L160 66Z"/><g class="dm"><path d="M160 66L234 116L160 166L86 116Z"/><text x="160" y="121">Signed in?</text></g><path class="ln" d="M234 116H293"/><path class="ah" d="M293 111L300 116L293 121Z"/><text class="lb" x="265" y="108">Yes</text><g class="nd good"><rect x="300" y="97" width="104" height="38" rx="19"/><text class="t" x="352" y="122">Home</text></g><text class="lb r" x="168" y="184">No</text><path class="ln" d="M160 166V192"/><path class="ah" d="M155 185L165 185L160 192Z"/><g class="nd "><rect x="60" y="192" width="200" height="38" rx="12"/><text class="t" x="160" y="217">Welcome</text></g><path class="ln" d="M160 230V256"/><path class="ah" d="M155 249L165 249L160 256Z"/><g class="nd "><rect x="60" y="256" width="200" height="38" rx="12"/><text class="t" x="160" y="281">Sign up or log in</text></g><path class="ln" d="M160 294V320"/><path class="ah" d="M155 313L165 313L160 320Z"/><g class="dm"><path d="M160 320L234 370L160 420L86 370Z"/><text x="160" y="375">In a home?</text></g><path class="ln" d="M234 370H293"/><path class="ah" d="M293 365L300 370L293 375Z"/><text class="lb" x="265" y="362">Yes</text><g class="nd good"><rect x="300" y="343" width="104" height="54" rx="19"/><text class="t" x="352" y="366">Home</text><text class="s" x="352" y="383">Welcome back</text></g><text class="lb r" x="168" y="438">No</text><path class="ln" d="M160 420V446"/><path class="ah" d="M155 439L165 439L160 446Z"/><g class="dm"><path d="M160 446L234 496L160 546L86 496Z"/><text x="160" y="501">New or join?</text></g><path class="ln" d="M86 496H88Q80 496 80 504V572"/><path class="ah" d="M75 565L85 565L80 572Z"/><text class="lb l" x="73" y="522">New</text><path class="ln" d="M234 496H232Q240 496 240 504V572"/><path class="ah" d="M235 565L245 565L240 572Z"/><text class="lb r" x="247" y="522">Join</text><g class="nd "><rect x="8" y="572" width="144" height="54" rx="12"/><text class="t" x="80" y="597">Name your home</text><text class="s" x="80" y="614">Start a new one</text></g><path class="ln" d="M80 626V652"/><path class="ah" d="M75 645L85 645L80 652Z"/><g class="nd "><rect x="8" y="652" width="144" height="54" rx="12"/><text class="t" x="80" y="677">Pick chores</text><text class="s" x="80" y="694">Suggested to start</text></g><g class="nd "><rect x="168" y="572" width="144" height="54" rx="12"/><text class="t" x="240" y="597">Enter the code</text><text class="s" x="240" y="614">Code or QR scan</text></g><path class="ln" d="M80 706V716Q80 724 88 724H160"/><path class="ln" d="M240 626V716Q240 724 232 724H160"/><path class="ln" d="M160 724V750"/><path class="ah" d="M155 743L165 743L160 750Z"/><g class="nd "><rect x="60" y="750" width="200" height="54" rx="12"/><text class="t" x="160" y="775">Mark busy days</text><text class="s" x="160" y="792">No heavy chores on them</text></g><path class="ln" d="M160 804V830"/><path class="ah" d="M155 823L165 823L160 830Z"/><g class="nd "><rect x="60" y="830" width="200" height="54" rx="12"/><text class="t" x="160" y="855">Choose a nudge style</text><text class="s" x="160" y="872">How Roomie reminds you</text></g><path class="ln" d="M160 884V910"/><path class="ah" d="M155 903L165 903L160 910Z"/><g class="nd "><rect x="60" y="910" width="200" height="54" rx="12"/><text class="t" x="160" y="935">Invite roommates</text><text class="s" x="160" y="952">Share the home code</text></g><path class="ln" d="M160 964V990"/><path class="ah" d="M155 983L165 983L160 990Z"/><g class="nd end good"><rect x="60" y="990" width="200" height="54" rx="27"/><text class="t" x="160" y="1015">Home</text><text class="s" x="160" y="1032">You’re all set</text></g></svg>
      <div class="flowtext">
        <p class="stage-label">Getting in</p>
        <h4>Two checks, then one fork</h4>
        <p>Returning people never see onboarding: two quick checks send them straight to Home. Everyone else chooses to start a new home or join one, and both paths meet at busy days.</p>
        <ul><li><strong>Already signed in?</strong> Straight to Home.</li><li><strong>Already in a home?</strong> A welcome back, then Home.</li><li><strong>Joining?</strong> Enter the 6-character code or scan the QR. Naming and chores come with the home.</li><li><strong>No passwords.</strong> Sign-in is an email code, Google or Apple.</li></ul>
        <div class="flow-legend"><span><i class="l-end"></i>Start</span><span><i></i>Screen</span><span><i class="l-dec"></i>Decision</span><span><i class="l-good"></i>Lands on Home</span></div>
      </div>
    </div>
    <p class="stage-label">From Home</p>
    <div class="hubs">
      <div class="card"><svg class="fcs" viewBox="0 0 320 534" style="max-width:320px" role="img" aria-label="Chores hub: a chore done on its day counts toward the daily house streak. A missed chore droops the plant and goes to the shared pool with no name attached. If anyone catches it up within its fallback window, one day for daily chores or two for weekly ones, the plant recovers and the streak lives. If not, the streak goes back to a seed and the best run is kept. The helper gets a lighter load when the plan rebalances."><g class="nd good"><rect x="20" y="2" width="180" height="38" rx="12"/><text class="t" x="110" y="27">Chores hub</text></g><path class="ln" d="M110 40V66"/><path class="ah" d="M105 59L115 59L110 66Z"/><g class="dm"><path d="M110 66L180 116L110 166L40 116Z"/><text x="110" y="113">Done on</text><text x="110" y="129">its day?</text></g><path class="ln" d="M180 116H220"/><path class="ah" d="M213 111L220 116L213 121Z"/><text class="lb" x="199" y="108">Yes</text><g class="nd good"><rect x="220" y="89" width="96" height="54" rx="12"/><text class="t" x="268" y="112">On track</text><text class="s" x="268" y="129">Day counts</text></g><text class="lb r" x="118" y="184">No</text><path class="ln" d="M110 166V192"/><path class="ah" d="M105 185L115 185L110 192Z"/><g class="nd peach"><rect x="20" y="192" width="180" height="54" rx="12"/><text class="t" x="110" y="217">The plant droops</text><text class="s" x="110" y="234">Chore goes to the pool</text></g><path class="ln" d="M110 246V272"/><path class="ah" d="M105 265L115 265L110 272Z"/><g class="dm"><path d="M110 272L180 322L110 372L40 322Z"/><text x="110" y="319">Caught up in</text><text x="110" y="335">1 or 2 days?</text></g><path class="ln" d="M180 322H220"/><path class="ah" d="M213 317L220 322L213 327Z"/><text class="lb" x="199" y="314">Yes</text><g class="nd sys"><rect x="220" y="295" width="96" height="54" rx="12"/><text class="t" x="268" y="318">Recovers</text><text class="s" x="268" y="335">Streak lives</text></g><text class="lb r" x="118" y="390">No</text><path class="ln" d="M110 372V398"/><path class="ah" d="M105 391L115 391L110 398Z"/><g class="nd rose"><rect x="20" y="398" width="180" height="54" rx="12"/><text class="t" x="110" y="423">Back to a seed</text><text class="s" x="110" y="440">Best run is kept</text></g><path class="ln" d="M110 452V478"/><path class="ah" d="M105 471L115 471L110 478Z"/><g class="nd sys"><rect x="20" y="478" width="180" height="54" rx="12"/><text class="t" x="110" y="503">Fair-share rebalance</text><text class="s" x="110" y="520">Helper gets a lighter load</text></g></svg></div>
      <div class="card"><svg class="fcs" viewBox="0 0 320 330" style="max-width:320px" role="img" aria-label="Pantry hub: shared items are flagged Out or Low, then bought or requested, and requests land in the chore pool; personal items are added with a boundary tag."><g class="nd peach"><rect x="60" y="2" width="200" height="38" rx="12"/><text class="t" x="160" y="27">Pantry hub</text></g><path class="ln" d="M160 40V66"/><path class="ah" d="M155 59L165 59L160 66Z"/><g class="dm"><path d="M160 66L234 116L160 166L86 116Z"/><text x="160" y="113">Shared or</text><text x="160" y="129">mine?</text></g><path class="ln" d="M86 116H88Q80 116 80 124V192"/><path class="ah" d="M75 185L85 185L80 192Z"/><text class="lb l" x="73" y="142">Shared</text><g class="nd "><rect x="8" y="192" width="144" height="54" rx="12"/><text class="t" x="80" y="217">Flag Out or Low</text><text class="s" x="80" y="234">I’ll get it, or ask</text></g><path class="ln" d="M80 246V272"/><path class="ah" d="M75 265L85 265L80 272Z"/><g class="nd sys"><rect x="8" y="272" width="144" height="56" rx="12"/><text class="t" x="80" y="297">Request lands in</text><text class="t" x="80" y="315">the chore pool</text></g><path class="ln" d="M234 116H232Q240 116 240 124V192"/><path class="ah" d="M235 185L245 185L240 192Z"/><text class="lb r" x="247" y="142">Mine</text><g class="nd "><rect x="168" y="192" width="144" height="38" rx="12"/><text class="t" x="240" y="217">Add an item</text></g><path class="ln" d="M240 230V256"/><path class="ah" d="M235 249L245 249L240 256Z"/><g class="nd "><rect x="168" y="256" width="144" height="70" rx="12"/><text class="t" x="240" y="281">Set a boundary tag</text><text class="s" x="240" y="298">Do not touch</text><text class="s" x="240" y="314">or Ask first</text></g></svg></div>
      <div class="card"><svg class="fcs" viewBox="0 0 320 348" style="max-width:320px" role="img" aria-label="Profile hub: edit busy days so next week’s plan adjusts, pick a nudge style, and manage house chores, roommates and invites."><g class="nd rose"><rect x="60" y="2" width="200" height="38" rx="12"/><text class="t" x="160" y="27">Profile hub</text></g><path class="ln" d="M160 40V66"/><path class="ah" d="M155 59L165 59L160 66Z"/><g class="nd "><rect x="60" y="66" width="200" height="38" rx="12"/><text class="t" x="160" y="91">Edit busy days</text></g><path class="ln" d="M160 104V130"/><path class="ah" d="M155 123L165 123L160 130Z"/><g class="nd sys"><rect x="60" y="130" width="200" height="54" rx="12"/><text class="t" x="160" y="155">Next week’s plan adjusts</text><text class="s" x="160" y="172">No heavy chores on busy days</text></g><path class="ln" d="M160 184V210"/><path class="ah" d="M155 203L165 203L160 210Z"/><g class="nd "><rect x="60" y="210" width="200" height="54" rx="12"/><text class="t" x="160" y="235">Pick a nudge style</text><text class="s" x="160" y="252">Motivate me · Just the facts</text></g><path class="ln" d="M160 264V290"/><path class="ah" d="M155 283L165 283L160 290Z"/><g class="nd "><rect x="60" y="290" width="200" height="56" rx="12"/><text class="t" x="160" y="315">House chores,</text><text class="t" x="160" y="333">roommates, invite</text></g></svg></div>
    </div>
  </div>

  <div class="block">
    <h3>Lo-fi wireframes</h3>
    <div class="wire" tabindex="0" role="region" aria-label="Lo-fi wireframes"><img src="/assets/wireframes-crop.png" alt="Six greyscale wireframes: onboarding busy-day picker, dashboard, chores with shared pool, groceries with ours and personal items, expenses rolling tab, profile settings" loading="lazy"></div>
    <p class="cutnote"><span class="pill" style="background:var(--rose);color:var(--rose-ink)">Cut after lo-fi</span> The Expenses &amp; Rolling Tab screen (fifth from left) was designed, then moved to Phase 2. The navigation dropped from five tabs to four.</p>
  </div>

  <div class="block">
    <h3>Visual identity: calm by design</h3>
    <p class="muted narrow">The product is about tension, so the interface lowers the temperature. The final brand grew out of one idea: the home itself is the character. A smiling house with a sprout, its violet roof for anything you tap, and frosted-glass cards floating on a faint lilac-and-peach haze.</p>
    <div class="identity">
      <div class="card stack typepair">
        <p class="eyebrow">Logo</p>
        <img class="id-logo" src="/assets/brand/logo.png" alt="Roomie logo: a smiling 3D house mascot with a sprout chimney, next to the Roomie wordmark" loading="lazy">
        <p class="eyebrow" style="margin-top:12px">Typography pair</p>
        <div style="display:flex;gap:28px;align-items:baseline;flex-wrap:wrap"><span class="ad">Aa</span><span class="ab">Aa</span><span class="aa">8</span></div>
        <p style="font-size:15px"><strong>Fraunces 72pt Soft</strong>, the logo’s own face, sets every screen title (italic for the one accent word, “home.”). <strong>Geist</strong> does everything you read and tap: Light for the big streak number, Medium for rows and buttons, Regular for the rest.</p>
        <p class="muted" style="font-size:14px">One scale on every screen: 34 page titles, 28 onboarding titles, 20 section headings, 16–17 rows and buttons, 15 body, 13 meta, 12 tags.</p>
        <p class="eyebrow" style="margin-top:12px">Shape language</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><span class="pill btn-primary">Add to rotation</span><span class="pill" style="background:#E9F6E1;color:#3F7A2A">Light</span><span class="pill" style="background:#FFF1D6;color:#8A5A00">Medium</span><span class="pill" style="background:#FFE6DC;color:#B23E1E">Heavy</span></div>
        <p class="muted" style="font-size:14px">Pills and generous curves everywhere: nothing sharp, nothing alarming, nothing bevelled. One flat violet action per screen; a lilac-to-peach outline marks whatever you’ve selected.</p>
      </div>
      <div class="card stack">
        <p class="eyebrow">Palette</p><p class="muted" style="font-size:14px;margin-top:-8px">Taken straight from the logo: the roof gives the violets, the chimney gives the peach. Ink carries the words, a lilac off-white gives them room, and nothing is ever pure white.</p>
        <div class="swatches swatches-final">
          <div class="swatch" style="background:#1F1B3A;color:#FCFBFF">Ink<small>#1F1B3A</small></div>
          <div class="swatch" style="background:#FCFBFF;color:#1F1B3A;box-shadow:inset 0 0 0 1px #E9E4F6">Off-white<small>#FCFBFF</small></div>
          <div class="swatch" style="background:#F8F6FC;color:#1F1B3A;box-shadow:inset 0 0 0 1px #E9E4F6">Mist<small>#F8F6FC base</small></div>
          <div class="swatch" style="background:#7A5FD6;color:#FCFBFF">Roof Violet<small>#7A5FD6 buttons</small></div>
          <div class="swatch" style="background:#876BDE;color:#FCFBFF">Violet<small>#876BDE icons</small></div>
          <div class="swatch" style="background:#3B2470;color:#FCFBFF">Plum<small>#3B2470 streak</small></div>
          <div class="swatch swatch-violet">Roof → Chimney<small>#A489ED → #FFB48A selected</small></div>
          <div class="swatch" style="background:#FFE3D3;color:#1F1B3A">Peach<small>#FFE3D3 shared pool</small></div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:18px;align-items:center;margin-top:8px"><img src="/assets/brand/mascot.png" alt="Roomie mascot: a smiling purple house with a sprout in its chimney pot" style="width:110px" loading="lazy"><p class="muted" style="font-size:14px;flex:1 1 180px">Soft, round, a little glossy: every illustration looks shaped from clay, lit from the top left.</p></div>
      </div>
    </div>
    <div class="card stack">
      <p class="eyebrow">The streak, as a house plant</p>
      <p class="muted" style="font-size:14px;margin-top:-8px">Every week the whole house finishes its chores, it grows. Miss a week and it droops, unless someone claims the missed chore in time. Miss two in a row and a new seed is planted, and the best run is kept.</p>
      <div class="plants">
        <figure><img src="/assets/brand/plant-seed.png" alt="Seed in a terracotta pot" loading="lazy"><figcaption>Seed</figcaption></figure>
        <figure><img src="/assets/brand/plant-sprout.png" alt="Small two-leaf sprout" loading="lazy"><figcaption>Sprout</figcaption></figure>
        <figure><img src="/assets/brand/plant-leafy.png" alt="Leafy plant" loading="lazy"><figcaption>Leafy</figcaption></figure>
        <figure><img src="/assets/brand/plant-bud.png" alt="Plant with a lilac bud" loading="lazy"><figcaption>Bud</figcaption></figure>
        <figure><img src="/assets/brand/plant-bloom.png" alt="Plant in full lilac bloom" loading="lazy"><figcaption>Bloom</figcaption></figure>
        <figure class="droop"><img src="/assets/brand/plant-droop.png" alt="Drooping sprout with a water drop" loading="lazy"><figcaption>Missed a week</figcaption></figure>
      </div>
    </div>
    <div class="photos">
      <figure><img src="/assets/brand/photo-home.jpg" alt="A hand holding a phone showing the Roomie home screen in a bright kitchen" loading="lazy"></figure>
      <figure><img src="/assets/brand/photo-nudge.jpg" alt="A phone on a sunlit table showing a gentle Roomie nudge on the lock screen" loading="lazy"></figure>
      <figure><img src="/assets/brand/photo-pantry.jpg" alt="A flatmate checking the Roomie pantry on his phone at the open fridge" loading="lazy"></figure>
    </div>
    <p class="muted narrow" style="font-size:14px;margin-top:-8px">Photography direction from the brand book: bright rooms, real people, and the real app on a current phone.</p>
    <div class="voice grid-3" style="display:grid">
      <div><b>Gentle, not alarmist</b><q>Dishes are yours tonight. Keep the streak going!</q></div>
      <div><b>Designs out blame</b><q>Chores that slipped through. Claim one to help out.</q></div>
      <div><b>Celebration over competition</b><q>All done for today. That’s day 23 of the house streak.</q></div>
    </div>
  </div>

  <div class="block">
    <h3>Exploring the streak card</h3>
    <p class="muted narrow">Four ways to show a 3-day streak in the same lavender language. The final card keeps the big number, counts days (light chores like dishes happen every day), shows this week as day pills, and swaps the sprout for a house plant that grows at milestones and droops while a chore waits. The streak should feel like a shared plant, not a scoreboard.</p>
    <div class="card crop-card" tabindex="0" role="region" aria-label="Wireframe detail"><div class="crop"><img src="/assets/streak-variations.png" alt="Four streak card variations: ring progress, weekday pills, milestone path, big number with trend" loading="lazy"></div></div>
  </div>

  <div class="block" style="gap:88px;margin-top:88px">
    <div class="feature">
      <div class="shots"><figure class="phone md"><img src="/assets/final/09-pick-chores.png" alt="Onboarding: suggested chores pre-ticked with effort tags" loading="lazy"></figure><figure class="phone md"><img src="/assets/final/10-busy-days.png" alt="Onboarding: which days are you busiest" loading="lazy"></figure></div>
      <div><h4>A household in under a minute</h4>
        <div class="rows"><div><b>Insight</b><span>If an app needs constant input, it becomes another chore.</span></div><div><b>Decision</b><span>Common chores come pre-ticked with their effort; tap to keep or remove. Busy days on one screen, then a QR code or a 6-character invite code.</span></div><div><b>Result</b><span>Setup is seven short screens with step dots, and the chore engine has everything it needs by the end.</span></div></div></div>
    </div>
    <div class="feature rev">
      <div class="shots"><figure class="phone md"><img src="/assets/final/c4-add-chore.png" alt="Add a chore with effort level Light, Medium, Heavy" loading="lazy"></figure><figure class="phone md"><img src="/assets/final/c1c-shared-pool.png" alt="Chores, shared pool: missed chores waiting to be claimed, each with its effort tag and a Claim button" loading="lazy"></figure></div>
      <div><h4>Effort you can see, and nobody to blame</h4>
        <div class="rows"><div><b>Insight</b><span>Fair isn’t equal, and a reminder from a friend reads as criticism.</span></div><div><b>Decision</b><span>Every new chore needs an effort level, and heavy ones skip your busy days. Missed chores move to the shared pool, which shows what’s undone, not who dropped it.</span></div><div><b>Result</b><span>Every card carries its effort tag. Claiming a missed chore keeps the house streak alive and earns the helper a lighter load later, so helping is never invisible.</span></div></div></div>
    </div>
    <div class="feature">
      <div class="shots"><figure class="phone md"><img src="/assets/final/p2d-add-personal.png" alt="Add to pantry, Personal: a Do not touch or Ask first tag decides who can use it" loading="lazy"></figure><figure class="phone md"><img src="/assets/final/p1f-restock.png" alt="Restock request that goes to the shared chore pool with an effort level" loading="lazy"></figure></div>
      <div><h4>Boundaries without a confrontation</h4>
        <div class="rows"><div><b>Insight</b><span>Grocery fights are about unspoken rules.</span></div><div><b>Decision</b><span>One “Add to pantry” sheet with a Shared / Personal switch. Personal items carry a tag: Do not touch or Ask first. Running-low items get one button, “I’ll get it”; asking the house lives in the ••• menu, and that request becomes a claimable chore.</span></div><div><b>Result</b><span>Groceries plug into the chore system instead of becoming a second one.</span></div></div></div>
    </div>
    <div class="feature rev">
      <div class="shots"><figure class="phone md"><img src="/assets/final/11-nudge-style.png" alt="Nudge style: Motivate me or Just the facts" loading="lazy"></figure><figure class="phone md"><img src="/assets/final/lock-screen.png" alt="Lock screen with a gentle Roomie nudge" loading="lazy"></figure></div>
      <div><h4>The app plays the bad guy, gently</h4>
        <div class="rows"><div><b>Insight</b><span>Nobody wants a game forced on them.</span></div><div><b>Decision</b><span>Each person picks <em>Motivate me</em> (streaks, emoji) or <em>Just the facts</em> (quiet, text only). Copy is written like a flatmate who’s on your side.</span></div><div><b>Result</b><span>The reminder arrives from Roomie, not from Priya. Nobody has to send the awkward text.</span></div></div></div>
    </div>
    <div class="feature">
      <div class="shots"><figure class="phone md"><img src="/assets/final/h1-home.png" alt="Home: house streak, shared pool banner and today’s tasks" loading="lazy"></figure><figure class="phone md"><img src="/assets/final/h2-why-these-chores.png" alt="Why these chores: one line per chore explaining the assignment" loading="lazy"></figure></div>
      <div><h4>Every assignment explains itself</h4>
        <div class="rows"><div><b>Insight</b><span>Automation is trusted only when it explains itself.</span></div><div><b>Decision</b><span>“Why these chores” on Home gives each chore one line, like “Your turn — Priya did it last week.” Effort shows as words, On track or Catching up, never a number.</span></div><div><b>Result</b><span>Nobody has to ask “why me?”, and nobody can argue with a score, because there isn’t one.</span></div></div></div>
    </div>
  </div>

  <div class="block">
    <h3>The final screens</h3>
    <p class="muted narrow">47 of the 62 final screens. Scroll each row.</p>
    <div class="gallery">
      <div><h4>Get in <span>5</span></h4><div class="strip" tabindex="0">
        <figure class="phone"><img src="/assets/final/01-welcome.png" alt="Welcome" loading="lazy"></figure><figure class="phone"><img src="/assets/final/02-create-account.png" alt="Create account" loading="lazy"></figure><figure class="phone"><img src="/assets/final/03-log-in.png" alt="Log in" loading="lazy"></figure><figure class="phone"><img src="/assets/final/05-enter-code.png" alt="Enter code" loading="lazy"></figure><figure class="phone"><img src="/assets/final/06-welcome-back.png" alt="Welcome back" loading="lazy"></figure>
      </div></div>
      <div><h4>Set up or join a home <span>9</span></h4><div class="strip" tabindex="0">
        <figure class="phone"><img src="/assets/final/07-new-or-join.png" alt="New home or join" loading="lazy"></figure><figure class="phone"><img src="/assets/final/j1-enter-home-code.png" alt="Join: enter the home code" loading="lazy"></figure><figure class="phone"><img src="/assets/final/j4-youre-in.png" alt="Join: you’re in" loading="lazy"></figure><figure class="phone"><img src="/assets/final/08-name-home.png" alt="Name your home" loading="lazy"></figure><figure class="phone"><img src="/assets/final/09-pick-chores.png" alt="Pick chores" loading="lazy"></figure><figure class="phone"><img src="/assets/final/10-busy-days.png" alt="Busiest days" loading="lazy"></figure><figure class="phone"><img src="/assets/final/11-nudge-style.png" alt="Nudge style" loading="lazy"></figure><figure class="phone"><img src="/assets/final/12-invite.png" alt="Invite roommates" loading="lazy"></figure><figure class="phone"><img src="/assets/final/13-all-set.png" alt="All set" loading="lazy"></figure>
      </div></div>
      <div><h4>Home <span>9</span></h4><div class="strip" tabindex="0">
        <figure class="phone"><img src="/assets/final/h0-first-day.png" alt="First day" loading="lazy"></figure><figure class="phone"><img src="/assets/final/h1-home.png" alt="Home" loading="lazy"></figure><figure class="phone"><img src="/assets/final/h2-why-these-chores.png" alt="Why these chores" loading="lazy"></figure><figure class="phone"><img src="/assets/final/h3-claimed.png" alt="Claimed" loading="lazy"></figure><figure class="phone"><img src="/assets/final/h4-missed-chore.png" alt="Missed chore" loading="lazy"></figure><figure class="phone"><img src="/assets/final/h5-chore-done.png" alt="Chore done" loading="lazy"></figure><figure class="phone"><img src="/assets/final/h6-all-done.png" alt="All done today" loading="lazy"></figure><figure class="phone"><img src="/assets/final/h7-friday.png" alt="A day with nothing due" loading="lazy"></figure><figure class="phone"><img src="/assets/final/h8-add-menu.png" alt="Add menu: chore, pantry item, restock, invite" loading="lazy"></figure>
      </div></div>
      <div><h4>Chores <span>6</span></h4><div class="strip" tabindex="0">
        <figure class="phone"><img src="/assets/final/c1-todo.png" alt="To-do, mine" loading="lazy"></figure><figure class="phone"><img src="/assets/final/c1-whole-house.png" alt="To-do, whole house" loading="lazy"></figure><figure class="phone"><img src="/assets/final/c1c-shared-pool.png" alt="Shared pool" loading="lazy"></figure><figure class="phone"><img src="/assets/final/c2-calendar.png" alt="Calendar month" loading="lazy"></figure><figure class="phone"><img src="/assets/final/c3-week.png" alt="Calendar week" loading="lazy"></figure><figure class="phone"><img src="/assets/final/c4-add-chore.png" alt="Add chore" loading="lazy"></figure>
      </div></div>
      <div><h4>Pantry <span>9</span></h4><div class="strip" tabindex="0">
        <figure class="phone"><img src="/assets/final/p1-pantry.png" alt="Shared pantry" loading="lazy"></figure><figure class="phone"><img src="/assets/final/p1f-restock.png" alt="Restock request" loading="lazy"></figure><figure class="phone"><img src="/assets/final/p2-my-items.png" alt="My items" loading="lazy"></figure><figure class="phone"><img src="/assets/final/p2c-add-menu.png" alt="Add menu" loading="lazy"></figure><figure class="phone"><img src="/assets/final/p2e-add-shared.png" alt="Add to pantry, shared" loading="lazy"></figure><figure class="phone"><img src="/assets/final/p2d-add-personal.png" alt="Add to pantry, personal" loading="lazy"></figure><figure class="phone"><img src="/assets/final/p3-roommates.png" alt="Roommates’ shelves" loading="lazy"></figure>
      <figure class="phone"><img src="/assets/final/p2f-pick-icon.png" alt="Pick an icon, with one picked for you" loading="lazy"></figure><figure class="phone"><img src="/assets/final/p2g-pick-icon-none.png" alt="No icon yet: closest matches or a letter tile" loading="lazy"></figure></div></div>
      <div><h4>Profile, settings &amp; notifications <span>9</span></h4><div class="strip" tabindex="0">
        <figure class="phone"><img src="/assets/final/r1-profile.png" alt="Profile" loading="lazy"></figure><figure class="phone"><img src="/assets/final/r4-roommates.png" alt="Roommates" loading="lazy"></figure><figure class="phone"><img src="/assets/final/r5-house-chores.png" alt="House chores: edit or remove any chore" loading="lazy"></figure><figure class="phone"><img src="/assets/final/r6-invite.png" alt="Invite roommates" loading="lazy"></figure><figure class="phone"><img src="/assets/final/r7-busy-days.png" alt="My busy days" loading="lazy"></figure><figure class="phone"><img src="/assets/final/r8-nudge-style.png" alt="Nudge style" loading="lazy"></figure><figure class="phone"><img src="/assets/final/r9-notifications.png" alt="Notifications" loading="lazy"></figure><figure class="phone"><img src="/assets/final/lock-screen.png" alt="Lock-screen nudge" loading="lazy"></figure>
      <figure class="phone"><img src="/assets/final/r13-leave-home.png" alt="Leave home: your chores go to the shared pool" loading="lazy"></figure></div></div>
    </div>
  </div>
  </div>
</section>
`;
