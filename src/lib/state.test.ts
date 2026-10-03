import { hydrate } from '@tanstack/react-query';
import { expect, test, vi } from 'vitest';
import { ACTION_RPCS } from './state';
import { queryClient } from './queryClient';

const db = vi.hoisted(() => ({ rpc: vi.fn(async () => ({ data: null, error: null })) }));
vi.mock('./supabase', () => ({ supabase: db }));

test('every action RPC has a default mutationFn, so a restored mutation can run', () => {
  for (const fn of ACTION_RPCS) expect(queryClient.getMutationDefaults(['rpc', fn]).mutationFn).toBeTypeOf('function');
});

test('a paused mutation restored after an app restart resumes and sends only p_ args', async () => {
  // what the persister hands back after the PWA was killed mid-offline
  hydrate(queryClient, {
    queries: [],
    mutations: [{
      mutationKey: ['rpc', 'claim_assignment'],
      state: {
        context: undefined, data: undefined, error: null, failureCount: 0, failureReason: null,
        isPaused: true, status: 'pending', variables: { p_id: 'a1', me: 'u1' }, submittedAt: Date.now(),
      },
    }],
  });
  await queryClient.resumePausedMutations();
  expect(db.rpc).toHaveBeenCalledWith('claim_assignment', { p_id: 'a1' });
});

test('every pantry RPC is an action, so an offline tap replays after a restart', () => {
  expect(ACTION_RPCS).toEqual(expect.arrayContaining([
    'add_pantry_item', 'add_pantry_basics', 'set_item_stock', 'set_item_rule', 'remove_pantry_item', 'request_restock',
    'claim_restock', 'unclaim_restock', 'complete_restock', 'cancel_restock', 'ask_to_use', 'answer_ask',
  ]));
});
