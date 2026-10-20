import type { NudgeStyle } from './types.ts';

// Push copy lives here, apart from copy.ts: copy.ts ships in the app's entry chunk, this only in Profile's chunk and the tick.
const pts = (n: number) => `${n} pt${n === 1 ? '' : 's'}`;
const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

export type NudgeKind =
  | 'digest' | 'pool' | 'plan_ready' | 'plan_locked' | 'covered' | 'day_kept' | 'swap_request' | 'swap_answer' | 'joined'
  | 'restock' | 'restock_done' | 'restock_closed' | 'ask' | 'ask_answer' | 'kudos';

export interface NudgePayload {
  chore?: string; chores?: string[]; actor?: string; streak?: number; effort?: number; accepted?: boolean; offered?: string;
  /** pantry: one item, a drain-batched list of items, and the digest's "still needed" restock requests */
  item?: string; items?: string[]; stale?: string[];
  /** kudos: the emoji a roommate sent */
  emoji?: string;
}

type Copy = { title: string; body: string };

export function nudge(kind: NudgeKind, style: NudgeStyle, p: NudgePayload): Copy {
  const m = style === 'motivate';
  const chores = p.chores ?? [];
  switch (kind) {
    case 'digest': {
      const still = p.stale?.length ? `Still needed: ${list(p.stale)}.` : '';
      if (!chores.length) return m ? { title: 'Good morning 🌱', body: still } : { title: 'Today', body: still };
      const tail = still ? ` ${still}` : '';
      return m
        ? { title: 'Good morning 🌱', body: `${chores.length} task${chores.length === 1 ? '' : 's'} today — ${list(chores)}.${tail}` }
        : { title: 'Today', body: `${list(chores)}.${tail}` };
    }
    case 'pool': {
      const items = chores.length ? chores : p.chore ? [p.chore] : []; // `chore` is the pre-batch payload
      if (items.length <= 1) {
        return m ? { title: 'Up for grabs 🙌', body: `Up for grabs: ${items[0]}. Be a hero?` } : { title: 'Unclaimed chore', body: `Unclaimed: ${items[0]}.` };
      }
      return m
        ? { title: 'Up for grabs 🙌', body: `Up for grabs: ${list(items)}. Grab one?` }
        : { title: 'Unclaimed chores', body: `Unclaimed: ${list(items)}.` };
    }
    case 'plan_ready':
      return m ? { title: "Next week's plan 📋", body: '30 seconds to check it — swap anything that clashes.' } : { title: 'Plan ready', body: "Next week's plan is ready for review." };
    case 'plan_locked':
      return m ? { title: 'Your week is planned ✨', body: 'Fair split, busy days respected. Nothing to sort out.' } : { title: 'Plan locked', body: "Next week's plan is set." };
    case 'covered':
      return m
        ? { title: 'Covered for you', body: `${p.actor} covered the ${p.chore} — you'll pick up a little extra next week (+${pts(p.effort ?? 1)}).` }
        : { title: 'Covered', body: `${p.actor} covered ${p.chore}. +${pts(p.effort ?? 1)} next week.` };
    case 'day_kept':
      return m ? { title: 'House peace secured ✨', body: `${p.streak}-day streak. Nicely done, everyone.` } : { title: 'Streak', body: `${p.streak} days.` };
    case 'swap_request':
      return m
        ? { title: 'Swap request 🔄', body: `${p.actor} wants to trade their ${p.offered} for your ${p.chore}.` }
        : { title: 'Swap request', body: `${p.actor}: ${p.offered} ↔ your ${p.chore}.` };
    case 'swap_answer':
      return p.accepted
        ? (m ? { title: 'Swap accepted 🤝', body: `${p.actor} took the trade.` } : { title: 'Swap accepted', body: `${p.actor} accepted.` })
        : (m ? { title: 'Swap declined', body: `${p.actor} would rather keep their task. No worries.` } : { title: 'Swap declined', body: `${p.actor} declined.` });
    case 'joined':
      return m ? { title: 'New roommate 🏠', body: `${p.actor} joined the house. Their chores start with next week's plan.` } : { title: 'New member', body: `${p.actor} joined.` };
    case 'restock': {
      const items = p.items?.length ? p.items : p.item ? [p.item] : [];
      if (items.length <= 1) {
        return m
          ? { title: 'Shopping run? 🛒', body: `${p.actor} asked for ${items[0]}. Passing a shop?` }
          : { title: 'Restock request', body: `Needed: ${items[0]}.` };
      }
      return m
        ? { title: 'Shopping run? 🛒', body: `The house needs ${list(items)}. Grab one?` }
        : { title: 'Restock requests', body: `Needed: ${list(items)}.` };
    }
    case 'restock_done':
      return m
        ? { title: 'Restocked 🛒', body: `${p.actor} picked up ${p.item}. One less thing to think about.` }
        : { title: 'Restocked', body: `${p.actor} picked up ${p.item}.` };
    case 'restock_closed':
      return m
        ? { title: 'No need to buy it', body: `${p.item} was restocked — you're off the hook.` }
        : { title: 'Restocked', body: `${p.item} was restocked.` };
    case 'ask':
      return m
        ? { title: 'Quick ask 🙋', body: `${p.actor} would like to use your ${p.item}. Sure?` }
        : { title: 'Ask', body: `${p.actor} asked to use your ${p.item}.` };
    case 'kudos':
      return m
        ? { title: 'A cheer for you 🙌', body: `${p.actor} sent you a ${p.emoji}. The house noticed.` }
        : { title: 'Kudos', body: `${p.actor} sent you a ${p.emoji}.` };
    case 'ask_answer':
      return p.accepted
        ? (m ? { title: 'Go ahead 👍', body: `${p.actor} said sure — the ${p.item} is yours to use.` } : { title: 'Answered', body: `${p.actor}: sure, ${p.item}.` })
        : (m ? { title: 'Not this time', body: `${p.actor} needs the ${p.item} this time. No worries.` } : { title: 'Answered', body: `${p.actor}: not this time, ${p.item}.` });
  }
}
