import { expect, test } from 'vitest';
import { greeting } from './greeting';

test("greets by the household's local hour", () => {
  expect(greeting(5)).toBe('Morning');
  expect(greeting(11)).toBe('Morning');
  expect(greeting(12)).toBe('Afternoon');
  expect(greeting(16)).toBe('Afternoon');
  expect(greeting(17)).toBe('Evening');
  expect(greeting(23)).toBe('Evening');
  expect(greeting(2)).toBe('Evening');
});
