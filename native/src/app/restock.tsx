import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Effort } from '@domain/types.ts';
import { cleanName, openRestockFor, sameName } from '@domain/pantry.ts';
import { F } from '@/constants/theme';
import { messageOf, rpc, STATE_KEY, useMe } from '@/lib/state';
import { Button, C, ErrorText, Field } from '@/ui/kit';

const EFFORTS: { value: Effort; label: string; tone: { bg: string; fg: string } }[] = [
  { value: 1, label: 'Light', tone: { bg: '#D1FAE5', fg: '#065F46' } },
  { value: 2, label: 'Medium', tone: { bg: '#FEF3C7', fg: '#92400E' } },
  { value: 3, label: 'Heavy', tone: { bg: '#FEE2E2', fg: '#991B1B' } },
];

/** From an item (`?item=<id>`) or free text from the + menu. */
export default function Restock() {
  const { item: itemId } = useLocalSearchParams<{ item?: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { state } = useMe();
  const item = itemId ? state.pantry.find((i) => i.id === itemId) : undefined;
  const [name, setName] = useState('');
  const [effort, setEffort] = useState<Effort>(1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const clean = cleanName(name);
    const target = item ?? (clean ? state.pantry.find((i) => i.owner_id === null && sameName(i.name, clean)) : undefined);
    if (!target && !clean) return setError('What do we need?');
    if (!target && [...clean].length > 40) return setError('Keep it under 40 characters.');
    if (target && openRestockFor(state.restocks, target.id)) return setError('Requested');
    setBusy(true);
    try {
      await rpc('request_restock', target ? { p_item: target.id, p_effort: effort } : { p_name: clean, p_effort: effort });
      await qc.invalidateQueries({ queryKey: STATE_KEY });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: '/request-sent', params: { name: target?.name ?? clean } });
    } catch (e) {
      setError(messageOf(e));
      setBusy(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: '#FFF' }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Request Restock</Text>
      <Text style={styles.sub}>
        {item ? `We're out of ${item.name}. Send this to the Chores pool so a roommate can pick it up.` : 'This will create a task in the Chores pool for a roommate to pick up.'}
      </Text>
      {!item && (
        <View style={{ marginTop: 18 }}>
          <Field style={styles.input} autoFocus placeholder="e.g., Dish soap" value={name} accessibilityLabel="What do we need?"
            onChangeText={(t) => { setName(t); setError(null); }} />
        </View>
      )}
      <Text style={styles.label}>EFFORT LEVEL</Text>
      <View style={styles.pills}>
        {EFFORTS.map((e) => (
          <Pressable key={e.label} accessibilityRole="radio" accessibilityState={{ selected: e.value === effort }}
            onPress={() => { Haptics.selectionAsync(); setEffort(e.value); }}
            style={({ pressed }) => [styles.pill, { backgroundColor: e.tone.bg, borderColor: e.value === effort ? e.tone.fg : 'transparent' }, pressed && { transform: [{ scale: 0.97 }] }]}>
            <Text style={[styles.pillText, { color: e.tone.fg }]}>{e.label}</Text>
          </Pressable>
        ))}
      </View>
      <ErrorText>{error}</ErrorText>
      <Button title="Send to Chores Pool" onPress={send} loading={busy} disabled={!item && !cleanName(name)} style={{ marginTop: 22 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 24, paddingTop: 36, paddingBottom: 32 },
  title: { fontSize: 32, lineHeight: 40, color: C.text, fontFamily: F.display },
  sub: { fontSize: 15, lineHeight: 22, color: C.sub, fontFamily: F.regular, marginTop: 8 },
  input: { height: 54, borderRadius: 16, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' },
  label: { fontSize: 12, letterSpacing: 0.8, color: C.sub, fontFamily: F.bold, marginTop: 24, marginBottom: 12 },
  pills: { flexDirection: 'row', gap: 10 },
  pill: { flex: 1, height: 46, borderRadius: 23, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  pillText: { fontSize: 15, fontFamily: F.bold },
});
