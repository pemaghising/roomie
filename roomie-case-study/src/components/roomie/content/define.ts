// Verbatim markup ported from roomie-case-study/index.html — see raw-section.tsx for why.
export const defineHtml = `
<section class="phase ph-def" id="define">
  <div class="wrap">
  <header class="phase-head"><span class="phi" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".6" fill="currentColor"/></svg></span><span class="num">02</span><h2>Define</h2><p>Turning scattered findings into one sharp problem: fairness is invisible, and enforcing it is socially expensive.</p></header>

  <div class="block">
    <h3>Affinity map: five themes</h3>
    <p class="muted narrow">I clustered the review findings, competitor gaps and root-cause chains until the same five problems kept showing up.</p>
    <div class="grid-5">
      <div class="sticky" style="background:var(--lav);--rot:-1.2deg"><h4>The silent burden</h4><p>One person notices everything and ends up doing it.</p></div>
      <div class="sticky" style="background:var(--peach);--rot:1deg"><h4>Awkward money</h4><p>Asking for Rs.&nbsp;150 back costs more socially than it’s worth.</p></div>
      <div class="sticky" style="background:var(--mint);--rot:-.6deg"><h4>Grocery confusion</h4><p>Shared or personal? Already bought? Nobody knows.</p></div>
      <div class="sticky" style="background:var(--sky);--rot:1.4deg"><h4>Real life</h4><p>Exams, late shifts and travel break fixed rotas.</p></div>
      <div class="sticky" style="background:var(--amber);--rot:-1deg"><h4>Mental load</h4><p>Coordination lives in memory and a chat that scrolls away.</p></div>
    </div>
  </div>

  <div class="block split">
    <div class="stack" style="gap:28px">
      <h3 style="font-size:clamp(26px,3vw,34px)">Four insights</h3>
      <div class="insight"><b>1</b><h4>Fairness is effort, not count</h4><p>A 2-minute trash run and a 45-minute bathroom clean are not the same. Counting tasks hides the imbalance.</p></div>
      <div class="insight"><b>2</b><h4>The real chore is remembering</h4><p>Planning, assigning and following up is invisible work, and it usually lands on one person.</p></div>
      <div class="insight"><b>3</b><h4>A reminder from a friend reads as criticism</h4><p>Every root-cause chain ended the same way: there’s no neutral intermediary.<br><span class="hyp">Hypothesis · to validate</span></p></div>
      <div class="insight"><b>4</b><h4>Automation is trusted only when it explains itself</h4><p>“Why me, why this week” has to be answerable in one sentence.</p></div>
    </div>
    <div class="stack">
      <h3 style="font-size:clamp(26px,3vw,34px)">5 Whys</h3>
      <ol class="whys" style="padding:0;margin:0">
        <li style="--i:0"><span class="q">Why are roommates frustrated?</span><span class="a">Chores and expenses feel unfair.</span></li>
        <li style="--i:1"><span class="q">Why do they feel unfair?</span><span class="a">Responsibilities change and aren’t tracked.</span></li>
        <li style="--i:2"><span class="q">Why aren’t they tracked?</span><span class="a">People rely on memory, chats and manual effort.</span></li>
        <li style="--i:3"><span class="q">Why manual?</span><span class="a">No shared system adapts to changing schedules.</span></li>
        <li style="--i:4" class="root"><span class="q">Why does it matter?</span><span class="a">It creates mental load, awkward talks and repeat conflict.</span></li>
      </ol>
    </div>
  </div>

  <div class="block">
    <h3>Proto-personas</h3>
    <p class="label-note"><span class="hyp" style="margin:0">Working hypotheses</span> Built from the research themes; I’ll validate them in testing.</p>
    <div class="split" style="gap:20px">
      <div class="card persona" style="--bg:var(--sky)">
        <div class="avatar">👨‍💻</div>
        <div><h4>Aarav Shrestha</h4><p class="role">27 · Software engineer · New Baneshwor, Kathmandu · lives with 2 colleagues</p>
          <blockquote>“I don’t mind helping out, but I don’t want to be the default apartment manager.”</blockquote></div>
        <dl>
          <div><dt>Goals</dt><dd>Split rent and chores fairly without doing the maths or the policing.</dd></div>
          <div><dt>Pains</dt><dd>Wastes energy reminding others; updates get buried in WhatsApp.</dd></div>
          <div><dt>Needs</dt><dd>Chores that follow his real work schedule.</dd></div>
          <div><dt>Represents</dt><dd>The busy one whose weeks are never the same.</dd></div>
        </dl>
      </div>
      <div class="card persona" style="--bg:var(--mint)">
        <div class="avatar">👨</div>
        <div><h4>Prakash Gurung</h4><p class="role">30 · Bank associate · Lakeside, Pokhara · lives with 2 roommates</p>
          <blockquote>“The hardest part isn’t the cleaning. It’s the mental toll of constantly remembering.”</blockquote></div>
        <dl>
          <div><dt>Goals</dt><dd>A calm, clean home and a balanced load.</dd></div>
          <div><dt>Pains</dt><dd>Notices every unfinished chore; does it himself rather than ask twice.</dd></div>
          <div><dt>Needs</dt><dd>Reminders that run without him.</dd></div>
          <div><dt>Represents</dt><dd>The silent-burden carrier.</dd></div>
        </dl>
      </div>
    </div>
    <div class="minis">
      <div class="card mini" style="--bg:var(--peach)"><div class="avatar">👩‍🎓</div><div><h4>Sushmita, 22 · Student</h4><p>“I’d rather pay a little extra than argue over Rs. 100.”</p></div></div>
      <div class="card mini" style="--bg:var(--lav)"><div class="avatar">🎨</div><div><h4>Nima, 26 · Freelancer</h4><p>Schedule changes every week; won’t maintain another complex app.</p></div></div>
    </div>
  </div>

  <div class="block">
    <h3>Current-state journey: the grocery run</h3>
    <div class="scroll">
      <div class="journey" role="table" aria-label="Current-state grocery journey">
        <div class="rh"></div><div class="st">Trigger</div><div class="st">Discussion</div><div class="st">Action</div><div class="st">Follow-up</div><div class="st">Resolution</div>
        <div class="rh">Does</div><div>Notices supplies running low</div><div>Asks in WhatsApp if anyone needs anything</div><div>Buys everything with own money</div><div>Calculates shares, asks for payment</div><div>Everyone pays, back to normal</div>
        <div class="rh">Thinks</div><div class="th">“Someone has to buy these today.”</div><div class="th">“Hopefully someone replies.”</div><div class="th">“I’ll just buy everything.”</div><div class="th">“I don’t want to keep asking.”</div><div class="th">“Finally, it’s settled.”</div>
        <div class="rh">Feels</div>
        <div class="curve">
          <svg viewBox="0 0 500 110" preserveAspectRatio="none" aria-label="Emotion curve: neutral, anxious, relieved, lowest at follow-up, recovers at resolution">
            <line x1="0" y1="55" x2="500" y2="55" stroke="#e5e7eb" stroke-dasharray="4 4"/>
            <path d="M50,52 C90,52 110,70 150,70 C190,70 210,40 250,40 C290,40 310,96 350,96 C390,96 410,34 450,34" fill="none" stroke="#a78bfa" stroke-width="3" vector-effect="non-scaling-stroke"/>
            </svg>
          <span class="mood" style="left:10%;top:47.3%" title="Neutral">😐</span><span class="mood" style="left:30%;top:63.6%" title="Anxious">😟</span><span class="mood" style="left:50%;top:36.4%" title="Relieved">🙂</span><span class="mood low" style="left:70%;top:87.3%" title="Lowest point">😣</span><span class="mood" style="left:90%;top:30.9%" title="Relief">😌</span>
        </div>
        <div class="rh">Touchpoint</div><div>Kitchen</div><div>WhatsApp</div><div>Supermarket · eSewa / Khalti</div><div>WhatsApp</div><div>Bank / wallet</div>
        <div class="rh">Pain</div><div class="pain">No clear owner</div><div class="pain">Messages ignored</div><div class="pain">One person fronts it all</div><div class="pain">Asking for small amounts is awkward</div><div class="pain">It all happens again</div>
        <div class="rh">Opportunity</div><div class="opp">Spot recurring needs</div><div class="opp">Shared pantry list</div><div class="opp">Mark shared vs. personal</div><div class="opp">The app does the asking</div><div class="opp">Track contribution over time</div>
      </div>
    </div>
  </div>

  <div class="block split">
    <div class="flowtext">
      <h3>As-is chore flow: the memory and anxiety loop</h3>
      <p>Without a system, one missed chore forces a choice between two bad exits. Rahul either sends an awkward text and creates tension, or does the chore himself while resentment builds. Both roads end in the same place, and the loop starts again next week.</p>
      <ul><li>No record of who owns what, so it all runs on memory.</li><li>The person who notices becomes the enforcer.</li><li>There is no neutral way out: every exit costs the relationship something.</li></ul>
      <div class="flow-legend"><span><i class="l-end"></i>Start / end</span><span><i></i>Action</span><span><i class="l-dec"></i>Decision</span><span><i class="l-bad"></i>Friction</span></div>
    </div>
    <figure class="card flow" style="margin:0" aria-label="As-is chore flowchart">
      <svg class="fcs" viewBox="0 0 350 734" style="max-width:350px" role="img" aria-label="As-is: Aman forgets a chore, Rahul either sends an awkward text or does it silently, and the loop repeats next week."><g class="nd start"><rect x="115" y="2" width="120" height="38" rx="19"/><text class="t" x="175" y="27">Start</text></g><path class="ln" d="M175 40V66"/><path class="ah" d="M170 59L180 59L175 66Z"/><g class="nd "><rect x="67" y="66" width="216" height="54" rx="12"/><text class="t" x="175" y="91">Rely on memory</text><text class="s" x="175" y="108">No tracking system</text></g><path class="ln" d="M175 120V146"/><path class="ah" d="M170 139L180 139L175 146Z"/><g class="nd "><rect x="67" y="146" width="216" height="38" rx="12"/><text class="t" x="175" y="171">Aman forgets his chore</text></g><path class="ln" d="M175 184V210"/><path class="ah" d="M170 203L180 203L175 210Z"/><g class="nd "><rect x="67" y="210" width="216" height="54" rx="12"/><text class="t" x="175" y="235">Trash piles up</text><text class="s" x="175" y="252">Rahul notices</text></g><path class="ln" d="M175 264V290"/><path class="ah" d="M170 283L180 283L175 290Z"/><g class="dm"><path d="M175 290L249 340L175 390L101 340Z"/><text x="175" y="345">Remind him?</text></g><path class="ln" d="M101 340H95.5Q87.5 340 87.5 348V416"/><path class="ah" d="M82.5 409L92.5 409L87.5 416Z"/><text class="lb l" x="80.5" y="366">YES</text><g class="nd bad"><rect x="9.5" y="416" width="156" height="54" rx="12"/><text class="t" x="87.5" y="441">Awkward text sent</text><text class="s" x="87.5" y="458">Tension created</text></g><path class="ln" d="M249 340H254.5Q262.5 340 262.5 348V416"/><path class="ah" d="M257.5 409L267.5 409L262.5 416Z"/><text class="lb r" x="269.5" y="366">NO</text><g class="nd "><rect x="184.5" y="416" width="156" height="54" rx="12"/><text class="t" x="262.5" y="441">Avoids conflict</text><text class="s" x="262.5" y="458">Social anxiety</text></g><path class="ln" d="M262.5 470V496"/><path class="ah" d="M257.5 489L267.5 489L262.5 496Z"/><g class="nd "><rect x="184.5" y="496" width="156" height="56" rx="12"/><text class="t" x="262.5" y="521">Rahul does it</text><text class="t" x="262.5" y="539">silently</text></g><path class="ln" d="M262.5 552V578"/><path class="ah" d="M257.5 571L267.5 571L262.5 578Z"/><g class="nd bad"><rect x="184.5" y="578" width="156" height="56" rx="12"/><text class="t" x="262.5" y="603">Silent resentment</text><text class="t" x="262.5" y="621">builds</text></g><path class="ln" d="M87.5 470V644Q87.5 652 95.5 652H175"/><path class="ln" d="M262.5 634V644Q262.5 652 254.5 652H175"/><path class="ln" d="M175 652V678"/><path class="ah" d="M170 671L180 671L175 678Z"/><g class="nd end bad"><rect x="67" y="678" width="216" height="54" rx="27"/><text class="t" x="175" y="703">End</text><text class="s" x="175" y="720">The loop repeats next week</text></g></svg>
    </figure>
  </div>
  <details class="block orig"><summary>See the original as-is flow from Figma</summary><div><img src="/assets/flows/asis-chore.png" alt="Original as-is chore flowchart from Figma" loading="lazy"></div></details>

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
      <div class="card"><span class="tlabel">Target</span><strong>1 line</strong><p>to explain any assignment (“Heavy task moved off your busy Wednesday”)</p></div>
      <div class="card"><span class="tlabel">Target</span><strong>0</strong><p>person-to-person reminders for tracked chores</p></div>
      <div class="card"><span class="tlabel">Target</span><strong>0 / 6</strong><p>test participants describing a nudge as nagging or shaming</p></div>
    </div>
  </div>
  </div>
</section>
`;
