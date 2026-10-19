"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Phone } from "@/ui/Phone";
import { StoreButtons } from "@/ui/StoreButtons";
import { useMotionOK } from "@/ui/useMotionOK";
import "./hero.css";

gsap.registerPlugin(ScrollTrigger);

const CHAT = [
  { who: "Priya", text: "whose turn is the bathroom??", meta: "Flat 3B · 11:42 pm" },
  { who: "Aman", text: "again? 🙃", meta: "Seen by 2" },
  { who: "You", text: "I'll just do it.", meta: "11:58 pm", me: true },
];

export function Hero() {
  const motionOK = useMotionOK();
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!motionOK || !root.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=110%",
          scrub: 0.6,
          pin: true,
        },
      });
      tl.to(".bubble", { y: -60, opacity: 0, filter: "blur(6px)", stagger: 0.18, ease: "power1.in", duration: 0.5 }, 0)
        .to(".chat-head", { opacity: 0, y: -30, duration: 0.3 }, 0)
        .fromTo(".tilt", { rotateX: 24, rotateY: -22, rotateZ: 4, yPercent: 14 }, { rotateX: 6, rotateY: -10, rotateZ: 1, yPercent: -2, ease: "power2.out", duration: 0.9 }, 0.05)
        .fromTo(".nudge-card", { x: 120, y: 40, opacity: 0, rotate: 4 }, { x: 0, y: 0, opacity: 1, rotate: -2, ease: "back.out(1.4)", duration: 0.45 }, 0.45)
        .to(".hero-glow", { opacity: 1, duration: 0.8 }, 0.1);
      // a slow idle float so the phone never feels static
      gsap.to(".float", { y: -10, duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.from(".hero-copy > *", { y: 24, opacity: 0, duration: 0.9, stagger: 0.08, ease: "power3.out" });
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

        <div className="hero-stage" aria-label="A flat group chat that goes quiet when Roomie takes over the reminding">
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
          <div className="chat">
            <div className="chat-head"><b>Flat 3B</b><span>Priya, Aman, you</span></div>
            {CHAT.map((m) => (
              <div key={m.text} className={`bubble ${m.me ? "me" : ""}`}>
                {!m.me && <span className="who">{m.who}</span>}
                <p>{m.text}</p>
                <small>{m.meta}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
