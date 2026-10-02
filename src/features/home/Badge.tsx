import { AnimatePresence, m, type Variants } from 'motion/react';
import { EASE_OUT, SPRING } from '../../lib/motion';

// null = from wherever it is now: 0 -> 1.15 -> 1 when it appears, 1 -> 1.15 -> 1 when the count goes up
const pop = { scale: [null, 1.15, 1], transition: { duration: 0.38, times: [0, 0.45, 1], ease: EASE_OUT } };
const POP: Variants = { p0: pop, p1: pop };
// the old count slides out as the new one slides in (up when it grows, down when it shrinks)
const ROLL: Variants = {
  in: (d: number) => ({ y: d > 0 ? '100%' : '-100%', opacity: 0 }),
  at: { y: 0, opacity: 1 },
  out: (d: number) => ({ y: d > 0 ? '-100%' : '100%', opacity: 0 }),
};

/** The bell's unread badge. Its own chunk: it only ever animates after first paint. */
export default function Badge({ unread, bump, dir }: { unread: number; bump: number; dir: number }) {
  const label = unread > 9 ? '9+' : String(unread);
  return (
    <AnimatePresence initial={false}>
      {unread > 0 && (
        <m.span key="badge" className="badge tnum" aria-hidden initial={{ scale: 0 }} variants={POP} animate={`p${bump % 2}`}
          exit={{ scale: 0, opacity: 0, transition: SPRING.snappy }}>
          <AnimatePresence initial={false} custom={dir}>
            <m.span key={label} className="badge__n" custom={dir} variants={ROLL} initial="in" animate="at" exit="out" transition={SPRING.snappy}>{label}</m.span>
          </AnimatePresence>
        </m.span>
      )}
    </AnimatePresence>
  );
}
