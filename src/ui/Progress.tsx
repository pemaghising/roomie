import { m } from 'motion/react';
import { EASE_OUT } from './motion';

/** `from` is the step the user just left, so the fill continues from there instead of snapping. */
export function Progress({ step, total, from }: { step: number; total: number; from?: number }) {
  return (
    <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step} aria-label={`Step ${step} of ${total}`}>
      <m.span style={{ originX: 0 }} initial={from ? { scaleX: from / total } : false} animate={{ scaleX: step / total }}
        transition={{ duration: 0.4, ease: EASE_OUT }} />
    </div>
  );
}
