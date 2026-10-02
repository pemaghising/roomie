export function Progress({ step, total }: { step: number; total: number }) {
  return (
    <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step} aria-label={`Step ${step} of ${total}`}>
      <span style={{ width: `${(step / total) * 100}%` }} />
    </div>
  );
}
