"use client";

import { useEffect } from "react";

// Turns each server-rendered .gallery .strip into a presentable rail: arrow
// buttons beside the row title, a caption under every screen (from its alt),
// drag to scroll with a mouse, edge fades and a slim progress line instead of
// the browser scrollbar. Vertical wheel scrolling is left alone.
export function GalleryRail() {
  useEffect(() => {
    const cleanups: (() => void)[] = [];

    document.querySelectorAll<HTMLElement>(".gallery .strip").forEach((strip) => {
      const row = strip.parentElement!;
      const title = row.querySelector("h4");
      row.classList.add("rail");

      strip.querySelectorAll<HTMLImageElement>(".phone img").forEach((img) => {
        const fig = img.closest("figure")!;
        if (fig.parentElement?.classList.contains("rail-item")) return;
        const item = document.createElement("div");
        item.className = "rail-item";
        fig.replaceWith(item);
        item.append(fig);
        const cap = document.createElement("p");
        cap.className = "rail-cap";
        cap.textContent = img.alt;
        item.append(cap);
      });

      const ui = document.createElement("div");
      ui.className = "rail-ui";
      ui.innerHTML = `<button type="button" data-d="-1" aria-label="Previous screens"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button><button type="button" data-d="1" aria-label="Next screens"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>`;
      title?.append(ui);
      const bar = document.createElement("div");
      bar.className = "rail-bar";
      bar.innerHTML = "<i></i>";
      strip.after(bar);
      const thumb = bar.firstElementChild as HTMLElement;
      const [prev, next] = ui.querySelectorAll("button");

      const update = () => {
        const max = strip.scrollWidth - strip.clientWidth;
        const p = max > 0 ? strip.scrollLeft / max : 0;
        const size = strip.scrollWidth ? strip.clientWidth / strip.scrollWidth : 1;
        thumb.style.width = `${Math.max(size, 0.08) * 100}%`;
        thumb.style.transform = `translateX(${p * (1 / Math.max(size, 0.08) - 1) * 100}%)`;
        prev.disabled = strip.scrollLeft <= 2;
        next.disabled = strip.scrollLeft >= max - 2;
        row.classList.toggle("at-start", strip.scrollLeft <= 2);
        row.classList.toggle("at-end", strip.scrollLeft >= max - 2);
        row.classList.toggle("no-scroll", max <= 2);
      };
      const step = (d: number) => {
        const item = strip.querySelector<HTMLElement>(".rail-item");
        const w = item ? item.offsetWidth + 20 : 280;
        const per = Math.max(1, Math.floor(strip.clientWidth / w) - 1);
        strip.scrollBy({ left: d * w * per, behavior: "smooth" });
      };
      const onClick = (e: Event) => {
        const b = (e.target as HTMLElement).closest("button");
        if (b) step(Number(b.dataset.d));
      };

      // mouse drag (touch and trackpads already scroll natively)
      let down = false, startX = 0, startL = 0, moved = false;
      const onDown = (e: PointerEvent) => {
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        down = true; moved = false; startX = e.clientX; startL = strip.scrollLeft;
        strip.classList.add("dragging");
      };
      const onMove = (e: PointerEvent) => {
        if (!down) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 4) moved = true;
        strip.scrollLeft = startL - dx;
      };
      const onUp = () => {
        if (!down) return;
        down = false;
        strip.classList.remove("dragging");
      };
      const onClickCapture = (e: MouseEvent) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
      };

      ui.addEventListener("click", onClick);
      strip.addEventListener("scroll", update, { passive: true });
      strip.addEventListener("pointerdown", onDown);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      strip.addEventListener("click", onClickCapture, true);
      strip.addEventListener("keydown", onKey);
      strip.addEventListener("dragstart", (e) => e.preventDefault());
      const ro = new ResizeObserver(update);
      ro.observe(strip);
      update();

      cleanups.push(() => {
        ui.removeEventListener("click", onClick);
        strip.removeEventListener("scroll", update);
        strip.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        strip.removeEventListener("click", onClickCapture, true);
        strip.removeEventListener("keydown", onKey);
        ro.disconnect();
        ui.remove();
        bar.remove();
      });
    });

    return () => cleanups.forEach((c) => c());
  }, []);

  return null;
}
