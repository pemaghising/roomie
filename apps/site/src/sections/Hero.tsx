"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { StoreButtons } from "@/ui/StoreButtons";
import { useMotionOK } from "@/ui/useMotionOK";
import "./hero.css";

gsap.registerPlugin(ScrollTrigger);

/** The promise: the app does the reminding. Only Roomie's own UI appears here. */
export function Hero() {
  const motionOK = useMotionOK();
  const root = useRef<HTMLElement>(null);
  const bar = useRef<HTMLElement>(null);

  // Full-width bar at the top of the page; it tucks into a floating pill once you scroll.
  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const onScroll = () => el.classList.toggle("is-scrolled", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!motionOK || !root.current) return;
    const ctx = gsap.context(() => {
      // One quiet moment: the photo settles, then the nudge arrives on its corner.
      gsap.from(".hero-photo", { opacity: 0, scale: 0.97, duration: 1.2, ease: "expo.out" });
      gsap.from(".hero-nudge", { opacity: 0, y: 24, duration: 1, delay: 0.9, ease: "expo.out" });
      gsap.to(".hero-photo img", { yPercent: 8, ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.6 } });
    }, root);
    return () => ctx.revert();
  }, [motionOK]);

  return (
    <section id="hero" ref={root} className="hero">
      <header className="topbar" ref={bar}>
        <div className="topbar-inner">
          <a className="brand" href="#hero" aria-label="Roomie, back to top">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="lockup" src="/brand/logo-roomie.webp" alt="Roomie" width={141} height={40} />
          </a>
          <nav className="topnav" aria-label="Sections">
            <a href="#features">Features</a>
            <a href="#week">How it works</a>
            <a href="#shelf">The pantry</a>
          </nav>
          <a className="topbar-cta" href="#close">Coming soon</a>
        </div>
      </header>

      <div className="hero-grid wrap">
        <div className="hero-copy">
          <h1>Fair chores. <em className="nb">Zero nagging.</em></h1>
          <p className="lede">
            Roomie splits chores by effort, works around busy weeks, and sends the reminders itself, so nobody in the flat has to play the parent.
          </p>
          <StoreButtons />
        </div>

        <div className="hero-scene">
          <figure className="hero-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/photos/hero-laundry.webp" alt="A flatmate laughing as he carries a full laundry basket down the hallway" width={1400} height={1400} fetchPriority="high" />
          </figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hero-nudge" src="/cards/hero-nudge.webp" alt="Roomie · now: Dishes are yours tonight. Keep the streak going!" width={361} height={86} />
        </div>
      </div>
    </section>
  );
}
