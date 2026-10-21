"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Phone } from "@/ui/Phone";
import { popVars } from "@/ui/pop";
import { WEEK, type Icon, type Owner, type Tap, type WeekDay } from "./week-data";
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

const slug = (w: string) => (w === "The house" ? "house" : w.toLowerCase());
const tapVars = (t: Tap) => ({ "--x": t.x, "--y": t.y }) as CSSProperties;
// The pop waits for the tap that causes it; on Saturday it waits for Priya's tap on the other phone.
const popDelay = (d: WeekDay) => (d.second ? 0.55 : d.tap ? 0.4 : 0.2);

function OwnerChip({ owner, className = "" }: { owner: Owner; className?: string }) {
  return (
    <span className={`owner owner--${slug(owner.who)} ${className}`}>
      <i aria-hidden="true">{owner.who === "The house" ? "⌂" : owner.who[0]}</i>{owner.label}
    </span>
  );
}

/** The dashed gap a card leaves in the screen when it lifts out. The hidden copy of the card sets the slot's height. */
function Slot({ d, className = "" }: { d: WeekDay; className?: string }) {
  return (
    <span className={`pop-slot ${className}`} style={popVars(d.pop, popDelay(d))} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={d.pop.src} alt="" loading="lazy" />
    </span>
  );
}

/** Mobile and reduced motion: one still scene per day. */
function InlineScene({ d }: { d: WeekDay }) {
  return (
    <div className={`device-pop ${d.second ? "has-second" : ""}`}>
      {d.second && (
        <div className="second">
          <Phone src={d.second.screen} alt={d.second.alt} />
          {d.second.tap && <span className="tap" style={tapVars(d.second.tap)} aria-hidden="true" />}
          <OwnerChip owner={d.second.owner} />
        </div>
      )}
      <Phone src={d.screen} alt={`${d.day}: ${d.title}`} />
      {d.tap && <span className="tap" style={tapVars(d.tap)} aria-hidden="true" />}
      <Slot d={d} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="pop" src={d.pop.src} alt={d.pop.alt} style={popVars(d.pop, 0)} />
      <OwnerChip owner={d.owner} className={d.second ? "beside" : ""} />
    </div>
  );
}

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

  const on = (i: number) => (active === i ? "on" : "");

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
                  <span className={`who who--${slug(d.who)}`}>
                    <i aria-hidden="true">{d.who === "The house" ? "⌂" : d.who[0]}</i>{d.who}
                  </span>
                </div>
                <div className="day-inline"><InlineScene d={d} /></div>
              </li>
            ))}
            </ol>
          </div>

          <div className="stage-col" aria-hidden="true">
            <div className="stage">
              <div className="device-pop stage-device">
                {WEEK.map((d, i) => d.second && (
                  <div key={d.second.screen} className={`second ${on(i)}`}>
                    <Phone src={d.second.screen} alt="" />
                    {d.second.tap && <span className="tap" style={tapVars(d.second.tap)} />}
                    <OwnerChip owner={d.second.owner} />
                  </div>
                ))}
                <figure className="phone stage-phone">
                  <span className="btn-l" />
                  <span className="btn-r" />
                  <span className="bezel">
                    {WEEK.map((d, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={d.screen} className={`screen ${on(i)}`} src={d.screen} alt="" width={393} height={852} loading={i === 0 ? "eager" : "lazy"} />
                    ))}
                    <span className="glare" />
                  </span>
                </figure>
                {WEEK.map((d, i) => d.tap && <span key={d.day} className={`tap ${on(i)}`} style={tapVars(d.tap)} />)}
                {WEEK.map((d, i) => <Slot key={d.day} d={d} className={on(i)} />)}
                {WEEK.map((d, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={d.pop.src} className={`pop ${on(i)}`} src={d.pop.src} alt="" style={popVars(d.pop, popDelay(d))} loading="lazy" />
                ))}
                {WEEK.map((d, i) => <OwnerChip key={d.day} owner={d.owner} className={`${on(i)} ${d.second ? "beside" : ""}`} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
