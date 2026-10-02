import { Bell, CalendarDays, Repeat } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { DAY_NAMES, weekdayOf } from '@domain/time.ts';
import { choreMap, incomingSwaps, myTasksOn, namesOf, nextUp, pendingDraft, pool, roommates, unreadCount } from '../../lib/selectors';
import { useMe } from '../../lib/state';
import type { Assignment } from '../../lib/types';
import { Avatar } from '../../ui/Avatar';
import { EmptyState } from '../../ui/EmptyState';
import { Sprout } from '../../ui/Sprout';
import { TaskRow } from '../../ui/TaskRow';
import { Celebration } from '../chores/Celebration';
import { useChoreActions } from '../chores/useChoreActions';
import { WhySheet } from '../chores/WhySheet';
import { InstallPrimer } from '../primer/InstallPrimer';
import './home.css';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning ✨' : h < 17 ? 'Good afternoon ☀️' : 'Good evening 🌙';
};

export default function Home() {
  const { me, state } = useMe();
  const { complete, celebration, closeCelebration } = useChoreActions();
  const [why, setWhy] = useState<Assignment | null>(null);
  const chores = choreMap(state);
  const tasks = myTasksOn(state, me, state.today);
  const upFor = pool(state, me);
  const next = nextUp(state, me, state.today);
  const draft = pendingDraft(state);
  const swaps = incomingSwaps(state, me);
  const unread = unreadCount(state, me);
  const streak = state.streak?.current ?? 0;
  const first = state.profile.name.split(' ')[0];

  return (
    <main className="screen home">
      <header className="home__header">
        <div>
          <p className="muted">{greeting()}</p>
          <h1>Hello, {first}.</h1>
        </div>
        <Link to="/activity" className="icon-btn home__bell" aria-label={unread ? `Activity, ${unread} new` : 'Activity'}>
          <Bell size={20} aria-hidden />{unread > 0 && <span className="dot" aria-hidden />}
        </Link>
      </header>

      <section className="streak" aria-label="Household streak">
        <div>
          <p className="streak__label">Clean streak</p>
          <p className="streak__value"><span className="streak__num">{streak}</span> <span>day{streak === 1 ? '' : 's'} in a row</span></p>
          <p className="streak__sub">{streak > 0 ? 'Kept together, by everyone.' : 'Finish today together to start one.'}</p>
        </div>
        <Sprout size={84} grow={1 + Math.min(streak, 14) / 28} />
      </section>

      <ul className="mates" aria-label="Roommates today">
        {roommates(state, state.today).map((m) => (
          <li key={m.user_id} className="mate" style={{ background: m.color }}>
            <Avatar name={m.name} color="#ffffffaa" size={36} />
            <strong>{m.user_id === me ? 'You' : m.name}</strong>
            <span>{m.today} task{m.today === 1 ? '' : 's'}</span>
          </li>
        ))}
      </ul>
      <InstallPrimer />

      {draft && !draft.approved_by.includes(me) && (
        <Link to="/plan" className="banner banner--plan"><CalendarDays size={18} aria-hidden /> Next week's plan is ready — take a look</Link>
      )}

      {swaps.length > 0 && (
        <Link to="/plan" className="banner banner--plan"><Repeat size={18} aria-hidden />
          {swaps.length === 1 ? `${namesOf(state)[swaps[0].from_user] ?? 'A roommate'} wants to swap — take a look` : `${swaps.length} swap requests — take a look`}
        </Link>
      )}

      <section className="section" aria-label="Today's tasks">
        <h2>Today's Tasks</h2>
        {tasks.length === 0 ? (
          <EmptyState title="No tasks today." body="Enjoy it." />
        ) : tasks.map((a) => {
          const chore = chores.get(a.chore_id);
          if (!chore) return null;
          return (
            <TaskRow key={a.id} chore={chore} assignment={a} onComplete={() => complete(a)} onOpen={() => setWhy(a)}
              note={a.claimed_by === me && a.user_id !== me ? 'Covering' : undefined} />
          );
        })}
      </section>

      {upFor.length > 0 && (
        <Link to="/chores" className="banner banner--pool">🙌 {upFor.length} chore{upFor.length === 1 ? '' : 's'} up for grabs</Link>
      )}

      {next && chores.get(next.chore_id) && (
        <div className="next-up">
          <span aria-hidden>📅</span>
          <div>
            <strong>Next up: {chores.get(next.chore_id)!.name}</strong>
            <p className="muted">{DAY_NAMES[weekdayOf(next.day)]}</p>
          </div>
        </div>
      )}

      <WhySheet assignment={why} onClose={() => setWhy(null)} />
      <Celebration kind={celebration} onClose={closeCelebration} />
    </main>
  );
}
