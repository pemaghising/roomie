"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { StoreButtons } from "@/ui/StoreButtons";
import { useMotionOK } from "@/ui/useMotionOK";
import "./hero.css";

gsap.registerPlugin(ScrollTrigger);

const HouseCanvas = dynamic(() => import("./HouseCanvas"), { ssr: false });

const CHAT = [
  { who: "Priya", text: "whose turn is the bathroom??", meta: "Flat 3B · 11:42 pm" },
  { who: "Aman", text: "again? 🙃", meta: "Seen by 2" },
  { who: "You", text: "I'll just do it.", meta: "11:58 pm", me: true },
];

function webglOK() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function Hero() {
  const motionOK = useMotionOK();
  const root = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [use3D, setUse3D] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (motionOK && webglOK()) setUse3D(true);
  }, [motionOK]);

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
          onUpdate: (st) => { progress.current = st.progress; },
        },
      });
      tl.to(".bubble", { y: -60, opacity: 0, filter: "blur(6px)", stagger: 0.18, ease: "power1.in", duration: 0.5 }, 0)
        .to(".chat-head", { opacity: 0, y: -30, duration: 0.3 }, 0)
        .fromTo(".house", { yPercent: 18, scale: 0.86 }, { yPercent: -4, scale: 1, ease: "power2.out", duration: 0.9 }, 0.05)
        .to(".hero-glow", { opacity: 1, duration: 0.8 }, 0.1);
      gsap.from(".hero-copy > *", { y: 24, opacity: 0, duration: 0.9, stagger: 0.08, ease: "power3.out" });
    }, root);
    return () => ctx.revert();
  }, [motionOK]);

  const showMascot = !use3D || !ready;

  return (
    <section id="hero" ref={root} className="hero">
      <header className="topbar wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="logo" src="/brand/mascot.png" alt="" width={36} height={36} />
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

        <div className="hero-stage" aria-label="A flat group chat that goes quiet when Roomie arrives">
          <div className="hero-glow" aria-hidden="true" />
          <div className="house" aria-hidden="true">
            {use3D && (
              <HouseCanvas progress={progress} onReady={() => setReady(true)} onFail={() => setUse3D(false)} />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={`mascot ${showMascot ? "" : "is-hidden"}`} src="/brand/mascot.png" alt="" width={420} height={420} />
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
