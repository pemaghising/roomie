// Verbatim markup ported from roomie-case-study/index.html — see raw-section.tsx for why.
export const ideateHtml = `
<section class="phase ph-ide" id="ideate">
  <div class="wrap">
  <header class="phase-head"><span class="phi" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z"/></svg></span><span class="num">03</span><h2>Ideate</h2><b class="ess">25 ideas in. Eight made the cut.</b><p>Go wide with Crazy 8s, filter hard with impact/effort and RICE, then commit to one system and cut what doesn’t serve it.</p></header>

  <div class="block">
    <h3>Crazy 8s: 25 ideas across five HMWs</h3>
    <div class="ideas">
      <span class="pill kept">Effort-weighted chores</span><span class="pill kept">Busy Mode</span><span class="pill kept">Shared task pool</span><span class="pill kept">Automated soft nudges</span><span class="pill kept">Ours vs. Mine lists</span><span class="pill kept">Pantry boundary tags</span><span class="pill kept">Restock → chore</span><span class="pill kept">Celebration moments</span>
      <span class="pill">Rolling Tab ledger</span><span class="pill">Contribution rings</span><span class="pill">24-hour snooze</span><span class="pill">Swap request</span><span class="pill">Daily morning briefing</span><span class="pill">Household timeline</span><span class="pill">“We’re out of…” button</span><span class="pill">Quick-add NPR prices</span><span class="pill">Receipt auto-split</span><span class="pill">WhatsApp bot</span><span class="pill">“Up for grabs” alert</span><span class="pill">Kudos button</span><span class="pill">Location reminders</span>
      <span class="pill cut">Gamified leaderboard</span><span class="pill cut">Chore bounties</span><span class="pill cut">In-app eSewa transfers</span><span class="pill cut">AI meal planner</span>
    </div>
    <p class="legend pills"><span><i class="pill kept"></i>Shipped in V1</span><span><i class="pill"></i>Parked / Phase 2</span><span><i class="pill cut"></i>Killed</span></p>
  </div>

  <div class="block">
    <h3>Impact / effort</h3>
      <div class="matrix">
        <div class="ax ay">High impact</div>
        <div class="q q-win"><h4>Quick wins · build first</h4><ul><li>Ours vs. Mine groceries</li><li>Pantry status tags</li><li>Automated soft nudges</li><li>Snooze / swap</li></ul></div>
        <div class="q q-big"><h4>Big bets · plan carefully</h4><ul><li>Rolling Tab (month-end settle)</li><li>Contribution visualiser</li><li>Household feed</li><li>Receipt auto-split</li></ul></div>
        <div class="ax ay">Low impact</div>
        <div class="q q-fill"><h4>Fill-ins</h4><ul><li>Chore templates</li><li>Kudos button</li></ul></div>
        <div class="q q-pit"><h4>Money pits · don’t build</h4><ul><li>In-app eSewa transfers</li><li>AI meal planner</li></ul></div>
        <div></div><div class="xl ax"><span>Low effort</span><span>High effort</span></div>
      </div>
  </div>

  <div class="block">
    <h3>RICE scores</h3>
      <div class="card rice">
        <div><span>Shared expense tracking<span class="tagv tagp">Phase 2</span></span><span class="bar"><i style="--s:62.5"></i></span><b>62.5</b></div>
        <div class="v1"><span>Shared chore board<span class="tagv">V1</span></span><span class="bar"><i style="--s:62.5"></i></span><b>62.5</b></div>
        <div><span>Automatic bill splitting<span class="tagv tagp">Phase 2</span></span><span class="bar"><i style="--s:41.7"></i></span><b>41.7</b></div>
        <div class="v1"><span>Shared grocery list<span class="tagv">V1</span></span><span class="bar"><i style="--s:40"></i></span><b>40.0</b></div>
        <div class="v1"><span>Chore rotation<span class="tagv">V1</span></span><span class="bar"><i style="--s:40"></i></span><b>40.0</b></div>
        <div class="v1"><span>Friendly reminders<span class="tagv">V1</span></span><span class="bar"><i style="--s:26.7"></i></span><b>26.7</b></div>
        <div><span>AI chore assignment<span class="tagv tagp">Phase 2</span></span><span class="bar"><i style="--s:20"></i></span><b>20.0</b></div>
        <div><span>Contribution dashboard</span><span class="bar"><i style="--s:16"></i></span><b>16.0</b></div>
        <div><span>Smart availability detection</span><span class="bar"><i style="--s:12"></i></span><b>12.0</b></div>
      </div>
      <p class="muted" style="font-size:14px">Reach × Impact × Confidence ÷ Effort, each scored 1–5.</p>
  </div>

  <div class="block">
    <h3>The big bet: Smart Division</h3>
    <p class="muted narrow">One system that answers all four insights. Rules first, so every assignment can explain itself.</p>
    <div class="smart">
      <div class="card"><span class="gi gi-orange" aria-hidden="true"><img src="/assets/icons/barbell.svg" alt=""></span><h4>Effort weighting</h4><p>Every chore is Light, Medium or Heavy. Rotation balances total effort, not task count.</p></div>
      <div class="card"><span class="gi gi-blue" aria-hidden="true"><img src="/assets/icons/calendar-dots.svg" alt=""></span><h4>Busy days</h4><p>Everyone marks their busy days. Heavy tasks never land on them.</p></div>
      <div class="card"><span class="gi gi-green" aria-hidden="true"><img src="/assets/icons/users-three.svg" alt=""></span><h4>A shared pool</h4><p>Missed chores go to a pool anyone can claim, so nobody chases anyone.</p></div>
      <div class="card"><span class="gi gi-purple" aria-hidden="true"><img src="/assets/icons/bell-ringing.svg" alt=""></span><h4>The app is the messenger</h4><p>Nudges come from Roomie, in a tone each person chooses.</p></div>
      <div class="card"><span class="gi gi-green" aria-hidden="true"><img src="/assets/icons/plant.svg" alt=""></span><h4>A streak the house grows</h4><p>One shared daily streak and a plant that grows with it. A slip droops it; it never names anyone.</p></div>
    </div>
  </div>

  <div class="block split">
    <figure class="card flow" style="margin:0" aria-label="To-be chore flowchart">
      <svg class="fcs" viewBox="0 0 350 704" style="max-width:350px" role="img" aria-label="To-be: Roomie assigns and nudges; if the chore is missed it moves to the shared pool, Ramesh claims it, which keeps the house streak alive and earns him a lighter load later."><g class="nd start"><rect x="115" y="2" width="120" height="38" rx="19"/><text class="t" x="175" y="27">Start</text></g><path class="ln" d="M175 40V66"/><path class="ah" d="M170 59L180 59L175 66Z"/><g class="nd sys"><rect x="67" y="66" width="216" height="54" rx="12"/><text class="t" x="175" y="91">Roomie assigns the chore</text><text class="s" x="175" y="108">By effort, around busy days</text></g><path class="ln" d="M175 120V146"/><path class="ah" d="M170 139L180 139L175 146Z"/><g class="nd sys"><rect x="67" y="146" width="216" height="54" rx="12"/><text class="t" x="175" y="171">Sends a gentle nudge</text><text class="s" x="175" y="188">“Dishes are yours tonight.”</text></g><path class="ln" d="M175 200V226"/><path class="ah" d="M170 219L180 219L175 226Z"/><g class="dm"><path d="M175 226L249 276L175 326L101 276Z"/><text x="175" y="281">Done on time?</text></g><path class="ln" d="M101 276H95.5Q87.5 276 87.5 284V352"/><path class="ah" d="M82.5 345L92.5 345L87.5 352Z"/><text class="lb l" x="80.5" y="302">Yes</text><g class="nd good"><rect x="9.5" y="352" width="156" height="54" rx="12"/><text class="t" x="87.5" y="377">Aman ticks it off</text><text class="s" x="87.5" y="394">Streak stays alive</text></g><path class="ln" d="M249 276H254.5Q262.5 276 262.5 284V352"/><path class="ah" d="M257.5 345L267.5 345L262.5 352Z"/><text class="lb r" x="269.5" y="302">No</text><g class="nd "><rect x="184.5" y="352" width="156" height="72" rx="12"/><text class="t" x="262.5" y="377">Moves to the</text><text class="t" x="262.5" y="395">shared pool</text><text class="s" x="262.5" y="412">No name attached</text></g><path class="ln" d="M262.5 424V450"/><path class="ah" d="M257.5 443L267.5 443L262.5 450Z"/><g class="nd "><rect x="184.5" y="450" width="156" height="56" rx="12"/><text class="t" x="262.5" y="475">Ramesh claims and</text><text class="t" x="262.5" y="493">completes it</text></g><path class="ln" d="M262.5 506V532"/><path class="ah" d="M257.5 525L267.5 525L262.5 532Z"/><g class="nd sys"><rect x="184.5" y="532" width="156" height="72" rx="12"/><text class="t" x="262.5" y="557">Streak saved;</text><text class="t" x="262.5" y="575">a lighter load</text><text class="s" x="262.5" y="592">for whoever claimed</text></g><path class="ln" d="M87.5 406V614Q87.5 622 95.5 622H175"/><path class="ln" d="M262.5 604V614Q262.5 622 254.5 622H175"/><path class="ln" d="M175 622V648"/><path class="ah" d="M170 641L180 641L175 648Z"/><g class="nd end good"><rect x="67" y="648" width="216" height="54" rx="27"/><text class="t" x="175" y="673">End</text><text class="s" x="175" y="690">Zero nagging</text></g></svg>
    </figure>
    <div class="flowtext">
      <h3>To-be chore flow: zero nagging</h3>
      <p>Smart Division removes the “Remind him?” decision entirely. Nobody has to choose between tension and silence, because the app owns the reminder and the fallback.</p>
      <ul><li><strong>The nudge comes from Roomie</strong>, in the tone each person picked.</li><li><strong>A missed chore doesn’t become a confrontation.</strong> It becomes an open task anyone can claim.</li><li><strong>Helping is never invisible.</strong> Claiming a missed chore keeps the house streak alive and earns the helper a lighter load later.</li></ul>
      <div class="flow-legend"><span><i class="l-sys"></i>Roomie acts</span><span><i></i>Person acts</span><span><i class="l-dec"></i>Decision</span><span><i class="l-good"></i>Good outcome</span></div>
    </div>
  </div>

  <div class="block">
    <h3>The rules behind Smart Division</h3>
    <p class="muted narrow">Here is what is deciding things behind that flow. Two small rule sets run the whole system, and each fits in a sentence, so any flatmate, at any age, can follow it and trust it.</p>
  </div>

  <div class="block split">
    <figure class="card flow" style="margin:0" aria-label="How Roomie splits the week"><svg class="fcs" viewBox="0 0 350 802" style="max-width:350px" role="img" aria-label="How Roomie splits the week: it lists the week's chores with their sizes and works out each flatmate's fair share. For each chore, a Heavy one can only go on free days while a Light or Medium one can go on any day; it goes to whoever is furthest below their fair share. It repeats until no chores are left, and the week is planned."><g class="nd start"><rect x="100" y="2" width="150" height="38" rx="19"/><text class="t" x="175" y="27">A new week starts</text></g><path class="ln" d="M175 40V66"/><path class="ah" d="M170 59L180 59L175 66Z"/><g class="nd sys"><rect x="67" y="66" width="216" height="54" rx="12"/><text class="t" x="175" y="91">List the week’s chores</text><text class="s" x="175" y="108">Each one Light, Medium or Heavy</text></g><path class="ln" d="M175 120V146"/><path class="ah" d="M170 139L180 139L175 146Z"/><g class="nd sys"><rect x="67" y="146" width="216" height="54" rx="12"/><text class="t" x="175" y="171">Work out each fair share</text><text class="s" x="175" y="188">Total effort ÷ flatmates</text></g><path class="ln" d="M175 200V226"/><path class="ah" d="M170 219L180 219L175 226Z"/><g class="nd"><rect x="67" y="226" width="216" height="44" rx="12"/><text class="t" x="175" y="253">Take the next chore</text></g><path class="ln" d="M175 270V296"/><path class="ah" d="M170 289L180 289L175 296Z"/><g class="dm"><path d="M175 296L249 346L175 396L101 346Z"/><text x="175" y="351">Heavy chore?</text></g><path class="ln" d="M101 346H95.5Q87.5 346 87.5 354V422"/><path class="ah" d="M82.5 415L92.5 415L87.5 422Z"/><text class="lb l" x="80.5" y="372">Yes</text><path class="ln" d="M249 346H254.5Q262.5 346 262.5 354V422"/><path class="ah" d="M257.5 415L267.5 415L262.5 422Z"/><text class="lb r" x="269.5" y="372">No</text><g class="nd"><rect x="13.5" y="422" width="148" height="54" rx="12"/><text class="t" x="87.5" y="447">Free days only</text><text class="s" x="87.5" y="464">Busy days are skipped</text></g><g class="nd"><rect x="188.5" y="422" width="148" height="54" rx="12"/><text class="t" x="262.5" y="447">Any day works</text><text class="s" x="262.5" y="464">Light fits busy days</text></g><path class="ln" d="M87.5 476V488Q87.5 496 95.5 496H175"/><path class="ln" d="M262.5 476V488Q262.5 496 254.5 496H175"/><path class="ln" d="M175 496V522"/><path class="ah" d="M170 515L180 515L175 522Z"/><g class="nd sys"><rect x="67" y="522" width="216" height="72" rx="12"/><text class="t" x="175" y="547">Give it to whoever is</text><text class="t" x="175" y="565">furthest below fair share</text><text class="s" x="175" y="582">Effort, not chore count</text></g><path class="ln" d="M175 594V620"/><path class="ah" d="M170 613L180 613L175 620Z"/><g class="dm"><path d="M175 620L249 670L175 720L101 670Z"/><text x="175" y="675">Chores left?</text></g><path class="ln" d="M249 670H336Q344 670 344 662V256Q344 248 336 248H283"/><path class="ah" d="M290 243L283 248L290 253Z"/><text class="lb r" x="256" y="662">Yes</text><path class="ln" d="M175 720V744"/><path class="ah" d="M170 737L180 737L175 744Z"/><text class="lb r" x="182" y="738">No</text><g class="nd end good"><rect x="67" y="744" width="216" height="54" rx="27"/><text class="t" x="175" y="769">The week is planned</text><text class="s" x="175" y="786">Equal effort for everyone</text></g></svg></figure>
    <div class="flowtext">
      <h3>How chores get split</h3>
      <p>Once a week, Roomie plans who does what. Everyone ends up with the same amount of work, not the same number of chores.</p>
      <ul><li><strong>Every chore has a size.</strong> Light counts 1, Medium 2, Heavy 3. Roomie counts behind the scenes; nobody ever sees points.</li><li><strong>Busy days are protected.</strong> A Heavy chore never lands on one. A Light chore can, because it takes a couple of minutes.</li><li><strong>Chores are handed out one at a time,</strong> each to whoever has done least so far, until none are left.</li><li><strong>Daily chores rotate day by day.</strong> Weekly chores go to one person for the week, then move on.</li><li><strong>On the day,</strong> Roomie sends the nudge in each person’s chosen tone.</li><li><strong>When busy days clash,</strong> a Heavy chore moves to the next free day or to a flatmate who is free. If everyone is busy, whoever is furthest below their fair share takes it.</li></ul>
      <div class="flow-legend"><span><i class="l-sys"></i>Roomie acts</span><span><i></i>A rule applies</span><span><i class="l-dec"></i>Decision</span><span><i class="l-good"></i>Good outcome</span></div>
    </div>
  </div>

  <div class="block split">
    <div class="flowtext">
      <h3>How the house streak works</h3>
      <p>One streak for the whole flat, counted in days. One slip never wipes it out.</p>
      <ul><li><strong>A day counts</strong> when every chore due that day is done, by anyone.</li><li><strong>A missed chore droops the plant</strong> and goes to the shared pool, with no name attached.</li><li><strong>Every chore gets a fallback window:</strong> one day for daily chores, two for weekly ones. Caught up in time, the plant recovers.</li><li><strong>If the window ends,</strong> the streak goes back to a seed. Roomie remembers the best run: “Your last one lasted 23 days.”</li><li><strong>Whoever catches up a missed chore</strong> gets a lighter load later, so helping is never invisible.</li></ul>
      <div class="flow-legend"><span><i class="l-sys"></i>Roomie acts</span><span><i></i>A rule applies</span><span><i class="l-dec"></i>Decision</span><span><i class="l-good"></i>Good outcome</span><span><i class="l-bad"></i>Needs catching up</span></div>
    </div>
    <figure class="card flow" style="margin:0" aria-label="How the house streak works"><svg class="fcs" viewBox="0 0 350 590" style="max-width:350px" role="img" aria-label="How the house streak works: when a chore's day ends, if it was done the day counts; if not, the plant droops, the chore goes to the pool and a fallback window starts, one day for daily chores and two for weekly; caught up in time, the streak carries on; if not, it resets to a seed and the best run is kept."><g class="nd start"><rect x="95" y="2" width="160" height="38" rx="19"/><text class="t" x="175" y="27">A chore’s day ends</text></g><path class="ln" d="M175 40V66"/><path class="ah" d="M170 59L180 59L175 66Z"/><g class="dm"><path d="M175 66L249 116L175 166L101 116Z"/><text x="175" y="121">Done on time?</text></g><path class="ln" d="M101 116H95.5Q87.5 116 87.5 124V192"/><path class="ah" d="M82.5 185L92.5 185L87.5 192Z"/><text class="lb l" x="80.5" y="142">Yes</text><path class="ln" d="M249 116H254.5Q262.5 116 262.5 124V192"/><path class="ah" d="M257.5 185L267.5 185L262.5 192Z"/><text class="lb r" x="269.5" y="142">No</text><g class="nd good"><rect x="9.5" y="192" width="156" height="54" rx="12"/><text class="t" x="87.5" y="217">The day counts</text><text class="s" x="87.5" y="234">Streak goes up by one</text></g><g class="nd rose"><rect x="184.5" y="192" width="156" height="54" rx="12"/><text class="t" x="262.5" y="217">The plant droops</text><text class="s" x="262.5" y="234">Chore goes to the pool</text></g><path class="ln" d="M262.5 246V272"/><path class="ah" d="M257.5 265L267.5 265L262.5 272Z"/><g class="nd sys"><rect x="184.5" y="272" width="156" height="72" rx="12"/><text class="t" x="262.5" y="297">Fallback window</text><text class="s" x="262.5" y="316">1 day for daily chores</text><text class="s" x="262.5" y="332">2 days for weekly ones</text></g><path class="ln" d="M262.5 344V368"/><path class="ah" d="M257.5 361L267.5 361L262.5 368Z"/><g class="dm"><path d="M262.5 368L336.5 418L262.5 468L188.5 418Z"/><text x="262.5" y="414">Caught up</text><text x="262.5" y="430">in time?</text></g><path class="ln" d="M188.5 418H87.5"/><text class="lb" x="138" y="410">Yes</text><path class="ln" d="M87.5 246V520"/><path class="ah" d="M82.5 513L92.5 513L87.5 520Z"/><path class="ln" d="M262.5 468V520"/><path class="ah" d="M257.5 513L267.5 513L262.5 520Z"/><text class="lb r" x="269.5" y="494">No</text><g class="nd end good"><rect x="9.5" y="520" width="156" height="54" rx="27"/><text class="t" x="87.5" y="545">Streak carries on</text><text class="s" x="87.5" y="562">Plant recovers</text></g><g class="nd end bad"><rect x="184.5" y="520" width="156" height="54" rx="27"/><text class="t" x="262.5" y="545">Back to a seed</text><text class="s" x="262.5" y="562">Best run is kept</text></g></svg></figure>
  </div>

  <div class="block">
    <h3>The plant grows at milestones</h3>
    <p class="muted narrow">The count moves every day; the plant changes only at milestones, so each new stage feels earned. While a chore waits in its fallback window, the plant droops.</p>
    <div class="card plantrow" role="list" aria-label="Plant stages by streak length">
      <figure role="listitem"><img src="/assets/brand/plant-seed.png" alt="Seed" loading="lazy"><figcaption><b>Seed</b><span>Day 0 to 2</span></figcaption></figure>
      <figure role="listitem"><img src="/assets/brand/plant-sprout.png" alt="Sprout" loading="lazy"><figcaption><b>Sprout</b><span>Day 3</span></figcaption></figure>
      <figure role="listitem"><img src="/assets/brand/plant-leafy.png" alt="Leafy" loading="lazy"><figcaption><b>Leafy</b><span>Day 7</span></figcaption></figure>
      <figure role="listitem"><img src="/assets/brand/plant-bud.png" alt="Bud" loading="lazy"><figcaption><b>Bud</b><span>Day 14</span></figcaption></figure>
      <figure role="listitem"><img src="/assets/brand/plant-bloom.png" alt="Bloom" loading="lazy"><figcaption><b>Bloom</b><span>Day 30 and on</span></figcaption></figure>
      <figure role="listitem" class="droop"><img src="/assets/brand/plant-droop.png" alt="Drooped plant" loading="lazy"><figcaption><b>Drooped</b><span>A chore is waiting</span></figcaption></figure>
    </div>
  </div>

  <div class="block">
    <h3>One week inside the chore engine</h3>
    <p class="muted narrow">A swimlane of what Aman, Roomie and Ramesh each do across a week when a chore gets missed. This is the part of the system that replaces the awkward conversation.</p>
    <div class="scroll" tabindex="0" role="region" aria-label="Chore engine swimlane over one week">
      <div class="lanes" role="group" aria-label="Chore engine swimlane over one week">
        <div class="th"></div><div class="th">Setup</div><div class="th">Wednesday</div><div class="th">Thursday</div><div class="th">Sunday</div><div class="th">Next week</div>
        <div class="who">Aman<small>Busy with exams</small></div>
        <div class="cell lane-a"><div class="n a">Joins with the code, sets busy days</div></div>
        <div class="cell lane-a"><div class="n a">Buried in exams, misses it</div></div>
        <div class="cell lane-a"><div class="n a">Gets a quiet note: the chore went to the pool</div></div>
        <div class="cell lane-a"><div class="n a">Nobody texted him, and the streak is safe</div></div>
        <div class="cell lane-a"><div class="n a">Sees next week’s plan with the extra chore</div></div>
        <div class="who">Roomie<small>The neutral third</small></div>
        <div class="cell lane-s"><div class="n sys">Stores busy days, generates the weekly plan</div></div>
        <div class="cell lane-s"><div class="n sys">Sends Aman a 7 pm nudge for “Mop bathroom”</div></div>
        <div class="cell lane-s"><div class="n sys">Moves the missed chore to the pool, no name attached</div></div>
        <div class="cell lane-s"><div class="n sys">Marks Ramesh “Ahead” and Aman “Catching up”: words, never points</div></div>
        <div class="cell lane-s"><div class="n sys">Rebalances: lighter for Ramesh, one extra chore for Aman, off his busy days</div></div>
        <div class="who">Ramesh<small>Does his share</small></div>
        <div class="cell lane-r"><div class="n r">Creates “Parijat Chowk Flat”, shares code A3F-92K, sets busy days</div></div>
        <div class="cell lane-r empty"><div class="n"></div></div>
        <div class="cell lane-r"><div class="n r">Sees “Mop bathroom” in the pool and claims it</div></div>
        <div class="cell lane-r"><div class="n r">Caught it inside the fallback window: the streak lives</div></div>
        <div class="cell lane-r"><div class="n r">Gets a lighter load</div></div>
      </div>
    </div>
    <p class="cutnote"><span class="pill" style="background:var(--amber);color:var(--amber-ink)">Riskiest part</span> Nobody texts anybody, but “Catching up” could still feel like a penalty. That’s the first thing I’d test (section 05).</p>
  </div>

  <div class="block">
    <h3>To-be journey: a month with Roomie</h3>
    <div class="scroll" tabindex="0" role="region" aria-label="To-be journey across a month">
      <div class="tjourney" role="group" aria-label="To-be journey across a month">
        <div class="rh"></div>
        <div class="st" style="--bg:var(--lav);--fg:var(--lav-ink)">Setup</div>
        <div class="st" style="--bg:var(--sky);--fg:var(--sky-ink)">Daily habits</div>
        <div class="st" style="--bg:var(--peach);--fg:var(--peach-ink)">Grocery run</div>
        <div class="st" style="--bg:var(--rose);--fg:var(--rose-ink)">A missed chore</div>
        <div class="st" style="--bg:var(--mint);--fg:var(--mint-ink)">Sunday balance</div>        <div class="rh">People do</div>
        <div>Ramesh downloads Roomie to avoid flat arguments and finishes setup in under a minute.</div>
        <div>Aman gets a 7 pm nudge for a quick sweep and ticks it off.</div>
        <div>Ramesh buys milk and eggs (shared) and protein powder (his).</div>
        <div>Aman is buried in exams and misses the bathroom deadline.</div>
        <div>Sunday arrives. Nobody writes a new rota.</div>        <div class="rh">Roomie does</div>
        <div>Marks Mon and Wed as busy, invites Aman, generates the rotation.</div>
        <div>Gives Aman a light chore on his free day; the house streak stays on track.</div>
        <div>Ticks the shared items off in Shared; adds protein to My items with “Do not touch”.</div>
        <div>Moves the chore to the pool; Ramesh claims it inside the fallback window, so the streak lives. No text sent.</div>
        <div>Gives Ramesh a lighter week and Aman one extra chore, off his busy days.</div>        <div class="rh">Feels</div>
        <div class="feel">😌 Relief<span>No house meeting needed.</span></div>
        <div class="feel">🎯 Rewarded<span>Aman feels done, Ramesh feels seen.</span></div>
        <div class="feel">🧺 Organised<span>Everyone knows what’s shared.</span></div>
        <div class="feel">😮‍💨 Stress-free<span>Ramesh doesn’t play the parent.</span></div>
        <div class="feel">⚖️ Vindicated<span>Balance restored, no argument.</span></div>      </div>
    </div>
  </div>

  <div class="block">
    <h3>The hardest trade-off: cutting what my own scores ranked first</h3>
    <p class="muted narrow">My first MVP had six features, including the Rolling Tab, a background ledger for small expenses. RICE put expense tracking joint first. I moved it to Phase 2 anyway.</p>
    <div class="scope">
      <div class="col v1"><p class="eyebrow" style="color:var(--mint-ink)">V1 · active now</p><h4>The chore loop + pantry</h4><ul><li>Rule-based rotation weighted by effort (never shown as points)</li><li>Busy-day blocking</li><li>Shared pool &amp; claiming</li><li>Nudges in a chosen tone + a house streak</li><li>Shared and My items pantry + boundary tags</li><li>Restock requests</li></ul></div>
      <div class="arrow">→</div>
      <div class="col p2"><p class="eyebrow" style="color:var(--lav-ink)">Phase 2 · roadmap</p><h4>Money + AI</h4><ul><li>The Rolling Tab</li><li>Settle-up QR codes</li><li>Automated cost splitting</li><li>Receipt scanning</li><li>AI-based chore optimisation</li></ul></div>
    </div>
    <div class="why">
      <div class="card"><h4>Money is already served</h4><p>Splitwise and eSewa are good enough. The chore half is where nothing works.</p></div>
      <div class="card"><h4>Money needs a high trust bar</h4><p>Reviews show financial features only earn trust with complete, explainable breakdowns. A half-built ledger would lose more trust than it earns.</p></div>
      <div class="card"><h4>Rules before AI</h4><p>Rule-based rotation is explainable by default. That’s the trust foundation AI needs later.</p></div>
    </div>
  </div>
  </div>
</section>
`;
