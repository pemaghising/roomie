import type { Weekday } from './time.ts';

export type Effort = 1 | 2 | 3;
export type Cadence = 'daily' | 'weekly' | 'biweekly';
export type AssignmentStatus = 'todo' | 'done' | 'missed' | 'claimed' | 'expired';
export type NudgeStyle = 'motivate' | 'facts';

export interface MemberInput {
  userId: string;
  busyDays: Weekday[];
  /** + means the member owes effort, − means they are owed (private ledger). */
  balance: number;
  /** userId of whoever most recently covered for this member, for the reason text. */
  coveredBy?: string;
}

export interface ChoreInput { id: string; effort: Effort; cadence: Cadence; createdWeek: string }
export interface HistoryItem { choreId: string; userId: string; weekStart: string }

export interface PlanInput {
  householdId: string;
  weekStart: string;
  members: MemberInput[];
  chores: ChoreInput[];
  history: HistoryItem[];
  /** Plan only from this weekday on (mid-week households and newly added chores). */
  fromDay?: Weekday;
  /** Points already assigned this week, when adding to an existing plan. */
  existingTotals?: Record<string, number>;
}

export type Reason =
  | { code: 'busy_moved'; busyDay: Weekday }
  | { code: 'turn'; previousUserId: string }
  | { code: 'debt'; coveredBy?: string }
  | { code: 'credit' }
  | { code: 'balance'; points: number; target: number }
  | { code: 'everyone_busy'; day: Weekday }
  | { code: 'swap'; withUserId: string };

export interface PlannedAssignment { choreId: string; userId: string; day: Weekday; effort: Effort; reason: Reason }

export interface PlanResult {
  assignments: PlannedAssignment[];
  totals: Record<string, number>;
  /** Heavy chores that could only land on a day everyone marked busy. */
  flags: { choreId: string; day: Weekday }[];
}
