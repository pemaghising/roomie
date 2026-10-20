"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Phone } from "@/ui/Phone";
import "./features.css";

gsap.registerPlugin(ScrollTrigger);

const TOUR = "(min-width: 821px) and (prefers-reduced-motion: no-preference)";

type Feature = {
  key: string; title: string; body: string;
  screen?: string; card?: string; alt: string;
  /** The one moment that lifts out of the phone when this feature arrives; top is a % of the phone height. */
  pop?: ReactNode; popTop?: string;
};

const img = (src: string, alt: string) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={src} alt={alt} loading="lazy" />
);

/** Everything in the app, one feature at a time. Every screen is a real v2 screen. */
const FEATURES: Feature[] = [
  {
    key: "effort", title: "Effort, not headcount",
    body: "Every chore is Light, Medium or Heavy. Roomie rotates them so nobody’s stuck with the bathroom.",
    screen: "/screens/f-pick-chores.webp", alt: "Pick your chores: wash dishes Light, vacuum Medium, mop bathroom Heavy",
    pop: (
      <div className="effort-card" aria-hidden="true">
        <span className="ec-label">How Roomie weighs it</span>
        {[["light", "Light", "Take out trash"], ["med", "Medium", "Vacuum"], ["heavy", "Heavy", "Mop bathroom"]].map(([k, tag, chore]) => (
          <span key={k} className={`ec-row ec-row--${k}`}>
            <b>{tag}</b><span className="ec-chore">{chore}</span><span className="ec-bar"><i /></span>
          </span>
        ))}
      </div>
    ), popTop: "46%",
  },
  {
    key: "busy", title: "Built around your week",
    body: "Mark your busy days once. Heavy chores land on the days you’re actually free.",
    screen: "/screens/f-calendar.webp", alt: "Calendar week with busy days shaded and light chores on them",
    pop: img("/cards/w-mon-card.webp", "Tue, Wed and Fri. Heavy chores stay off these days."), popTop: "74%",
  },
  {
    key: "pool", title: "A shared pool, no blame",
    body: "Missed chores slip into a pool with no names attached. Claim one and your next week gets lighter.",
    screen: "/screens/c1c-shared-pool.webp", alt: "Shared pool: Mop bathroom floor and Take out recycling, each with a Claim button",
    pop: img("/cards/w-thu-toast.webp", "Mop bathroom floor is yours. You’ll get a lighter week."), popTop: "48%",
  },
  {
    key: "nudge", title: "Nudges in your tone",
    body: "Motivate me, or just the facts. Roomie does the reminding, so nobody in the flat has to.",
    screen: "/screens/f-nudge-style.webp", alt: "Nudge style: Motivate me or Just the facts",
  },
  {
    key: "restock", title: "Restock in one tap",
    body: "Out of milk? Ask the house, pick how soon, and it becomes a chore anyone can claim.",
    screen: "/screens/f-restock.webp", alt: "Restock request for milk: how soon, effort, and Request restock",
    pop: img("/cards/w-sat-card.webp", "Roomie · now: Priya is getting the milk. No action needed."), popTop: "14%",
  },
  {
    key: "streak", title: "A streak the whole house grows",
    body: "Every day the house gets its chores done, the streak goes up. Slip, and the plant droops until someone catches up. It’s a shared streak, never a scoreboard.",
    card: "/cards/w-sun-streak.webp", alt: "House streak: 24 days strong, Sunday done and a new week started",
  },
  {
    key: "invite", title: "Move in with a code",
    body: "Scan the QR or share a six-character code, and everyone’s in the same home.",
    screen: "/screens/f-invite.webp", alt: "Invite your roommates: a QR code and the code A3F-92K",
    pop: <span className="code-chip" aria-hidden="true"><small>Home code</small><b>A3F-92K</b></span>, popTop: "50%",
  },
];

const pad = (n: number) => String(n).padStart(2, "0");

export function Features() {
  const tour = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [tourOn, setTourOn] = useState(false);

  useEffect(() => {
    const el = tour.current, tr = track.current;
    if (!el || !tr) return;
    const mm = gsap.matchMedia();
    mm.add(TOUR, () => {
      setTourOn(true);
      const n = FEATURES.length;
      const tween = gsap.to(tr, {
        x: () => -(tr.scrollWidth - window.innerWidth),
        ease: "none",
        scrollTrigger: {
          trigger: el, pin: true, scrub: 0.6, start: "top top",
          end: () => "+=" + window.innerWidth * (n - 1) * 0.8,
          invalidateOnRefresh: true,
          onUpdate: (st) => {
            el.style.setProperty("--p", st.progress.toFixed(4));
            setActive(Math.min(n - 1, Math.round(st.progress * (n - 1))));
          },
        },
      });
      return () => { tween.scrollTrigger?.kill(); tween.kill(); setTourOn(false); };
    });
    return () => mm.revert();
  }, []);

  return (
    <section id="features" className="features">
      <div className="wrap features-head">
        <p className="eyebrow">Everything in Roomie</p>
        <h2>All the small stuff, <em>handled.</em></h2>
        <p className="lede">The chores, the reminders, the milk. One calm app for the whole flat.</p>
      </div>

      <div className={`ftour ${tourOn ? "is-tour" : ""}`} ref={tour}>
        <div className="ftour-track" ref={track}>
          {FEATURES.map((f, i) => (
            <article key={f.key} className={`fslide fslide--${f.key} ${!tourOn || active === i ? "is-in" : ""}`}>
              <div className="fslide-inner wrap">
                <div className="fslide-copy">
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </div>
                <div className="fslide-visual">
                  <div className="fstage">
                    {f.screen && <Phone src={f.screen} alt={f.alt} />}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {f.card && <img className="fcard" src={f.card} alt={f.alt} loading="lazy" />}
                    {f.pop && <div className="fpop" style={{ top: f.popTop }}>{f.pop}</div>}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="ftour-progress wrap" aria-hidden="true">
          <span className="fcount">{pad(active + 1)} / {pad(FEATURES.length)}</span>
          <span className="fbar"><span /></span>
        </div>
      </div>
    </section>
  );
}
