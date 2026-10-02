import { expect, test } from 'vitest';
import { safeTarget } from './safeUrl';

const o = 'https://roomie.app';
test('other-origin absolute URL falls back to root', () => expect(safeTarget('https://evil.example/x', o)).toBe('https://roomie.app/'));
test('protocol-relative other origin falls back to root', () => expect(safeTarget('//evil.example/x', o)).toBe('https://roomie.app/'));
test('relative path is kept', () => expect(safeTarget('/chores', o)).toBe('https://roomie.app/chores'));
test('missing or garbage falls back to root', () => {
  expect(safeTarget(undefined, o)).toBe('https://roomie.app/');
  expect(safeTarget('http://[bad', o)).toBe('https://roomie.app/');
});
