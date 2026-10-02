import { Button } from '../../ui/Button';
import { Sheet } from '../../ui/Sheet';
import { Sprout } from '../../ui/Sprout';

const COPY = {
  all_done: { title: 'Wonderful job.', body: "That's everything for today. The house noticed." },
  covered: { title: 'Thanks for covering.', body: 'You took one off a roommate’s plate — it evens out next week.' },
};

export function Celebration({ kind, onClose }: { kind: 'all_done' | 'covered' | null; onClose: () => void }) {
  if (!kind) return null;
  const c = COPY[kind];
  return (
    <Sheet open onClose={onClose} title={c.title}>
      <div className="celebrate">
        <div className="celebrate__sprout"><Sprout size={72} grow={1.15} /></div>
        <p>{c.body}</p>
        <Button block onClick={onClose}>Close</Button>
      </div>
    </Sheet>
  );
}
