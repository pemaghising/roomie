/** Same rule as SQL `normalize_code`: keep letters/digits, uppercase, last 6 (so pasted links work). */
export function normalizeCode(input: string): string {
  const s = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return s.length > 6 ? s.slice(-6) : s;
}
