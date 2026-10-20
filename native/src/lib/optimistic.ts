/** Runs an optimistic change on a deep copy, so a failed write can restore exactly what was cached. */
export function applyOptimistic<S>(state: S, change: (draft: S) => S): { next: S; snapshot: S } {
  const snapshot = structuredClone(state);
  return { next: change(structuredClone(state)), snapshot };
}

export const rollback = <S>(snapshot: S): S => snapshot;
