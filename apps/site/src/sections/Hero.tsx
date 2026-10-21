"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TryRoomie } from "@/ui/TryRoomie";
import { Phone } from "@/ui/Phone";
import { useMotionOK } from "@/ui/useMotionOK";
import "./hero.css";

gsap.registerPlugin(ScrollTrigger);

/** The promise: the app does the reminding. Centred headline over a lilac-peach glow, the Home screen rising below. */
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
      // The phone rises into the glow, then the two moments float out beside it.
      gsap.from(".hero-phone", { opacity: 0, y: 60, duration: 1.3, ease: "expo.out" });
      gsap.from(".hero-float", { opacity: 0, y: 24, duration: 1, delay: 0.8, stagger: 0.15, ease: "expo.out" });
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
            <a href="#faq">FAQ</a>
          </nav>
          <TryRoomie className="topbar-cta" />
        </div>
      </header>

      <div className="hero-center wrap">
        <h1>Fair chores. <em className="nb">Zero nagging.</em></h1>
        <p className="lede">Chores split by effort, reminders sent for you. Nobody has to play the parent.</p>
        <div className="hero-cta">
          <TryRoomie size="lg" label="Try Roomie now" />
        </div>
      </div>

      <div className="hero-stage">
        <Phone className="hero-phone" src="/screens/h1-home.webp" alt="Roomie Home: a 23 day house streak, the plant in bloom, and today's tasks" priority />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero-float hero-nudge" src="/cards/hero-nudge.webp" alt="Roomie · now: Dishes are yours tonight. Keep the streak going!" width={361} height={86} />
        <div className="hero-float hero-busy" aria-label="Heavy chores never land on days you marked busy">
          <span className="tag tag--heavy">Heavy</span>
          <span>chores never land on days you marked busy</span>
        </div>
      </div>
    </section>
  );
}
