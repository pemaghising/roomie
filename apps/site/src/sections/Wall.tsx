"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotionOK } from "@/ui/useMotionOK";
import "./wall.css";

gsap.registerPlugin(ScrollTrigger);

const COLS: [string, string][][] = [
  [["01-welcome", "Welcome: make your place feel like home"], ["c2-calendar", "Calendar month with busy days"], ["r1-profile", "Profile and preferences"]],
  [["09-pick-chores", "Pick your chores by effort"], ["h5-chore-done", "A chore ticked off"], ["p3-roommates", "Roommates' shelves"]],
  [["h1-home", "Home: the house streak and today's tasks"], ["p1-pantry", "Pantry: running low and in stock"], ["13-all-set", "Welcome home"]],
  [["11-nudge-style", "Pick your nudges"], ["c3-week", "This week's calendar"], ["h6-all-done", "All done for today"]],
  [["12-invite", "Invite your roommates with a code"], ["p2-my-items", "My items, each with a tag"], ["r7-busy-days", "My busy days"]],
];
// how far each column drifts across the section, in px: neighbours move opposite ways, the centre barely moves
const DRIFT = [70, -50, 24, -60, 80];

/** A breather between the tour and the story: real screens, frameless, drifting gently with the scroll. */
export function Wall() {
  const motionOK = useMotionOK();
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!motionOK || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".wall-col").forEach((col, i) => {
        gsap.fromTo(col, { y: DRIFT[i] }, {
          y: -DRIFT[i], ease: "none",
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.3 },
        });
      });
    }, root);
    return () => ctx.revert();
  }, [motionOK]);

  return (
    <section id="wall" ref={root} className="wall">
      <div className="wrap wall-head">
        <h2>Calm, <em>screen by screen.</em></h2>
      </div>
      <div className="wall-grid" aria-label="A wall of Roomie screens">
        {COLS.map((col, i) => (
          <div key={i} className="wall-col">
            {col.map(([src, alt]) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={`/wall/${src}.webp`} alt={alt} width={393} height={852} loading="lazy" decoding="async" />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
