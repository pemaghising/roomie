import { useSyncExternalStore } from 'react';

const IDLE_MS = 600; // how long after the last movement the bar expands again
const WOBBLE = 2; // movement smaller than this is not scrolling

let shrunk = false;
let lastY = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

const set = (v: boolean) => { if (v !== shrunk) { shrunk = v; listeners.forEach((l) => l()); } };

export const getShrunk = () => shrunk;

/** Call with a scroll view's vertical offset. Moving in either direction shrinks the bar; stopping, or reaching the top, expands it. */
export function noteScroll(y: number): void {
  const moved = Math.abs(y - lastY);
  lastY = y;
  if (y <= 0) { clearTimeout(timer); set(false); return; }
  if (moved < WOBBLE) return;
  set(true);
  clearTimeout(timer);
  timer = setTimeout(() => set(false), IDLE_MS);
}

export function resetShrink(): void { clearTimeout(timer); lastY = 0; set(false); }

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const useTabShrunk = () => useSyncExternalStore(subscribe, getShrunk, () => false);

/** Spread onto a ScrollView so it drives the tab bar. */
export const scrollShrink = {
  onScroll: (e: { nativeEvent: { contentOffset: { y: number } } }) => noteScroll(e.nativeEvent.contentOffset.y),
  scrollEventThrottle: 16,
};
