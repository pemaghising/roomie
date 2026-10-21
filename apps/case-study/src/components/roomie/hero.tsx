import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Hero() {
  return (
    <div className="wrap hero">
      <div className="hero-copy">
        <p className="kicker">Roomie · UX case study</p>
        <h1>
          Fair isn&rsquo;t <em>equal.</em>
        </h1>
        <p className="lede">
          Roomie balances chores by effort, not count. Busy weeks get lighter, missed chores go
          to a shared pool, and the app sends the nudge, so no one plays the parent.
        </p>
        <div className="author">
          <Avatar className="avatar-photo" size="lg">
            <AvatarImage src="/assets/avatar.png" alt="Pema Ghising" />
            <AvatarFallback>PG</AvatarFallback>
          </Avatar>
          <div>
            <b>Pema Ghising</b>
            <span>Lead Graphic Designer · Leapfrog Technology</span>
          </div>
        </div>
      </div>

      <div className="hero-art" aria-hidden="true">
        <figure className="device d-left">
          <span className="bezel"><img src="/assets/final/c1c-shared-pool.png" alt="" /><span className="glare" /></span>
        </figure>
        <figure className="device d-right">
          <span className="bezel"><img src="/assets/final/p1-pantry.png" alt="" /><span className="glare" /></span>
        </figure>
        <figure className="device d-main">
          <span className="bezel"><img src="/assets/final/h1-home.png" alt="" /><span className="glare" /></span>
        </figure>
      </div>

      <dl className="facts">
        <div><dt>Role</dt><dd>Lead Graphic Designer, leading research, UX, UI and brand</dd></div>
        <div><dt>Timeline</dt><dd>2 weeks</dd></div>
        <div><dt>Tools</dt><dd>Figma, Mobbin, Notion and AI tools</dd></div>
        <div><dt>Delivered</dt><dd>60+ hi-fi screens, a 50+ component library, a 36-page brand book and a marketing site</dd></div>
      </dl>
      {/* Tentative (#10): reading time + skim path. Delete this <p> to drop it. */}
      <p className="skim">
        About 25 min read. Short on time? Read the three cards below, then jump to{" "}
        <a href="#final-screens">the final screens</a> or <a href="#reflect">what I learned</a>.
      </p>
    </div>
  );
}
