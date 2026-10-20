"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// All scroll-driven motion on the page - hero parallax, each chapter opener's
// field growing to full bleed, quick content reveals - lives here as one GSAP
// set, mounted once. Renders nothing; it wires ScrollTrigger to the
// server-rendered DOM. Reveals are time-based and short (they fire once as
// an element nears the viewport) so nothing waits on the reader's scroll.
export function ScrollFx() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const hero = document.querySelector<HTMLElement>(".hero");
      const heroArt = document.querySelector<HTMLElement>(".hero-art");
      const heroCopy = document.querySelector<HTMLElement>(".hero-copy");
      if (hero && heroArt) {
        gsap.fromTo(
          heroArt,
          { y: -36 },
          { y: 56, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } },
        );
      }
      if (hero && heroCopy) {
        gsap.fromTo(
          heroCopy,
          { y: -14 },
          { y: 22, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } },
        );
      }

      // chapter opener: the colour field opens out to full bleed as it
      // arrives, then its contents rise in a beat behind it.
      document.querySelectorAll<HTMLElement>(".opener").forEach((op) => {
        gsap.fromTo(
          op,
          { clipPath: "inset(9% 4% 0% 4% round 44px)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 0px)",
            ease: "none",
            scrollTrigger: { trigger: op, start: "top 94%", end: "top 38%", scrub: true },
          },
        );
        gsap.from(op.querySelectorAll(".op-eye, .opener h2, .op-num, .op-sum, .op-toc li"), {
          y: 32,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.06,
          scrollTrigger: { trigger: op, start: "top 80%", once: true },
        });
      });

      document.querySelectorAll<HTMLElement>("section.phase > .wrap").forEach((wrap) => {
        gsap.from(wrap, {
          opacity: 0,
          y: 36,
          duration: 0.55,
          ease: "power3.out",
          clearProps: "transform,opacity",
          scrollTrigger: { trigger: wrap, start: "top 88%", once: true },
        });
      });

      // individual content cards (method cards, insight/decision/result
      // rows, personas, stickies, targets...) pop in with a short stagger as
      // they cross into view.
      const cards = gsap.utils.toArray<HTMLElement>(
        [
          ".card",
          ".sticky",
          ".review",
          ".persona",
          ".insight",
          ".mini",
          ".grid-3 > *",
          ".grid-4 > *",
          ".grid-5 > *",
          ".idr > div",
          ".why > *",
          ".learn > *",
          ".ia > *",
          ".smart > *",
          ".targets > *",
          ".minis > *",
          ".hubs > *",
          ".branches > *",
          ".scope > .col",
        ].join(","),
      );
      if (cards.length) {
        gsap.set(cards, { opacity: 0, y: 18 });
        ScrollTrigger.batch(cards, {
          start: "top 94%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out", stagger: 0.045, overwrite: true }),
        });
      }
    });

    return () => ctx.revert();
  }, []);

  return null;
}
