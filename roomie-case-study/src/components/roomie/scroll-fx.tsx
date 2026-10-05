"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// All scroll-driven motion on the page - hero parallax, each section's
// card-like enter/hold/exit, the phase number's depth drift - lives here as
// one GSAP timeline set, mounted once. Renders nothing; it just wires up
// ScrollTrigger against the server-rendered DOM already on the page.
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

      document.querySelectorAll<HTMLElement>("section.phase").forEach((section) => {
        // the enter/hold/exit tween targets the section's inner .wrap, not
        // the section itself - a transformed ancestor becomes the
        // containing block for any position:fixed descendant (CSS spec
        // behavior). The outer card (rounded corners, shadow, background)
        // stays untouched by transform; only its content scales/rises/recedes.
        const wrap = section.querySelector<HTMLElement>(":scope > .wrap");
        if (wrap) {
          gsap
            .timeline({ scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true } })
            .fromTo(
              wrap,
              { opacity: 0, y: 52, scale: 0.96 },
              { opacity: 1, y: 0, scale: 1, ease: "power3.out", duration: 0.16 },
            )
            .to(wrap, { opacity: 1, y: 0, scale: 1, duration: 0.68 })
            .to(wrap, { opacity: 0.82, scale: 0.97, filter: "blur(0.6px)", ease: "power2.in", duration: 0.16 });
        }

        const num = section.querySelector<HTMLElement>(".phase-head .num");
        if (num) {
          gsap.fromTo(
            num,
            { y: -18 },
            { y: 18, ease: "none", scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true } },
          );
        }
      });

      // individual content cards (method cards, insight/decision/result
      // rows, personas, stickies, targets...) rise and fade in as they
      // cross into view, on top of the whole-section motion above - the
      // section settles into place, and its own content reveals in a
      // stagger a beat after, rather than every card just appearing
      // instantly the moment its parent card stops moving.
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
        gsap.set(cards, { opacity: 0, y: 20 });
        ScrollTrigger.batch(cards, {
          start: "top 88%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.08, overwrite: true }),
        });
      }
    });

    return () => ctx.revert();
  }, []);

  return null;
}
