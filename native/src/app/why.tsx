// H2 · Why these chores: one line per chore, and your effort in words. Opens over Home.
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useBack } from '@/lib/use-back';
import { StyleSheet, View } from 'react-native';
import { weekStartOf } from '@domain/time.ts';
import { balanceWords, effortSegments } from '@/lib/balance';
import { choreMap, myTasksOn, namesOf, planForWeek } from '@/lib/selectors';
import { useAppState } from '@/lib/state';
import { whyText } from '@/lib/why';
import { color, font } from '@/ui/tokens';
import { Button, effortKind, ReasonRow, Sheet, Txt } from '@/ui/v2';

export default function Why() {
  const router = useRouter();
  const back = useBack();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data: state } = useAppState();
  if (!state?.household) return null;
  const me = state.profile.id;
  const chores = choreMap(state);
  const names = namesOf(state);
  const today = myTasksOn(state, me, state.today);
  const rows = id ? state.assignments.filter((a) => a.id === id) : today;
  const plan = planForWeek(state, weekStartOf(state.today));
  const mine = state.assignments.filter((a) => a.plan_id === plan?.id && (a.claimed_by ?? a.user_id) === me && a.status !== 'expired');
  const doneEffort = mine.filter((a) => a.status === 'done').reduce((n, a) => n + a.effort, 0);
  const planned = mine.reduce((n, a) => n + a.effort, 0);
  const filled = effortSegments(doneEffort, planned);
  const words = balanceWords(state.balance);
  const close = () => back();

  return (
    <Sheet onClose={close} title="Why these chores" sub="Roomie balances effort, not the number of chores.">
      <View style={styles.effort} accessible accessibilityLabel={`Your effort this week: ${words.label}. ${words.sentence}`}>
        <Txt v="Meta/Medium" c={color.text.numeral}>Your effort this week</Txt>
        <Txt v="Title/Onboarding" c={color.text.numeral} style={{ fontFamily: font.medium }}>{words.label}</Txt>
        <View style={styles.bar}>
          {Array.from({ length: 9 }, (_, i) => <View key={i} style={[styles.seg, { backgroundColor: i < filled ? color.action.primary : 'rgba(135,107,222,0.18)' }]} />)}
        </View>
        <Txt v="Meta" c={color.text.numeral}>{words.sentence}</Txt>
      </View>
      <View>
        {rows.length === 0 && <Txt v="Body/Default" c={color.text.secondary}>Nothing on your list today.</Txt>}
        {rows.map((a, i) => {
          const c = chores.get(a.chore_id);
          return <ReasonRow key={a.id} icon={c?.icon} title={c?.name ?? 'A chore'} reason={whyText(a, me, names)} tag={effortKind(a.effort)} last={i === rows.length - 1} />;
        })}
      </View>
      <Button title="Got it" onPress={close} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  effort: { borderRadius: 24, backgroundColor: '#EFE7FF', padding: 20, gap: 10 },
  bar: { flexDirection: 'row', gap: 6, marginVertical: 4 },
  seg: { flex: 1, height: 8, borderRadius: 4 },
});
