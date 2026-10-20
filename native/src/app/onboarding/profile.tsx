import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { F } from '@/constants/theme';
import { PASTELS, useDraft } from '@/lib/draft';
import { Art } from '@/ui/art';
import { messageOf, rpc, STATE_KEY } from '@/lib/state';
import { Button, C, ErrorText, Field, Screen, StepHeader, Sub, Title } from '@/ui/kit';

/** Shown once, to a signed-in account with no name yet. */
export default function ProfileStep() {
  const qc = useQueryClient();
  const draft = useDraft();
  const [name, setName] = useState(draft.name);
  const [color, setColor] = useState(PASTELS[1]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) return setError('Tell us your name.');
    setBusy(true);
    try {
      await rpc('update_profile', { p_name: name.trim(), p_color: color });
      await qc.invalidateQueries({ queryKey: STATE_KEY }); // the root gate moves on once the name is saved
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen footer={<Button title="Continue" onPress={save} loading={busy} />}>
      <StepHeader step={1} total={6} back={false} />
      <View style={{ marginBottom: 12 }}><Art name="highfive" width={190} /></View>
      <Title>What should we call you?</Title>
      <Sub>Your roommates will see this name and colour.</Sub>
      <View style={{ marginTop: 28, gap: 24 }}>
        <Field placeholder="Your name" value={name} onChangeText={(t) => { setName(t); setError(null); }} autoCapitalize="words" autoFocus={!name} maxLength={40} />
        <View style={styles.colors}>
          {PASTELS.map((p) => (
            <Pressable key={p} accessibilityLabel={`Colour ${p}`} accessibilityState={{ selected: p === color }}
              onPress={() => { Haptics.selectionAsync(); setColor(p); }}
              style={[styles.swatch, { backgroundColor: p }, p === color && styles.on]}>
              {p === color && <Text style={styles.initial}>{(name.trim()[0] ?? '?').toUpperCase()}</Text>}
            </Pressable>
          ))}
        </View>
      </View>
      <ErrorText>{error}</ErrorText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  colors: { flexDirection: 'row', justifyContent: 'space-between' },
  swatch: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  on: { borderWidth: 3, borderColor: C.text },
  initial: { fontSize: 18, fontFamily: F.bold, color: C.text },
});
