import { Bell, CalendarDays, Repeat } from 'lucide-react';
import { LayoutGroup, m, type Variants } from 'motion/react';
import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router';
import { DAY_NAMES, weekdayOf } from '@domain/time.ts';
import { choreMap, incomingSwaps, myTasksOn, namesOf, nextUp, pendingDraft, pool, roommates, unreadCount } from '../../lib/selectors';
import { useMe } from '../../lib/state';
import type { Assignment } from '../../lib/types';
import { Avatar } from '../../ui/Avatar';
import { EmptyState } from '../../ui/EmptyState';
import { EASE_OUT, useFirstMount } from '../../lib/motion';
import { Sprout } from '../../ui/Sprout';
import { TaskRow } from '../../ui/TaskRow';
import { useChoreActions } from '../chores/useChoreActions';
import { InstallPrimer } from '../primer/InstallPrimer';
import '../chores/chores.css'; // .section and the sheet styles Home uses; the sheets themselves load lazily
import './home.css';

const Celebration = lazy(() => import('../chores/Celebration').then((m) => ({ default: m.Celebration })));
const Badge = lazy(() => import('./Badge'));
const WhySheet = lazy(() => import('../chores/WhySheet').then((m) => ({ default: m.WhySheet })));

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning ✨' : h < 17 ? 'Good afternoon ☀️' : 'Good evening 🌙';
};

// a damped swing from the top, ~600 ms, once per new item; never loops
const swing = { rotate: [0, 12, -9, 5, -2, 0], transition: { duration: 0.6, ease: EASE_OUT } };
const SWING: Variants = { s0: swing, s1: swing };

/** Unread badge + bell: the badge pops in, its number rolls, and the bell swings once when something new arrives. */
function ActivityBell({ unread }: { unread: number }) {
  const [seen, setSeen] = useState({ n: unread, bump: 0, dir: 1 });
  if (seen.n !== unread) setSeen({ n: unread, bump: unread > seen.n ? seen.bump + 1 : seen.bump, dir: unread > seen.n ? 1 : -1 });
  return (
    <Link to="/activity" className="icon-btn home__bell" aria-label={unread ? `Activity, ${unread} new` : 'Activity'}>
      <m.span className="home__bell-icon" style={{ originY: 0.1 }} initial={false} variants={SWING} animate={`s${seen.bump % 2}`}>
        <Bell size={20} aria-hidden />
      </m.span>
      <Suspense fallback={null}><Badge unread={unread} bump={seen.bump} dir={seen.dir} /></Suspense>
    </Link>
  );
}

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
  const stagger = useFirstMount('home');

  return (
    <main className="screen home">
      <header className="home__header">
        <div>
          <p className="muted">{greeting()}</p>
          <h1>Hello, {first}.</h1>
        </div>
        <ActivityBell unread={unread} />
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
        ) : <LayoutGroup id="home">{tasks.map((a, i) => {
          const chore = chores.get(a.chore_id);
          if (!chore) return null;
          return (
            <TaskRow key={a.id} chore={chore} assignment={a} onComplete={() => complete(a)} onOpen={() => setWhy(a)} enter={stagger ? i : undefined}
              note={a.claimed_by === me && a.user_id !== me ? 'Covering' : undefined} />
          );
        })}</LayoutGroup>}
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

      <Suspense fallback={null}>
        <WhySheet assignment={why} onClose={() => setWhy(null)} />
        <Celebration kind={celebration} onClose={closeCelebration} />
      </Suspense>
    </main>
  );
}
