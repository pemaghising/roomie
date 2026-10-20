// Verbatim markup ported from roomie-case-study/index.html — see raw-section.tsx for why.
export const empathizeHtml = `
<section class="phase ph-emp" id="empathize">
  <div class="wrap">
  <header class="phase-head"><span class="phi" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/></svg></span><span class="num">01</span><h2>Empathize</h2><b class="ess">The chore isn’t the hard part. Asking is.</b><p>How do households split chores and costs today, where does it break, and what would make people trust an app with something this personal?</p></header>

  <div class="block grid-3 two">
    <div class="card stack method"><span class="gi gi-blue" aria-hidden="true"><img src="/assets/icons/binoculars.svg" alt=""></span><span class="pill" style="background:var(--sky);color:var(--sky-ink);justify-self:start">Method 1</span><h3 style="font-size:22px">Competitor audit</h3><p class="muted" style="font-size:15px">Six apps in three rings: direct (Flatastic, Sweepy, Nipto, Tody), indirect (Splitwise, Settle Up), and the real rival, the habits: WhatsApp, Google Keep, memory.</p></div>
    <div class="card stack method"><span class="gi gi-orange" aria-hidden="true"><img src="/assets/icons/star.svg" alt=""></span><span class="pill" style="background:var(--sky);color:var(--sky-ink);justify-self:start">Method 2</span><h3 style="font-size:22px">App-store review analysis</h3><p class="muted" style="font-size:15px">Four apps with 94K+ ratings between them, coded as Review → Problem → Insight → Opportunity.</p></div>
  </div>

  <div class="block">
    <h3>The competitive landscape</h3>
    <div class="scroll" tabindex="0" role="region" aria-label="Competitor comparison table">
      <table class="cm">
        <thead><tr><th>Capability</th><th>Flatastic</th><th>Sweepy</th><th>Nipto</th><th>Tody</th><th>Splitwise</th><th>Settle Up</th><th class="us">Roomie</th></tr></thead>
        <tbody>
          <tr><td>Chores &amp; scheduling</td><td class="y" aria-label="Full"></td><td class="y" aria-label="Full"></td><td class="y" aria-label="Full"></td><td class="y" aria-label="Full"></td><td class="no" aria-label="None"></td><td class="no" aria-label="None"></td><td class="us y" aria-label="Full"></td></tr>
          <tr><td>Fairness tracking</td><td class="y" aria-label="Full"></td><td class="y" aria-label="Full"></td><td class="y" aria-label="Full"></td><td class="p" aria-label="Partial"></td><td class="no" aria-label="None"></td><td class="no" aria-label="None"></td><td class="us">Effort-based</td></tr>
          <tr><td>Expense splitting</td><td class="y" aria-label="Full"></td><td class="no" aria-label="None"></td><td class="no" aria-label="None"></td><td class="no" aria-label="None"></td><td class="y" aria-label="Full"></td><td class="y" aria-label="Full"></td><td class="us">Phase 2</td></tr>
          <tr><td>Grocery list</td><td class="y" aria-label="Full"></td><td class="no" aria-label="None"></td><td class="no" aria-label="None"></td><td class="no" aria-label="None"></td><td class="no" aria-label="None"></td><td class="no" aria-label="None"></td><td class="us">Shared vs. mine</td></tr>
          <tr><td>Schedule-aware allocation</td><td class="no" aria-label="None"></td><td class="p" aria-label="Partial"></td><td class="no" aria-label="None"></td><td class="no" aria-label="None"></td><td class="no" aria-label="None"></td><td class="no" aria-label="None"></td><td class="us">Core</td></tr>
          <tr><td>Neutral, non-blaming reminders</td><td class="p" aria-label="Partial"></td><td class="p" aria-label="Partial"></td><td class="p" aria-label="Partial"></td><td class="p" aria-label="Partial"></td><td class="p" aria-label="Partial"></td><td class="p" aria-label="Partial"></td><td class="us">Core</td></tr>
          <tr><td>Explains why a split is fair</td><td class="no" aria-label="None"></td><td class="no" aria-label="None"></td><td class="no" aria-label="None"></td><td class="no" aria-label="None"></td><td class="no" aria-label="None"></td><td class="no" aria-label="None"></td><td class="us">Core</td></tr>
        </tbody>
      </table>
    </div>
    <p class="legend mk"><span><i class="y"></i>Full</span><span><i class="p"></i>Partial / basic</span><span><i class="no"></i>None</span></p>
  </div>

  <div class="block">
    <h3>What reviewers told me, between the lines</h3>
    <div class="grid-4">
      <div class="card review"><h4>Sweepy</h4><p class="stars">4.5★<small>17.6K ratings</small></p><p style="margin-top:12px">Relief comes from <strong>not having to think</strong> about cleaning, not from cleaning less.</p><p class="opp">→ Carry the mental load, not just the list</p></div>
      <div class="card review"><h4>Tody</h4><p class="stars">4.7★<small>21.3K ratings</small></p><p style="margin-top:12px">Households aren’t static. People travel, get sick and change shifts.</p><p class="opp">→ The plan must bend around real weeks</p></div>
      <div class="card review"><h4>Nipto</h4><p class="stars">4.5★<small>6.4K ratings</small></p><p style="margin-top:12px">People want control over the rules, not a game imposed on them.</p><p class="opp">→ Motivation is optional and chosen</p></div>
      <div class="card review"><h4>Settle Up</h4><p class="stars">4.7★<small>49K ratings</small></p><p style="margin-top:12px">With money, trust comes from seeing the breakdown, not just the total.</p><p class="opp">→ Every number must explain itself</p></div>
    </div>
    <!-- TODO (Pema): swap in 2–3 short verbatim review lines from these store pages, attributed "App Store review, Sweepy, 2026". Re-check ratings before publishing. -->
  </div>

  <div class="block">
    <h3>Pain points: seven frictions, one root problem</h3>
    <p class="muted narrow">What the review analysis and the competitor audit kept surfacing, grouped into three clusters. Underneath all of them sits the same pattern.</p>
    <div class="pains">
      <div class="card pc"><p class="eyebrow">Ownership &amp; mental load</p><ol><li><b>01</b>No clear ownership of tasks</li><li><b>02</b>The responsible roommate carries the mental load</li></ol></div>
      <div class="card pc"><p class="eyebrow">Money &amp; groceries</p><ol><li><b>03</b>Shared vs. personal groceries are unclear</li><li><b>04</b>Small expenses are awkward to ask back</li></ol></div>
      <div class="card pc"><p class="eyebrow">Communication &amp; scheduling</p><ol><li><b>05</b>Information gets buried in chats</li><li><b>06</b>Changing schedules break chore plans</li></ol></div>
      <div class="card pc root"><p class="eyebrow">The root problem</p><ol><li><b>07</b>The same coordination problems repeat</li></ol><p>Ownership, money, schedules and communication break down together. The household runs on memory, manual coordination and awkward conversations.</p></div>
    </div>
  </div>

  <div class="block callout">
    <p class="eyebrow">The gap</p>
    <p>A chores-and-expenses app already exists. What no app does is plan around people’s real weeks and explain why the split is fair. The strongest competitor isn’t an app at all: it’s a free group chat everyone already uses.</p>
  </div>

  <div class="block idr" style="--fg:var(--sky-ink)">
    <div><p class="eyebrow">Insight</p><p>“All-in-one” isn’t a differentiator. Flatastic already combines chores, shopping and expenses.</p></div>
    <div><p class="eyebrow">Decision</p><p>Position Roomie as a <strong>neutral third party</strong> that carries the mental and social load, not as a tracker.</p></div>
    <div><p class="eyebrow">Result</p><p>Every later feature had to answer one question: does this remove a remembering or an awkward conversation?</p></div>
  </div>
  </div>
</section>
`;
