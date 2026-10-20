import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { balanceSentence, effortLabel } from '@domain/copy.ts';
import { weekStartOf } from '@domain/time.ts';
import { F } from '@/constants/theme';
import { choreMap, namesOf, weekTotals } from '@/lib/selectors';
import { useMe } from '@/lib/state';
import { whyText } from '@/lib/why';
import { C, Screen } from '@/ui/kit';
import { EFFORT } from '@/ui/task-row';

/** Why a chore landed on someone: the reason, and a picture of the week's effort. Alphabetical, never a ranking. */
export default function Why() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { me, state } = useMe();
  const a = state.assignments.find((x) => x.id === id);
  if (!a) return <Screen><Text style={styles.empty}>This chore is no longer on the plan.</Text></Screen>;

  const chore = choreMap(state).get(a.chore_id);
  const names = namesOf(state);
  const totals = weekTotals(state, weekStartOf(a.day));
  const max = Math.max(1, ...Object.values(totals));
  const people = [...state.members].sort((x, y) => x.name.localeCompare(y.name));
  const tone = EFFORT[effortLabel(a.effort)];

  return (
    <Screen>
      <View style={styles.head}>
        <Text style={{ fontSize: 34 }}>{chore?.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{chore?.name ?? 'Chore'}</Text>
          <View style={[styles.chip, { backgroundColor: tone.bg }]}><Text style={[styles.chipText, { color: tone.text }]}>{effortLabel(a.effort)}</Text></View>
        </View>
      </View>
      <Text style={styles.reason}>{whyText(a, me, names)}</Text>

      <Text style={styles.label}>THIS WEEK'S EFFORT</Text>
      <View style={{ gap: 12 }}>
        {people.map((m) => (
          <View key={m.user_id} style={styles.bar} accessible accessibilityLabel={`${m.user_id === me ? 'You' : m.name}: ${totals[m.user_id] ?? 0} points`}>
            <Text style={styles.name} numberOfLines={1}>{m.user_id === me ? 'You' : m.name.split(' ')[0]}</Text>
            <View style={styles.track}><View style={[styles.fill, { width: `${((totals[m.user_id] ?? 0) / max) * 100}%`, backgroundColor: m.color }]} /></View>
            <Text style={styles.pts}>{totals[m.user_id] ?? 0} pts</Text>
          </View>
        ))}
      </View>

      <View style={styles.private}>
        <Ionicons name="lock-closed-outline" size={15} color={C.lavenderText} />
        <Text style={styles.privateText}>{balanceSentence(state.balance)} Only you can see this.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: 15, color: C.sub, fontFamily: F.regular, marginTop: 40, textAlign: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 },
  title: { fontSize: 26, color: C.text, fontFamily: F.display },
  chip: { alignSelf: 'flex-start', borderRadius: 9, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6 },
  chipText: { fontSize: 12, fontFamily: F.bold },
  reason: { fontSize: 17, lineHeight: 25, color: C.text, fontFamily: F.medium, marginTop: 20 },
  label: { fontSize: 12, letterSpacing: 0.8, color: C.sub, fontFamily: F.bold, marginTop: 28, marginBottom: 14 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { width: 64, fontSize: 14, color: C.text, fontFamily: F.semibold },
  track: { flex: 1, height: 10, borderRadius: 5, backgroundColor: '#F3F4F6', overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5 },
  pts: { width: 48, textAlign: 'right', fontSize: 12, color: C.sub, fontFamily: F.semibold },
  private: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.lavender, borderRadius: 16, padding: 14, marginTop: 28 },
  privateText: { flex: 1, fontSize: 13, lineHeight: 18, color: C.lavenderText, fontFamily: F.medium },
});
