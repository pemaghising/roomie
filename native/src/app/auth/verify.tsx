// 05 · Enter code / 05b · Wrong code.
import { useQueryClient } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { haptic } from '@/ui/haptics';
import { otpMessage, resendCooldown } from '@/lib/otp';
import { updateDraft, useDraft } from '@/lib/draft';
import { rpc, STATE_KEY } from '@/lib/state';
import { supabase } from '@/lib/supabase';
import { color } from '@/ui/tokens';
import { Button, CodeInput, Glass, Heading, Page, Txt } from '@/ui/v2';

export default function VerifyCode() {
  const router = useRouter();
  const qc = useQueryClient();
  const { email, name, welcomeBack } = useDraft();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const sentAt = useRef(Date.now());
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const wait = resendCooldown(sentAt.current, now);

  if (!email) return <Redirect href="/auth" />;

  const verify = async (token = code) => {
    if (busy || token.length !== 6) return;
    setBusy(true);
    try {
      const { data, error: err } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
      if (err) { haptic.warn(); setError(otpMessage(err)); return; }
      // a new account brings its name from frame 02, so it never sees a separate name step
      if (name && data.user) await rpc('update_profile', { p_name: name }).catch(() => {});
      if (welcomeBack) router.replace('/auth/welcome-back');
      await qc.invalidateQueries({ queryKey: STATE_KEY }); // the root gate moves on from here
    } catch (e) {
      setError(otpMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (wait > 0) return;
    const { error: err } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } }).catch((e) => ({ error: e }));
    if (err) return setError(otpMessage(err));
    sentAt.current = Date.now(); setNow(Date.now()); setError(null); setCode('');
  };

  const m = Math.floor(wait / 60), s = String(wait % 60).padStart(2, '0');
  return (
    <Page back footer={<Button title={error ? 'Give it another go' : 'Let me in'} onPress={() => (error ? (setError(null), setCode('')) : verify())} loading={busy} disabled={!error && code.length !== 6} />}>
      <View style={{ gap: 14 }}>
        <Heading title="You’ve got mail" sub="Peek at your inbox for your code." />
        <Glass r={999} fill={0.8} style={{ alignSelf: 'flex-start' }}>
          <View style={styles.chip}><Mail size={18} color={color.icon.default} strokeWidth={1.75} /><Txt v="Body/Label">{email}</Txt></View>
        </Glass>
      </View>
      <View style={{ gap: 16 }}>
        <CodeInput autoFocus value={code} error={!!error} accessibilityLabel="Six-digit code"
          onChange={(v) => { setCode(v); setError(null); if (v.length === 6) verify(v); }} />
        <View style={styles.row}>
          {error
            ? <Txt v="Body/Label" c={color.text.danger} accessibilityRole="alert">{error}</Txt>
            : <Txt v="Body/Default" c={color.text.secondary}>{wait > 0 ? `New code in ${m}:${s}` : 'Didn’t get it?'}</Txt>}
          {error || wait === 0
            ? <Txt v="Body/Label" c={color.text.link} onPress={resend} accessibilityRole="button">Send a new one</Txt>
            : <Txt v="Body/Label" c={color.text.link} onPress={() => { updateDraft({ email: '' }); router.back(); }} accessibilityRole="button">Wrong inbox?</Txt>}
        </View>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
