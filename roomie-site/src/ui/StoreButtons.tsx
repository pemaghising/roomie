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
      <path d="M4.2 2.6c-.2.2-.3.6-.3 1v16.8c0 .4.1.8.3 1l9.4-9.4-9.4-9.4Zm10.4 10.4-2.5 2.5-7 7 9.9-5.7-.4-3.8Zm0-2 .4-3.8-9.9-5.7 7 7 2.5 2.5Zm1.7 1 3.2 1.8c.9.5.9 1.4 0 1.9l-3.2 1.8-2.8-2.8 2.8-2.7Z" fill="currentColor" />
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
