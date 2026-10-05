"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { LogoSpin } from "./logo-spin";
import { phases, phaseIds } from "./phases";

export function Nav() {
  // Which section is currently in view - tracked with a thin band near the
  // top of the viewport rather than the URL hash, since sections scroll
  // past normally instead of opening.
  const [activeIndex, setActiveIndex] = useState(-1);
  useEffect(() => {
    const sections = phaseIds.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!sections.length) return;
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id)));
        setActiveIndex(visible.size ? Math.min(...[...visible].map((id) => phaseIds.indexOf(id))) : -1);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Full bar at the very top of the landing page; shrinks to a pill once
  // you've scrolled down into it.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const pill = activeIndex >= 0 || scrolled;

  // A single colored pill slides to sit behind whichever step is current,
  // instead of each link separately swapping its own background - the
  // steps themselves stay a plain list, only the highlight moves.
  const stepsRef = useRef<HTMLElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const el = stepsRef.current?.querySelector<HTMLElement>("a.is-current");
      setIndicator(el ? { left: el.offsetLeft, width: el.offsetWidth } : null);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeIndex]);

  return (
    <header className={pill ? "topbar is-pill" : "topbar"}>
      <div className="wrap">
        <a className="brand" href="#top">
          <LogoSpin />
          <span className="brand-name">Roomie</span>
        </a>
        <nav className="steps" aria-label="Case study sections" ref={stepsRef}>
          {indicator && (
            <span
              className={`steps-pill ${phases[activeIndex]?.cls ?? ""}`}
              style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
              aria-hidden="true"
            />
          )}
          {phases.map((p, i) => {
            const isCurrent = i === activeIndex;
            return (
              <a
                key={p.id}
                href={`#${p.id}`}
                className={`${p.cls}${isCurrent ? " is-current" : ""}`}
                aria-current={isCurrent ? "page" : undefined}
              >
                <b>{p.n}</b>
                <span className="step-label">{p.label}</span>
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
