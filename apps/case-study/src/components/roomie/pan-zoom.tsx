"use client";

import { useEffect } from "react";

// Drag to move, Ctrl/⌘ + scroll, trackpad pinch, touch pinch or the buttons
// to zoom, for the "original from Figma" flowcharts. Renders nothing; it wraps
// each server-rendered details.orig image in a viewport and drives a CSS
// transform. Plain scroll is left alone so the page never gets trapped.
export function PanZoom() {
  useEffect(() => {
    const cleanups: (() => void)[] = [];

    document.querySelectorAll<HTMLImageElement>("details.orig img").forEach((img) => {
      const details = img.closest("details")!;
      const view = document.createElement("div");
      view.className = "pz";
      img.replaceWith(view);
      view.append(img);
      view.insertAdjacentHTML(
        "beforeend",
        `<div class="pz-ui"><button type="button" data-z="in" aria-label="Zoom in">+</button><button type="button" data-z="out" aria-label="Zoom out">−</button><button type="button" data-z="fit" aria-label="Fit to view">Fit</button></div><p class="pz-hint">Drag to move · Ctrl + scroll or pinch to zoom</p>`,
      );

      let s = 1, x = 0, y = 0, fit = 1;
      // ponytail: 1.5× source pixels per device pixel — DPR-aware so quality is consistent on retina
      // raise ceiling when PNGs are replaced with SVG exports (SVG is already 8× fit)
      const max = () => Math.max(fit, img.src.endsWith(".svg") ? fit * 8 : 1.5 / (window.devicePixelRatio || 1));
      const apply = () => {
        const w = img.naturalWidth * s, h = img.naturalHeight * s;
        const vw = view.clientWidth, vh = view.clientHeight;
        x = w <= vw ? (vw - w) / 2 : Math.min(0, Math.max(vw - w, x));
        y = h <= vh ? (vh - h) / 2 : Math.min(0, Math.max(vh - h, y));
        img.style.transform = `translate(${x}px,${y}px) scale(${s})`;
      };
      // zoom keeping the point (cx, cy) in the viewport still
      const zoomAt = (next: number, cx = view.clientWidth / 2, cy = view.clientHeight / 2) => {
        next = Math.min(max(), Math.max(fit, next));
        x = cx - ((cx - x) * next) / s;
        y = cy - ((cy - y) * next) / s;
        s = next;
        apply();
      };
      const reset = () => {
        if (!img.naturalWidth || !view.clientWidth) return;
        fit = view.clientWidth / img.naturalWidth;
        view.style.height = `${Math.max(320, Math.min(img.naturalHeight * fit, window.innerHeight * 0.72))}px`;
        s = fit; x = 0; y = 0;
        apply();
      };

      const onWheel = (e: WheelEvent) => {
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        const r = view.getBoundingClientRect();
        zoomAt(s * Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
      };

      // one pointer drags, two pointers pinch
      const pts = new Map<number, { x: number; y: number }>();
      let pinch = 0;
      const onDown = (e: PointerEvent) => {
        if ((e.target as HTMLElement).closest(".pz-ui")) return;
        view.setPointerCapture(e.pointerId);
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        view.classList.add("drag");
      };
      const onMove = (e: PointerEvent) => {
        const prev = pts.get(e.pointerId);
        if (!prev) return;
        const cur = { x: e.clientX, y: e.clientY };
        pts.set(e.pointerId, cur);
        if (pts.size === 2) {
          const [a, b] = [...pts.values()];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          const r = view.getBoundingClientRect();
          if (pinch) zoomAt((s * d) / pinch, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
          pinch = d;
        } else {
          x += cur.x - prev.x;
          y += cur.y - prev.y;
          apply();
        }
      };
      const onUp = (e: PointerEvent) => {
        pts.delete(e.pointerId);
        pinch = 0;
        if (!pts.size) view.classList.remove("drag");
      };
      const onClick = (e: MouseEvent) => {
        const z = (e.target as HTMLElement).closest<HTMLElement>("[data-z]")?.dataset.z;
        if (z === "in") zoomAt(s * 1.5);
        else if (z === "out") zoomAt(s / 1.5);
        else if (z === "fit") reset();
      };
      const onDbl = (e: MouseEvent) => {
        if ((e.target as HTMLElement).closest(".pz-ui")) return;
        const r = view.getBoundingClientRect();
        zoomAt(s * 2, e.clientX - r.left, e.clientY - r.top);
      };
      const onToggle = () => details.open && (img.loading = "eager", img.complete ? reset() : img.addEventListener("load", reset, { once: true }));
      const ro = new ResizeObserver(() => details.open && reset());

      view.addEventListener("wheel", onWheel, { passive: false });
      view.addEventListener("pointerdown", onDown);
      view.addEventListener("pointermove", onMove);
      view.addEventListener("pointerup", onUp);
      view.addEventListener("pointercancel", onUp);
      view.addEventListener("click", onClick);
      view.addEventListener("dblclick", onDbl);
      details.addEventListener("toggle", onToggle);
      ro.observe(view);
      onToggle();

      cleanups.push(() => {
        ro.disconnect();
        details.removeEventListener("toggle", onToggle);
        view.replaceWith(img);
        img.style.transform = "";
      });
    });

    return () => cleanups.forEach((c) => c());
  }, []);

  return null;
}
