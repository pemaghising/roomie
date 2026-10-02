import { m } from 'motion/react';
import { useState } from 'react';
import { Button } from '../../ui/Button';
import { EASE_OUT } from '../../lib/motion';
import { Sheet } from '../../ui/Sheet';
import { Sprout } from '../../ui/Sprout';

type Kind = 'all_done' | 'covered';
const COPY = {
  all_done: { title: 'Wonderful job.', body: "That's everything for today. The house noticed." },
  covered: { title: 'Thanks for covering.', body: "You took one off a roommate's plate — it evens out next week." },
};

/**
 * The focal moment: the household sprout grows when the day is done.
 * Lottie seam: to swap in a designed animation, replace this component's body with a Lottie player
 * (e.g. @lottiefiles/dotlottie-react, lazy-loaded) inside the same 120px .celebrate__sprout box, keep it
 * aria-hidden, and show the final frame when useReducedMotion() is true. Nothing else needs to change.
 */
function CelebrationArt({ kind }: { kind: Kind }) {
  const full = kind === 'all_done';
  return (
    <div className="celebrate__sprout">
      <m.span className="celebrate__glow" aria-hidden initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: full ? 0.8 : 0.5, ease: EASE_OUT, delay: full ? 0.1 : 0 }} />
      <Sprout size={72} grow={1.15} play={full ? 'grow' : 'unfurl'} />
    </div>
  );
}

export function Celebration({ kind, onClose }: { kind: Kind | null; onClose: () => void }) {
  const [last, setLast] = useState(kind); // keep the copy on screen while the sheet slides away
  if (kind && kind !== last) setLast(kind);
  const shown = kind ?? last;
  if (!shown) return null;
  const c = COPY[shown];
  return (
    <Sheet open={Boolean(kind)} onClose={onClose} title={c.title}>
      <div className="celebrate">
        <CelebrationArt kind={shown} />
        <p>{c.body}</p>
        <Button block onClick={onClose}>Close</Button>
      </div>
    </Sheet>
  );
}
