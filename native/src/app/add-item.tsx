import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { cleanName, sameName, type PantryRule } from '@domain/pantry.ts';
import { F } from '@/constants/theme';
import { TAG } from '@/lib/pantry';
import { messageOf, rpc, STATE_KEY, useMe } from '@/lib/state';
import { Button, C, ErrorText, Field } from '@/ui/kit';
import { Segmented, TonePills } from '@/ui/segmented';
import { useToast } from '@/ui/toast';

const RULES: { value: PantryRule; label: string; tone: { bg: string; fg: string } }[] = [
  { value: 'ask_first', label: 'Ask first', tone: TAG.ask_first },
  { value: 'do_not_touch', label: 'Do not touch', tone: TAG.do_not_touch },
];

export default function AddItem() {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const { me, state } = useMe();
  const [kind, setKind] = useState<'shared' | 'personal'>('shared');
  const [rule, setRule] = useState<PantryRule>('ask_first');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const clean = cleanName(name);
    if (!clean) return setError('Name it first.');
    if ([...clean].length > 40) return setError('Keep it under 40 characters.');
    const shelf = state.pantry.filter((i) => (kind === 'shared' ? i.owner_id === null : i.owner_id === me));
    if (shelf.some((i) => sameName(i.name, clean))) return setError('Already in the pantry');
    setBusy(true);
    try {
      await rpc('add_pantry_item', { p_name: clean, p_owner_personal: kind === 'personal', ...(kind === 'personal' ? { p_rule: rule } : {}) });
      await qc.invalidateQueries({ queryKey: STATE_KEY });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.show(kind === 'shared' ? `${clean} added to the shared shelf.` : `${clean} added to your shelf.`);
      router.back();
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: '#FFF' }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Add to Pantry</Text>
      <Segmented options={[{ value: 'shared', label: 'Shared' }, { value: 'personal', label: 'Personal' }]} value={kind} onChange={(v) => { setKind(v); setError(null); }} />
      <View style={{ marginTop: 18 }}>
        <Field style={styles.input} autoFocus placeholder={kind === 'shared' ? 'e.g., Paper Towels' : 'e.g., Almond Milk'} value={name}
          accessibilityLabel="Item name" onChangeText={(t) => { setName(t); setError(null); }} returnKeyType="done" onSubmitEditing={save} />
      </View>
      {kind === 'personal' && (
        <>
          <Text style={styles.label}>SHARING RULE</Text>
          <TonePills options={RULES} value={rule} onChange={setRule} />
        </>
      )}
      <ErrorText>{error}</ErrorText>
      <Button title={kind === 'shared' ? 'Add to Shared List' : 'Add to My Shelf'} onPress={save} loading={busy} disabled={!cleanName(name)} style={{ marginTop: 22 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 24, paddingTop: 36, paddingBottom: 32 },
  title: { fontSize: 32, lineHeight: 40, color: C.text, fontFamily: F.display, marginBottom: 20 },
  input: { height: 54, borderRadius: 16, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' },
  label: { fontSize: 12, letterSpacing: 0.8, color: C.sub, fontFamily: F.bold, marginTop: 24, marginBottom: 12 },
});
