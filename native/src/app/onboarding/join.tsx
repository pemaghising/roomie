import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { normalizeCode, updateDraft, useDraft } from '@/lib/draft';
import { Art } from '@/ui/art';
import { Button, CodeInput, Screen, StepHeader, Sub, Title } from '@/ui/kit';

export default function Join() {
  const router = useRouter();
  const draft = useDraft();
  const [code, setCode] = useState(draft.code);
  const next = (c = code) => { updateDraft({ mode: 'join', code: c }); router.push('/onboarding/busy'); };

  return (
    <Screen footer={<Button title="Continue" onPress={() => next()} disabled={code.length !== 6} />}>
      <StepHeader step={3} total={4} />
      <View style={{ marginBottom: 12 }}><Art name="findHome" width={220} /></View>
      <Title>Join your home</Title>
      <Sub>Enter the 6-character household code your roommate shared with you.</Sub>
      <View style={{ marginTop: 28 }}>
        <CodeInput autoFocus keyboard="default" value={code} onChange={(v) => {
          const c = normalizeCode(v);
          setCode(c);
          if (c.length === 6) next(c);
        }} />
      </View>
    </Screen>
  );
}
