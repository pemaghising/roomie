import type { ReactNode } from "react";

// Shared by Nav (which section is in view). Matches the phase-head
// numbers/labels/icons and .ph-xxx color classes already defined in
// globals.css, so colors and icons always agree with each section's own
// banner. Context isn't one of the numbered design-thinking phases, so
// it's left out.
export type Phase = { id: string; cls: string; n: string; label: string; icon: ReactNode };

export const phases: Phase[] = [
  {
    id: "empathize",
    cls: "ph-emp",
    n: "01",
    label: "Empathize",
    icon: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />,
  },
  {
    id: "define",
    cls: "ph-def",
    n: "02",
    label: "Define",
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r=".6" fill="currentColor" />
      </>
    ),
  },
  {
    id: "ideate",
    cls: "ph-ide",
    n: "03",
    label: "Ideate",
    icon: (
      <>
        <path d="M9 18h6M10 21h4" />
        <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" />
      </>
    ),
  },
  {
    id: "prototype",
    cls: "ph-pro",
    n: "04",
    label: "Prototype",
    icon: (
      <>
        <rect x="6.5" y="2.5" width="11" height="19" rx="2.8" />
        <path d="M10.5 18.5h3M9.5 7h5M9.5 10.5h5" />
      </>
    ),
  },
  {
    id: "test",
    cls: "ph-tes",
    n: "05",
    label: "Test",
    icon: (
      <>
        <path d="M9.5 3h5M10 3v6L5 18.5A1.7 1.7 0 0 0 6.5 21h11a1.7 1.7 0 0 0 1.5-2.5L14 9V3" />
        <path d="M7.5 15h9" />
      </>
    ),
  },
  {
    id: "reflect",
    cls: "ph-ref",
    n: "06",
    label: "Reflect",
    icon: (
      <>
        <path d="M4 12a8 8 0 0 1 14-5.3L20 9" />
        <path d="M20 4v5h-5" />
        <path d="M20 12a8 8 0 0 1-14 5.3L4 15" />
        <path d="M4 20v-5h5" />
      </>
    ),
  },
];

export const phaseIds = phases.map((p) => p.id);
