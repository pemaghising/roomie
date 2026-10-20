import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { normalizeCode, updateDraft, useDraft } from '@/lib/draft';
import { Art } from '@/ui/art';
import { Button, C, CodeInput, ErrorText, Field, Screen, StepHeader, Sub, Title } from '@/ui/kit';

export default function HomeName() {
  const router = useRouter();
  const draft = useDraft();
  const [name, setName] = useState(draft.homeName);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const next = () => {
    if (!name.trim()) return setError('Give your home a name.');
    updateDraft({ mode: 'create', homeName: name.trim() });
    router.push('/onboarding/chores');
  };

  return (
    <Screen>
      <StepHeader step={3} total={6} />
      <View style={{ marginBottom: 12 }}><Art name="nightHouse" width={170} /></View>
      <Title>Name your home</Title>
      <Sub>Establish a brand new space for your housemates.</Sub>
      <View style={{ gap: 16, marginTop: 24 }}>
        <Field placeholder="e.g. Haven Cottage or Apt 4B" value={name} maxLength={40} autoCapitalize="words"
          onChangeText={(t) => { setName(t); setError(null); }} returnKeyType="next" onSubmitEditing={next} />
        <Button title="Continue" onPress={next} />
      </View>
      <ErrorText>{error}</ErrorText>

      <View style={{ height: 1, backgroundColor: C.line, marginVertical: 28 }} />
      <Title style={{ fontSize: 24, lineHeight: 30 }}>Got a code?</Title>
      <Sub>Enter the 6-digit code shared by your roommates.</Sub>
      <View style={{ marginTop: 20 }}>
        <CodeInput keyboard="default" value={code} onChange={(v) => {
          const c = normalizeCode(v);
          setCode(c);
          if (c.length === 6) { updateDraft({ mode: 'join', code: c }); router.push('/onboarding/busy'); }
        }} />
      </View>
    </Screen>
  );
}
