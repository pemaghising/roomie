"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotionOK } from "./useMotionOK";

gsap.registerPlugin(ScrollTrigger);

/** The live Lenis instance, so sections can scroll with it instead of fighting it. Null without smooth scroll. */
export let lenis: Lenis | null = null;

/** Lenis smooth scrolling driven by GSAP's ticker, so ScrollTrigger stays in sync. */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const motionOK = useMotionOK();

  useEffect(() => {
    if (!motionOK) return;
    // lerp .16 catches up about twice as fast as the old .1: still glides, no longer trails behind the wheel
    const l = new Lenis({ lerp: 0.16, smoothWheel: true, wheelMultiplier: 1 });
    lenis = l;
    l.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => l.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      l.destroy();
      lenis = null;
    };
  }, [motionOK]);

  return <>{children}</>;
}
