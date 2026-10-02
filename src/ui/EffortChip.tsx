import { effortLabel } from '@domain/copy.ts';

export function EffortChip({ effort, size = 'sm' }: { effort: number; size?: 'sm' | 'md' }) {
  const label = effortLabel(effort);
  return <span className={`chip chip--${label.toLowerCase()} chip--${size}`}>{label}</span>;
}
