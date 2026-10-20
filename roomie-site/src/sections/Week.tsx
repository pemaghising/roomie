"use client";

import { useEffect, useRef, useState } from "react";
import { Phone } from "@/ui/Phone";
import { WEEK, type Icon } from "./week-data";
import "./week.css";

const PINNED = "(min-width: 821px) and (prefers-reduced-motion: no-preference)";

/** Line icons for each moment, drawn in the app's nav style. */
const ICONS: Record<Icon, React.ReactNode> = {
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18M8 15h3" /></>,
  slip: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  hand: <path d="M7 11V6.5a1.5 1.5 0 0 1 3 0V11m0-1V4.5a1.5 1.5 0 0 1 3 0V11m0-1V6a1.5 1.5 0 0 1 3 0v6.5a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 4 15l-1.2-2.4a1.5 1.5 0 0 1 2.6-1.5L7 13" />,
  bag: <><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  sprout: <><path d="M12 21v-8" /><path d="M12 13c0-4 3-6 7-6 0 4-3 6-7 6Z" /><path d="M12 15c0-3-2.5-5-6-5 0 3 2.5 5 6 5Z" /></>,
};

export function Week() {
  const [active, setActive] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);

  // Pinned timeline: progress through the tall wrapper picks the active day
  // and fills the track. Phones and reduced motion get a plain stacked timeline.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const mq = window.matchMedia(PINNED);
    let raf = 0;
    const update = () => {
      raf = 0;
      if (!mq.matches) { el.style.setProperty("--p", "1"); return; }
      const r = el.getBoundingClientRect();
      const span = Math.max(1, r.height - window.innerHeight);
      const p = Math.min(Math.max(-r.top / span, 0), 0.9999);
      el.style.setProperty("--p", p.toFixed(4));
      setActive(Math.floor(p * WEEK.length));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    mq.addEventListener("change", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      mq.removeEventListener("change", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section id="week" className="week">
      <div className="wrap week-head">
        <p className="eyebrow">How it works</p>
        <h2>One week at Parijat Chowk Flat.</h2>
        <p className="lede">Three flatmates. Five days. Zero awkward texts.</p>
      </div>

      <div className="timeline-wrap" ref={wrap}>
        <div className="timeline-sticky wrap">
          <div className="timeline">
            <span className="track" aria-hidden="true"><span className="track-fill" /></span>
            <ol className="days">
            {WEEK.map((d, i) => (
              <li key={d.day} className={`day ${active === i ? "is-active" : ""} ${i < active ? "is-done" : ""}`}>
                <span className="node" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{ICONS[d.icon]}</svg>
                </span>
                <div className="day-box">
                  <span className="day-name">{d.day} · {d.time}</span>
                  <h3>{d.title}</h3>
                  <p>{d.body}</p>
                  <span className={`who who--${d.who === "The house" ? "house" : d.who.toLowerCase()}`}>
                    <i aria-hidden="true">{d.who === "The house" ? "⌂" : d.who[0]}</i>{d.who}
                  </span>
                </div>
                <div className="day-inline">
                  <Phone src={d.screen} alt={`${d.day}: ${d.title}`} />
                </div>
              </li>
            ))}
            </ol>
          </div>

          <div className="stage-col" aria-hidden="true">
            <div className="stage">
              <figure className="phone stage-phone">
                <span className="btn-l" />
                <span className="btn-r" />
                <span className="bezel">
                  {WEEK.map((d, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={d.screen} className={`screen ${active === i ? "on" : ""}`} src={d.screen} alt="" width={393} height={852} loading={i === 0 ? "eager" : "lazy"} />
                  ))}
                  <span className="glare" />
                </span>
              </figure>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
