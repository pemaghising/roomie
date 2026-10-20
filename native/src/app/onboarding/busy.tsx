import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DAY_NAMES, type Weekday } from '@domain/time.ts';
import { errorText } from '@domain/copy.ts';
import { F } from '@/constants/theme';
import { resetDraft, updateDraft, useDraft } from '@/lib/draft';
import { Art } from '@/ui/art';
import { messageOf, planNow, rpc, STATE_KEY } from '@/lib/state';
import type { AppState } from '@/lib/types';
import { useToast } from '@/ui/toast';
import { Button, C, Screen, StepHeader, Sub, Title } from '@/ui/kit';

export default function BusyStep() {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const draft = useDraft();
  const isJoin = draft.mode === 'join';
  const [busy, setBusy] = useState(false);

  const toggle = (d: Weekday) => {
    Haptics.selectionAsync();
    updateDraft({ busyDays: (draft.busyDays.includes(d) ? draft.busyDays.filter((x) => x !== d) : [...draft.busyDays, d].sort()) as Weekday[] });
  };

  const finish = async () => {
    setBusy(true);
    try {
      if (isJoin) {
        const h = await rpc<string | null>('join_household', { p_code: draft.code, p_busy: draft.busyDays });
        if (!h) { toast.show(errorText('invalid_code')); router.back(); return; }
      } else {
        await rpc('create_household', {
          p_name: draft.homeName,
          p_busy: draft.busyDays,
          p_chores: draft.chores.filter((c) => c.selected).map(({ name, icon, effort, cadence }) => ({ name, icon, effort, cadence })),
        });
      }
      await planNow().catch(() => {}); // the 10-minute tick catches up if this call fails
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // go to the invite screen before the refetch flips the gate to 'ready', which would otherwise send us Home
      router.replace(isJoin ? '/onboarding/ready' : '/onboarding/invite');
      await qc.invalidateQueries({ queryKey: STATE_KEY });
      if (isJoin) {
        const name = qc.getQueryData<AppState>(STATE_KEY)?.household?.name;
        toast.show(name ? `Welcome to ${name}!` : 'Welcome home!');
      }
      resetDraft();
    } catch (e) {
      toast.show(messageOf(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen footer={<Button title={isJoin ? 'Join home' : 'Continue'} onPress={finish} loading={busy} />}>
      <StepHeader step={isJoin ? 4 : 5} total={isJoin ? 4 : 6} />
      <View style={{ marginBottom: 12 }}><Art name="calendar" width={150} /></View>
      <Title>Which days are you busiest?</Title>
      <Sub>Heavy chores stay off these days. You can change them anytime.</Sub>
      <View style={{ gap: 10, marginTop: 24 }}>
        {DAY_NAMES.map((name, i) => {
          const on = draft.busyDays.includes(i as Weekday);
          return (
            <Pressable key={name} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => toggle(i as Weekday)}
              style={({ pressed }) => [styles.day, on && styles.dayOn, pressed && { transform: [{ scale: 0.98 }] }]}>
              <Text style={[styles.dayText, on && styles.dayTextOn]}>{name}</Text>
              {on && <Text style={styles.dayTextOn}>✓</Text>}
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  day: { height: 50, borderRadius: 25, backgroundColor: C.field, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayOn: { backgroundColor: C.lavender },
  dayText: { fontSize: 16, color: C.text, fontFamily: F.medium },
  dayTextOn: { color: C.lavenderText, fontFamily: F.bold, fontSize: 16 },
});
