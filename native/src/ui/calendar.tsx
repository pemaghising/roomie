import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { weekdayOf, weekStartOf } from '@domain/time.ts';
import { F } from '@/constants/theme';
import { C } from './kit';

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** A Sunday-first month grid. `marks` gives each date a few dot colours; the selected date's whole week is tinted. */
export function MonthCalendar({ month, selected, today, marks, onSelect, onMonth, onToday }: {
  month: string; // YYYY-MM
  selected: string; today: string; marks: Record<string, string[]>;
  onSelect: (d: string) => void; onMonth: (delta: number) => void; onToday: () => void;
}) {
  const [y, m] = month.split('-').map(Number);
  const first = `${month}-01`;
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = [
    ...Array(weekdayOf(first)).fill(null),
    ...Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`),
  ];
  while (cells.length % 7) cells.push(null);
  const rows = Array.from({ length: cells.length / 7 }, (_, r) => cells.slice(r * 7, r * 7 + 7));
  const week = weekStartOf(selected);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.month}>{MONTHS[m - 1]} <Text style={styles.year}>{y}</Text></Text>
        <Pressable accessibilityRole="button" onPress={() => { Haptics.selectionAsync(); onToday(); }} hitSlop={6} style={styles.todayBtn}><Text style={styles.todayText}>Today</Text></Pressable>
        <Pressable accessibilityLabel="Previous month" onPress={() => { Haptics.selectionAsync(); onMonth(-1); }} hitSlop={8} style={styles.arrow}><Ionicons name="chevron-back" size={20} color={C.text} /></Pressable>
        <Pressable accessibilityLabel="Next month" onPress={() => { Haptics.selectionAsync(); onMonth(1); }} hitSlop={8} style={styles.arrow}><Ionicons name="chevron-forward" size={20} color={C.text} /></Pressable>
      </View>
      <View style={styles.row}>{DOW.map((d, i) => <Text key={i} style={styles.dow}>{d}</Text>)}</View>
      {rows.map((r, ri) => (
        <View key={ri} style={[styles.row, r.some((c) => c && weekStartOf(c) === week) && styles.weekBand]}>
          {r.map((d, ci) => {
            if (!d) return <View key={ci} style={styles.cell} />;
            const on = d === selected;
            const dots = marks[d] ?? [];
            return (
              <Pressable key={d} accessibilityRole="button" accessibilityLabel={`${Number(d.slice(8))} ${MONTHS[m - 1]}${d === today ? ', today' : ''}${dots.length ? ', has chores' : ''}`}
                onPress={() => { Haptics.selectionAsync(); onSelect(d); }} style={styles.cell}>
                <View style={[styles.num, on && styles.numOn, !on && d === today && styles.numToday]}>
                  <Text style={[styles.numText, on && { color: '#FFF' }, !on && d === today && { color: C.lavenderText }]}>{Number(d.slice(8))}</Text>
                </View>
                <View style={styles.dots}>{dots.slice(0, 3).map((c, i) => <View key={i} style={[styles.dot, { backgroundColor: c }]} />)}</View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderRadius: 24, borderWidth: 1, borderColor: C.line, padding: 14, marginBottom: 22 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, paddingHorizontal: 4 },
  month: { flex: 1, fontSize: 22, color: C.text, fontFamily: F.display },
  year: { fontSize: 16, color: C.sub, fontFamily: F.semibold },
  todayBtn: { backgroundColor: C.lavender, paddingHorizontal: 12, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  todayText: { fontSize: 13, color: C.lavenderText, fontFamily: F.bold },
  arrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.field, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', borderRadius: 16 },
  weekBand: { backgroundColor: '#F7F2FF' },
  dow: { flex: 1, textAlign: 'center', fontSize: 12, color: C.faint, fontFamily: F.semibold, paddingBottom: 6 },
  cell: { flex: 1, height: 52, alignItems: 'center', paddingTop: 4 },
  num: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  numOn: { backgroundColor: C.text },
  numToday: { borderWidth: 1.5, borderColor: '#A78BFA' },
  numText: { fontSize: 15, color: C.text, fontFamily: F.medium },
  dots: { flexDirection: 'row', gap: 3, height: 6, marginTop: 3 },
  dot: { width: 5, height: 5, borderRadius: 3 },
});
