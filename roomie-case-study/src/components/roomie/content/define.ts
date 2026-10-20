// Verbatim markup ported from roomie-case-study/index.html — see raw-section.tsx for why.
export const defineHtml = `
<section class="phase ph-def" id="define">
  <div class="wrap">
  <header class="phase-head"><span class="phi" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".6" fill="currentColor"/></svg></span><span class="num">02</span><h2>Define</h2><b class="ess">Fairness is effort, not count.</b><p>Turning scattered findings into one sharp problem: fairness is invisible, and enforcing it is socially expensive.</p></header>

  <div class="block">
    <h3>5 Whys</h3>
      <ol class="whys" style="padding:0;margin:0">
        <li style="--i:0"><span class="q">Why are roommates frustrated?</span><span class="a">Chores feel unfair.</span></li>
        <li style="--i:1"><span class="q">Why do they feel unfair?</span><span class="a">Responsibilities change and aren’t tracked.</span></li>
        <li style="--i:2"><span class="q">Why aren’t they tracked?</span><span class="a">People rely on memory, chats and manual effort.</span></li>
        <li style="--i:3"><span class="q">Why manual?</span><span class="a">No shared system adapts to changing schedules.</span></li>
        <li style="--i:4" class="root"><span class="q">Why does it matter?</span><span class="a">It creates mental load, awkward talks and repeat conflict.</span></li>
      </ol>
  </div>

  <div class="block">
    <h3>Affinity map: five themes</h3>
    <p class="muted narrow">I clustered the review findings, competitor gaps and root-cause chains until the same five problems kept showing up.</p>
    <div class="grid-5">
      <div class="sticky" style="background:var(--lav);--rot:-1.2deg"><h4>The silent burden</h4><p>One person notices everything and ends up doing it.</p></div>
      <div class="sticky" style="background:var(--peach);--rot:1deg"><h4>Awkward asking</h4><p>Reminding a roommate twice costs more socially than just doing it.</p></div>
      <div class="sticky" style="background:var(--mint);--rot:-.6deg"><h4>Grocery confusion</h4><p>Shared or personal? Already bought? Nobody&nbsp;knows.</p></div>
      <div class="sticky" style="background:var(--sky);--rot:1.4deg"><h4>Real life</h4><p>Exams, late shifts and travel break fixed rotas.</p></div>
      <div class="sticky" style="background:var(--amber);--rot:-1deg"><h4>Mental load</h4><p>Coordination lives in memory and a chat that scrolls away.</p></div>
    </div>
  </div>

  <div class="block">
    <h3>Four insights</h3>
    <div class="insights">
      <div class="insight"><b>1</b><h4>Fairness is effort, not count</h4><p>A 2-minute trash run and a 45-minute bathroom clean are not the same. Counting tasks hides the imbalance.</p></div>
      <div class="insight"><b>2</b><h4>The real chore is remembering</h4><p>Planning, assigning and following up is invisible work, and it usually lands on one person.</p></div>
      <div class="insight"><b>3</b><h4>A reminder from a friend reads as&nbsp;criticism</h4><p>Every root-cause chain ended the same way: there’s no neutral intermediary.<br><span class="hyp">Hypothesis · to validate</span></p></div>
      <div class="insight"><b>4</b><h4>Automation is trusted only when it explains itself</h4><p>“Why me, why this week” has to be answerable in one sentence.</p></div>
    </div>
  </div>

  <div class="block">
    <h3>Proto-personas</h3>
    <p class="label-note"><span class="hyp" style="margin:0">Working hypotheses</span> Built from the research themes; I’ll validate them in testing.</p>
    <div class="split" style="gap:20px">
      <div class="card persona" style="--bg:var(--sky)">
        <div class="avatar"><img src="/assets/personas/aarav.svg" alt="" width="128" height="128" loading="lazy"></div>
        <div><h4>Aarav Shrestha</h4><p class="role"><b>27 · Software engineer</b><span>New Baneshwor, Kathmandu · lives with 2 colleagues · high tech literacy</span></p></div>
        <blockquote>“I don’t mind helping out around the house, but I absolutely do not want to be the default apartment&nbsp;manager.”</blockquote>
        <dl>
          <div><dt>Goals</dt><dd>A clean flat without becoming the person who organises it, and no more passive-aggressive group chats.</dd></div>
          <div><dt>Pains</dt><dd>Reminding people wears him out, his hours change every week, and anything important gets lost in&nbsp;WhatsApp.</dd></div>
          <div><dt>Needs</dt><dd>A plan that works around his messy weeks, and for someone else to do the&nbsp;reminding.</dd></div>
          <div><dt>Represents</dt><dd>The busy professional.</dd></div>
        </dl>
      </div>
      <div class="card persona" style="--bg:var(--mint)">
        <div class="avatar"><img src="/assets/personas/prakash.svg" alt="" width="128" height="128" loading="lazy"></div>
        <div><h4>Prakash Gurung</h4><p class="role"><b>30 · Senior bank associate</b><span>Lakeside, Pokhara · lives with 2 roommates · medium tech literacy</span></p></div>
        <blockquote>“The hardest part of living together isn’t the physical cleaning. It’s the mental toll of constantly remembering what needs to be done.”</blockquote>
        <dl>
          <div><dt>Goals</dt><dd>A clean, welcoming home where everyone pulls their weight, and somewhere peaceful after long banking hours.</dd></div>
          <div><dt>Pains</dt><dd>Notices every unfinished chore, ends up doing it himself rather than asking twice, and is tired of keeping the whole house running.</dd></div>
          <div><dt>Needs</dt><dd>To stop being the one who notices everything, an easy way for anyone to pick up what was missed, and a sense that the effort evens out.</dd></div>
          <div><dt>Represents</dt><dd>The responsible roommate, carrying the silent burden.</dd></div>
        </dl>
      </div>
      <div class="card persona" style="--bg:var(--peach)">
        <div class="avatar"><img src="/assets/personas/sushmita.svg" alt="" width="128" height="128" loading="lazy"></div>
        <div><h4>Sushmita Karki</h4><p class="role"><b>22 · Business student</b><span>Jhamsikhel, Lalitpur · lives with 3 college friends · medium tech literacy</span></p></div>
        <blockquote>“I’d rather buy the milk again myself than argue with my friends about who finished it.”</blockquote>
        <dl>
          <div><dt>Goals</dt><dd>Keep groceries simple, keep her own things hers, and keep her friendships&nbsp;stress&#8209;free.</dd></div>
          <div><dt>Pains</dt><dd>Buying the same thing twice, flatmates finishing her snacks without asking, and a chore chart on the fridge that nobody follows.</dd></div>
          <div><dt>Needs</dt><dd>One list everyone can see so nothing gets bought twice, and a polite way to say “please don’t touch my stuff”.</dd></div>
          <div><dt>Represents</dt><dd>The university student.</dd></div>
        </dl>
      </div>
      <div class="card persona" style="--bg:var(--lav)">
        <div class="avatar"><img src="/assets/personas/nima.svg" alt="" width="128" height="128" loading="lazy"></div>
        <div><h4>Nima Tamang</h4><p class="role"><b>26 · Freelance graphic designer</b><span>Kapan, Kathmandu · lives with 1 childhood friend · high tech literacy</span></p></div>
        <blockquote>“I don’t need another complex app to manage my life. I just need a simple system that actually reduces my daily mental load.”</blockquote>
        <dl>
          <div><dt>Goals</dt><dd>Protect deep-focus time for client work, and spend as little time as possible on household admin.</dd></div>
          <div><dt>Pains</dt><dd>The work schedule changes every week, fixed cleaning calendars never last, and there’s no patience for setting up another app.</dd></div>
          <div><dt>Needs</dt><dd>Something that adjusts when the week changes, takes a minute to set up, and stays quiet unless it’s&nbsp;needed.</dd></div>
          <div><dt>Represents</dt><dd>The busy freelancer.</dd></div>
        </dl>
      </div>
    </div>
  </div>

  <div class="block">
    <h3>Current-state journey: the dishes pile up</h3>
    <div class="scroll" tabindex="0" role="region" aria-label="Current-state chore journey">
      <div class="journey" role="group" aria-label="Current-state chore journey">
        <div class="rh"></div><div class="st">Trigger</div><div class="st">Discussion</div><div class="st">Action</div><div class="st">Follow-up</div><div class="st">Resolution</div>
        <div class="rh">Does</div><div>Notices dishes piling up in the sink</div><div>Drops a hint in the WhatsApp group</div><div>Waits a day, then cleans it himself</div><div>Reminds again when it happens next week</div><div>Someone pitches in, the loop resets</div>
        <div class="rh">Thinks</div><div class="th">“Whose turn was it?”</div><div class="th">“I don’t want to sound like a nag.”</div><div class="th">“It’s faster if I just do it.”</div><div class="th">“Why is it always me?”</div><div class="th">“Fine, until next week.”</div>
        <div class="rh">Feels</div>
        <div class="curve">
          <svg viewBox="0 0 500 110" preserveAspectRatio="none" aria-label="Emotion curve: neutral, anxious, relieved, lowest at follow-up, partly recovers at resolution">
            <line x1="0" y1="55" x2="500" y2="55" stroke="#e5e7eb" stroke-dasharray="4 4"/>
            <path d="M50,52 C90,52 110,70 150,70 C190,70 210,40 250,40 C290,40 310,96 350,96 C390,96 410,34 450,34" fill="none" stroke="#a78bfa" stroke-width="3" vector-effect="non-scaling-stroke"/>
            </svg>
          <span class="mood" style="left:10%;top:47.3%" title="Neutral">😐</span><span class="mood" style="left:30%;top:63.6%" title="Anxious">😟</span><span class="mood" style="left:50%;top:36.4%" title="Relieved">🙂</span><span class="mood low" style="left:70%;top:87.3%" title="Lowest point">😣</span><span class="mood" style="left:90%;top:30.9%" title="Resigned">😮‍💨</span>
        </div>
        <div class="rh">Touchpoint</div><div>Kitchen</div><div>WhatsApp group</div><div>Kitchen</div><div>WhatsApp · in person</div><div>Kitchen</div>
        <div class="rh">Pain</div><div class="pain">No clear owner</div><div class="pain">A reminder reads as&nbsp;criticism</div><div class="pain">One person carries the load</div><div class="pain">Asking twice breeds resentment</div><div class="pain">It all happens again</div>
        <div class="rh">Opportunity</div><div class="opp">Every chore has an owner</div><div class="opp">The app sends the nudge</div><div class="opp">Weigh chores by effort</div><div class="opp">A shared pool anyone can claim</div><div class="opp">Rotate fairly around busy days</div>
      </div>
    </div>
  </div>

  <div class="block">
    <h3>Current-state journey: the groceries run out</h3>
    <p class="muted narrow">Aarav, a month in the same flat. The money half of the problem: one person buys, one person chases.</p>
    <div class="scroll" tabindex="0" role="region" aria-label="Current-state grocery journey">
      <div class="journey" role="group" aria-label="Current-state grocery journey">
        <div class="rh"></div><div class="st">Trigger</div><div class="st">Discussion</div><div class="st">Action</div><div class="st">Follow-up</div><div class="st">Resolution</div>
        <div class="rh">Does</div><div>Notices groceries are running low</div><div>Asks in the WhatsApp group if anyone needs anything</div><div>Buys everything and pays out of pocket</div><div>Works out everyone’s share and asks to be paid back</div><div>Everyone pays, and the house goes back to normal</div>
        <div class="rh">Thinks</div><div class="th">“Someone has to buy these today.”</div><div class="th">“Hopefully someone replies.”</div><div class="th">“I’ll just buy everything.”</div><div class="th">“I don’t want to keep asking for money.”</div><div class="th">“Finally, it’s settled.”</div>
        <div class="rh">Feels</div>
        <div class="curve">
          <svg viewBox="0 0 500 110" preserveAspectRatio="none" aria-label="Emotion curve: neutral, unsure, fine, lowest when asking for money back, relieved at resolution">
            <line x1="0" y1="55" x2="500" y2="55" stroke="#e5e7eb" stroke-dasharray="4 4"/>
            <path d="M50,52 C90,52 110,64 150,64 C190,64 210,44 250,44 C290,44 310,92 350,92 C390,92 410,30 450,30" fill="none" stroke="#a78bfa" stroke-width="3" vector-effect="non-scaling-stroke"/>
            </svg>
          <span class="mood" style="left:10%;top:47.3%" title="Neutral">😐</span><span class="mood" style="left:30%;top:58.2%" title="Unsure">🤔</span><span class="mood" style="left:50%;top:40%" title="Fine">🙂</span><span class="mood low" style="left:70%;top:83.6%" title="Lowest point">😬</span><span class="mood" style="left:90%;top:27.3%" title="Relieved">😌</span>
        </div>
        <div class="rh">Touchpoint</div><div>Kitchen</div><div>WhatsApp group</div><div>Supermarket · eSewa / Khalti</div><div>WhatsApp</div><div>Bank · wallet</div>
        <div class="rh">Pain</div><div class="pain">No clear owner</div><div class="pain">Messages get ignored</div><div class="pain">One person pays for everything</div><div class="pain">Asking for small amounts feels awkward</div><div class="pain">It all happens again next month</div>
        <div class="rh">Opportunity</div><div class="opp">Spot what’s running low</div><div class="opp">One shared list, no group-chat ask</div><div class="opp">Mark items Shared or Mine</div><div class="opp">A restock request becomes a claimable chore</div><div class="opp">Credit whoever restocks</div>
      </div>
    </div>
  </div>

  <div class="block split">
    <div class="flowtext">
      <h3>As-is chore flow: the memory and anxiety loop</h3>
      <p>Without a system, one missed chore forces a choice between two bad exits. Ramesh either sends an awkward text and creates tension, or does the chore himself while resentment builds. Both roads end in the same place, and the loop starts again next week.</p>
      <ul><li>No record of who owns what, so it all runs on memory.</li><li>The person who notices becomes the enforcer.</li><li>There is no neutral way out: every exit costs the relationship something.</li></ul>
      <div class="flow-legend"><span><i class="l-end"></i>Start / end</span><span><i></i>Action</span><span><i class="l-dec"></i>Decision</span><span><i class="l-bad"></i>Friction</span></div>
    </div>
    <figure class="card flow" style="margin:0" aria-label="As-is chore flowchart">
      <svg class="fcs" viewBox="0 0 350 734" style="max-width:350px" role="img" aria-label="As-is: Aman forgets a chore, Ramesh either sends an awkward text or does it silently, and the loop repeats next week."><g class="nd start"><rect x="115" y="2" width="120" height="38" rx="19"/><text class="t" x="175" y="27">Start</text></g><path class="ln" d="M175 40V66"/><path class="ah" d="M170 59L180 59L175 66Z"/><g class="nd "><rect x="67" y="66" width="216" height="54" rx="12"/><text class="t" x="175" y="91">Rely on memory</text><text class="s" x="175" y="108">No tracking system</text></g><path class="ln" d="M175 120V146"/><path class="ah" d="M170 139L180 139L175 146Z"/><g class="nd "><rect x="67" y="146" width="216" height="38" rx="12"/><text class="t" x="175" y="171">Aman forgets his chore</text></g><path class="ln" d="M175 184V210"/><path class="ah" d="M170 203L180 203L175 210Z"/><g class="nd "><rect x="67" y="210" width="216" height="54" rx="12"/><text class="t" x="175" y="235">Trash piles up</text><text class="s" x="175" y="252">Ramesh notices</text></g><path class="ln" d="M175 264V290"/><path class="ah" d="M170 283L180 283L175 290Z"/><g class="dm"><path d="M175 290L249 340L175 390L101 340Z"/><text x="175" y="345">Remind him?</text></g><path class="ln" d="M101 340H95.5Q87.5 340 87.5 348V416"/><path class="ah" d="M82.5 409L92.5 409L87.5 416Z"/><text class="lb l" x="80.5" y="366">Yes</text><g class="nd bad"><rect x="9.5" y="416" width="156" height="54" rx="12"/><text class="t" x="87.5" y="441">Awkward text sent</text><text class="s" x="87.5" y="458">Tension created</text></g><path class="ln" d="M249 340H254.5Q262.5 340 262.5 348V416"/><path class="ah" d="M257.5 409L267.5 409L262.5 416Z"/><text class="lb r" x="269.5" y="366">No</text><g class="nd "><rect x="184.5" y="416" width="156" height="54" rx="12"/><text class="t" x="262.5" y="441">Avoids conflict</text><text class="s" x="262.5" y="458">Social anxiety</text></g><path class="ln" d="M262.5 470V496"/><path class="ah" d="M257.5 489L267.5 489L262.5 496Z"/><g class="nd "><rect x="184.5" y="496" width="156" height="56" rx="12"/><text class="t" x="262.5" y="521">Ramesh does it</text><text class="t" x="262.5" y="539">silently</text></g><path class="ln" d="M262.5 552V578"/><path class="ah" d="M257.5 571L267.5 571L262.5 578Z"/><g class="nd bad"><rect x="184.5" y="578" width="156" height="56" rx="12"/><text class="t" x="262.5" y="603">Silent resentment</text><text class="t" x="262.5" y="621">builds</text></g><path class="ln" d="M87.5 470V644Q87.5 652 95.5 652H175"/><path class="ln" d="M262.5 634V644Q262.5 652 254.5 652H175"/><path class="ln" d="M175 652V678"/><path class="ah" d="M170 671L180 671L175 678Z"/><g class="nd end bad"><rect x="67" y="678" width="216" height="54" rx="27"/><text class="t" x="175" y="703">End</text><text class="s" x="175" y="720">The loop repeats next week</text></g></svg>
    </figure>
  </div>

  <div class="block statement">
    <p class="eyebrow" style="color:var(--lav-ink)">Problem statement</p>
    <blockquote>Roommates struggle to manage shared chores and groceries fairly because they rely on memory, scattered chats and manual coordination. As schedules change, responsibility blurs, creating mental load, awkward conversations and repeated friction.</blockquote>
    <div class="hmw">
      <div><b>Core HMW ·</b> How might we help roommates share a home in a way that feels fair, effortless, and free from awkward conversations?</div>
      <div><b>HMW</b> make chore distribution feel fair despite changing schedules?</div>
      <div><b>HMW</b> reduce the mental load of remembering, coordinating and following up?</div>
      <div><b>HMW</b> let the system do the reminding, so nobody has to?</div>
    </div>
  </div>

  <div class="block">
    <h3>Success criteria</h3>
    <div class="targets">
      <div class="card"><span class="tlabel">Target</span><strong>&lt; 60s</strong><p>to set up a household and invite a roommate</p></div>
      <div class="card"><span class="tlabel">Target</span><strong>1 line</strong><p>to explain any assignment (“Your turn — Priya did it last week.”)</p></div>
      <div class="card"><span class="tlabel">Target</span><strong>0</strong><p>person-to-person reminders for tracked chores</p></div>
      <div class="card"><span class="tlabel">Target</span><strong>0 / 6</strong><p>test participants describing a nudge as nagging or shaming</p></div>
    </div>
  </div>
  </div>
</section>
`;
