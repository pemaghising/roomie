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
          <img src="/assets/final/c1-todo.png" alt="" />
        </figure>
        <figure className="device d-right">
          <img src="/assets/final/c4-add-chore.png" alt="" />
        </figure>
        <figure className="device d-main">
          <img src="/assets/final/h1-home.png" alt="" />
        </figure>
      </div>
    </div>
  );
}
