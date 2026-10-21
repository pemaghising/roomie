// Verbatim markup ported from roomie-case-study/index.html — see raw-section.tsx for why.
export const reflectHtml = `
<section class="phase ph-ref" id="reflect">
  <div class="wrap">
  <header class="phase-head"><span class="phi" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5.3L20 9"/><path d="M20 4v5h-5"/><path d="M20 12a8 8 0 0 1-14 5.3L4 15"/><path d="M4 20v-5h5"/></svg></span><span class="num">06</span><h2>Reflect</h2><b class="ess">From how it looks to what it does.</b><p>What changed when a graphic designer had to decide how a product behaves.</p></header>
  <div class="block">
    <div class="argument">
      <p>I came to Roomie as a graphic designer. My job had been to make things look right: a layout, a palette, a brand. A page is finished when it looks finished.</p>
      <p>A chore app is never one page. It is a set of rules that run every day, for people who share a kitchen and don’t want to fight about it. The design that mattered most here has no pixels: what “fair” means, what happens on a busy day, when the plant droops and when it resets. The screens only got easy once those rules were written down.</p>
      <p>The craft I brought didn’t go to waste. It moved. A chore app that looks like a scoreboard behaves like one, so the calm palette, the plant and the words-not-numbers are product decisions, not decoration.</p>
    </div>
  </div>
  <div class="block learn">
    <div class="card"><span class="pill" style="background:var(--lav);color:var(--lav-ink);justify-self:start">Shift 1</span><h3>From the screen to the system</h3><p>I used to start with the artboard. Here I started with the rules: effort weights, busy days, the pool, the streak window. Every screen became a view of the same system, so nothing had to be decided twice.</p></div>
    <div class="card"><span class="pill" style="background:var(--peach);color:var(--peach-ink);justify-self:start">Shift 2</span><h3>From taste to trade-offs</h3><p>Every idea looked good on a sticky note. Scoring each one against what flats already use kept V1 on the chore loop, the one problem nothing else solves, and gave money and AI a clear place in Phase 2. A score is only as honest as what you compare it to.</p></div>
    <div class="card"><span class="pill" style="background:var(--mint);color:var(--mint-ink);justify-self:start">Shift 3</span><h3>From the good day to the bad day</h3><p>My first drafts showed the house when everything went right. Product design is mostly the other days: a wrong code, an empty home, a chore nobody did, someone moving out. Those states are where “no blame” is either real or a tagline.</p></div>
  </div>
  <div class="block">
    <div class="card nexttime"><span class="pill" style="background:var(--rose);color:var(--rose-ink);justify-self:start">Next time</span><h3>Put it in front of people sooner</h3><p>My evidence comes from public reviews, competitor products and structured reasoning. It’s real, but it isn’t the people who’ll use Roomie. The first hi-fi pass had two slips a quick test would have caught: a household “rank” that broke my own no-ranking principle, and a Home nav bar highlighting Chores. Both are fixed, but I found them myself, late.</p></div>
  </div>
  <div class="block">
    <h3>Did the design meet its goals?</h3>
    <p class="muted narrow">In Define I set four goals. Here is how the final design aims at each one. One can be checked just by looking at the screens; the other three can only be proven by real people using it.</p>
    <div class="scroll"><table class="plan check">
      <thead><tr><th>Goal</th><th>How the design aims at it</th><th>Do we know yet?</th></tr></thead>
      <tbody>
        <tr><td data-label="Goal">Set up a home and invite a flatmate in under a minute</td><td data-label="How the design aims at it">Seven short screens. Common chores come pre-ticked, busy days fit on one screen, and inviting is a QR code or a 6-character code.</td><td data-label="Do we know yet?"><span class="st">Not yet</span><small class="st-note">Time 6 people in the usability test</small></td></tr>
        <tr><td data-label="Goal">Explain any chore in one line</td><td data-label="How the design aims at it">“Why these chores” gives every chore a single line, like “Your turn — Priya did it last week.”</td><td data-label="Do we know yet?"><span class="st st-d">Yes</span><small class="st-note">You can see it on the screen</small></td></tr>
        <tr><td data-label="Goal">Nobody has to remind a flatmate themselves</td><td data-label="How the design aims at it">Reminders come from Roomie, and a missed chore goes to a shared pool anyone can pick up, with no message needed.</td><td data-label="Do we know yet?"><span class="st">Not yet</span><small class="st-note">Needs two homes using it for two&nbsp;weeks</small></td></tr>
        <tr><td data-label="Goal">No one feels nagged or shamed by a reminder</td><td data-label="How the design aims at it">Two reminder styles to choose from, friendly copy, and no names on missed chores.</td><td data-label="Do we know yet?"><span class="st">Not yet</span><small class="st-note">Ask all 6 people in the usability test</small></td></tr>
      </tbody>
    </table></div>
  </div>
  <div class="block">
    <h3>Beyond the app</h3>
    <p class="muted narrow">A product also has to be found and trusted before anyone opens it, so I took Roomie past the screens.</p>
    <div class="beyond">
      <a class="card" href="https://roomie-site-sigma.vercel.app/" target="_blank" rel="noopener"><b>Marketing website</b><p>Sells the same three ideas as the app: effort, the shared pool and the nudge. Written for flatmates, not designers.</p><span>See the website →</span></a>
      <a class="card" href="/roomie-brand-guidelines.pdf" target="_blank" rel="noopener"><b>Brand guidelines</b><p>36 pages of logo, colour, type, voice and photography rules, so the app, site and store listing speak with one voice.</p><span>Open the PDF →</span></a>
    </div>
  </div>
  <div class="block">
    <h3 style="font-size:26px">What’s next</h3>
    <div class="next"><span class="pill">1 · Run the usability test</span><span class="pill">2 · Prototype the celebrations in motion</span><span class="pill">3 · Test the house-plant streak framing</span><span class="pill">4 · Phase 2: the Rolling Tab, explained line by line</span></div>
  </div>
  </div>
</section>
`;
