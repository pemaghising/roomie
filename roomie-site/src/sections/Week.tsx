"use client";

import { useEffect, useRef, useState } from "react";
import { Phone } from "@/ui/Phone";
import { WEEK } from "./week-data";
import "./week.css";

const PINNED = "(min-width: 821px) and (prefers-reduced-motion: no-preference)";

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
                <span className="day-name">{d.day}</span>
                <h3>{d.title}</h3>
                <p>{d.body}</p>
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
                  <span className="island" />
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
