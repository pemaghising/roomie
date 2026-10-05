"use client";

import { useEffect, useRef } from "react";

// 36-frame turntable sprite rendered from the Blender mascot (roomie-logo-spin.webp).
const FRAMES = 36;
const PX_PER_FRAME = 40; // one full turn every 1440px of scroll

export function LogoSpin() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const frame = Math.floor(window.scrollY / PX_PER_FRAME) % FRAMES;
      ref.current?.style.setProperty("--frame", String(frame));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <span className="brand-mark" aria-hidden="true">
      <span ref={ref} className="brand-spin" />
    </span>
  );
}
