import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { addDays } from '@domain/time.ts';
import { F } from '@/constants/theme';
import type { DayState } from '@/lib/recap';
import { C } from './kit';
import { MONTHS } from './calendar';

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const ACCENT = '#7C3AED';

const short = (d: string) => `${MONTHS[Number(d.slice(5, 7)) - 1].slice(0, 3)} ${Number(d.slice(8))}`;

/** One week as seven pills: the picked day is filled, today is tinted, and a dot under each date says how that day went. */
export function WeekStrip({ weekStart, selected, today, states, onSelect, onWeek }: {
  weekStart: string; selected: string; today: string; states: DayState[]; onSelect: (d: string) => void; onWeek: (delta: -1 | 1) => void;
}) {
  const end = addDays(weekStart, 6);
  const label = weekStart.slice(0, 7) === end.slice(0, 7) ? `${short(weekStart)} – ${Number(end.slice(8))}` : `${short(weekStart)} – ${short(end)}`;
  return (
    <View>
      <View style={styles.head}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.arrows}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous week" hitSlop={10} onPress={() => onWeek(-1)}><Ionicons name="chevron-back" size={20} color={C.sub} /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Next week" hitSlop={10} onPress={() => onWeek(1)}><Ionicons name="chevron-forward" size={20} color={C.sub} /></Pressable>
        </View>
      </View>
      <View style={styles.row}>
        {states.map((s, i) => {
          const d = addDays(weekStart, i);
          const on = d === selected;
          const isToday = d === today;
          return (
            <Pressable key={d} accessibilityRole="button" accessibilityState={{ selected: on }}
              accessibilityLabel={`${d}${isToday ? ', today' : ''}${s === 'kept' ? ', all done' : s === 'missed' ? ', something missed' : ''}`}
              onPress={() => { if (!on) { Haptics.selectionAsync(); onSelect(d); } }}
              style={({ pressed }) => [styles.pill, isToday && !on && styles.pillToday, on && styles.pillOn, pressed && { transform: [{ scale: 0.95 }] }]}>
              <Text style={[styles.letter, on && styles.onText]}>{LETTERS[i]}</Text>
              <Text style={[styles.num, isToday && !on && { color: ACCENT }, on && styles.onText]}>{Number(d.slice(8))}</Text>
              <View style={[styles.dot, s === 'kept' && { backgroundColor: on ? '#FFF' : ACCENT }, s === 'missed' && { borderWidth: 1.5, borderColor: on ? '#FFF' : C.coral }, s === 'open' && { backgroundColor: on ? 'rgba(255,255,255,0.6)' : '#C4B5FD' }]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  label: { fontSize: 13, color: C.sub, fontFamily: F.semibold },
  arrows: { flexDirection: 'row', gap: 14 },
  row: { flexDirection: 'row', gap: 6 },
  pill: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 22, gap: 4, backgroundColor: '#FFF', borderWidth: 1, borderColor: C.line },
  pillToday: { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' },
  pillOn: { backgroundColor: ACCENT, borderColor: ACCENT, shadowColor: ACCENT, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  letter: { fontSize: 11, color: C.sub, fontFamily: F.semibold },
  num: { fontSize: 18, color: C.text, fontFamily: F.bold },
  onText: { color: '#FFF' },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
