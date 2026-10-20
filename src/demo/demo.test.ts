import { describe, expect, it } from 'vitest';
import { incomingSwaps, myTasksOn, pendingDraft, pool } from '../lib/selectors';
import { AMAN, applyDemoRpc, ME, seedState } from './demo';

// every weekday, so the seed works whatever day a tester opens it
const DAYS = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'];

describe('demo seed', () => {
  it.each(DAYS)('gives the tester all four test tasks on %s', (today) => {
    const s = seedState(today);
    expect(s.household?.name).toBe('Apt 4B');
    expect(pool(s, ME).length).toBeGreaterThan(0); // something to claim
    expect(pendingDraft(s)).toBeDefined(); // a plan to review
    expect(incomingSwaps(s, ME)).toHaveLength(1); // a swap to answer
    expect(myTasksOn(s, ME, today).length).toBeGreaterThan(0); // something to tick off
  });

  it('hides roommates’ private debt reasons, like get_state', () => {
    const s = seedState('2026-10-07');
    const others = s.assignments.filter((a) => a.user_id !== ME);
    expect(others.some((a) => a.reason?.code === 'debt' || a.reason?.code === 'credit')).toBe(false);
  });
});

describe('demo actions', () => {
  const today = '2026-10-07';

  it('claiming a missed chore makes it mine and earns credit', () => {
    const s = seedState(today);
    const missed = pool(s, ME)[0];
    const { state } = applyDemoRpc(s, 'claim_assignment', { p_id: missed.id });
    const a = state.assignments.find((x) => x.id === missed.id)!;
    expect(a).toMatchObject({ status: 'claimed', claimed_by: ME, user_id: AMAN });
    expect(state.balance).toBe(s.balance - missed.effort);
    expect(myTasksOn(state, ME, today).map((x) => x.id)).toContain(missed.id);
  });

  it('complete then undo restores the chore', () => {
    const s = seedState(today);
    const mine = myTasksOn(s, ME, today).find((a) => a.status === 'todo')!;
    const done = applyDemoRpc(s, 'complete_assignment', { p_id: mine.id }).state;
    expect(done.assignments.find((a) => a.id === mine.id)?.status).toBe('done');
    const undone = applyDemoRpc(done, 'undo_complete', { p_id: mine.id }).state;
    expect(undone.assignments.find((a) => a.id === mine.id)?.status).toBe('todo');
  });

  it('accepting a swap trades the two chores', () => {
    const s = seedState(today);
    const w = s.swaps[0];
    const { state } = applyDemoRpc(s, 'respond_swap', { p_swap: w.id, p_accept: true });
    expect(state.swaps).toHaveLength(0);
    expect(state.assignments.find((a) => a.id === w.from_assignment)?.user_id).toBe(ME);
    expect(state.assignments.find((a) => a.id === w.to_assignment)?.user_id).toBe(AMAN);
  });

  it('a new chore is planned into the rest of this week', () => {
    const s = seedState(today);
    const { state, result } = applyDemoRpc(s, 'add_chore', { p_name: 'Mop floors', p_icon: '🧽', p_effort: 2, p_cadence: 'weekly' });
    const placed = state.assignments.filter((a) => a.chore_id === result);
    expect(placed).toHaveLength(1);
    expect(placed[0].day >= today).toBe(true);
  });

  it('refuses account-only actions with an error code', () => {
    expect(() => applyDemoRpc(seedState(today), 'leave_household')).toThrow('unknown');
  });
});
