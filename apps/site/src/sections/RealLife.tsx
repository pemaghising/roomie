"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotionOK } from "@/ui/useMotionOK";
import "./more.css";

gsap.registerPlugin(ScrollTrigger);

type Card = { src: string; w: number; h: number; alt: string };
type Moment = { key: string; src: string; w: number; h: number; alt: string; title: string; line: string; card?: Card };

/** Real photos with the real app cards floated on top (cards exported from Figma, never drawn into the photo). */
const MOMENTS: Moment[] = [
  {
    key: "sofa", src: "/life/sofa.webp", w: 1402, h: 1122,
    alt: "Three flatmates laughing together on the sofa over one phone",
    title: "Fewer “whose turn is it?” moments.",
    line: "Chores split by effort, so the flat stays friends.",
    card: { src: "/life/card-pool.webp", w: 1179, h: 344, alt: "2 chores in the shared pool. Claim one to help the house." },
  },
  {
    key: "morning", src: "/life/morning.webp", w: 1086, h: 1448,
    alt: "A flatmate smiling at her phone at the kitchen counter",
    title: "The day, at a glance.",
    line: "Only what’s yours, sized by effort.",
    card: { src: "/life/card-tasks.webp", w: 849, h: 482, alt: "Sweep living room, Light. Take out trash, Light." },
  },
  {
    key: "nudge", src: "/life/nudge.webp", w: 1448, h: 1086,
    alt: "A flatmate at breakfast reading a notification",
    title: "A nudge, never a nag.",
    line: "Roomie sends the reminder, so nobody has to.",
    card: { src: "/life/card-nudge.webp", w: 1200, h: 373, alt: "Gentle nudge: The bins go out tonight. Aman’s up, but anyone can grab it." },
  },
  {
    key: "laundry", src: "/life/laundry.webp", w: 1254, h: 1254,
    alt: "A flatmate laughing as she carries a basket of folded laundry",
    title: "Done, and everyone sees it.",
    line: "Tick it off and the house streak grows.",
    card: { src: "/life/card-laundry.webp", w: 1026, h: 341, alt: "Do the laundry, Medium, done." },
  },
  {
    key: "pantry", src: "/life/pantry.webp", w: 1086, h: 1448,
    alt: "Checking the Roomie pantry on a phone in front of the open fridge",
    title: "Out of milk? Sorted.",
    line: "One tap and the house knows who’s getting it.",
  },
];

export function RealLife() {
  const motionOK = useMotionOK();
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!motionOK || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".moment").forEach((m) => {
        const img = m.querySelector(".moment-photo");
        const card = m.querySelector(".moment-card");
        if (img) gsap.fromTo(img, { scale: 1.12, yPercent: -4 }, {
          scale: 1.02, yPercent: 4, ease: "none",
          scrollTrigger: { trigger: m, start: "top bottom", end: "bottom top", scrub: true },
        });
        if (card) {
          gsap.from(card, {
            y: 28, scale: .94, opacity: 0, duration: .9, ease: "power3.out",
            scrollTrigger: { trigger: m, start: "top 72%", once: true },
          });
          gsap.to(card, {
            yPercent: -18, ease: "none",
            scrollTrigger: { trigger: m, start: "top bottom", end: "bottom top", scrub: true },
          });
        }
      });
    }, root);
    return () => ctx.revert();
  }, [motionOK]);

  return (
    <section id="real-life" ref={root} className="real-life">
      <div className="wrap">
        <div className="life-head">
          <div>
            <p className="eyebrow">In real life</p>
            <h2>Built for the <em>small moments.</em></h2>
          </div>
          <p className="life-lede">Breakfast, the bins, a basket of laundry. Roomie shows up for a second, then gets out of the way.</p>
        </div>
        <div className="moments">
          {MOMENTS.map((m) => (
            <figure key={m.key} className={`moment moment--${m.key}`}>
              <div className="moment-frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="moment-photo" src={m.src} alt={m.alt} width={m.w} height={m.h} loading="lazy" />
                {m.card && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="moment-card" src={m.card.src} alt={m.card.alt} width={m.card.w} height={m.card.h} loading="lazy" />
                )}
              </div>
              <figcaption>
                <b>{m.title}</b>
                <span>{m.line}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
