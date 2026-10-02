import { ArrowLeft } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { supabase } from '../../lib/supabase';
import { Button } from '../../ui/Button';
import { isRateLimited } from './errors';
import { savePending } from './pending';
import './auth.css';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const toE164 = (raw: string) => {
  const digits = raw.replace(/\D/g, '');
  if (raw.trim().startsWith('+')) return `+${digits}`;
  return `+977${digits.replace(/^0+/, '')}`; // default to Nepal
};

export default function ContactEntry() {
  const { method = 'email' } = useParams();
  const isPhone = method === 'phone';
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const contact = isPhone ? toE164(value) : value.trim().toLowerCase();
    if (isPhone ? !/^\+\d{8,15}$/.test(contact) : !EMAIL.test(contact)) {
      setError(isPhone ? 'Check that phone number.' : 'Check that email address.');
      return;
    }
    setBusy(true);
    let err;
    try {
      ({ error: err } = isPhone
        ? await supabase.auth.signInWithOtp({ phone: contact })
        : await supabase.auth.signInWithOtp({ email: contact, options: { shouldCreateUser: true } }));
    } catch (thrown) {
      err = thrown;
    } finally {
      setBusy(false);
    }
    if (err) { setError(isRateLimited(err) ? 'Too many codes requested. Try again in a minute.' : "We couldn't send a code. Try again."); return; }
    savePending({ method: isPhone ? 'phone' : 'email', contact });
    navigate('/verify');
  };

  return (
    <main className="screen auth">
      <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft size={20} /></button>
      <form className="auth__form" onSubmit={submit} noValidate>
        <h1>{isPhone ? "What's your number?" : "What's your email?"}</h1>
        <p className="muted">We'll send a 6-digit code to sign you in.</p>
        <label className="field">
          <span className="field__label">{isPhone ? 'Phone number' : 'Email'}</span>
          <span className="field__control">
            {isPhone && <span className="field__prefix">+977</span>}
            <input
              autoFocus value={value} onChange={(e) => { setValue(e.target.value); setError(null); }}
              type={isPhone ? 'tel' : 'email'} inputMode={isPhone ? 'tel' : 'email'}
              autoComplete={isPhone ? 'tel-national' : 'email'} placeholder={isPhone ? '98XXXXXXXX' : 'you@example.com'}
              aria-invalid={Boolean(error)} aria-describedby={error ? 'contact-error' : undefined}
            />
          </span>
        </label>
        {error && <p id="contact-error" className="field__error" role="alert">{error}</p>}
        <Button block type="submit" loading={busy}>Send code</Button>
      </form>
    </main>
  );
}
