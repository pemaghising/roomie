import { AnimatePresence, m } from 'motion/react';
import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';
import { SPRING } from '../lib/motion';

interface ToastAction { label: string; onClick: () => void }
interface ToastItem { id: number; message: string; action?: ToastAction }
type Show = (message: string, opts?: { action?: ToastAction; duration?: number }) => void;

const ToastContext = createContext<{ show: Show }>({ show: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = (id: number) => setItems((xs) => xs.filter((x) => x.id !== id));
  const show = useCallback<Show>((message, opts = {}) => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs.slice(-2), { id, message, action: opts.action }]);
    setTimeout(() => dismiss(id), opts.duration ?? 4000);
  }, []);
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <m.div key={t.id} className="toast" layout
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={SPRING.smooth}>
              <span>{t.message}</span>
              {t.action && (
                <button className="toast__action" onClick={() => { t.action!.onClick(); dismiss(t.id); }}>{t.action.label}</button>
              )}
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
