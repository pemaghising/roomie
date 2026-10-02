import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';
import { type CSSProperties, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { SPRING, useFirstMount } from '../../lib/motion';
import { isUnread, namesOf } from '../../lib/selectors';
import { rpc, STATE_KEY, useMe } from '../../lib/state';
import { EmptyState } from '../../ui/EmptyState';
import { activityText } from './text';
import './activity.css';

const dayLabel = (iso: string, tz: string, today: string) => {
  const d = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(iso));
  if (d === today) return 'Today';
  const y = new Date(Date.parse(`${today}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  if (d === y) return 'Yesterday';
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: tz });
};

export default function Activity() {
  const { me, state } = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const names = namesOf(state);
  const tz = state.household!.tz;
  const unread = isUnread(state, me); // live: once mark-seen lands, the dots fade out
  const stagger = useFirstMount('activity');
  let n = 0;

  useEffect(() => {
    rpc('mark_activity_seen').then(() => qc.invalidateQueries({ queryKey: STATE_KEY })).catch(() => {});
  }, [qc]);

  const groups = new Map<string, typeof state.activity>();
  for (const item of state.activity) {
    const label = dayLabel(item.created_at, tz, state.today);
    groups.set(label, [...(groups.get(label) ?? []), item]);
  }

  return (
    <main className="screen">
      <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft size={20} /></button>
      <h1>Activity</h1>
      {state.activity.length === 0 && <EmptyState title="Quiet so far." body="Completed, claimed and planned chores show up here." />}
      {[...groups].map(([label, items]) => (
        <section key={label} className="feed" aria-label={label}>
          <p className="eyebrow">{label}</p>
          <ul>
            <AnimatePresence initial={false}>
            {items.map((item) => (
              // stagger once on open; items arriving live slide in at the top and the rest glide down
              <m.li key={item.id} layout="position" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={SPRING.smooth}
                className={stagger ? 'stagger' : undefined} style={stagger ? ({ '--i': n++ } as CSSProperties) : undefined}>
                <span className={`feed__dot${unread(item) ? ' is-on' : ''}`} aria-hidden />
                <span className="feed__text">{unread(item) && <span className="sr-only">New: </span>}{activityText(item, names, me)}</span>
                <time className="muted" dateTime={item.created_at}>
                  {new Date(item.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz })}
                </time>
              </m.li>
            ))}
            </AnimatePresence>
          </ul>
        </section>
      ))}
    </main>
  );
}
