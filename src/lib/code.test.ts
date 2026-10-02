import { expect, test } from 'vitest';
import { normalizeCode } from './code';

test.each([
  ['abc123', 'ABC123'],
  ['abc 123', 'ABC123'],
  ['ABC-123', 'ABC123'],
  ['https://roomie.example/j/ABC123', 'ABC123'],
  ['  a b c', 'ABC'],
])('%s → %s', (input, out) => expect(normalizeCode(input)).toBe(out));
