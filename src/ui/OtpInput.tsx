import { normalizeCode } from '../lib/code';

interface Props {
  label: string; value: string; onChange: (v: string) => void; onComplete?: (v: string) => void;
  alphanumeric?: boolean; autoFocus?: boolean;
}

export function OtpInput({ label, value, onChange, onComplete, alphanumeric = false, autoFocus = true }: Props) {
  const clean = (v: string) => (alphanumeric ? normalizeCode(v) : v.replace(/\D/g, '').slice(0, 6));
  return (
    <div className="otp">
      <input
        className="otp__input" aria-label={label} value={value} autoFocus={autoFocus}
        inputMode={alphanumeric ? 'text' : 'numeric'} autoComplete={alphanumeric ? 'off' : 'one-time-code'}
        autoCapitalize="characters" spellCheck={false}
        onChange={(e) => {
          const v = clean(e.target.value);
          onChange(v);
          if (v.length === 6) onComplete?.(v);
        }}
      />
      <div className="otp__boxes" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className={`otp__box${i === value.length ? ' is-current' : ''}`}>{value[i] ?? ''}</span>
        ))}
      </div>
    </div>
  );
}
