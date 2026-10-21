import type { CSSProperties } from "react";

/** Where a card sits on the 393 × 852 screen (fractions; r in points), and when it lifts out. */
export const popVars = (p: { x: number; y: number; w: number; r: number }, delay = 0) =>
  ({ "--x": p.x, "--y": p.y, "--w": p.w, "--r": p.r / 393, "--delay": `${delay}s` }) as CSSProperties;
