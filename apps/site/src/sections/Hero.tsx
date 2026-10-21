"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TryRoomie } from "@/ui/TryRoomie";
import { Phone } from "@/ui/Phone";
import { StoreButtons } from "@/ui/StoreButtons";
import { useMotionOK } from "@/ui/useMotionOK";
import "./hero.css";

gsap.registerPlugin(ScrollTrigger);

/** The promise and the download beside the real Home screen, rising out of a sunlit Kathmandu flat. */
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
      // Copy settles in, the room comes into focus, the phone rises into it.
      gsap.from(".hero-copy > *", { opacity: 0, y: 24, duration: 1, stagger: 0.08, ease: "expo.out" });
      gsap.from(".hero-room", { scale: 1.12, duration: 2.2, ease: "expo.out" });
      gsap.from(".hero-phone", { yPercent: 18, opacity: 0, duration: 1.5, delay: 0.25, ease: "expo.out" });
      // On scroll the room drifts slower than the phone, so the panel has depth.
      const scroll = { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.5 };
      gsap.to(".hero-room", { yPercent: 8, ease: "none", scrollTrigger: scroll });
      gsap.to(".hero-phone", { yPercent: -10, ease: "none", scrollTrigger: scroll });
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

      <div className="hero-split wrap">
        <div className="hero-copy">
          <h1>Fair chores. <em>Zero nagging.</em></h1>
          <p className="lede">Chores split by effort, reminders sent for you. Nobody has to play the parent.</p>
          <div className="hero-cta">
            <TryRoomie size="lg" label="Try Roomie now" />
          </div>
          <StoreButtons variant="light" />
        </div>
        <div className="hero-panel">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hero-room" src="/life/hero-room.webp" alt="" width={1402} height={1122} />
          <Phone className="hero-phone" src="/screens/h1-home.webp" alt="Roomie Home: a 23 day house streak, the plant in bloom, and today's tasks" priority />
        </div>
      </div>
    </section>
  );
}
