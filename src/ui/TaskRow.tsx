import { type ReactNode, useRef, useState } from 'react';
import { EffortChip } from './EffortChip';
import type { Assignment, Chore } from '../lib/types';

interface Props { chore: Chore; assignment: Assignment; onComplete?: () => void; onOpen?: () => void; action?: ReactNode; note?: string }

export function TaskRow({ chore, assignment, onComplete, onOpen, action, note }: Props) {
  const done = assignment.status === 'done';
  const canSwipe = Boolean(onComplete) && !done;
  const [dx, setDx] = useState(0);
  const start = useRef<number | null>(null);
  const moved = useRef(false);
  const reset = () => { setDx(0); start.current = null; };

  return (
    <div className={`task${done ? ' is-done' : ''}`}>
      {canSwipe && <div className="task__swipe" aria-hidden style={{ opacity: Math.min(1, dx / 80) }}>Done ✓</div>}
      <div
        className="task__card"
        style={{ transform: dx ? `translateX(${dx}px)` : undefined }}
        onPointerDown={canSwipe ? (e) => { start.current = e.clientX; moved.current = false; } : undefined}
        onPointerMove={canSwipe ? (e) => {
          if (start.current === null) return;
          const d = Math.max(0, Math.min(120, e.clientX - start.current));
          if (d > 6) moved.current = true;
          setDx(d);
        } : undefined}
        onPointerUp={canSwipe ? () => { if (dx > 80) onComplete!(); reset(); } : undefined}
        onPointerCancel={reset}
        onPointerLeave={() => { if (start.current !== null) reset(); }}
      >
        <span className="task__icon" aria-hidden>{chore.icon}</span>
        <button className="task__body" onClick={() => { if (!moved.current) onOpen?.(); }} disabled={!onOpen} aria-label={onOpen ? `${chore.name}: why this is yours` : undefined}>
          <span className="task__name">{chore.name}</span>
          <span className="task__meta"><EffortChip effort={assignment.effort} />{note && <span className="muted">{note}</span>}</span>
        </button>
        {action ?? (onComplete && (
          <button
            className={`check${done ? ' is-checked' : ''}`}
            aria-label={done ? `${chore.name} done` : `Mark ${chore.name} done`}
            aria-pressed={done}
            onClick={done ? undefined : onComplete}
          />
        ))}
      </div>
    </div>
  );
}
