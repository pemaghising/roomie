// 08 · Name your home.
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { updateDraft, useDraft } from '@/lib/draft';
import { color } from '@/ui/tokens';
import { Button, Chip, Heading, Page, TextField, Txt } from '@/ui/v2';

const IDEAS = ['Flat 3B', 'Our Ghar', 'The Nest'];

export default function HomeName() {
  const router = useRouter();
  const draft = useDraft();
  const [name, setName] = useState(draft.homeName);
  const [error, setError] = useState<string | null>(null);
  const next = () => {
    if (!name.trim()) return setError('Give your home a name everyone will recognise.');
    updateDraft({ mode: 'create', homeName: name.trim() });
    router.push('/onboarding/chores');
  };
  return (
    <Page back step={2} footer={<Button title="Continue" onPress={next} disabled={!name.trim()} />}>
      <Heading title="Name your home" sub="Pick something everyone will recognise." />
      <View>
        <TextField value={name} onChangeText={(t) => { setName(t); setError(null); }} placeholder="Parijat Chowk Flat" autoFocus
          autoCapitalize="words" maxLength={40} returnKeyType="next" onSubmitEditing={next} accessibilityLabel="Home name" />
        {error && <Txt v="Meta" c={color.text.danger} style={{ marginTop: 8 }}>{error}</Txt>}
      </View>
      <View style={{ gap: 12 }}>
        <Txt v="Body/Default" c={color.text.secondary}>Or try one of these</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {IDEAS.map((i) => <Chip key={i} label={i} selected={name === i} onPress={() => { setName(i); setError(null); }} />)}
        </View>
      </View>
    </Page>
  );
}
