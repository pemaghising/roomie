import { Check } from 'lucide-react';
import { m } from 'motion/react';
import { type CSSProperties, type ReactNode, useRef } from 'react';
import { EffortChip } from './EffortChip';
import { SPRING } from '../lib/motion';
import type { Assignment, Chore } from '../lib/types';

interface Props { chore: Chore; assignment: Assignment; onComplete?: () => void; onOpen?: () => void; action?: ReactNode; note?: string; enter?: number }

/** A swipe completes past 40% of the row, or on a rightward fling. */
export const swipeCompletes = (offset: number, width: number, velocity: number) => offset > width * 0.4 || velocity > 500;

export function TaskRow({ chore, assignment, onComplete, onOpen, action, note, enter }: Props) {
  const done = assignment.status === 'done';
  const canSwipe = Boolean(onComplete) && !done;
  const moved = useRef(false);
  const track = useRef<HTMLDivElement>(null);

  return (
    // layoutId (scoped by the page's LayoutGroup) lets a row glide when claiming or completing moves it between sections
    <m.div layoutId={assignment.id} layout="position" transition={{ layout: SPRING.smooth }}
      className={`task${done ? ' is-done' : ''}${enter !== undefined ? ' stagger' : ''}`}
      style={enter !== undefined ? ({ '--i': enter } as CSSProperties) : undefined}>
      {canSwipe && (
        <div className="task__swipe" aria-hidden ref={track}>
          <span className="task__swipe-tick"><Check size={18} /></span>Done
        </div>
      )}
      <m.div
        className="task__card"
        // the mint track fades in and its tick grows as the card is pulled (also while it springs back)
        onUpdate={(v) => track.current?.style.setProperty('--pull', String(Math.min(1, Math.max(0, Number.parseFloat(String(v.x ?? 0)) / 72))))}
        drag={canSwipe ? 'x' : false}
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0, right: 0.9 }}
        dragTransition={{ bounceStiffness: SPRING.snappy.stiffness, bounceDamping: SPRING.snappy.damping }}
        onPointerDown={() => { moved.current = false; }}
        onDragStart={() => { moved.current = true; }}
        onDragEnd={(e, info) => {
          const width = (e.target as HTMLElement | null)?.closest('.task')?.clientWidth ?? 320;
          if (swipeCompletes(info.offset.x, width, info.velocity.x)) onComplete?.();
        }}
      >
        <span className="task__icon" aria-hidden>{chore.icon}</span>
        <button className="task__body" data-press-target=".task__card" onClick={() => { if (!moved.current) onOpen?.(); }} disabled={!onOpen} aria-label={onOpen ? `${chore.name}: why this is yours` : undefined}>
          <span className="task__name">{chore.name}</span>
          <span className="task__meta"><EffortChip effort={assignment.effort} />{note && <span className="muted">{note}</span>}</span>
        </button>
        {action ?? (onComplete && (
          <m.button
            className={`check${done ? ' is-checked' : ''}`}
            aria-label={done ? `${chore.name} done` : `Mark ${chore.name} done`}
            aria-pressed={done}
            onClick={done ? undefined : onComplete}
            initial={false}
            animate={done ? { scale: [0.85, 1] } : { scale: 1 }}
            transition={SPRING.snappy}
          >
            <svg viewBox="0 0 24 24" aria-hidden><path d="M6 12.5l4 4 8-9" /></svg>
          </m.button>
        ))}
      </m.div>
    </m.div>
  );
}
