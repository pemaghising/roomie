import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { F } from '@/constants/theme';
import { updateDraft, useDraft } from '@/lib/draft';
import { supabase } from '@/lib/supabase';
import { Button, C, ErrorText, Field, Screen, StepHeader, Sub, Title } from '@/ui/kit';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const rateLimited = (e: { status?: number; message?: string }) => e.status === 429 || /rate limit/i.test(e.message ?? '');

export default function EmailEntry() {
  const { mode } = useLocalSearchParams<{ mode?: 'create' | 'login' }>();
  const creating = mode !== 'login';
  const router = useRouter();
  const draft = useDraft();
  const [name, setName] = useState(draft.name);
  const [email, setEmail] = useState(draft.email);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const contact = email.trim().toLowerCase();
    if (creating && !name.trim()) return setError('Tell us your name.');
    if (!EMAIL.test(contact)) return setError('Check that email address.');
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.signInWithOtp({ email: contact, options: { shouldCreateUser: true } });
      if (err) return setError(rateLimited(err) ? 'Too many codes requested. Try again in a minute.' : "We couldn't send a code. Try again.");
      updateDraft({ name: name.trim(), email: contact });
      router.push('/auth/verify');
    } catch {
      setError("We couldn't send a code. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen footer={
      <View style={{ gap: 6 }}>
        <Button title={creating ? 'Sign Up' : 'Send code'} onPress={submit} loading={busy} />
        <Text style={{ textAlign: 'center', fontFamily: F.regular, color: C.sub, fontSize: 15, paddingVertical: 8 }}>
          {creating ? 'Already have an account? ' : 'New to Roomie? '}
          <Text style={{ fontFamily: F.bold, color: C.text }} onPress={() => router.setParams({ mode: creating ? 'login' : 'create' })}>
            {creating ? 'Log In' : 'Create Account'}
          </Text>
        </Text>
      </View>
    }>
      <StepHeader step={creating ? 1 : undefined} total={6} />
      <Title>{creating ? "Let's get started." : 'Welcome back.'}</Title>
      <Sub>{creating ? "Create an account to join or build your serene household. We'll email you a 6-digit code — no password to remember." : "We'll email you a 6-digit code to sign in."}</Sub>
      <View style={{ gap: 12, marginTop: 28 }}>
        {creating && (
          <Field placeholder="Full Name" value={name} onChangeText={(t) => { setName(t); setError(null); }}
            autoComplete="name" textContentType="name" autoCapitalize="words" returnKeyType="next" />
        )}
        <Field placeholder="Email Address" value={email} onChangeText={(t) => { setEmail(t); setError(null); }}
          keyboardType="email-address" autoComplete="email" textContentType="emailAddress" autoCapitalize="none"
          autoCorrect={false} returnKeyType="send" onSubmitEditing={submit} autoFocus={!creating} />
      </View>
      <ErrorText>{error}</ErrorText>
    </Screen>
  );
}
