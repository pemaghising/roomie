"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TryRoomie } from "@/ui/TryRoomie";
import { Phone } from "@/ui/Phone";
import { useMotionOK } from "@/ui/useMotionOK";
import "./hero.css";

gsap.registerPlugin(ScrollTrigger);

/** The promise: the app does the reminding. A fan of three real screens fading into the glow, then the headline and the action. */
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
      // The fan opens: Home rises, the side phones slide out from behind it, then the nudge drops in.
      gsap.from(".hero-phone--main", { opacity: 0, y: 60, duration: 1.3, ease: "expo.out" });
      gsap.from(".hero-phone--l", { opacity: 0, x: 120, rotate: 0, duration: 1.4, delay: 0.25, ease: "expo.out" });
      gsap.from(".hero-phone--r", { opacity: 0, x: -120, rotate: 0, duration: 1.4, delay: 0.25, ease: "expo.out" });
      gsap.from(".hero-nudge", { opacity: 0, y: -28, scale: 0.96, duration: 0.9, delay: 1, ease: "back.out(1.6)" });
      // On scroll the fan spreads a little and the front layers lift faster than the back ones.
      const scroll = { trigger: root.current, start: "top top", end: "bottom top", scrub: true };
      gsap.to(".hero-phone--main", { yPercent: -6, ease: "none", scrollTrigger: scroll });
      gsap.to(".hero-nudge", { yPercent: -60, ease: "none", scrollTrigger: scroll });
      gsap.to(".hero-phone--l", { xPercent: -10, rotate: -10, ease: "none", scrollTrigger: scroll });
      gsap.to(".hero-phone--r", { xPercent: 10, rotate: 10, ease: "none", scrollTrigger: scroll });
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

      <div className="hero-stage">
        <div className="hero-fan">
          <Phone className="hero-phone hero-phone--side hero-phone--l" src="/screens/p1-pantry.webp" alt="Roomie Pantry: milk out, rice low, each with I'll get it" priority />
          <Phone className="hero-phone hero-phone--side hero-phone--r" src="/screens/c1c-shared-pool.webp" alt="Roomie Chores: the shared pool, chores anyone can claim" priority />
          <Phone className="hero-phone hero-phone--main" src="/screens/h1-home.webp" alt="Roomie Home: a 23 day house streak, the plant in bloom, and today's tasks" priority />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hero-nudge" src="/cards/hero-nudge.webp" alt="Roomie · now: Dishes are yours tonight. Keep the streak going!" width={361} height={86} />
        </div>
      </div>

      <div className="hero-center wrap">
        <h1>Fair chores. <em className="nb">Zero nagging.</em></h1>
        <p className="lede"><span>Chores split by effort, reminders sent for you.</span> <span>Nobody has to play the parent.</span></p>
        <div className="hero-cta">
          <TryRoomie size="lg" label="Try Roomie now" />
        </div>
      </div>
    </section>
  );
}
