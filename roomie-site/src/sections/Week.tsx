"use client";

import { useEffect, useRef, useState } from "react";
import { Phone } from "@/ui/Phone";
import { WEEK } from "./week-data";
import "./week.css";

export function Week() {
  const [active, setActive] = useState(0);
  const days = useRef<(HTMLElement | null)[]>([]);

  // The day crossing the middle of the viewport is the active one.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    days.current.forEach((d) => d && io.observe(d));
    return () => io.disconnect();
  }, []);

  return (
    <section id="week" className="week">
      <div className="wrap week-head">
        <p className="eyebrow">How it works</p>
        <h2>One week at Parijat Chowk Flat.</h2>
        <p className="lede">Three flatmates. Five days. Zero awkward texts.</p>
      </div>

      <div className="wrap week-grid">
        <ol className="days">
          {WEEK.map((d, i) => (
            <li
              key={d.day}
              className={`day ${active === i ? "is-active" : ""}`}
              data-i={i}
              ref={(el) => { days.current[i] = el; }}
            >
              <span className="day-name">{d.day}</span>
              <h3>{d.title}</h3>
              <p>{d.body}</p>
              <div className="day-inline">
                <Phone src={d.screen} alt={`${d.day}: ${d.title}`} />
                {d.card && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="day-card" src={d.card} alt="" loading="lazy" />
                )}
              </div>
            </li>
          ))}
        </ol>

        <div className="stage-col" aria-hidden="true">
          <div className="stage">
            <figure className="phone stage-phone">
              {WEEK.map((d, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={d.screen} className={`screen ${active === i ? "on" : ""}`} src={d.screen} alt="" width={393} height={852} loading={i === 0 ? "eager" : "lazy"} />
              ))}
            </figure>
            {WEEK.map((d, i) =>
              d.card ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={d.card} className={`stage-card stage-card--${i} ${active === i ? "on" : ""}`} src={d.card} alt="" loading="lazy" />
              ) : null,
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
