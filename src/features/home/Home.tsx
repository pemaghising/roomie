import { Bell, CalendarDays, Repeat } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Link } from 'react-router';
import { balanceSentence } from '@domain/copy.ts';
import { DAY_NAMES, weekdayOf } from '@domain/time.ts';
import { choreMap, incomingSwaps, myTasksOn, namesOf, nextUp, pendingDraft, pool, roommates, unreadCount } from '../../lib/selectors';
import { useMe } from '../../lib/state';
import { getStreakGoal, setStreakGoal } from '../../lib/streakGoal';
import type { Assignment } from '../../lib/types';
import { Avatar } from '../../ui/Avatar';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { RingProgress } from '../../ui/RingProgress';
import { Sheet } from '../../ui/Sheet';
import { StreakPlant } from '../../ui/StreakPlant';
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
  const [goal, setGoal] = useState(getStreakGoal);
  const [settingGoal, setSettingGoal] = useState(false);
  const closeGoal = useCallback(() => setSettingGoal(false), []);

  return (
    <main className="screen home">
      <header className="home__header">
        <div>
          <p className="muted">{greeting()}</p>
          <h1>Hello, {first}.</h1>
        </div>
        <div className="home__header-actions">
          <Link to="/profile" className="balance-chip" aria-label={balanceSentence(state.balance)} title={balanceSentence(state.balance)}>
            {state.balance === 0 ? 'All square' : state.balance > 0 ? `+${state.balance} pts next week` : `${Math.abs(state.balance)} pts ahead`}
          </Link>
          <Link to="/activity" className="icon-btn home__bell" aria-label={unread ? `Activity, ${unread} new` : 'Activity'}>
            <Bell size={20} aria-hidden />{unread > 0 && <span className="dot" aria-hidden />}
          </Link>
        </div>
      </header>

      <section className="streak" aria-label="Household streak">
        <div>
          <p className="streak__label">Clean streak</p>
          <p className="streak__value"><span className="streak__num">{streak}</span> <span>day{streak === 1 ? '' : 's'} in a row</span></p>
          <p className="streak__sub">{streak > 0 ? 'Kept together, by everyone.' : 'Finish today together to start one.'}</p>
          {goal && streak < goal && (
            <p className="streak__goal">{goal - streak} day{goal - streak === 1 ? '' : 's'} to your {goal}-day goal</p>
          )}
          {goal && streak >= goal && <p className="streak__goal">🏆 Goal reached: {goal} days!</p>}
          {(!goal || streak >= goal) && (
            <button type="button" className="streak__goal-link" onClick={() => setSettingGoal(true)}>{goal ? 'Set a new goal' : 'Set a streak goal'}</button>
          )}
        </div>
        <StreakPlant streak={streak} />
      </section>

      <Sheet open={settingGoal} onClose={closeGoal} title="Set a streak goal">
        <p className="muted">Commit to keeping the house clean together for a stretch.</p>
        <div className="sheet-actions">
          {[3, 5, 7].map((d) => (
            <Button key={d} variant="secondary" onClick={() => { setStreakGoal(d); setGoal(d); setSettingGoal(false); }}>{d} days</Button>
          ))}
        </div>
      </Sheet>

      <ul className="mates" aria-label="Roommates today">
        {roommates(state, state.today).map((m) => (
          <li key={m.user_id} className="mate" style={{ background: m.color }}>
            <RingProgress value={m.done} total={m.today} size={44}>
              <Avatar name={m.name} color="#ffffffaa" size={36} />
            </RingProgress>
            <strong>{m.user_id === me ? 'You' : m.name}</strong>
            <span>{m.today === 0 ? 'free today' : `${m.done}/${m.today} done`}</span>
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
          <EmptyState title="No tasks today 🎉" body="Check back tomorrow." />
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
      <Celebration info={celebration} onClose={closeCelebration} />
    </main>
  );
}
