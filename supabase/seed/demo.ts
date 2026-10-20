// Demo household for testing on a phone: the Figma cast (Ramesh, Priya, Aman),
// a week of chores that follows the busy-day rules, and a 23-day house streak.
import { addDays, weekStartOf, type Weekday } from '../functions/_shared/domain/time.ts';

export type Effort = 1 | 2 | 3;
export type Cadence = 'daily' | 'weekly';

export interface DemoSeed {
  household: { name: string; tz: 'Asia/Kathmandu'; planMode: 'auto' };
  members: { name: string; email: string; role: 'owner' | 'member'; color: string; busyDays: Weekday[] }[];
  chores: { name: string; icon: string; effort: Effort; cadence: Cadence }[];
  pantry: { name: string; icon: string; shared: boolean; owner?: string; tag?: 'do_not_touch' | 'ask_first'; status: 'in_stock' | 'low' | 'out' }[];
  weekStart: string;
  assignments: { chore: string; member: string; day: string; status: 'done' | 'todo' }[];
  streakDays: number;
}

const CHORES: DemoSeed['chores'] = [
  { name: 'Wash dishes', icon: '🧽', effort: 1, cadence: 'daily' },
  { name: 'Take out trash', icon: '🗑️', effort: 1, cadence: 'daily' },
  { name: 'Sweep living room', icon: '🧹', effort: 1, cadence: 'daily' },
  { name: 'Wipe counters', icon: '🧼', effort: 1, cadence: 'daily' },
  { name: 'Do the laundry', icon: '🧺', effort: 2, cadence: 'weekly' },
  { name: 'Vacuum living room', icon: '🧹', effort: 2, cadence: 'weekly' },
  { name: 'Mop bathroom floor', icon: '🪣', effort: 3, cadence: 'weekly' },
  { name: 'Sunday deep clean', icon: '🧽', effort: 3, cadence: 'weekly' },
];

// weekly chores: [chore, member, weekday]; heavy ones sit on days nobody marked busy for that member
const WEEKLY: [string, string, Weekday][] = [
  ['Mop bathroom floor', 'Ramesh', 0],
  ['Sunday deep clean', 'Priya', 0],
  ['Vacuum living room', 'Aman', 1],
  ['Do the laundry', 'Ramesh', 6],
];

export function buildDemoHousehold(today: string, ownerEmail: string): DemoSeed {
  const members: DemoSeed['members'] = [
    { name: 'Ramesh', email: ownerEmail, role: 'owner', color: '#EFE9FD', busyDays: [2, 3, 5] },
    { name: 'Priya', email: 'priya.demo@roomie.test', role: 'member', color: '#FFEDE5', busyDays: [1, 4] },
    { name: 'Aman', email: 'aman.demo@roomie.test', role: 'member', color: '#E6F0FA', busyDays: [6] },
  ];
  const weekStart = weekStartOf(today);
  const status = (day: string) => (day < today ? 'done' : 'todo') as 'done' | 'todo';
  const assignments: DemoSeed['assignments'] = [];
  const daily = CHORES.filter((c) => c.cadence === 'daily');
  for (let d = 0; d < 7; d++) {
    const day = addDays(weekStart, d);
    daily.forEach((c, i) => assignments.push({ chore: c.name, member: members[(d + i) % 3].name, day, status: status(day) }));
  }
  for (const [chore, member, weekday] of WEEKLY) {
    const day = addDays(weekStart, weekday);
    assignments.push({ chore, member, day, status: status(day) });
  }
  return {
    household: { name: 'Parijat Chowk Flat', tz: 'Asia/Kathmandu', planMode: 'auto' },
    members,
    chores: CHORES,
    pantry: [
      { name: 'Milk', icon: 'Glass of milk', shared: true, status: 'out' },
      { name: 'Rice', icon: 'Cooked rice', shared: true, status: 'low' },
      { name: 'Olive oil', icon: 'Olive', shared: true, status: 'in_stock' },
      { name: 'Paper towels', icon: 'Roll of paper', shared: true, status: 'in_stock' },
      { name: 'Salt', icon: 'Salt', shared: true, status: 'in_stock' },
      { name: 'Bread', icon: 'Bread', shared: true, status: 'in_stock' },
      { name: 'Protein shake', icon: 'Cup with straw', shared: false, owner: 'Ramesh', tag: 'do_not_touch', status: 'in_stock' },
      { name: 'Sourdough', icon: 'Baguette bread', shared: false, owner: 'Priya', tag: 'ask_first', status: 'in_stock' },
    ],
    weekStart,
    assignments,
    streakDays: 23,
  };
}

