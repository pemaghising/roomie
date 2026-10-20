import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { effortLabel } from '@domain/copy.ts';
import { F } from '@/constants/theme';
import { messageOf, rpc, STATE_KEY, useMe } from '@/lib/state';
import type { Chore } from '@/lib/types';
import { Button, C, Screen } from '@/ui/kit';
import { EFFORT } from '@/ui/task-row';
import { useToast } from '@/ui/toast';

const CADENCE: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', biweekly: 'Every 2 weeks' };

/** The household's chores. Removing one retires it and clears its upcoming, not-yet-done turns. */
export default function ManageChores() {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const { state } = useMe();
  const [busy, setBusy] = useState<string | null>(null);
  const chores = state.chores.filter((c) => c.active).sort((a, b) => a.name.localeCompare(b.name));

  const archive = (c: Chore) => Alert.alert(`Remove ${c.name}?`, 'It leaves the rotation and its upcoming turns are cleared. Finished chores stay in the history.', [
    { text: 'Keep it', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: async () => {
      setBusy(c.id);
      try {
        await rpc('archive_chore', { p_id: c.id });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        await qc.invalidateQueries({ queryKey: STATE_KEY });
        toast.show(`${c.name} removed.`);
      } catch (e) {
        toast.show(messageOf(e));
      } finally {
        setBusy(null);
      }
    } },
  ]);

  return (
    <Screen footer={<Button title="Add a chore" onPress={() => router.replace('/add-chore')} />}>
      <Text style={styles.title}>Chores</Text>
      <Text style={styles.sub}>Everything in your home's rotation.</Text>
      <View style={styles.list}>
        {chores.length === 0 && <Text style={styles.empty}>No chores yet. Add the first one.</Text>}
        {chores.map((c) => {
          const tone = EFFORT[effortLabel(c.effort)];
          return (
            <View key={c.id} style={styles.row}>
              <View style={[styles.icon, { backgroundColor: tone.bg }]}><Text style={{ fontSize: 22 }}>{c.icon}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>{c.name}</Text>
                <Text style={styles.meta}>{effortLabel(c.effort)} · {CADENCE[c.cadence] ?? c.cadence}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${c.name}`} hitSlop={10} disabled={busy === c.id} onPress={() => archive(c)} style={{ opacity: busy === c.id ? 0.4 : 1 }}>
                <Ionicons name="trash-outline" size={20} color="#B91C1C" />
              </Pressable>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, color: C.text, fontFamily: F.display, marginTop: 8 },
  sub: { fontSize: 14, color: C.sub, fontFamily: F.regular, marginTop: 4 },
  list: { gap: 10, marginTop: 20 },
  empty: { fontSize: 14, color: C.sub, fontFamily: F.regular },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: C.line, padding: 12 },
  icon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, color: C.text, fontFamily: F.semibold },
  meta: { fontSize: 13, color: C.sub, fontFamily: F.regular, marginTop: 2 },
});
