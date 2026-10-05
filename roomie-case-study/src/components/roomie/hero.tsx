import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const facts = [
  {
    label: "Timeline",
    value: "2 weeks",
    icon: (
      <>
        <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
        <path d="M3.5 10h17M8 3v4M16 3v4" />
      </>
    ),
  },
  {
    label: "Tools",
    value: "Figma, FigJam, AI synthesis",
    icon: (
      <>
        <path d="M14.5 4.5 19.5 9.5 9 20H4v-5L14.5 4.5Z" />
        <path d="m12.5 6.5 5 5" />
      </>
    ),
  },
  {
    label: "Platform",
    value: "iOS & Android",
    icon: (
      <>
        <rect x="6.5" y="2.5" width="11" height="19" rx="2.8" />
        <path d="M10.5 18.5h3" />
      </>
    ),
  },
];

export function Hero() {
  return (
    <div className="wrap hero">
      <div className="hero-copy">
        <p className="kicker">Roomie · UX case study</p>
        <h1>
          Fair isn&rsquo;t <em>equal.</em>
        </h1>
        <p className="lede">
          A household app for roommates in Kathmandu that makes fairness visible. It weighs
          chores by effort, bends around busy weeks, and sends the reminder itself, so nobody
          has to be the one who asks.
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
          <img src="/assets/screens/10-chores.png" alt="" />
        </figure>
        <figure className="device d-right">
          <img src="/assets/screens/27-lockscreen.png" alt="" />
        </figure>
        <figure className="device d-main">
          <img src="/assets/screens/09-home.png" alt="" />
        </figure>
      </div>

      <dl className="meta">
        {facts.map((f) => (
          <div key={f.label}>
            <span className="mi" aria-hidden="true">
              <svg viewBox="0 0 24 24">{f.icon}</svg>
            </span>
            <dt>{f.label}</dt>
            <dd>{f.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
