"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotionOK } from "@/ui/useMotionOK";
import "./more.css";

gsap.registerPlugin(ScrollTrigger);

/** Product photos of the real app in real rooms. Photos only: no overlays, no captions. */
const PHOTOS = [
  { src: "/life/lock-nudge.webp", w: 1122, h: 1402, alt: "A phone on a bedside table, its lock screen showing: Priya is getting the milk. No action needed." },
  { src: "/life/home-table.webp", w: 1536, h: 1024, alt: "The Roomie Home screen on a phone beside a mug of tea: a 23-day house streak and today’s chores" },
  { src: "/life/pantry-hand.webp", w: 1600, h: 900, alt: "The Roomie pantry in hand: milk out, rice low, each with I’ll get it" },
];

function Photo({ p, cls }: { p: (typeof PHOTOS)[number]; cls: string }) {
  return (
    <figure className={`life-photo ${cls}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.src} alt={p.alt} width={p.w} height={p.h} loading="lazy" />
    </figure>
  );
}

export function RealLife() {
  const motionOK = useMotionOK();
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!motionOK || !root.current) return;
    const ctx = gsap.context(() => {
      // Parallax inside each frame: the photo drifts against the scroll, a touch more in the tall one.
      gsap.utils.toArray<HTMLElement>(".life-photo img").forEach((img, i) => {
        const d = i === 0 ? 9 : 7;
        gsap.fromTo(img, { yPercent: -d }, {
          yPercent: d, ease: "none",
          scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true },
        });
      });
    }, root);
    return () => ctx.revert();
  }, [motionOK]);

  return (
    <section id="real-life" ref={root} className="real-life">
      <div className="wrap">
        <div className="more-head">
          <p className="eyebrow">In real life</p>
          <h2>Built for the <em>small moments.</em></h2>
        </div>
        <div className="life-grid">
          <Photo p={PHOTOS[0]} cls="life-photo--tall" />
          <div className="life-col">
            <Photo p={PHOTOS[1]} cls="life-photo--a" />
            <Photo p={PHOTOS[2]} cls="life-photo--b" />
          </div>
        </div>
      </div>
    </section>
  );
}
