"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotionOK } from "@/ui/useMotionOK";
import "./effort.css";

gsap.registerPlugin(ScrollTrigger);

const CHORES = [
  { name: "Take out trash", tag: "Light", mins: "about 2 min", weight: 1 },
  { name: "Vacuum living room", tag: "Medium", mins: "about 20 min", weight: 2 },
  { name: "Deep clean bathroom", tag: "Heavy", mins: "about 45 min", weight: 3 },
] as const;

export function Effort() {
  const motionOK = useMotionOK();
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!motionOK || !root.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: "top 70%", end: "center 45%", scrub: true },
      });
      tl.from(".chore", { x: 60, opacity: 0, stagger: 0.15, ease: "power2.out" })
        .from(".seg", { scaleX: 0, transformOrigin: "left center", stagger: 0.18, ease: "power2.inOut" }, 0.2)
        .from(".effort-note", { opacity: 0, y: 12 }, ">-0.1");
    }, root);
    return () => ctx.revert();
  }, [motionOK]);

  return (
    <section id="effort" ref={root} className="effort">
      <div className="wrap effort-grid">
        <div className="effort-copy">
          <p className="eyebrow">Fair isn’t equal</p>
          <h2>A <span className="nb">2-minute</span> trash run isn’t a <span className="nb">45-minute bathroom.</span></h2>
          <p className="lede">
            Every chore is Light, Medium or Heavy. Roomie balances the effort across the house, not the number of chores.
          </p>
        </div>

        <div className="effort-board">
          <ul className="chores">
            {CHORES.map((c) => (
              <li key={c.name} className="chore">
                <b>{c.name}</b>
                <span className="mins">{c.mins}</span>
                <span className={`tag tag--${c.tag.toLowerCase()}`}>{c.tag}</span>
              </li>
            ))}
          </ul>
          <div className="effort-bar" role="img" aria-label="Effort share: Light 1 part, Medium 2 parts, Heavy 4 parts">
            {CHORES.map((c) => (
              <span key={c.tag} className={`seg seg--${c.tag.toLowerCase()}`} style={{ flexGrow: c.weight }} />
            ))}
          </div>
          <p className="effort-note">Three chores, one count, very different weights. Roomie rotates the weight.</p>
        </div>
      </div>
    </section>
  );
}
