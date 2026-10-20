// Name step, only for an account that signed in without one (new accounts bring it from frame 02).
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';
import { useDraft } from '@/lib/draft';
import { messageOf, rpc, STATE_KEY } from '@/lib/state';
import { color } from '@/ui/tokens';
import { Button, Heading, Page, TextField, Txt } from '@/ui/v2';

export default function ProfileStep() {
  const qc = useQueryClient();
  const draft = useDraft();
  const [name, setName] = useState(draft.name);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!name.trim()) return setError('Tell us what to call you.');
    setBusy(true);
    try {
      await rpc('update_profile', { p_name: name.trim() });
      await qc.invalidateQueries({ queryKey: STATE_KEY }); // the root gate moves on once the name is saved
    } catch (e) { setError(messageOf(e)); } finally { setBusy(false); }
  };
  return (
    <Page footer={<Button title="Continue" onPress={save} loading={busy} disabled={!name.trim()} />}>
      <Heading title="What should we call you?" sub="Your roommates will see this. Make it you." />
      <View>
        <TextField value={name} onChangeText={(t) => { setName(t); setError(null); }} placeholder="Your name" autoFocus autoCapitalize="words" maxLength={30}
          returnKeyType="done" onSubmitEditing={save} accessibilityLabel="Your name" />
        {error && <Txt v="Meta" c={color.text.danger} style={{ marginTop: 8 }}>{error}</Txt>}
      </View>
    </Page>
  );
}
