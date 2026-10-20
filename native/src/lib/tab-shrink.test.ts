import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getShrunk, noteScroll, resetShrink } from './tab-shrink';

beforeEach(() => { vi.useFakeTimers(); resetShrink(); });
afterEach(() => { vi.useRealTimers(); });

test('scrolling shrinks the bar, and it expands again once scrolling stops', () => {
  noteScroll(0);
  noteScroll(40);
  expect(getShrunk()).toBe(true);
  vi.advanceTimersByTime(700);
  expect(getShrunk()).toBe(false);
});

test('keeps shrinking while the scrolling goes on, in either direction', () => {
  noteScroll(0);
  noteScroll(60);
  vi.advanceTimersByTime(300);
  noteScroll(20); // scrolling back up
  vi.advanceTimersByTime(300);
  expect(getShrunk()).toBe(true);
});

test('being at the top expands it straight away', () => {
  noteScroll(0);
  noteScroll(50);
  expect(getShrunk()).toBe(true);
  noteScroll(0);
  expect(getShrunk()).toBe(false);
});

test('a one-pixel wobble is not scrolling', () => {
  noteScroll(0);
  noteScroll(1);
  expect(getShrunk()).toBe(false);
  noteScroll(3); // a real movement still counts
  expect(getShrunk()).toBe(true);
});
