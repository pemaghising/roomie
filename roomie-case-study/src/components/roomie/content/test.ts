// Verbatim markup ported from roomie-case-study/index.html — see raw-section.tsx for why.
export const testHtml = `
<section class="phase ph-tes" id="test">
  <div class="wrap">
  <header class="phase-head"><span class="phi" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9.5 3h5M10 3v6L5 18.5A1.7 1.7 0 0 0 6.5 21h11a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><path d="M7.5 15h9"/></svg></span><span class="num">05</span><h2>Test</h2><p>Roomie hasn’t been tested with users yet. This is the plan I’d run next, and what each result would change.</p></header>

  <div class="block">
    <h3>Round 1: moderated usability test</h3>
    <p class="muted narrow"><strong>Who:</strong> 6 people who share a flat in the Kathmandu Valley: 2 who usually end up doing the extra work, 2 with unpredictable schedules, and 2 who tried a chore app or rota and gave up. No friends or bootcamp classmates; they’re too kind to the design.</p>
    <p class="muted narrow"><strong>How:</strong> 40 minutes each on the Figma prototype, thinking aloud. It opens with “tell me about the last time a chore got missed at home”. Tasks are situations, not screen names, and I don’t help. I note what people do (pause, backtrack, reach for WhatsApp) before what they say.</p>
    <div class="scroll">
      <table class="plan">
        <thead><tr><th>Scenario I read out</th><th>Pass if</th><th>Tests insight</th></tr></thead>
        <tbody>
          <tr><td data-label="Scenario">“You’ve just moved into a 2BHK in Lalitpur with a friend. Get Roomie ready so you can both use it.”</td><td data-label="Pass if">Home created and invite shared in under 60s, without help</td><td data-label="Tests insight">Automation shouldn’t become a chore</td></tr>
          <tr><td data-label="Scenario">“You have exams on Wednesday and Thursday. Make sure you’re not stuck cleaning the bathroom those days.”</td><td data-label="Pass if">Marks busy days unprompted; explains in one sentence why the heavy chore moved</td><td data-label="Tests insight">Fair is effort, not count</td></tr>
          <tr><td data-label="Scenario">“Aman didn’t take the trash out on Sunday. It’s still there on Monday morning. What do you do?”</td><td data-label="Pass if">Claims it from the pool without messaging Aman; describes it without blame words</td><td data-label="Tests insight">Reminders from friends read as criticism</td></tr>
          <tr><td data-label="Scenario">“The shared cooking oil is almost finished. Make sure someone buys more.”</td><td data-label="Pass if">Sends a restock request and expects it to become a claimable chore</td><td data-label="Tests insight">One system, not two</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="block risk">
    <div class="stack"><p class="eyebrow" style="color:var(--amber-ink)">Riskiest assumption</p><h4>Do streaks and “effort debt” motivate, or shame?</h4><p>The research warns against ranking people, but V1 resets streaks and gives a heavier load to whoever misses tasks. I’d show the streak-reset and effort-debt screens in both nudge styles, watch the first reaction, then ask one neutral question:</p></div>
    <div class="stack" style="align-content:center"><q>Tell me what this screen is saying about you.</q><p>The target is zero. One “judged” gets probed; if 2 of 6 describe it as blame or punishment, streaks become opt-in and effort debt becomes private.</p></div>
  </div>

  <div class="block">
    <h3>What the results would change</h3>
    <div class="idr" style="--fg:var(--amber-ink)">
      <div><p class="eyebrow">A task fails</p><p>Fix the screen and retest with 5 new people before moving on.</p></div>
      <div><p class="eyebrow">The pool reads as blame</p><p>Back to Define. The “neutral third party” insight is wrong, not just the UI.</p></div>
      <div><p class="eyebrow">Only minor friction</p><p>Log it for the backlog and move to Round 2.</p></div>
    </div>
  </div>

  <div class="block idr" style="--fg:var(--amber-ink)">
    <div><p class="eyebrow">Round 2</p><p><strong>Concierge pilot.</strong> Run the Sunday chore plan by hand for two households over WhatsApp for two weeks.</p></div>
    <div><p class="eyebrow">Why</p><p>It tests the core bet (does a neutral planner reduce friction?) before any code exists.</p></div>
    <div><p class="eyebrow">Measure</p><p>Reminders sent person to person (target: zero), plans accepted without edits, and how each household describes the fortnight in a closing call.</p></div>
  </div>
  </div>
</section>
`;
