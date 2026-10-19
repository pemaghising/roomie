"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotionOK } from "@/ui/useMotionOK";
import "./more.css";

gsap.registerPlugin(ScrollTrigger);

/** Composed photos (real v2 cards placed in Figma). Add entries as new photos are made. */
export const PHOTOS = [
  { src: "/photos/01-morning-check.webp", caption: "One glance before chai.", alt: "A flatmate smiling at her phone in a bright kitchen, with today’s Roomie tasks beside her" },
  { src: "/photos/02-the-nudge.webp", caption: "A nudge that never nags.", alt: "A flatmate at breakfast reading a Roomie nudge: Dishes are yours tonight" },
];

export function RealLife() {
  const motionOK = useMotionOK();
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!motionOK || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".photo img").forEach((img) => {
        gsap.fromTo(img, { scale: 1.08, yPercent: -3 }, {
          scale: 1, yPercent: 3, ease: "none",
          scrollTrigger: { trigger: img, start: "top bottom", end: "bottom top", scrub: true },
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
          <h2>Built for the small moments.</h2>
        </div>
        <div className="photos">
          {PHOTOS.map((p) => (
            <figure key={p.src} className="photo">
              <div className="photo-frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt={p.alt} width={1376} height={768} loading="lazy" />
              </div>
              <figcaption>{p.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
