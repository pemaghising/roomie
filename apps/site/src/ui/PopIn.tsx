"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import "./ui.css";

/** A phone scene whose `.pop` cards lift out of the screen once it scrolls into view. */
export function PopIn({ className = "", children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`device-pop reveal ${className} ${on ? "on" : ""}`}>{children}</div>;
}
