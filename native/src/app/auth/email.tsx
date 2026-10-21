// 02 · Create account (name + email) and 04 · Log in with email.
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { otpMessage } from '@/lib/otp';
import { updateDraft, useDraft } from '@/lib/draft';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/ui/toast';
import { color } from '@/ui/tokens';
import { AppleMark, Button, GoogleMark, Heading, Page, Tap, TextField, Txt } from '@/ui/v2';
import { Legal } from './index';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function Label({ children }: { children: string }) {
  return <Txt v="Body/Label" style={{ marginBottom: 8 }}>{children}</Txt>;
}

export default function EmailEntry() {
  const { mode } = useLocalSearchParams<{ mode?: 'create' | 'login' }>();
  const creating = mode !== 'login';
  const router = useRouter();
  const toast = useToast();
  const draft = useDraft();
  const [name, setName] = useState(draft.name);
  const [email, setEmail] = useState(draft.email);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const soon = () => toast.show('Coming soon. Use your email for now.');

  const submit = async () => {
    const contact = email.trim().toLowerCase();
    if (creating && !name.trim()) return setError('Tell us what to call you.');
    if (!EMAIL.test(contact)) return setError('That email doesn’t look right.');
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.signInWithOtp({ email: contact, options: { shouldCreateUser: true } });
      if (err) return setError(otpMessage(err));
      updateDraft({ name: creating ? name.trim() : draft.name, email: contact, welcomeBack: !creating });
      router.push('/auth/verify');
    } catch (e) {
      setError(otpMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (!creating) {
    return (
      <Page back footer={<View style={{ gap: 20 }}><Button title="Send me a code" onPress={submit} loading={busy} /><Legal /></View>}>
        <Heading title="What’s your email?" sub="We’ll pop a code in your inbox." />
        <View>
          <TextField icon={Mail} value={email} onChangeText={(t) => { setEmail(t); setError(null); }} placeholder="you@example.com"
            keyboardType="email-address" autoComplete="email" textContentType="emailAddress" autoCapitalize="none" autoCorrect={false}
            returnKeyType="send" onSubmitEditing={submit} error={!!error} accessibilityLabel="Your email" />
          {error && <Txt v="Meta" c={color.text.danger} style={{ marginTop: 8 }} accessibilityRole="alert">{error}</Txt>}
        </View>
      </Page>
    );
  }

  return (
    <Page back gap={20}>
      <Heading title="Let’s get you settled" sub="Name, email, done. No passwords to forget." />
      <View>
        <Label>What should we call you?</Label>
        <TextField value={name} onChangeText={(t) => { setName(t); setError(null); }} placeholder="Your name" autoCapitalize="words"
          autoComplete="name" textContentType="name" maxLength={30} returnKeyType="next" accessibilityLabel="What should we call you?" />
        <Txt v="Meta" c={color.text.secondary} style={{ marginTop: 8 }}>Your roommates will see this. Make it you.</Txt>
      </View>
      <View>
        <Label>Your email</Label>
        <TextField value={email} onChangeText={(t) => { setEmail(t); setError(null); }} placeholder="you@example.com"
          keyboardType="email-address" autoComplete="email" textContentType="emailAddress" autoCapitalize="none" autoCorrect={false}
          returnKeyType="send" onSubmitEditing={submit} error={!!error} accessibilityLabel="Your email" />
        {error && <Txt v="Meta" c={color.text.danger} style={{ marginTop: 8 }} accessibilityRole="alert">{error}</Txt>}
      </View>
      <Button title="Send my code" onPress={submit} loading={busy} />
      <View style={styles.or}><View style={styles.rule} /><Txt v="Meta" c={color.text.secondary}>Or</Txt><View style={styles.rule} /></View>
      <View style={{ gap: 12 }}>
        <Tap onPress={soon} accessibilityLabel="Continue with Google">
          <View style={[styles.provider, styles.light]}><GoogleMark /><Txt v="Body/Button">Continue with Google</Txt></View>
        </Tap>
        <Tap onPress={soon} accessibilityLabel="Continue with Apple">
          <View style={[styles.provider, { backgroundColor: '#16131F' }]}><AppleMark /><Txt v="Body/Button" c={color.text.onAccent}>Continue with Apple</Txt></View>
        </Tap>
      </View>
      <View style={{ gap: 14 }}>
        <Txt v="Body/Default" c={color.text.secondary} style={{ textAlign: 'center' }}>
          {'Been here before? '}<Txt v="Body/Label" c={color.text.link} onPress={() => router.setParams({ mode: 'login' })}>Log in</Txt>
        </Txt>
        <Legal />
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  or: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rule: { flex: 1, height: 1, backgroundColor: 'rgba(31,27,58,0.1)' },
  provider: { height: 56, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  light: { backgroundColor: color.bg.surface, borderWidth: 1, borderColor: '#ECEAF3' },
});
