import type { Reason } from './types.ts';
import { DAY_NAMES } from './time.ts';

// Push copy (nudge) lives in nudge.ts: this module ships in the app's entry chunk, so it holds only what first load needs.

export const effortLabel = (e: number) => (e >= 3 ? 'Heavy' : e === 2 ? 'Medium' : 'Light') as 'Light' | 'Medium' | 'Heavy';

const nameOf = (names: Record<string, string>, id?: string) => (id && names[id]) || 'a roommate';

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

export const ERROR_CODES = [
  'not_authenticated', 'not_member', 'already_member', 'invalid_code', 'household_full', 'rate_limited',
  'already_claimed', 'not_allowed', 'undo_expired', 'plan_locked', 'invalid_input', 'swap_unavailable',
  'already_requested', 'duplicate_item',
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
  already_requested: "Already requested — it's in the Chores pool.",
  duplicate_item: 'Already in the pantry.',
};

export const errorText = (code: string) => ERROR_COPY[code] ?? "Something went wrong. We'll keep trying.";

export function balanceSentence(balance: number): string {
  if (balance === 0) return "You're all square with the house.";
  const n = Math.abs(balance);
  return balance > 0
    ? `You'll pick up ${n} extra point${n === 1 ? '' : 's'} over the next week.`
    : `You're ${n} point${n === 1 ? '' : 's'} ahead — next week will be a little lighter.`;
}
