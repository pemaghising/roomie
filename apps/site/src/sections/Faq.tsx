import "./faq.css";

const PROTOTYPE = "https://roomie-mobile.vercel.app";

const FAQS: { q: string; a: string[] }[] = [
  {
    q: "How does Roomie keep it fair?",
    a: [
      "Every chore is Light, Medium or Heavy, so taking out the trash and scrubbing the bathroom don’t count the same.",
      "Each week Roomie hands chores out one at a time, each to whoever has done the least so far. Everyone ends up doing about the same amount of work, not the same number of chores. Nobody sees scores or a ranking, just whether they’re on track.",
    ],
  },
  {
    q: "What if I have a really busy week?",
    a: [
      "Mark your busy days once, say Tuesday, Wednesday and Friday. Heavy chores never land on those days, so the big jobs go to days you’re actually free.",
      "You can change your busy days any time, and the next week’s plan follows.",
    ],
  },
  {
    q: "What happens when someone misses a chore?",
    a: [
      "It moves to a shared pool. The pool shows the chore, never who missed it, so nobody gets called out.",
      "Anyone can claim it, and whoever does gets a lighter week after. Until it’s done, the house plant droops a little. Catch up in time and it perks back up.",
    ],
  },
  {
    q: "Will Roomie nag my flatmates?",
    a: [
      "Roomie sends the reminders, so nobody in the flat has to. Each person picks the tone they like: Motivate me, or Just the facts.",
      "Reminders are calm and about the chore, never about the person.",
    ],
  },
  {
    q: "How does the shared pantry work?",
    a: [
      "Shared things, like milk or rice, are for everyone. When something runs low, flag it or ask the house to restock. Tap “I’ll get it” and everyone can see who’s on it, so nobody buys it twice.",
      "Your own things stay yours. Tag them Do not touch, or Ask first. If someone asks to use an Ask first item, you approve it from Activity.",
    ],
  },
  {
    q: "What does the house streak count?",
    a: [
      "A day counts when every chore due that day is done. The whole house shares one streak, and the plant grows at 3, 7, 14 and 30 days.",
      "It’s something you grow together, not a scoreboard.",
    ],
  },
  {
    q: "How do my flatmates join?",
    a: [
      "Whoever sets up the home gets a QR code and a six-character home code. Flatmates scan it or type it in, and everyone’s in the same home.",
      "Each person only ever sees their own home.",
    ],
  },
  {
    q: "Can I download it yet?",
    a: [
      "Not quite. Roomie is coming to the App Store and Google Play soon.",
      "Until then, you can try the full interactive prototype in your browser.",
    ],
  },
];

/** Plain answers to what people ask before they move in. Native details/summary: works without script, one open at a time. */
export function Faq() {
  return (
    <section id="faq" className="faq">
      <div className="wrap faq-grid">
        <div className="faq-head">
          <p className="eyebrow">Before you move in</p>
          <h2>A few things <em>you might wonder.</em></h2>
          <a className="faq-link" href={PROTOTYPE} target="_blank" rel="noopener">
            Try the interactive prototype <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="faq-list">
          {FAQS.map((f, i) => (
            <details key={f.q} name="faq" open={i === 0}>
              <summary>
                <span>{f.q}</span>
                <i aria-hidden="true" />
              </summary>
              <div className="faq-a">
                {f.a.map((p) => <p key={p}>{p}</p>)}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
