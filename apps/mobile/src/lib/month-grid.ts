/** A month as weeks of seven cells, Sunday first (C2). Blank cells are null; dates are YYYY-MM-DD. */
export function monthGrid(year: number, month1to12: number): (string | null)[][] {
  const first = new Date(Date.UTC(year, month1to12 - 1, 1));
  const days = new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
  const cells: (string | null)[] = Array.from({ length: first.getUTCDay() }, () => null);
  for (let d = 1; d <= days; d++) cells.push(`${year}-${String(month1to12).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}
