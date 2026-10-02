/**
 * Press feedback for every tappable surface, implemented once. Pointer delegation marks the pressed element
 * data-pressed="s" (small, scales to .94) or "l" (large, .97); ui.css dims it and releases it on the snappy spring.
 * Unlike :active it works on iOS without touch listeners, and scrolling, dragging or sliding off cancels it.
 * Opt out with data-press="off"; send the press to a container with data-press-target=".selector".
 */
const SEL = 'button:not(:disabled), a[href], [role="button"], label:has(input[type="checkbox"], input[type="radio"])';
const SMALL = 100 * 100; // px²: chips, icon buttons, the FAB, tab items, day pills
const DELAY = 50; // ms: like an iOS scroll view, wait a beat so a scroll that starts on a card doesn't flash it
const MIN_VISIBLE = 90; // ms: a quick tap still shows the press

export function installPress() {
  let el: HTMLElement | null = null;
  let x = 0, y = 0, timer = 0, at = 0;
  const press = () => {
    timer = 0;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.dataset.pressed = r.width * r.height < SMALL ? 's' : 'l';
    at = performance.now();
  };
  const release = (target = el) => {
    if (target === el) { clearTimeout(timer); timer = 0; el = null; }
    target?.removeAttribute('data-pressed');
  };
  const opts = { passive: true, capture: true };
  addEventListener('pointerdown', (e: PointerEvent) => {
    release();
    if (e.button !== 0) return;
    let t = (e.target as Element | null)?.closest<HTMLElement>(SEL) ?? null;
    if (t?.dataset.pressTarget) t = t.closest<HTMLElement>(t.dataset.pressTarget);
    if (!t || t.closest('[data-press="off"]')) return;
    el = t; x = e.clientX; y = e.clientY;
    timer = window.setTimeout(press, DELAY);
  }, opts);
  addEventListener('pointermove', (e: PointerEvent) => { if (el && Math.hypot(e.clientX - x, e.clientY - y) > 10) release(); }, opts);
  addEventListener('pointerup', () => {
    if (!el) return;
    if (timer) { clearTimeout(timer); press(); } // a tap quicker than DELAY still shows
    const t = el;
    el = null;
    setTimeout(() => release(t), Math.max(0, MIN_VISIBLE - (performance.now() - at)));
  }, opts);
  for (const type of ['pointercancel', 'scroll', 'blur']) addEventListener(type, () => release(), opts);
}
