import { Button } from '../../ui/Button';
import { Sheet } from '../../ui/Sheet';
import { Sprout } from '../../ui/Sprout';

const COPY = {
  all_done: { title: 'Wonderful job.', body: "That's everything for today. The house noticed." },
  covered: { title: 'Thanks for covering.', body: 'You took one off a roommate’s plate — it evens out next week.' },
};

export type CelebrationInfo = { kind: 'all_done' | 'covered'; streak: number; doneToday: number };

export function Celebration({ info, onClose }: { info: CelebrationInfo | null; onClose: () => void }) {
  if (!info) return null;
  const c = COPY[info.kind];
  return (
    <Sheet open onClose={onClose} title={c.title}>
      <div className="celebrate">
        <div className="celebrate__sprout"><Sprout size={72} grow={1.15} /></div>
        <p>{c.body}</p>
        <div className="celebrate__stats">
          <div className="celebrate__stat"><strong>{info.streak}</strong><span>day streak</span></div>
          <div className="celebrate__stat"><strong>{info.doneToday}</strong><span>done today</span></div>
        </div>
        <Button block onClick={onClose}>Close</Button>
      </div>
    </Sheet>
  );
}
