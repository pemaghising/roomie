"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TryRoomie } from "@/ui/TryRoomie";
import { useMotionOK } from "@/ui/useMotionOK";
import { Phone3D, type PhonePose } from "@/ui/Phone3D";
import "@/ui/ui.css";
import "./hero.css";

gsap.registerPlugin(ScrollTrigger);

const Tick = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);

function Notif({ when, lead, rest }: { when: string; lead: string; rest: string }) {
  return (
    <div className="hero-card hero-notif">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/app-icon.webp" alt="" width={38} height={38} />
      <div className="body">
        <div className="head"><b>Roomie</b><span>{when}</span></div>
        <p><strong>{lead}</strong> {rest}</p>
      </div>
    </div>
  );
}

function Task({ title, effort, emoji, done = false }: { title: string; effort: "Light" | "Medium"; emoji: string; done?: boolean }) {
  return (
    <div className={`hero-card hero-task${done ? " is-done" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <span className="ico"><img src={`/emoji/${emoji}.webp`} alt="" width={26} height={26} /></span>
      <span className="txt"><span className="title">{title}</span><span className={`hero-tag hero-tag--${effort.toLowerCase()}`}>{effort}</span></span>
      <button type="button" className="hero-check" aria-label={`Mark ${title} done`}
        onClick={(e) => e.currentTarget.closest(".hero-task")?.classList.toggle("is-done")}><Tick /></button>
    </div>
  );
}

/**
 * The opening: the phone lies back and stands up as you scroll, then pins while pieces of the app
 * (a nudge, tasks, the streak, the pantry) drift past at their own speeds. As it dissolves, the promise rises.
 */
export function Hero() {
  const motionOK = useMotionOK();
  const root = useRef<HTMLElement>(null);
  const bar = useRef<HTMLElement>(null);
  const pose = useRef<PhonePose>({ tilt: 0, yaw: 0, pitch: 0 });

  // Full-width bar at the top of the page; it tucks into a floating pill once you scroll.
  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const onScroll = () => el.classList.toggle("is-scrolled", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!motionOK || !el) return;
    const q = gsap.utils.selector(el);

    // the cards feel used: a task ticks or the pantry gets claimed every couple of seconds
    const tasks = q(".hero-task") as HTMLElement[];
    const getIt = el.querySelector<HTMLButtonElement>(".hero-pantry button");
    let k = 0;
    const timer = window.setInterval(() => {
      k++;
      if (k % 3 === 0) getIt?.click();
      else tasks[k % tasks.length]?.classList.toggle("is-done");
    }, 2400);

    let onMove: ((e: PointerEvent) => void) | null = null;
    const ctx = gsap.context(() => {
      const scene = el.querySelector<HTMLElement>(".hero-scene")!;
      const pin = el.querySelector<HTMLElement>(".hero-pin")!;
      const stickTop = () => parseFloat(getComputedStyle(pin).top);
      // the phone stands up over at least most of a screen of scroll, even when it pins almost at once
      const pinAt = () => Math.max(scene.offsetTop - stickTop(), window.innerHeight * 0.7);
      const unpinAt = () => scene.offsetTop + scene.offsetHeight - stickTop() - pin.offsetHeight;

      const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
      intro
        .from(".hero-stage", { y: () => window.innerHeight * 0.45, duration: 2 }, 0.25)
        .from(".hero-bit .hero-card", { autoAlpha: 0, y: 40, scale: 0.9, duration: 1.4, stagger: 0.07, ease: "back.out(1.3)" }, 0.8);

      // the phone stands up as it reaches the pin; the wash lifts off the screen and the shadow tucks in
      gsap.timeline({ scrollTrigger: { start: 0, end: pinAt, scrub: 1.1, invalidateOnRefresh: true } })
        .fromTo(pose.current, { tilt: 0.62 }, { tilt: 0, ease: "power2.out" }, 0)
        .fromTo(".hero-tilt", { scale: 0.94 }, { scale: 1, ease: "power2.out" }, 0)
        // the shadows shorten with the lean, so they never show above the receding top
        .fromTo(".hero-shadow--cast", { x: "48%", y: "18%", skewX: -22, scaleY: 0.62, opacity: 0.6, transformOrigin: "50% 100%" }, { x: "34%", y: "10%", skewX: -14, scaleY: 1.02, opacity: 1, ease: "power2.out" }, 0)
        .fromTo(".hero-shadow--contact", { opacity: 0.4, y: "6%", scaleY: 0.62, transformOrigin: "50% 100%" }, { opacity: 1, y: "3%", scaleY: 0.97, ease: "power2.out" }, 0);

      // the foot of the phone dissolves as the promise arrives
      const fade = () => ({ start: () => unpinAt() - window.innerHeight * 0.5, end: unpinAt, scrub: 1, invalidateOnRefresh: true });
      gsap.to(".hero-stage", { "--fade": "54%", ease: "none", scrollTrigger: fade() });
      // the shadows melt over a longer stretch than the phone. The fade runs on their wrapper: the stand-up above
      // owns each shadow's own opacity, and two tweens on one property made it snap back to its start value
      gsap.to([".hero-shadows", ".hero-haze"], { autoAlpha: 0, ease: "power2.inOut", scrollTrigger: { start: () => unpinAt() - window.innerHeight, end: () => unpinAt() + window.innerHeight * 0.15, scrub: 1.5, invalidateOnRefresh: true } });

      // each piece travels at its own speed, with a little turn
      (q(".hero-bit") as HTMLElement[]).forEach((b, i) => {
        const s = Number(b.dataset.s);
        gsap.to(b, {
          y: () => -s * ScrollTrigger.maxScroll(window), rotation: (i % 2 ? 1 : -1) * (2 + s * 6), ease: "none",
          scrollTrigger: { start: 0, end: "max", scrub: 1.4, invalidateOnRefresh: true },
        });
      });

      gsap.timeline({ scrollTrigger: { trigger: ".hero-end", start: "top 94%" }, defaults: { ease: "expo.out" } })
        .from(".hero-end .w > span", { yPercent: 120, duration: 1, stagger: 0.06 })
        .from(".hero-end .lede", { autoAlpha: 0, y: 16, duration: 0.9 }, 0.2)
        .from(".hero-cta > *", { autoAlpha: 0, y: 18, duration: 0.9, stagger: 0.06 }, 0.3);

      // pointer: cards drift by depth, the phone turns a few degrees towards the cursor
      const cards = (q(".hero-bit .hero-card") as HTMLElement[]).map((c, i) => ({
        x: gsap.quickTo(c, "x", { duration: 1.2, ease: "power3" }), y: gsap.quickTo(c, "y", { duration: 1.2, ease: "power3" }), d: 10 + (i % 4) * 7,
      }));
      const ry = gsap.quickTo(pose.current, "yaw", { duration: 1.4, ease: "power3" });
      const rx = gsap.quickTo(pose.current, "pitch", { duration: 1.4, ease: "power3" });
      intro.eventCallback("onComplete", () => {
        onMove = (e) => {
          const mx = e.clientX / window.innerWidth - 0.5, my = e.clientY / window.innerHeight - 0.5;
          cards.forEach((c) => { c.x(mx * c.d * 2); c.y(my * c.d * 1.4); });
          ry(mx * 0.3); rx(my * 0.1);
        };
        window.addEventListener("pointermove", onMove);
      });
    }, el);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => {
      window.clearInterval(timer);
      if (onMove) window.removeEventListener("pointermove", onMove);
      ctx.revert();
    };
  }, [motionOK]);

  return (
    <section id="hero" ref={root} className="hero">
      <header className="topbar" ref={bar}>
        <div className="topbar-inner">
          <a className="brand" href="#hero" aria-label="Roomie, back to top">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="lockup" src="/brand/logo-roomie.webp" alt="Roomie" width={141} height={40} />
          </a>
          <nav className="topnav" aria-label="Sections">
            <a href="#features">Features</a>
            <a href="#week">How it works</a>
            <a href="#faq">FAQ</a>
          </nav>
          <TryRoomie className="topbar-cta" />
        </div>
      </header>

      <div className="hero-top" aria-hidden="true" />

      <div className="hero-scene">
        <div className="hero-pin">
          <div className="hero-stage">
            <div className="hero-haze" aria-hidden="true" />
            <div className="hero-ptilt"><div className="hero-tilt">
              <div className="hero-shadows" aria-hidden="true">
                <div className="hero-shadow hero-shadow--cast" />
                <div className="hero-shadow hero-shadow--contact" />
              </div>
              <Phone3D src="/screens/h1-home.webp" alt="Roomie Home: a 23 day house streak with the plant in bud, and today's tasks" pose={pose} className="hero-phone3d">
                <figure className="phone hero-phone">
                  <span className="btn-l" aria-hidden="true" />
                  <span className="btn-r" aria-hidden="true" />
                  <span className="bezel">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/screens/h1-home.webp" alt="" width={393} height={852} loading="eager" />
                    <span className="glare" aria-hidden="true" />
                  </span>
                </figure>
              </Phone3D>
            </div></div>
          </div>
        </div>

        <div className="hero-bit hero-b1" data-s=".18"><Notif when="now" lead="Bins go out tonight." rest="It’s your turn, Ramesh. No rush, just a heads-up." /></div>
        <div className="hero-bit hero-b2" data-s=".32">
          <Task title="Sweep living room" effort="Light" emoji="broom" />
        </div>
        <div className="hero-bit hero-b3" data-s=".12">
          <div className="hero-card hero-streak" role="img" aria-label="House streak: 23 days strong">
            <div className="left">
              <span className="lbl">House streak</span>
              <span className="num"><span className="n">23</span><span className="u">days<br />strong</span></span>
              <span className="days">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <i key={i} className={i < 6 ? "done" : "today"}>{d}</i>)}
              </span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/plant-bud.webp" alt="" width={120} height={120} />
          </div>
        </div>
        <div className="hero-bit hero-b4" data-s=".28">
          <Task title="Take out trash" effort="Light" emoji="wastebasket" done />
        </div>
        <div className="hero-bit hero-b5" data-s=".05"><Notif when="2m ago" lead="Priya’s getting the milk." rest="You’re off the hook." /></div>
        <div className="hero-bit hero-b6" data-s=".1">
          <div className="hero-card hero-pantry">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <span className="ico"><img src="/emoji/olive.webp" alt="" width={24} height={24} /></span>
            <span className="name">Olive oil</span>
            <span className="hero-tag hero-tag--medium">Low</span>
            <button type="button" onClick={(e) => { const b = e.currentTarget; const on = b.classList.toggle("is-got"); b.textContent = on ? "You’re getting it" : "I’ll get it"; }}>I’ll get it</button>
          </div>
        </div>
        <div className="hero-bit hero-b7" data-s="-.04">
          <Task title="Water the plants" effort="Medium" emoji="potted_plant" />
        </div>
        <div className="hero-bit hero-b8" data-s=".02"><Notif when="Sunday" lead="All done for the week." rest="Everyone did their share. 24 days strong." /></div>
      </div>

      <div className="hero-end">
        <h1 aria-label="Fair chores. Zero nagging.">
          <span className="w"><span>Fair</span></span> <span className="w"><span>chores.</span></span>{" "}
          <em><span className="w"><span>Zero</span></span> <span className="w"><span>nagging.</span></span></em>
        </h1>
        <p className="lede">Chores split by effort, reminders sent for you. <span className="l2">Nobody has to play the parent.</span></p>
        <div className="hero-cta"><TryRoomie size="lg" label="Try Roomie now" /></div>
      </div>
    </section>
  );
}
