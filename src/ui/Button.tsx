import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; block?: boolean; loading?: boolean };

export function Button({ variant = 'primary', block, loading, className = '', children, disabled, ...rest }: Props) {
  return (
    <button {...rest} className={`btn btn--${variant}${block ? ' btn--block' : ''} ${className}`} disabled={disabled || loading} aria-busy={loading || undefined}>
      {loading && <span className="spinner" aria-hidden />}
      <span>{children}</span>
    </button>
  );
}
