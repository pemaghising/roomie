import type { NudgeStyle, Reason } from './types.ts';
import { DAY_NAMES } from './time.ts';

export const effortLabel = (e: number) => (e >= 3 ? 'Heavy' : e === 2 ? 'Medium' : 'Light') as 'Light' | 'Medium' | 'Heavy';

const nameOf = (names: Record<string, string>, id?: string) => (id && names[id]) || 'a roommate';
const pts = (n: number) => `${n} pt${n === 1 ? '' : 's'}`;
const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

export function reasonText(r: Reason, names: Record<string, string>): string {
  switch (r.code) {
    case 'busy_moved': return `Heavy task moved off your busy ${DAY_NAMES[r.busyDay]}.`;
    case 'turn': return `Your turn — ${nameOf(names, r.previousUserId)} did it last week.`;
    case 'debt': return r.coveredBy ? `A little extra this week — ${nameOf(names, r.coveredBy)} covered for you.` : 'A little extra this week to even things out.';
    case 'credit': return 'A lighter week — you covered for a roommate.';
    case 'balance': return `Evens out effort: you're at ${r.points} of ${r.target} points this week.`;
    case 'everyone_busy': return `Everyone's busy ${DAY_NAMES[r.day]}, so this went to whoever had the lightest week.`;
    case 'swap': return `Swapped with ${nameOf(names, r.withUserId)}.`;
  }
}

export type NudgeKind =
  | 'digest' | 'pool' | 'plan_ready' | 'plan_locked' | 'covered' | 'day_kept' | 'swap_request' | 'swap_answer' | 'joined';

export interface NudgePayload {
  chore?: string; chores?: string[]; actor?: string; streak?: number; effort?: number; accepted?: boolean; offered?: string;
}

type Copy = { title: string; body: string };

export function nudge(kind: NudgeKind, style: NudgeStyle, p: NudgePayload): Copy {
  const m = style === 'motivate';
  const chores = p.chores ?? [];
  switch (kind) {
    case 'digest':
      return m
        ? { title: 'Good morning 🌱', body: `${chores.length} task${chores.length === 1 ? '' : 's'} today — ${list(chores)}.` }
        : { title: 'Today', body: `${list(chores)}.` };
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
  }
}

export const ERROR_CODES = [
  'not_authenticated', 'not_member', 'already_member', 'invalid_code', 'household_full', 'rate_limited',
  'already_claimed', 'not_allowed', 'undo_expired', 'plan_locked', 'invalid_input', 'swap_unavailable',
] as const;

const ERROR_COPY: Record<string, string> = {
  not_authenticated: 'Please sign in again.',
  not_member: "You're not in this household anymore.",
  already_member: "You're already in a household. Leave it first to join another.",
  invalid_code: "That code doesn't match a household. Check it with your roommate.",
  household_full: 'This household is full (8 people max).',
  rate_limited: 'Too many tries. Give it a minute.',
  already_claimed: 'Someone already grabbed this one.',
  not_allowed: "That can't be changed anymore.",
  undo_expired: 'Too late to undo — it stays done.',
  plan_locked: 'This plan is already locked.',
  invalid_input: 'Something in that form needs another look.',
  swap_unavailable: "That swap isn't possible anymore.",
};

export const errorText = (code: string) => ERROR_COPY[code] ?? "Something went wrong. We'll keep trying.";

export function balanceSentence(balance: number): string {
  if (balance === 0) return "You're all square with the house.";
  const n = Math.abs(balance);
  return balance > 0
    ? `You'll pick up ${n} extra point${n === 1 ? '' : 's'} over the next week.`
    : `You're ${n} point${n === 1 ? '' : 's'} ahead — next week will be a little lighter.`;
}
