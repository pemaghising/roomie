import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Progress } from '../../ui/Progress';
import './onboarding.css';

export function Step({ title, subtitle, step, total, children, footer, back = true }: {
  title: string; subtitle?: string; step?: number; total?: number; children: ReactNode; footer?: ReactNode; back?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <main className="screen step">
      {step && total && <Progress step={step} total={total} />}
      {back && <button className="icon-btn step__back" onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft size={20} /></button>}
      <h1 className="step__title">{title}</h1>
      {subtitle && <p className="muted step__subtitle">{subtitle}</p>}
      <div className="step__body">{children}</div>
      {footer && <div className="step__footer">{footer}</div>}
    </main>
  );
}
