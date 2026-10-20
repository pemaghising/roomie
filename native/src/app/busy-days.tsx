import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { DAY_NAMES, type Weekday } from '@domain/time.ts';
import { F } from '@/constants/theme';
import { useAction, useMe } from '@/lib/state';
import { useToast } from '@/ui/toast';
import { Button, C } from '@/ui/kit';

export default function BusyDays() {
  const router = useRouter();
  const toast = useToast();
  const { me, state } = useMe();
  const [days, setDays] = useState<Weekday[]>(state.members.find((m) => m.user_id === me)?.busy_days ?? []);
  const save = useAction<{ p_days: Weekday[] }>('update_busy_days', {
    optimistic: (s, { p_days }) => ({ ...s, members: s.members.map((m) => (m.user_id === me ? { ...m, busy_days: p_days } : m)) }),
    onSuccess: () => toast.show("Saved — applies from next week's plan."),
  });
  const toggle = (d: Weekday) => {
    Haptics.selectionAsync();
    setDays((x) => (x.includes(d) ? x.filter((y) => y !== d) : [...x, d].sort() as Weekday[]));
  };

  return (
    <ScrollView style={{ backgroundColor: '#FFF' }} contentContainerStyle={styles.body}>
      <Text style={styles.title}>My busy days</Text>
      <Text style={styles.sub}>Heavy chores stay off these days.</Text>
      {DAY_NAMES.map((name, i) => {
        const on = days.includes(i as Weekday);
        return (
          <Pressable key={name} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => toggle(i as Weekday)}
            style={({ pressed }) => [styles.day, on && styles.dayOn, pressed && { transform: [{ scale: 0.98 }] }]}>
            <Text style={[styles.dayText, on && styles.dayTextOn]}>{name}</Text>
            {on && <Text style={styles.dayTextOn}>✓</Text>}
          </Pressable>
        );
      })}
      <Button title="Save" style={{ marginTop: 16 }} onPress={() => { save.mutate({ p_days: days }); router.back(); }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 24, paddingTop: 32, gap: 10 },
  title: { fontSize: 28, color: C.text, fontFamily: F.display },
  sub: { fontSize: 15, color: C.sub, fontFamily: F.regular, marginBottom: 10 },
  day: { height: 50, borderRadius: 25, backgroundColor: C.field, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayOn: { backgroundColor: C.lavender },
  dayText: { fontSize: 16, color: C.text, fontFamily: F.medium },
  dayTextOn: { color: C.lavenderText, fontFamily: F.bold, fontSize: 16 },
});
