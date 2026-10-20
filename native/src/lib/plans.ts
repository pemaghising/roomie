/** Roomie Plus. Prices are placeholders until the App Store Connect / Play products exist. */
export type PlanId = 'yearly' | 'monthly';

export const TRIAL_DAYS = 7;

export const PLANS: Record<PlanId, { id: PlanId; title: string; price: string; per: string; note: string; badge?: string }> = {
  yearly: { id: 'yearly', title: `${TRIAL_DAYS}-day free trial`, price: '$19.99', per: '/year', note: 'then billed yearly · about $1.67/month', badge: 'Most popular' },
  monthly: { id: 'monthly', title: 'Monthly', price: '$2.99', per: '/month', note: 'Cancel anytime' },
};

/** Core chores, invites and the shareable recap stay free: they are how a household grows. */
export const COMPARISON: { label: string; free: boolean; plus: boolean; soon?: boolean }[] = [
  { label: 'Chores, plans and streaks', free: true, plus: true },
  { label: 'Invite roommates', free: true, plus: true },
  { label: 'Share your weekly recap', free: true, plus: true },
  { label: '7-day record for everyone', free: false, plus: true },
  { label: 'Themes and mascots', free: false, plus: true, soon: true },
  { label: 'Bigger households (8)', free: false, plus: true, soon: true },
];
