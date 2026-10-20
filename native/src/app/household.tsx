import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { F } from '@/constants/theme';
import { formatCode } from '@/lib/actions';
import { messageOf, rpc, STATE_KEY, useAction, useMe } from '@/lib/state';
import { Avatar } from '@/ui/avatar';
import { Button, C, Field, Screen } from '@/ui/kit';
import { useToast } from '@/ui/toast';

const ACCENT = '#7C3AED';
const MODES = [
  { value: 'review', title: 'Review first', body: "Everyone sees next week's plan and can swap before it locks." },
  { value: 'auto', title: 'Apply automatically', body: "The plan locks as soon as it's made. Swaps still work." },
] as const;
const ENDS = ['20:00', '21:00', '22:00', '23:00'];

export default function HouseholdSettings() {
  const { me, state } = useMe();
  const qc = useQueryClient();
  const toast = useToast();
  const h = state.household!;
  const isOwner = state.members.find((m) => m.user_id === me)?.role === 'owner';
  const [name, setName] = useState(h.name);
  const [sure, setSure] = useState(false);
  const [busy, setBusy] = useState(false);
  // a two-tap confirm that disarms itself: the old code stops working, so it can't be a single tap
  useEffect(() => { if (!sure) return; const t = setTimeout(() => setSure(false), 4000); return () => clearTimeout(t); }, [sure]);

  const update = useAction<{ p_name?: string; p_plan_mode?: 'review' | 'auto'; p_day_ends_at?: string }>('update_household', {
    optimistic: (s, a) => ({
      ...s,
      household: {
        ...s.household!,
        ...(a.p_name ? { name: a.p_name } : {}),
        ...(a.p_plan_mode ? { plan_mode: a.p_plan_mode } : {}),
        ...(a.p_day_ends_at ? { day_ends_at: `${a.p_day_ends_at}:00` } : {}),
      },
    }),
  });

  const saveName = () => { if (name.trim() && name.trim() !== h.name) update.mutate({ p_name: name.trim() }); };

  const run = async (fn: () => Promise<unknown>, done: string) => {
    if (busy) return;
    setBusy(true);
    try { await fn(); await qc.invalidateQueries({ queryKey: STATE_KEY }); toast.show(done); } catch (e) { toast.show(messageOf(e)); } finally { setBusy(false); setSure(false); }
  };

  const rotate = () => { if (!sure) { setSure(true); return; } void run(() => rpc('rotate_invite_code'), 'New code ready. The old one no longer works.'); };

  const remove = (m: { user_id: string; name: string }) => Alert.alert(`Remove ${m.name}?`, 'Their upcoming chores go to "Up for grabs" so anyone can claim them.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); void run(() => rpc('remove_member', { p_user: m.user_id }), `${m.name} was removed.`); } },
  ]);

  const leave = () => Alert.alert(`Leave ${h.name}?`, 'Your upcoming chores go to the claim pool. You can rejoin later with the code.', [
    { text: 'Stay', style: 'cancel' },
    // the root gate sends you back to create or join a home once the household is gone from your state
    { text: 'Leave', style: 'destructive', onPress: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); void run(() => rpc('leave_household'), 'You left the home.'); } },
  ]);

  return (
    <Screen>
      <Text style={styles.title}>Household</Text>

      <Text style={styles.label}>HOME NAME</Text>
      <Field value={name} maxLength={40} accessibilityLabel="Home name" onChangeText={setName} onBlur={saveName} onSubmitEditing={saveName} returnKeyType="done" />

      <Text style={styles.label}>WEEKLY PLAN</Text>
      <View style={{ gap: 10 }} accessibilityRole="radiogroup">
        {MODES.map((m) => {
          const on = h.plan_mode === m.value;
          return (
            <Pressable key={m.value} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => { if (!on) { Haptics.selectionAsync(); update.mutate({ p_plan_mode: m.value }); } }}
              style={[styles.card, on && styles.cardOn]}>
              <Text style={styles.cardTitle}>{m.title}</Text>
              <Text style={styles.cardBody}>{m.body}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>DAY ENDS AT</Text>
      <Text style={styles.hint}>Unfinished chores move to "Up for grabs" after this time.</Text>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {ENDS.map((t) => {
          const on = h.day_ends_at.slice(0, 5) === t;
          return (
            <Pressable key={t} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => { if (!on) { Haptics.selectionAsync(); update.mutate({ p_day_ends_at: t }); } }} style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipText, on && { color: '#FFF' }]}>{t}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>INVITE CODE</Text>
      <Text style={styles.code} selectable>{formatCode(h.invite_code)}</Text>
      {isOwner && <Button title={sure ? 'Sure? The old code stops working' : 'Make a new code'} variant={sure ? 'danger' : 'ghost'} loading={busy} onPress={rotate} />}

      <Text style={styles.label}>ROOMMATES</Text>
      <View style={styles.group}>
        {state.members.map((m, i) => (
          <View key={m.user_id} style={[styles.row, i > 0 && styles.divider]}>
            <Avatar name={m.name} color={m.color} path={m.avatar_path} size={38} />
            <Text style={styles.rowName}>{m.user_id === me ? `${m.name} (you)` : m.name}</Text>
            {m.role === 'owner' && <Text style={styles.owner}>Owner</Text>}
            {isOwner && m.user_id !== me && (
              <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${m.name}`} hitSlop={10} onPress={() => remove(m)}>
                <Ionicons name="person-remove-outline" size={20} color="#B91C1C" />
              </Pressable>
            )}
          </View>
        ))}
      </View>

      <Pressable accessibilityRole="button" onPress={leave} style={({ pressed }) => [styles.leave, pressed && { opacity: 0.7 }]}>
        <Ionicons name="exit-outline" size={18} color="#B91C1C" />
        <Text style={styles.leaveText}>Leave household</Text>
      </Pressable>
      <View style={{ height: 24 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 32, color: C.text, fontFamily: F.display, marginTop: 8, marginBottom: 6 },
  label: { fontSize: 12, letterSpacing: 0.8, color: C.sub, fontFamily: F.bold, marginTop: 24, marginBottom: 10 },
  hint: { fontSize: 13, lineHeight: 19, color: C.sub, fontFamily: F.regular, marginBottom: 10, marginTop: -4 },
  card: { borderRadius: 20, borderWidth: 1.5, borderColor: C.line, backgroundColor: '#FFF', padding: 14, gap: 3 },
  cardOn: { borderColor: ACCENT, backgroundColor: '#F5F3FF' },
  cardTitle: { fontSize: 15, color: C.text, fontFamily: F.bold },
  cardBody: { fontSize: 13, lineHeight: 18, color: C.sub, fontFamily: F.regular },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, height: 42, borderRadius: 21, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: C.text },
  chipText: { fontSize: 14, color: C.text, fontFamily: F.semibold },
  code: { fontSize: 34, letterSpacing: 2, color: C.text, fontFamily: F.heavy, marginBottom: 8 },
  group: { backgroundColor: '#FFF', borderRadius: 22, borderWidth: 1, borderColor: C.line, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  divider: { borderTopWidth: 1, borderTopColor: C.line },
  rowName: { flex: 1, fontSize: 15, color: C.text, fontFamily: F.semibold },
  owner: { fontSize: 12, color: ACCENT, fontFamily: F.bold },
  leave: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: '#FECACA', marginTop: 28 },
  leaveText: { color: '#B91C1C', fontSize: 16, fontFamily: F.semibold },
});
