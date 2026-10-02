import { Lock } from 'lucide-react';
import { balanceSentence, reasonText } from '@domain/copy.ts';
import { weekStartOf } from '@domain/time.ts';
import { choreMap, namesOf, weekTotals } from '../../lib/selectors';
import { useMe } from '../../lib/state';
import type { Assignment } from '../../lib/types';
import { EffortChip } from '../../ui/EffortChip';
import { Sheet } from '../../ui/Sheet';
import './chores.css';

function whyText(a: Assignment, me: string, names: Record<string, string>): string {
  // covering someone else's chore: their reason is theirs (and may be private), so speak to the person covering
  if (a.claimed_by === me && a.user_id !== me) return `You're covering for ${names[a.user_id] ?? 'a roommate'}. Thanks.`;
  return a.reason ? reasonText(a.reason, names) : 'Shared out fairly by effort.';
}

export function WhySheet({ assignment, onClose }: { assignment: Assignment | null; onClose: () => void }) {
  const { me, state } = useMe();
  if (!assignment) return null;
  const chore = choreMap(state).get(assignment.chore_id);
  const names = namesOf(state);
  const totals = weekTotals(state, weekStartOf(assignment.day));
  const max = Math.max(1, ...Object.values(totals));
  const people = [...state.members].sort((a, b) => a.name.localeCompare(b.name)); // alphabetical: a picture of the week, never a ranking

  return (
    <Sheet open onClose={onClose} title={chore?.name ?? 'Chore'}>
      <div className="why">
        <EffortChip effort={assignment.effort} size="md" />
        <p className="why__reason">{whyText(assignment, me, names)}</p>
        <p className="eyebrow">This week's effort</p>
        <ul className="why__bars">
          {people.map((m) => (
            <li key={m.user_id}>
              <span className="why__name">{m.user_id === me ? 'You' : m.name}</span>
              <span className="why__track"><span style={{ width: `${((totals[m.user_id] ?? 0) / max) * 100}%`, background: m.color }} /></span>
              <span className="why__pts">{totals[m.user_id] ?? 0} pts</span>
            </li>
          ))}
        </ul>
        <p className="why__private"><Lock size={14} aria-hidden /> {balanceSentence(state.balance)} Only you can see this.</p>
      </div>
    </Sheet>
  );
}
