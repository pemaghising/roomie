import { AnimatePresence, m, useDragControls } from 'motion/react';
import { type ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { EASE_IOS, SPRING } from '../lib/motion';

const SCRIM = 'rgba(17, 24, 39, 0.45)';

/** Dragging the header closes the sheet past 120px, or on a downward fling. */
export const sheetDismisses = (offset: number, velocity: number) => offset > 120 || velocity > 500;

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useDragControls();
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; previous?.focus(); };
  }, [open, onClose]);
  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div key="sheet" className="sheet-backdrop" onClick={onClose}
          // the scrim fades by colour, not opacity, so the sheet itself stays solid while it rises
          initial={{ backgroundColor: 'rgba(17, 24, 39, 0)' }} animate={{ backgroundColor: SCRIM, transition: { duration: 0.3, ease: EASE_IOS } }}
          exit={{ backgroundColor: 'rgba(17, 24, 39, 0)', transition: { duration: 0.22, ease: EASE_IOS } }}>
          <m.div className="sheet" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref} onClick={(e) => e.stopPropagation()}
            initial={{ y: '100%' }}
            animate={{ y: 0, transition: SPRING.smooth }}
            exit={{ y: '100%', transition: SPRING.snappy }}
            drag="y" dragControls={drag} dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 1 }}
            dragTransition={{ bounceStiffness: SPRING.smooth.stiffness, bounceDamping: SPRING.smooth.damping }}
            onDragEnd={(_, info) => { if (sheetDismisses(info.offset.y, info.velocity.y)) onClose(); }}>
            <div className="sheet__grab" onPointerDown={(e) => drag.start(e)}>
              <div className="sheet__handle" aria-hidden />
              <h2 className="sheet__title">{title}</h2>
            </div>
            {children}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
