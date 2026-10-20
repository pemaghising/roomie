import { useSyncExternalStore } from 'react';
import type { PlanId } from './plans';

/**
 * The one place that knows whether this person has Roomie Plus.
 * Billing is not wired yet: until a store provider (e.g. RevenueCat in a dev build) is connected, nobody is Plus
 * and purchase() reports that honestly instead of pretending to unlock. Wire the provider here and nowhere else.
 */
export class PurchasesNotConfigured extends Error {
  constructor() { super('Purchases are not set up yet.'); }
}

let plus = false;
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

export const usePlus = () => useSyncExternalStore(subscribe, () => plus, () => false);

/** Provider callback: call when the store reports a changed entitlement. */
export function setPlus(next: boolean) {
  if (next === plus) return;
  plus = next;
  listeners.forEach((l) => l());
}

export async function purchase(_plan: PlanId): Promise<void> {
  throw new PurchasesNotConfigured();
}

export async function restorePurchases(): Promise<void> {
  throw new PurchasesNotConfigured();
}
