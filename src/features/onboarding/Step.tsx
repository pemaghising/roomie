import { ChevronLeft } from 'lucide-react';
import { m } from 'motion/react';
import { type ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { EASE_OUT, SPRING } from '../../lib/motion';
import { Progress } from '../../ui/Progress';
import './onboarding.css';

// each step is its own route, so the last one seen lives here to tell forward from back
let last: { step: number; total: number } | null = null;

export function Step({ title, subtitle, step, total, children, footer, back = true, bodyClass = '' }: {
  title: string; subtitle?: ReactNode; step?: number; total?: number; children: ReactNode; footer?: ReactNode; back?: boolean; bodyClass?: string;
}) {
  const navigate = useNavigate();
  const [from] = useState(() => (last && step && last.total === total && last.step !== step ? last.step : undefined));
  useEffect(() => { if (step && total) last = { step, total }; }, [step, total]);
  // first step seen this session just appears; after that, forward enters from the right, back from the left
  const slide = from === undefined ? { initial: false as const } : {
    initial: { opacity: 0, x: step! > from ? 24 : -24 },
    animate: { opacity: 1, x: 0 },
    transition: { x: SPRING.smooth, opacity: { duration: 0.2, ease: EASE_OUT } },
  };
  return (
    <main className="screen step">
      {step && total && <Progress step={step} total={total} from={from} />}
      {back && <button className="icon-btn step__back" onClick={() => navigate(-1)} aria-label="Back"><ChevronLeft size={20} aria-hidden /></button>}
      <m.h1 className="step__title" {...slide}>{title}</m.h1>
      {subtitle && <m.p className="muted step__subtitle" {...slide}>{subtitle}</m.p>}
      <m.div className={`step__body ${bodyClass}`} {...slide}>{children}</m.div>
      {footer && <m.div className="step__footer" {...slide}>{footer}</m.div>}
    </main>
  );
}
