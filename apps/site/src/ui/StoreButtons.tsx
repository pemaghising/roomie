"use client";

import { useEffect, useState } from "react";
import "./ui.css";

const STORES = [
  {
    id: "apple",
    label: "Coming soon on the App Store",
    small: "Coming soon on the",
    big: "App Store",
    glyph: (
      <path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.7.9-.8 0-2-.9-3.2-.9-1.7 0-3.2 1-4.1 2.4-1.8 3-.5 7.6 1.3 10.1.8 1.2 1.8 2.6 3.1 2.6 1.2-.1 1.7-.8 3.2-.8s1.9.8 3.2.8 2.2-1.2 3-2.4c.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.6-1-2.6-4.2ZM14 5.4c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4Z" fill="currentColor" />
    ),
  },
  {
    id: "play",
    label: "Coming soon on Google Play",
    small: "Coming soon on",
    big: "Google Play",
    glyph: (
      <>
        <path d="M1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924Z" fill="#00C3FF" />
        <path d="M13.544 10.989l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973Z" fill="#00E676" />
        <path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594Z" fill="#FFC400" />
        <path d="M13.544 13.056l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21Z" fill="#FF3D47" />
      </>
    ),
  },
];

/** The only call to action. Inert until launch: shows "Coming soon", never navigates. */
export function StoreButtons({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => setOpen(null), 2200);
    return () => window.clearTimeout(t);
  }, [open]);

  return (
    <div className={`stores stores--${variant}`}>
      {STORES.map((s) => (
        <span className="store-wrap" key={s.id}>
          <button
            type="button"
            className="store"
            aria-disabled="true"
            aria-label={s.label}
            onClick={(e) => { e.preventDefault(); setOpen(s.id); }}
            onFocus={() => setOpen(s.id)}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">{s.glyph}</svg>
            <span className="store-text"><small>{s.small}</small><b>{s.big}</b></span>
          </button>
          {open === s.id && (
            <span role="status" className="store-tip">Coming soon. We’re putting the finishing touches on it.</span>
          )}
        </span>
      ))}
    </div>
  );
}
