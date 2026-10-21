"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TryRoomie } from "@/ui/TryRoomie";
import { Phone } from "@/ui/Phone";
import { useMotionOK } from "@/ui/useMotionOK";
import "./hero.css";

gsap.registerPlugin(ScrollTrigger);

/** First screen: the product alone, a fan of three real screens. The promise and the action follow on scroll. */
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
      // GSAP owns every transform here, so the entrance, scroll and pointer layers never fight.
      gsap.set(".hero-phone--l", { rotationY: 40, z: -90 });
      gsap.set(".hero-phone--r", { rotationY: -40, z: -90 });
      // Open once: Home rises onto the floor, then the side phones swing open from its edges.
      gsap.from(".hero-phone--main", { opacity: 0, y: 70, duration: 1.4, ease: "expo.out" });
      gsap.from(".hero-phone--l", { opacity: 0, rotationY: 88, duration: 1.8, delay: 0.35, ease: "expo.out" });
      gsap.from(".hero-phone--r", { opacity: 0, rotationY: -88, duration: 1.8, delay: 0.35, ease: "expo.out" });
      // Scrolling keeps opening the book flat while the scene sinks back.
      const scroll = { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.6 };
      gsap.to(".hero-phone--l", { rotationY: 18, ease: "none", scrollTrigger: scroll, immediateRender: false });
      gsap.to(".hero-phone--r", { rotationY: -18, ease: "none", scrollTrigger: scroll, immediateRender: false });
      gsap.to(".hero-scene", { yPercent: -8, scale: 0.9, ease: "none", scrollTrigger: scroll });
      // The scene leans a few degrees toward the pointer.
      const scene = root.current?.querySelector<HTMLElement>(".hero-scene");
      if (scene && window.matchMedia("(pointer: fine)").matches) {
        const rx = gsap.quickTo(scene, "rotationX", { duration: 0.9, ease: "power3.out" });
        const ry = gsap.quickTo(scene, "rotationY", { duration: 0.9, ease: "power3.out" });
        const onMove = (e: PointerEvent) => {
          ry(((e.clientX / window.innerWidth) - 0.5) * 10);
          rx(-((e.clientY / window.innerHeight) - 0.5) * 6);
        };
        window.addEventListener("pointermove", onMove);
        return () => window.removeEventListener("pointermove", onMove);
      }
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
        <div className="hero-scene">
          <Phone className="hero-phone hero-phone--side hero-phone--l" src="/screens/p1-pantry.webp" alt="Roomie Pantry: milk out, rice low, each with I'll get it" priority />
          <Phone className="hero-phone hero-phone--side hero-phone--r" src="/screens/c1c-shared-pool.webp" alt="Roomie Chores: the shared pool, chores anyone can claim" priority />
          <Phone className="hero-phone hero-phone--main" src="/screens/h1-home.webp" alt="Roomie Home: a 23 day house streak, the plant in bloom, and today's tasks" priority />
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
