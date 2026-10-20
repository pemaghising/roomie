import { describe, expect, test } from 'vitest';
import { applyOptimistic, rollback } from './optimistic';

type S = { assignments: { id: string; status: string }[] };

describe('optimistic updates', () => {
  const state: S = { assignments: [{ id: 'a', status: 'todo' }] };

  test('applies the change to a copy and leaves the cached state untouched', () => {
    const { next } = applyOptimistic(state, (s) => { s.assignments[0].status = 'done'; return s; });
    expect(next.assignments[0].status).toBe('done');
    expect(state.assignments[0].status).toBe('todo');
  });

  test('a failed write rolls back to exactly the state before it', () => {
    const before = structuredClone(state);
    const { snapshot } = applyOptimistic(state, (s) => ({ assignments: [...s.assignments, { id: 'b', status: 'todo' }] }));
    expect(rollback(snapshot)).toEqual(before);
  });
});
