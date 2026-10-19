"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { StoreButtons } from "@/ui/StoreButtons";
import { useMotionOK } from "@/ui/useMotionOK";
import "./close.css";

gsap.registerPlugin(ScrollTrigger);

const STAGES = ["seed", "sprout", "leafy", "bud", "bloom"] as const;

export function Close() {
  const motionOK = useMotionOK();
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!motionOK || !root.current) return;
    const ctx = gsap.context(() => {
      const plants = gsap.utils.toArray<HTMLElement>(".plant");
      gsap.set(plants.slice(1), { opacity: 0, scale: 0.92 });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: "top top", end: "+=140%", scrub: 0.7, pin: true },
      });
      plants.forEach((p, i) => {
        if (i === 0) return;
        tl.to(plants[i - 1], { opacity: 0, scale: 1.04, duration: 0.5 }, i - 0.5)
          .to(p, { opacity: 1, scale: 1, duration: 0.5 }, i - 0.5);
      });
      tl.from(".close-copy h2", { y: 30, opacity: 0, duration: 0.6 }, 0.6);
    }, root);
    return () => ctx.revert();
  }, [motionOK]);

  return (
    <section id="close" ref={root} className="close">
      <div className="wrap close-inner">
        <div className="plants" aria-label="The house plant grows a stage with every finished week">
          {STAGES.map((s) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={s} className="plant" src={`/brand/plant-${s}.webp`} alt={`Plant, ${s} stage`} width={360} height={360} loading="lazy" />
          ))}
        </div>
        <p className="plant-note">Every week the house finishes its chores, the plant grows.</p>
        <div className="close-copy">
          <h2>Make your place feel like <em>home.</em></h2>
          <StoreButtons />
        </div>
      </div>
    </section>
  );
}
