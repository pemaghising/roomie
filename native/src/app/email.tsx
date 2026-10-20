// R10 · Email: a code goes to the new address; entering it makes the change.
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useAuth } from '@/lib/auth';
import { otpMessage } from '@/lib/otp';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/ui/toast';
import { color } from '@/ui/tokens';
import { Button, CodeInput, Heading, Page, TextField, Txt } from '@/ui/v2';

const valid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export default function Email() {
  const router = useRouter();
  const toast = useToast();
  const { session } = useAuth();
  const [email, setEmail] = useState(session?.user.email ?? '');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clean = email.trim().toLowerCase();
  const same = clean === session?.user.email;

  const send = async () => {
    if (busy || !valid(clean) || same) return;
    setBusy(true);
    const { error: e } = await supabase.auth.updateUser({ email: clean });
    setBusy(false);
    if (e) return setError(otpMessage(e));
    setSent(true);
  };
  const verify = async (token = code) => {
    if (busy || token.length !== 6) return;
    setBusy(true);
    const { data, error: e } = await supabase.auth.verifyOtp({ email: clean, token, type: 'email_change' });
    setBusy(false);
    if (e) return setError(otpMessage(e));
    // with double confirm on, the change also waits for the current address to say yes
    if (data.user?.email?.toLowerCase() !== clean) toast.show('Nearly there. Confirm from your current email too, then it switches.', { duration: 6000 });
    else toast.show('Email updated.', { tick: true });
    router.back();
  };

  if (sent) return (
    <Page back={() => { setSent(false); setCode(''); setError(null); }}
      footer={<Button title="Confirm" onPress={() => verify()} loading={busy} disabled={code.length !== 6} />}>
      <Heading title="Check your email" size="page" sub={`We sent a 6-digit code to ${clean}.`} />
      <View style={{ gap: 12 }}>
        <CodeInput autoFocus value={code} error={!!error} accessibilityLabel="Six-digit code"
          onChange={(v) => { setCode(v); setError(null); if (v.length === 6) verify(v); }} />
        {error && <Txt v="Meta" c={color.text.danger}>{error}</Txt>}
      </View>
    </Page>
  );

  return (
    <Page back footer={<Button title="Send code" onPress={send} loading={busy} disabled={!valid(clean) || same} />}>
      <Heading title="Email" size="page" sub="We’ll send a code to confirm a new one." />
      <View style={{ gap: 10 }}>
        <Txt v="Body/Label">Email</Txt>
        <TextField value={email} onChangeText={(t) => { setEmail(t); setError(null); }} keyboardType="email-address" autoCapitalize="none" autoComplete="email"
          textContentType="emailAddress" accessibilityLabel="Email" error={!!error} onSubmitEditing={send} />
        {error && <Txt v="Meta" c={color.text.danger}>{error}</Txt>}
      </View>
    </Page>
  );
}
