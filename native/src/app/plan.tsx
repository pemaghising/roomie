import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { effortLabel } from '@domain/copy.ts';
import { addDays, DAY_NAMES, weekdayOf, weekStartOf } from '@domain/time.ts';
import { F } from '@/constants/theme';
import { lockCopy } from '@/lib/plan';
import { choreMap, incomingSwaps, namesOf, pendingDraft, planForWeek, weekTotals } from '@/lib/selectors';
import { useAction, useMe } from '@/lib/state';
import { Art } from '@/ui/art';
import { Avatar } from '@/ui/avatar';
import { Button, C, Screen } from '@/ui/kit';
import { Segmented } from '@/ui/segmented';
import { EFFORT } from '@/ui/task-row';
import { useToast } from '@/ui/toast';

const ACCENT = '#7C3AED';
const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export default function PlanReview() {
  const router = useRouter();
  const { me, state } = useMe();
  const toast = useToast();
  const names = namesOf(state);
  const chores = choreMap(state);
  const thisWeek = weekStartOf(state.today);
  const current = planForWeek(state, thisWeek);
  const next = planForWeek(state, addDays(thisWeek, 7));
  // a draft waiting for review comes first; otherwise this week (auto mode, locked plans, swaps)
  const [week, setWeek] = useState(() => (pendingDraft(state) ?? current ?? next)?.week_start);
  const plan = planForWeek(state, week ?? '') ?? pendingDraft(state) ?? current ?? next;

  const approve = useAction<{ p_plan: string; me: string }>('approve_plan', {
    optimistic: (s, { p_plan, me: who }) => ({ ...s, plans: s.plans.map((p) => (p.id === p_plan ? { ...p, approved_by: [...p.approved_by, who] } : p)) }),
    onSuccess: () => toast.show("Thanks. You're in."),
  });
  const respond = useAction<{ p_swap: string; p_accept: boolean }>('respond_swap', {
    optimistic: (s, { p_swap }) => ({ ...s, swaps: s.swaps.filter((w) => w.id !== p_swap) }),
  });
  const answer = (p_swap: string, p_accept: boolean) =>
    respond.mutate({ p_swap, p_accept }, { onSuccess: () => toast.show(p_accept ? "Swapped. It's on your list." : 'Declined. No hard feelings.') });

  if (!plan) {
    return (
      <Screen footer={<Button title="Back" variant="ghost" onPress={() => router.back()} />}>
        <View style={styles.empty}>
          <Art name="calendar" width={200} />
          <Text style={styles.title}>No plan yet.</Text>
          <Text style={styles.sub}>Your first plan arrives a few minutes after the home is set up.</Text>
        </View>
      </Screen>
    );
  }

  const isDraft = plan.status === 'draft';
  const approved = plan.approved_by.includes(me);
  const waiting = state.members.filter((m) => !plan.approved_by.includes(m.user_id) && m.user_id !== me).length;
  const totals = weekTotals(state, plan.week_start);
  const rows = state.assignments.filter((a) => a.plan_id === plan.id && a.status !== 'expired');
  const people = [...state.members].sort((a, b) => (a.user_id === me ? -1 : b.user_id === me ? 1 : a.name.localeCompare(b.name)));

  return (
    <Screen footer={
      <View style={{ gap: 4 }}>
        {isDraft && approved && <Text style={styles.status}>You approved{waiting ? ` · waiting for ${waiting} more` : ' · locking soon'}</Text>}
        {isDraft && !approved && <Button title="Looks good" loading={approve.isPending} onPress={() => approve.mutate({ p_plan: plan.id, me })} />}
        <Button title={isDraft ? 'Request a swap' : 'Swap a chore'} variant="ghost" onPress={() => router.push({ pathname: '/swap', params: { planId: plan.id } })} />
      </View>
    }>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={12} onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={22} color={C.text} /></Pressable>
      <Text style={styles.eyebrow}>{isDraft ? lockCopy(plan.lock_at, state.household?.tz ?? 'UTC') : 'Locked'}</Text>
      <Text style={styles.title}>{plan.week_start > thisWeek ? 'Next week' : 'This week'}</Text>
      {current && next && (
        <View style={{ marginTop: 12 }}>
          <Segmented options={[{ value: current.week_start, label: 'This week' }, { value: next.week_start, label: 'Next week' }]} value={plan.week_start} onChange={setWeek} />
        </View>
      )}
      <Text style={styles.sub}>{fmt(plan.week_start)} – {fmt(addDays(plan.week_start, 6))} · balanced by effort, busy days respected</Text>

      {incomingSwaps(state, me).map((w) => {
        const theirs = state.assignments.find((a) => a.id === w.from_assignment);
        const mine = state.assignments.find((a) => a.id === w.to_assignment);
        return (
          <View key={w.id} style={styles.swap} accessible accessibilityLabel="Swap request">
            <Text style={styles.swapText}><Text style={{ fontFamily: F.bold }}>{names[w.from_user] ?? 'A roommate'}</Text> wants to trade their {chores.get(theirs?.chore_id ?? '')?.name ?? 'chore'} for your {chores.get(mine?.chore_id ?? '')?.name ?? 'chore'}</Text>
            <View style={styles.swapButtons}>
              <Pressable accessibilityRole="button" disabled={respond.isPending} onPress={() => answer(w.id, false)} style={({ pressed }) => [styles.swapNo, pressed && { opacity: 0.7 }]}><Text style={styles.swapNoText}>Decline</Text></Pressable>
              <Pressable accessibilityRole="button" disabled={respond.isPending} onPress={() => answer(w.id, true)} style={({ pressed }) => [styles.swapYes, pressed && { opacity: 0.85 }]}><Text style={styles.swapYesText}>Accept</Text></Pressable>
            </View>
          </View>
        );
      })}

      {people.map((m) => (
        <View key={m.user_id} style={styles.person} accessible={false}>
          <View style={styles.personHead}>
            <Avatar name={m.name} color={m.color} path={m.avatar_path} size={36} />
            <Text style={styles.personName}>{m.user_id === me ? 'You' : m.name}</Text>
            {isDraft && plan.approved_by.includes(m.user_id) && <Ionicons name="checkmark-circle" size={18} color="#22C55E" accessibilityLabel="approved" />}
            <Text style={styles.pts}>{totals[m.user_id] ?? 0} pts</Text>
          </View>
          {rows.filter((a) => a.user_id === m.user_id).sort((a, b) => a.day.localeCompare(b.day)).map((a) => {
            const tone = EFFORT[effortLabel(a.effort)];
            return (
              <View key={a.id} style={styles.line}>
                <Text style={styles.day}>{DAY_NAMES[weekdayOf(a.day)].slice(0, 3)}</Text>
                <Text style={{ fontSize: 18 }}>{chores.get(a.chore_id)?.icon}</Text>
                <Text style={styles.chore} numberOfLines={1}>{chores.get(a.chore_id)?.name}</Text>
                <View style={[styles.chip, { backgroundColor: tone.bg }]}><Text style={[styles.chipText, { color: tone.text }]}>{effortLabel(a.effort)}</Text></View>
              </View>
            );
          })}
        </View>
      ))}
      <View style={{ height: 16 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.field, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  eyebrow: { fontSize: 12, letterSpacing: 0.6, color: ACCENT, fontFamily: F.bold, marginTop: 16 },
  title: { fontSize: 32, color: C.text, fontFamily: F.display, marginTop: 4 },
  sub: { fontSize: 14, lineHeight: 20, color: C.sub, fontFamily: F.regular, marginTop: 10 },
  empty: { alignItems: 'center', paddingTop: 48, gap: 8 },
  status: { fontSize: 14, color: C.sub, fontFamily: F.semibold, textAlign: 'center', marginBottom: 6 },
  swap: { backgroundColor: C.lavender, borderRadius: 22, padding: 16, gap: 12, marginTop: 18 },
  swapText: { fontSize: 15, lineHeight: 21, color: C.lavenderText, fontFamily: F.regular },
  swapButtons: { flexDirection: 'row', gap: 10 },
  swapNo: { flex: 1, height: 42, borderRadius: 21, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  swapNoText: { fontSize: 14, color: C.text, fontFamily: F.semibold },
  swapYes: { flex: 1, height: 42, borderRadius: 21, backgroundColor: C.text, alignItems: 'center', justifyContent: 'center' },
  swapYesText: { fontSize: 14, color: '#FFF', fontFamily: F.semibold },
  person: { backgroundColor: '#FFF', borderRadius: 24, borderWidth: 1, borderColor: C.line, padding: 14, marginTop: 14, gap: 10 },
  personHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  personName: { flex: 1, fontSize: 16, color: C.text, fontFamily: F.bold },
  pts: { fontSize: 13, color: C.sub, fontFamily: F.semibold },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  day: { width: 34, fontSize: 12, color: C.sub, fontFamily: F.semibold },
  chore: { flex: 1, fontSize: 15, color: C.text, fontFamily: F.medium },
  chip: { borderRadius: 9, paddingHorizontal: 9, paddingVertical: 3 },
  chipText: { fontSize: 11, fontFamily: F.bold },
});
