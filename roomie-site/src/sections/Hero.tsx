"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Phone } from "@/ui/Phone";
import { StoreButtons } from "@/ui/StoreButtons";
import { useMotionOK } from "@/ui/useMotionOK";
import "./hero.css";

gsap.registerPlugin(ScrollTrigger);

/** The promise: the app does the reminding. Only Roomie's own UI appears here. */
export function Hero() {
  const motionOK = useMotionOK();
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!motionOK || !root.current) return;
    const ctx = gsap.context(() => {
      // The nudge arrives a beat after the phone settles.
      gsap.fromTo(".nudge-card", { y: -24, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, delay: 0.7, duration: 0.8, ease: "back.out(1.6)" });
      // Scroll gently straightens the phone as the page moves on.
      gsap.fromTo(".tilt", { rotateX: 10, rotateY: -16, rotateZ: 2 }, {
        rotateX: 2, rotateY: -4, rotateZ: 0, ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(".float", { y: -10, duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: -1 });
    }, root);
    return () => ctx.revert();
  }, [motionOK]);

  return (
    <section id="hero" ref={root} className="hero">
      <header className="topbar wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="logo" src="/brand/mascot.webp" alt="" width={36} height={36} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="wordmark" src="/brand/wordmark.svg" alt="Roomie" width={104} height={28} />
        <span className="soon">Coming soon</span>
      </header>

      <div className="hero-grid wrap">
        <div className="hero-copy">
          <p className="eyebrow">For everyone who shares a home</p>
          <h1>Nobody should have to be the one who asks.</h1>
          <p className="lede">
            Roomie splits chores by effort, works around busy weeks, and does the reminding, so nobody has to play the parent.
          </p>
          <StoreButtons />
        </div>

        <div className="hero-stage">
          <div className="hero-glow" aria-hidden="true" />
          <div className="device">
            <div className="float">
              <div className="tilt">
                <Phone src="/screens/h1-home.webp" alt="Roomie Home: your tasks today, the house streak and the shared pool" priority />
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="nudge-card" src="/cards/nudge.webp" alt="Roomie · now: Dishes are yours tonight. Keep the streak going!" width={354} height={142} />
          </div>
        </div>
      </div>
    </section>
  );
}
