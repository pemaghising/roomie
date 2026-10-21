"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TryRoomie } from "@/ui/TryRoomie";
import { StoreButtons } from "@/ui/StoreButtons";
import { useMotionOK } from "@/ui/useMotionOK";
import "./hero.css";

gsap.registerPlugin(ScrollTrigger);

const SCREENS = [
  { src: "/screens/h1-home.webp", alt: "Roomie Home: a 23 day house streak, the plant in bloom, and today's tasks", caption: "Only your chores, sized by effort." },
  { src: "/screens/c1c-shared-pool.webp", alt: "Roomie Chores: the shared pool, chores anyone can claim", caption: "Missed ones go to the pool. No names." },
  { src: "/screens/p1-pantry.webp", alt: "Roomie Pantry: milk out, rice low, each with I'll get it", caption: "Out of milk? One tap, sorted." },
];

/** A pinned scroll film: the promise set huge behind the phone, which walks through Home, the shared pool and Pantry. */
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
      // Entrance: each word rolls up out of its mask, the phone rises tilted back.
      gsap.from(".film-word--a .w1, .film-word--a .w2", { yPercent: 140, duration: 1.3, stagger: 0.1, ease: "expo.out" });
      gsap.from(".film-phone", { yPercent: 40, opacity: 0, duration: 1.6, delay: 0.15, ease: "expo.out" });
      gsap.set(".film-word--b .w1, .film-word--b .w2", { yPercent: 140 });

      // The film, scrubbed across the pinned stage. Words never cross-fade: the old pair rolls up
      // out of its masks as the new pair rolls up in, so only one phrase is ever readable.
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: ".film", start: "top top", end: "bottom bottom", scrub: 1 },
      });
      tl.to(".film-phone", { rotationX: 0, scale: 1, duration: 1, ease: "power2.out" }, 0)
        .to(".film-hint", { opacity: 0, duration: 0.2 }, 0)
        .to(".film-step--0", { opacity: 1, y: 0, duration: 0.4 }, 0.4)
        .to(".film-word--a .w1", { yPercent: -140, duration: 0.6, ease: "power3.in" }, 1.0)
        .to(".film-word--a .w2", { yPercent: -140, duration: 0.6, ease: "power3.in" }, 1.08)
        .to(".film-word--b .w1", { yPercent: 0, duration: 0.7, ease: "power3.out" }, 1.55)
        .to(".film-word--b .w2", { yPercent: 0, duration: 0.7, ease: "power3.out" }, 1.63)
        .to(".film-screen--1", { clipPath: "inset(0% 0 0 0)", duration: 0.5, ease: "power2.inOut" }, 1.6)
        .to(".film-step--0", { opacity: 0, y: -12, duration: 0.3 }, 1.5)
        .to(".film-step--1", { opacity: 1, y: 0, duration: 0.4 }, 1.8)
        .to(".film-screen--2", { clipPath: "inset(0% 0 0 0)", duration: 0.5, ease: "power2.inOut" }, 2.6)
        .to(".film-step--1", { opacity: 0, y: -12, duration: 0.3 }, 2.5)
        .to(".film-step--2", { opacity: 1, y: 0, duration: 0.4 }, 2.8)
        .to(".film-step--2", { opacity: 0, y: -12, duration: 0.3 }, 3.3)
        .to(".film-word--b .w1, .film-word--b .w2", { yPercent: -140, duration: 0.6, ease: "power3.in" }, 3.3)
        .to(".film-phone", { yPercent: -16, scale: 0.84, duration: 1, ease: "power2.inOut" }, 3.3)
        .fromTo(".film-end", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, 3.7);
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

      {/* A pinned film: the type runs behind the phone, splits, and the phone walks through three screens. */}
      <div className="film">
        <div className="film-stage">
          <h1 className="sr-only">Fair chores. Zero nagging.</h1>
          <p className="film-word film-word--a" aria-hidden="true"><span className="mask"><span className="w1">Fair</span></span><span className="mask"><span className="w2">chores.</span></span></p>
          <p className="film-word film-word--b" aria-hidden="true"><span className="mask"><em className="w1">Zero</em></span><span className="mask"><em className="w2">nagging.</em></span></p>

          <figure className="phone film-phone">
            <span className="btn-l" aria-hidden="true" />
            <span className="btn-r" aria-hidden="true" />
            <span className="bezel">
              {SCREENS.map((sc, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={sc.src} className={`film-screen film-screen--${i}`} src={sc.src} alt={sc.alt} width={393} height={852} loading={i ? "lazy" : "eager"} />
              ))}
              <span className="glare" aria-hidden="true" />
            </span>
          </figure>

          <ol className="film-steps" aria-hidden="true">
            {SCREENS.map((sc, i) => (
              <li key={sc.src} className={`film-step film-step--${i}`}><b>{String(i + 1).padStart(2, "0")}</b>{sc.caption}</li>
            ))}
          </ol>

          <div className="film-end">
            <p className="lede">Chores split by effort, reminders sent for you. Nobody has to play the parent.</p>
            <div className="film-cta"><TryRoomie size="lg" label="Try Roomie now" /><StoreButtons variant="light" /></div>
          </div>
          <p className="film-meta film-meta--r film-hint">Scroll</p>
        </div>
      </div>
    </section>
  );
}
