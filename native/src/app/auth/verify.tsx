import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { F } from '@/constants/theme';
import { useDraft } from '@/lib/draft';
import { Art } from '@/ui/art';
import { supabase } from '@/lib/supabase';
import { Button, C, CodeInput, ErrorText, Screen, StepHeader, Sub, Title } from '@/ui/kit';

const rateLimited = (e: { status?: number; message?: string }) => e.status === 429 || /rate limit/i.test(e.message ?? '');

export default function VerifyCode() {
  const { email } = useDraft();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(30);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  if (!email) return <Redirect href="/auth" />;

  const verify = async (token: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
      if (err) {
        setError(rateLimited(err) ? 'Too many tries. Wait a minute, then try again.'
          : (err.status && err.status < 500) || /expired|invalid|token/i.test(err.message) ? "That code didn't work. Check it, or send a new one."
          : 'Something went wrong. Check your connection and try again.');
        setCode('');
      }
      // on success the auth listener updates the session and the root gate moves us on
    } catch {
      setError('Something went wrong. Check your connection and try again.');
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      const { error: err } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      if (err) return setError(rateLimited(err) ? "Couldn't send a new code. Try again in a minute." : "We couldn't send a new code. Try again.");
      setWait(30);
      setError(null);
    } catch {
      setError("We couldn't send a new code. Check your connection and try again.");
    }
  };

  return (
    <Screen footer={<Button variant="ghost" title={wait > 0 ? `Send a new code in ${wait}s` : 'Send a new code'} onPress={resend} disabled={wait > 0 || busy} />}>
      <StepHeader />
      <View style={{ marginBottom: 12 }}><Art name="chat" width={190} /></View>
      <Title>Enter your code</Title>
      <Sub>Sent to <Text style={{ fontFamily: F.bold, color: C.text }}>{email}</Text></Sub>
      <View style={{ marginTop: 32 }}>
        <CodeInput autoFocus value={code} onChange={(v) => {
          const digits = v.replace(/\D/g, '');
          setCode(digits); setError(null);
          if (digits.length === 6) verify(digits);
        }} />
      </View>
      {busy && <ActivityIndicator style={{ marginTop: 20 }} color={C.text} />}
      <ErrorText>{error}</ErrorText>
    </Screen>
  );
}
