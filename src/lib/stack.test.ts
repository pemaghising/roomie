import { expect, test } from 'vitest';
import { navDirection, stackKey, swipeBackCompletes } from './stack';

test('going deeper pushes, coming back pops, tab switches and onboarding just swap', () => {
  expect(navDirection('/', '/activity', 'PUSH')).toBe('push');
  expect(navDirection('/profile', '/profile/household', 'PUSH')).toBe('push');
  expect(navDirection('/activity', '/', 'POP')).toBe('pop'); // back / navigate(-1)
  expect(navDirection('/plan', '/chores', 'PUSH')).toBe('pop'); // a link back up is still a pop
  expect(navDirection('/', '/chores', 'PUSH')).toBe('none');
  expect(navDirection('/chores', '/', 'POP')).toBe('none');
  expect(navDirection('/plan', '/activity', 'PUSH')).toBe('push');
  expect(navDirection('/activity', '/plan', 'POP')).toBe('pop');
  expect(navDirection('/profile', '/onboarding/invite', 'PUSH')).toBe('none');
  expect(navDirection('/welcome', '/', 'REPLACE')).toBe('none');
});

test('every tab shares one stack entry', () => {
  expect(stackKey('/')).toBe('tabs');
  expect(stackKey('/profile')).toBe('tabs');
  expect(stackKey('/profile/household')).toBe('/profile/household');
});

test('edge-swipe back completes past 35% of the width or on a fling, and springs back otherwise', () => {
  expect(swipeBackCompletes(140, 390, 0)).toBe(true); // 36%
  expect(swipeBackCompletes(120, 390, 200)).toBe(false); // 31%, slow
  expect(swipeBackCompletes(40, 390, 800)).toBe(true); // a quick flick
  expect(swipeBackCompletes(0, 390, 900)).toBe(false); // no movement
  expect(swipeBackCompletes(-30, 390, -900)).toBe(false); // leftward never pops
});
