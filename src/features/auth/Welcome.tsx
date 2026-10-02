import { Link } from 'react-router';
import { supabase } from '../../lib/supabase';
import { Button } from '../../ui/Button';
import { Sprout } from '../../ui/Sprout';
import { useToast } from '../../ui/Toast';
import './auth.css';

export default function Welcome() {
  const toast = useToast();
  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (error) toast.show("Google sign-in didn't start. Try email instead.");
  };
  return (
    <main className="screen auth">
      <div className="auth__hero">
        <div className="auth__mark"><Sprout size={72} /></div>
        <h1>Fair isn't equal.</h1>
        <p className="muted auth__lede">Roomie plans the chores, keeps heavy ones off your busy days, and does the reminding — so nobody has to.</p>
      </div>
      <div className="auth__actions">
        <Button block onClick={google}>Continue with Google</Button>
        <Link className="btn btn--secondary btn--block" to="/signin/email">Continue with email</Link>
        {import.meta.env.VITE_PHONE_AUTH === 'on' && (
          <Link className="btn btn--ghost btn--block" to="/signin/phone">Continue with phone</Link>
        )}
        <p className="auth__fine muted">No passwords. We'll send you a 6-digit code.</p>
      </div>
    </main>
  );
}
