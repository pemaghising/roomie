"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotionOK } from "@/ui/useMotionOK";
import "./problem.css";

gsap.registerPlugin(ScrollTrigger);

/** The flat group chat everyone knows. Deliberately not Roomie's look. */
const CHAT = [
  { who: "Priya", text: "whose turn is the bathroom??", meta: "11:42 pm" },
  { who: "Aman", text: "again? 🙃", meta: "Seen by 2" },
  { who: "You", text: "I'll just do it.", meta: "11:58 pm", me: true },
];

export function Problem() {
  const motionOK = useMotionOK();
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!motionOK || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".bubble", {
        y: 18, opacity: 0, stagger: 0.35, duration: 0.5, ease: "power2.out",
        scrollTrigger: { trigger: ".thread", start: "top 75%" },
      });
      gsap.from(".problem-turn", { y: 14, opacity: 0, duration: 0.6, scrollTrigger: { trigger: ".problem-turn", start: "top 85%" } });
    }, root);
    return () => ctx.revert();
  }, [motionOK]);

  return (
    <section id="problem" ref={root} className="problem">
      <div className="wrap problem-grid">
        <div className="problem-copy">
          <p className="eyebrow">Before Roomie</p>
          <h2>Sound familiar?</h2>
          <p className="lede">
            Every shared flat has this thread. Somebody asks, somebody ignores it, and somebody ends up doing it themselves.
          </p>
          <p className="problem-turn">Roomie takes this job off everyone.</p>
        </div>

        <div className="thread" aria-label="A flat group chat at midnight">
          <div className="thread-head">
            <span className="thread-avatar" aria-hidden="true">3B</span>
            <div><b>Flat 3B</b><small>Priya, Aman, you</small></div>
          </div>
          {CHAT.map((m) => (
            <div key={m.text} className={`bubble ${m.me ? "me" : ""}`}>
              {!m.me && <span className="who">{m.who}</span>}
              <p>{m.text}</p>
              <small>{m.meta}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
