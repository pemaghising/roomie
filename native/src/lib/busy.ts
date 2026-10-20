const SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "Tue, Thu and Fri": busy days in week order, Sunday first. */
export function busyLabel(days: number[]): string {
  const n = [...days].sort((a, b) => a - b).map((d) => SHORT[d]);
  return n.length <= 1 ? (n[0] ?? '') : `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}`;
}
