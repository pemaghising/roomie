// Verbatim markup ported from roomie-case-study/index.html — see raw-section.tsx for why.
export const ideateHtml = `
<section class="phase ph-ide" id="ideate">
  <div class="wrap">
  <header class="phase-head"><span class="phi" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z"/></svg></span><span class="num">03</span><h2>Ideate</h2><p>Go wide with Crazy 8s, filter hard with impact/effort and RICE, then commit to one system and cut what doesn’t serve it.</p></header>

  <div class="block">
    <h3>Crazy 8s: 25 ideas across five HMWs</h3>
    <div class="ideas">
      <span class="pill kept">Effort-weighted chores</span><span class="pill kept">Busy Mode</span><span class="pill kept">Shared task pool</span><span class="pill kept">Automated soft nudges</span><span class="pill kept">Ours vs. Mine lists</span><span class="pill kept">Pantry boundary tags</span><span class="pill kept">Restock → chore</span><span class="pill kept">Celebration moments</span>
      <span class="pill">Rolling Tab ledger</span><span class="pill">Contribution rings</span><span class="pill">24-hour snooze</span><span class="pill">Swap request</span><span class="pill">Daily morning briefing</span><span class="pill">Household timeline</span><span class="pill">“We’re out of…” button</span><span class="pill">Quick-add NPR prices</span><span class="pill">Receipt auto-split</span><span class="pill">WhatsApp bot</span><span class="pill">“Up for grabs” alert</span><span class="pill">Kudos button</span><span class="pill">Location reminders</span>
      <span class="pill cut">Gamified leaderboard</span><span class="pill cut">Chore bounties</span><span class="pill cut">In-app eSewa transfers</span><span class="pill cut">AI meal planner</span>
    </div>
    <p class="legend"><span><i style="background:var(--peach-ink)"></i>Shipped in V1</span><span><i style="background:#fff;box-shadow:0 0 0 1px #d1d5db"></i>Parked / Phase 2</span><span><i style="background:#d1d5db"></i>Killed</span></p>
  </div>

  <div class="block split">
    <div class="stack">
      <h3 style="font-size:clamp(26px,3vw,34px)">Impact / effort</h3>
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
    <div class="stack">
      <h3 style="font-size:clamp(26px,3vw,34px)">RICE scores</h3>
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
  </div>

  <div class="block">
    <h3>The big bet: Smart Division</h3>
    <p class="muted narrow">One system that answers all four insights. Rules first, so every assignment can explain itself.</p>
    <div class="smart">
      <div class="card" style="--bg:var(--sky)"><div class="ic">⛰️</div><h4>Effort weighting</h4><p>Every chore is Light, Medium or Heavy. Rotation balances total effort, not task count.</p></div>
      <div class="card" style="--bg:var(--lav)"><div class="ic">📅</div><h4>Busy days</h4><p>Everyone marks their busy days. Heavy tasks never land on them.</p></div>
      <div class="card" style="--bg:var(--peach)"><div class="ic">🧺</div><h4>A shared pool</h4><p>Missed chores go to a pool anyone can claim, so nobody chases anyone.</p></div>
      <div class="card" style="--bg:var(--mint)"><div class="ic">🌱</div><h4>The app is the messenger</h4><p>Nudges come from Roomie, in a tone each person chooses.</p></div>
    </div>
  </div>

  <div class="block split">
    <figure class="card flow" style="margin:0" aria-label="To-be chore flowchart">
      <svg class="fcs" viewBox="0 0 350 704" style="max-width:350px" role="img" aria-label="To-be: Roomie assigns and nudges; if the chore is missed it moves to the shared pool, Rahul claims it, and effort debt is balanced next Sunday."><g class="nd start"><rect x="115" y="2" width="120" height="38" rx="19"/><text class="t" x="175" y="27">Start</text></g><path class="ln" d="M175 40V66"/><path class="ah" d="M170 59L180 59L175 66Z"/><g class="nd sys"><rect x="67" y="66" width="216" height="54" rx="12"/><text class="t" x="175" y="91">Roomie assigns the chore</text><text class="s" x="175" y="108">By effort, around busy days</text></g><path class="ln" d="M175 120V146"/><path class="ah" d="M170 139L180 139L175 146Z"/><g class="nd sys"><rect x="67" y="146" width="216" height="54" rx="12"/><text class="t" x="175" y="171">Sends a gentle nudge</text><text class="s" x="175" y="188">“You’ve got this!”</text></g><path class="ln" d="M175 200V226"/><path class="ah" d="M170 219L180 219L175 226Z"/><g class="dm"><path d="M175 226L249 276L175 326L101 276Z"/><text x="175" y="281">Done on time?</text></g><path class="ln" d="M101 276H95.5Q87.5 276 87.5 284V352"/><path class="ah" d="M82.5 345L92.5 345L87.5 352Z"/><text class="lb l" x="80.5" y="302">YES</text><g class="nd good"><rect x="9.5" y="352" width="156" height="54" rx="12"/><text class="t" x="87.5" y="377">Aman logs it</text><text class="s" x="87.5" y="394">Streak grows</text></g><path class="ln" d="M249 276H254.5Q262.5 276 262.5 284V352"/><path class="ah" d="M257.5 345L267.5 345L262.5 352Z"/><text class="lb r" x="269.5" y="302">NO</text><g class="nd "><rect x="184.5" y="352" width="156" height="72" rx="12"/><text class="t" x="262.5" y="377">Moves to the</text><text class="t" x="262.5" y="395">shared pool</text><text class="s" x="262.5" y="412">Streak resets</text></g><path class="ln" d="M262.5 424V450"/><path class="ah" d="M257.5 443L267.5 443L262.5 450Z"/><g class="nd "><rect x="184.5" y="450" width="156" height="56" rx="12"/><text class="t" x="262.5" y="475">Rahul claims and</text><text class="t" x="262.5" y="493">completes it</text></g><path class="ln" d="M262.5 506V532"/><path class="ah" d="M257.5 525L267.5 525L262.5 532Z"/><g class="nd sys"><rect x="184.5" y="532" width="156" height="72" rx="12"/><text class="t" x="262.5" y="557">Roomie logs</text><text class="t" x="262.5" y="575">effort debt</text><text class="s" x="262.5" y="592">Balanced next Sunday</text></g><path class="ln" d="M87.5 406V614Q87.5 622 95.5 622H175"/><path class="ln" d="M262.5 604V614Q262.5 622 254.5 622H175"/><path class="ln" d="M175 622V648"/><path class="ah" d="M170 641L180 641L175 648Z"/><g class="nd end good"><rect x="67" y="648" width="216" height="54" rx="27"/><text class="t" x="175" y="673">End</text><text class="s" x="175" y="690">Zero nagging</text></g></svg>
    </figure>
    <div class="flowtext">
      <h3>To-be chore flow: zero nagging</h3>
      <p>Smart Division removes the “Remind him?” decision entirely. Nobody has to choose between tension and silence, because the app owns the reminder and the fallback.</p>
      <ul><li><strong>The nudge comes from Roomie</strong>, in the tone each person picked.</li><li><strong>A missed chore doesn’t become a confrontation.</strong> It becomes an open task anyone can claim.</li><li><strong>Extra effort is remembered</strong> and balanced in next week’s plan, so the helper isn’t silently out of pocket.</li></ul>
      <div class="flow-legend"><span><i class="l-sys"></i>Roomie acts</span><span><i></i>Person acts</span><span><i class="l-dec"></i>Decision</span><span><i class="l-good"></i>Good outcome</span></div>
    </div>
  </div>
  <details class="block orig"><summary>See the original to-be flow from Figma</summary><div><img src="/assets/flows/tobe-chore.png" alt="Original to-be chore flowchart from Figma" loading="lazy"></div></details>

  <div class="block">
    <h3>The hardest trade-off: cutting what my own scores ranked first</h3>
    <p class="muted narrow">My first MVP had six features, including the Rolling Tab, a background ledger for small expenses. RICE put expense tracking joint first. I moved it to Phase 2 anyway.</p>
    <div class="scope">
      <div class="col v1"><p class="eyebrow" style="color:var(--mint-ink)">V1 · active now</p><h4>The chore loop + pantry</h4><ul><li>Rule-based rotation with effort points</li><li>Busy-day blocking</li><li>Shared pool &amp; claiming</li><li>Nudges &amp; streaks (opt-in tone)</li><li>Ours vs. Mine pantry + boundary tags</li><li>Restock requests</li></ul></div>
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
