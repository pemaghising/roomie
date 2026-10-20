import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { effortLabel } from '@domain/copy.ts';
import { swapDelta } from '@domain/ledger.ts';
import { DAY_NAMES, weekdayOf } from '@domain/time.ts';
import { F } from '@/constants/theme';
import { swapSentence } from '@/lib/plan';
import { choreMap, namesOf } from '@/lib/selectors';
import { useAction, useMe } from '@/lib/state';
import type { Assignment } from '@/lib/types';
import { Button, C, Screen } from '@/ui/kit';
import { EFFORT } from '@/ui/task-row';
import { useToast } from '@/ui/toast';

const short = (day: string) => DAY_NAMES[weekdayOf(day)].slice(0, 3);
const ACCENT = '#7C3AED';

export default function Swap() {
  const router = useRouter();
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const { me, state } = useMe();
  const toast = useToast();
  const chores = choreMap(state);
  const names = namesOf(state);
  const [give, setGive] = useState<Assignment | null>(null);
  const [take, setTake] = useState<Assignment | null>(null);
  const request = useAction<{ p_from: string; p_to: string }>('request_swap', {
    onSuccess: () => { toast.show('Swap request sent.'); router.back(); },
  });

  const upcoming = (a: Assignment) => a.plan_id === planId && a.status === 'todo' && a.day >= state.today;
  const mine = state.assignments.filter((a) => upcoming(a) && a.user_id === me);
  const theirs = state.assignments.filter((a) => upcoming(a) && a.user_id !== me);
  const delta = give && take ? swapDelta(give.effort, take.effort) : null;

  const option = (a: Assignment, selected: boolean, onPick: () => void, withName: boolean) => {
    const chore = chores.get(a.chore_id);
    const tone = EFFORT[effortLabel(a.effort)];
    return (
      <Pressable key={a.id} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={`${chore?.name}, ${short(a.day)}${withName ? `, ${names[a.user_id]}` : ''}`}
        onPress={() => { Haptics.selectionAsync(); onPick(); }} style={[styles.opt, selected && styles.optOn]}>
        <Text style={{ fontSize: 22 }}>{chore?.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.optName}>{chore?.name}</Text>
          <Text style={styles.optSub}>{short(a.day)}{withName ? ` · ${names[a.user_id] ?? 'A roommate'}` : ''}</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: tone.bg }]}><Text style={[styles.chipText, { color: tone.text }]}>{effortLabel(a.effort)}</Text></View>
      </Pressable>
    );
  };

  return (
    <Screen footer={
      <Button title="Send request" loading={request.isPending} disabled={!give || !take}
        onPress={() => give && take && !request.isPending && request.mutate({ p_from: give.id, p_to: take.id })} />
    }>
      <Text style={styles.title}>Swap a chore</Text>
      <Text style={styles.label}>1 · ONE OF YOURS</Text>
      <View style={styles.list} accessibilityRole="radiogroup">
        {mine.length === 0 ? <Text style={styles.empty}>You have no upcoming chores to trade.</Text> : mine.map((a) => option(a, give?.id === a.id, () => setGive(a), false))}
      </View>
      {give && (
        <>
          <Text style={styles.label}>2 · TRADE IT FOR</Text>
          <View style={styles.list} accessibilityRole="radiogroup">
            {theirs.length === 0 ? <Text style={styles.empty}>Nobody else has an upcoming chore to trade.</Text> : theirs.map((a) => option(a, take?.id === a.id, () => setTake(a), true))}
          </View>
        </>
      )}
      {delta !== null && <Text style={styles.delta}>{swapSentence(delta)}</Text>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, color: C.text, fontFamily: F.display, marginTop: 8 },
  label: { fontSize: 12, letterSpacing: 0.8, color: C.sub, fontFamily: F.bold, marginTop: 22, marginBottom: 10 },
  list: { gap: 10 },
  empty: { fontSize: 14, color: C.sub, fontFamily: F.regular },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1.5, borderColor: C.line, padding: 14 },
  optOn: { borderColor: ACCENT, backgroundColor: '#F5F3FF' },
  optName: { fontSize: 15, color: C.text, fontFamily: F.semibold },
  optSub: { fontSize: 12, color: C.sub, fontFamily: F.regular, marginTop: 2 },
  chip: { borderRadius: 9, paddingHorizontal: 9, paddingVertical: 3 },
  chipText: { fontSize: 11, fontFamily: F.bold },
  delta: { fontSize: 14, lineHeight: 20, color: C.lavenderText, fontFamily: F.semibold, backgroundColor: C.lavender, borderRadius: 16, padding: 14, marginTop: 20 },
});
