import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { Button } from '../../ui/Button';
import { OtpInput } from '../../ui/OtpInput';
import { clearPending, loadPending } from './pending';
import './auth.css';

export default function VerifyCode() {
  const pending = loadPending();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(30);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  if (!pending) return <Navigate to="/welcome" replace />;

  const verify = async (token: string) => {
    setBusy(true);
    const { error: err } = pending.method === 'phone'
      ? await supabase.auth.verifyOtp({ phone: pending.contact, token, type: 'sms' })
      : await supabase.auth.verifyOtp({ email: pending.contact, token, type: 'email' });
    setBusy(false);
    if (err) { setError("That code didn't work. Check it, or send a new one."); setCode(''); return; }
    clearPending(); // the auth listener updates the session; the route guard moves us on
  };

  const resend = async () => {
    setWait(30);
    if (pending.method === 'phone') await supabase.auth.signInWithOtp({ phone: pending.contact });
    else await supabase.auth.signInWithOtp({ email: pending.contact, options: { shouldCreateUser: true } });
  };

  return (
    <main className="screen auth">
      <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft size={20} /></button>
      <div className="auth__form">
        <h1>Enter your code</h1>
        <p className="muted">Sent to <strong>{pending.contact}</strong></p>
        <OtpInput label="6-digit code" value={code} onChange={(v) => { setCode(v); setError(null); }} onComplete={verify} />
        {error && <p className="field__error" role="alert">{error}</p>}
        <Button variant="ghost" onClick={resend} disabled={wait > 0 || busy}>
          {wait > 0 ? `Send a new code in ${wait}s` : 'Send a new code'}
        </Button>
      </div>
    </main>
  );
}
