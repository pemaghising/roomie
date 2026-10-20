// Mirrors web src/lib/types.ts — the get_state() snapshot shape.
import type { AssignmentStatus, Cadence, Effort, NudgeStyle, Reason } from '@domain/types.ts';
import type { Weekday } from '@domain/time.ts';
import type { PantryAsk, PantryItem, Restock } from '@domain/pantry.ts';

export type NotifyPrefs = { chores: boolean; pool: boolean; pantry: boolean; recap: boolean };
export interface Profile { id: string; name: string; color: string; nudge_style: NudgeStyle; activity_seen_at: string; avatar_path: string | null; notify?: NotifyPrefs }
export interface Household { id: string; name: string; invite_code: string; plan_mode: 'review' | 'auto'; tz: string; day_ends_at: string }
export interface Member { user_id: string; name: string; color: string; role: 'owner' | 'member'; busy_days: Weekday[]; avatar_path: string | null }
export interface Chore { id: string; name: string; icon: string; effort: Effort; cadence: Cadence; active: boolean }
export interface Plan { id: string; week_start: string; status: 'draft' | 'locked'; lock_at: string; approved_by: string[] }
export interface Assignment {
  id: string; plan_id: string; chore_id: string; user_id: string; day: string; effort: Effort;
  status: AssignmentStatus; claimed_by: string | null; done_at: string | null;
  reason: Reason | null;
}
export interface SwapRequest { id: string; from_assignment: string; to_assignment: string; from_user: string; to_user: string; status: 'pending' }
export interface ActivityItem { id: number; kind: string; actor: string | null; payload: Record<string, unknown>; created_at: string }

export interface AppState {
  profile: Profile;
  household: Household | null;
  members: Member[];
  chores: Chore[];
  plans: Plan[];
  assignments: Assignment[];
  swaps: SwapRequest[];
  streak: { current: number; best: number; last_settled_day: string | null } | null;
  balance: number;
  activity: ActivityItem[];
  pantry: PantryItem[];
  restocks: Restock[];
  asks: PantryAsk[];
  today: string;
}
