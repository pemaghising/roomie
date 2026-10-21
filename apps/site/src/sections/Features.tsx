"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { lenis } from "@/ui/SmoothScroll";
import { Phone } from "@/ui/Phone";
import "./features.css";

gsap.registerPlugin(ScrollTrigger);

const TOUR = "(min-width: 821px) and (prefers-reduced-motion: no-preference)";

type Feature = {
  key: string; title: string; body: string;
  /** 3D emoji from the app, shown in a soft tile above the title. */
  icon: string;
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
    key: "effort", icon: "flexed_biceps", title: "Effort, not headcount",
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
    key: "busy", icon: "calendar", title: "Built around your week",
    body: "Mark your busy days once. Heavy chores land on the days you’re actually free.",
    screen: "/screens/f-calendar.webp", alt: "Calendar week with busy days shaded and light chores on them",
    pop: img("/cards/w-mon-card.webp", "Tue, Wed and Fri. Heavy chores stay off these days."), popTop: "74%",
  },
  {
    key: "pool", icon: "raising_hands", title: "A shared pool, no blame",
    body: "Missed chores slip into a pool with no names attached. Claim one and your next week gets lighter.",
    screen: "/screens/c1c-shared-pool.webp", alt: "Shared pool: Mop bathroom floor and Take out recycling, each with a Claim button",
    pop: img("/cards/w-thu-toast.webp", "Mop bathroom floor is yours. You’ll get a lighter week."), popTop: "48%",
  },
  {
    key: "nudge", icon: "bell", title: "Nudges in your tone",
    body: "Motivate me, or just the facts. Roomie does the reminding, so nobody in the flat has to.",
    screen: "/screens/f-nudge-style.webp", alt: "Nudge style: Motivate me or Just the facts",
  },
  {
    key: "restock", icon: "shopping_cart", title: "Restock in one tap",
    body: "Out of milk? Ask the house, pick how soon, and it becomes a chore anyone can claim.",
    screen: "/screens/f-restock.webp", alt: "Restock request for milk: how soon, effort, and Request restock",
    pop: img("/cards/w-sat-card.webp", "Roomie · now: Priya is getting the milk. No action needed."), popTop: "14%",
  },
  {
    key: "streak", icon: "potted_plant", title: "A streak the whole house grows",
    body: "Every day the house gets its chores done, the streak goes up. Slip, and the plant droops until someone catches up. It’s a shared streak, never a scoreboard.",
    card: "/cards/w-sun-streak.webp", alt: "House streak: 24 days strong, Sunday done and a new week started",
  },
  {
    key: "invite", icon: "house", title: "Move in with a code",
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
      const on = { enter: () => {}, enterBack: () => {}, leave: () => {} };
      const tween = gsap.to(tr, {
        x: () => -(tr.scrollWidth - window.innerWidth),
        ease: "none",
        scrollTrigger: {
          trigger: el, pin: true, scrub: 0.3, start: "top top",
          end: () => "+=" + window.innerWidth * (n - 1) * 0.8,
          invalidateOnRefresh: true,
          onEnter: () => on.enter(), onEnterBack: () => on.enterBack(),
          onLeave: () => on.leave(), onLeaveBack: () => on.leave(),
          onUpdate: (st) => {
            el.style.setProperty("--p", st.progress.toFixed(4));
            setActive(Math.min(n - 1, Math.round(st.progress * (n - 1))));
          },
        },
      });
      // Paged like a slideshow: while pinned, one scroll gesture moves exactly one feature and further input
      // waits until the glide lands, so it can't slip past or stop between slides. Past 07 (or before 01)
      // the page scrolls normally again.
      const st = tween.scrollTrigger!;
      // 1px inside each end: landing exactly on start/end counts as leaving the pin and would release the tour
      const posOf = (i: number) => Math.min(st.end - 1, Math.max(st.start + 1, st.start + (i / (n - 1)) * (st.end - st.start)));
      let at = 0, inside = false, busy = false, lastEvt = 0, lastAbs = 0, touchY = 0;
      const go = (y: number) => {
        if (Math.abs(y - window.scrollY) < 1) return;
        busy = true;
        // Lenis skips onComplete when interrupted, so a timer always releases the lock too
        const t = window.setTimeout(() => { busy = false; }, 800);
        const done = () => { window.clearTimeout(t); busy = false; };
        if (lenis) lenis.scrollTo(y, { duration: 0.7, easing: (k) => 1 - Math.pow(1 - k, 3), onComplete: done });
        else window.scrollTo({ top: y, behavior: "smooth" });
      };
      const engage = (i: number) => { inside = true; at = i; go(posOf(i)); };
      const release = () => { inside = false; };
      const step = (dir: 1 | -1) => {
        if (busy) return;
        const next = at + dir;
        if (next < 0 || next > n - 1) { release(); go(dir > 0 ? st.end + 2 : st.start - 2); return; }
        at = next;
        go(posOf(at));
      };
      const onWheel = (e: WheelEvent) => {
        if (!inside) return;
        // capture phase + stopImmediatePropagation: Lenis never sees the wheel, so it can't add its own scroll
        e.preventDefault(); e.stopImmediatePropagation();
        const now = performance.now(), abs = Math.abs(e.deltaY);
        // a trackpad sends a long decaying stream per swipe: only a pause or a fresh push counts as a new gesture
        const fresh = now - lastEvt > 160 || abs > lastAbs * 1.6 + 4;
        lastEvt = now; lastAbs = abs;
        if (fresh && abs > 3) step(e.deltaY > 0 ? 1 : -1);
      };
      const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0].clientY; };
      const onTouchMove = (e: TouchEvent) => { if (inside) e.preventDefault(); };
      const onTouchEnd = (e: TouchEvent) => {
        if (!inside) return;
        const dy = touchY - e.changedTouches[0].clientY;
        if (Math.abs(dy) > 40) step(dy > 0 ? 1 : -1);
      };
      // Only take over when arriving at an end of the tour, not when a nav link jumps straight past it
      on.enter = () => { if (Math.abs(window.scrollY - st.start) < window.innerHeight * 0.6) engage(0); };
      on.enterBack = () => { if (Math.abs(window.scrollY - st.end) < window.innerHeight * 0.6) engage(n - 1); };
      on.leave = release;
      window.addEventListener("wheel", onWheel, { passive: false, capture: true });
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd);
      return () => {
        window.removeEventListener("wheel", onWheel, { capture: true });
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
        release(); tween.scrollTrigger?.kill(); tween.kill(); setTourOn(false);
      };
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <span className="ficon" aria-hidden="true"><img src={`/emoji/${f.icon}.webp`} alt="" width={96} height={96} /></span>
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
