"use client";

import { useRef } from "react";
import { Phone } from "@/ui/Phone";
import { useMotionOK } from "@/ui/useMotionOK";
import "./more.css";

export function Shelf() {
  const motionOK = useMotionOK();
  const card = useRef<HTMLImageElement>(null);

  // Desktop pointer tilt; skipped for touch and reduced motion.
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!motionOK || e.pointerType !== "mouse" || !card.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.current.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 10}deg) translateZ(30px)`;
  };
  const onLeave = () => { if (card.current) card.current.style.transform = ""; };

  return (
    <section id="shelf" className="shelf">
      <div className="wrap shelf-grid">
        <div className="shelf-copy">
          <p className="eyebrow">The pantry</p>
          <h2>Your shelf, your rules.</h2>
          <p className="lede">Shared things anyone can top up. Your things stay yours: tag them Do not touch or Ask first.</p>
          <p className="lede">Running low? Ask the house, and it becomes a chore anyone can claim.</p>
        </div>
        <div className="shelf-stage" onPointerMove={onMove} onPointerLeave={onLeave}>
          <Phone src="/screens/p2-my-items.webp" alt="Roomie Pantry, My items: Protein shake tagged Do not touch, Sourdough bread tagged Ask first" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={card} className="shelf-card" src="/cards/shelf.webp" alt="" width={393} height={220} loading="lazy" />
        </div>
      </div>
    </section>
  );
}
