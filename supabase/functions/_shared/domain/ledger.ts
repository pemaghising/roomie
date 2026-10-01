import { clampDebt } from './rotation.ts';

/** Private effort balance per member: + owes effort, − is owed effort. */
export type Balances = Record<string, number>;

const add = (b: Balances, userId: string, n: number): Balances => ({ ...b, [userId]: (b[userId] ?? 0) + n });

export function applyClaim(b: Balances, missedUserId: string, claimerId: string, effort: number): Balances {
  return add(add(b, missedUserId, effort), claimerId, -effort);
}

export function applyExpiry(b: Balances, missedUserId: string, effort: number): Balances {
  return add(b, missedUserId, effort);
}

/** Points the requester takes on (+) or hands off (−) by swapping their task for the other one. */
export const swapDelta = (fromEffort: number, toEffort: number) => toEffort - fromEffort;

export function applySwap(b: Balances, fromUser: string, fromEffort: number, toUser: string, toEffort: number): Balances {
  const delta = swapDelta(fromEffort, toEffort);
  return add(add(b, fromUser, -delta), toUser, delta);
}

export function consumeIntoPlan(balance: number): number {
  return balance - clampDebt(balance);
}
