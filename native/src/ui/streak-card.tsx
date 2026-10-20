import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { F } from '@/constants/theme';
import type { DayState } from '@/lib/recap';
import { StreakPlant } from './streak-plant';

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function Day({ state, letter, today }: { state: DayState; letter: string; today: boolean }) {
  return (
    <View style={styles.day}>
      <Text style={[styles.letter, today && styles.letterToday]}>{letter}</Text>
      <View style={[styles.dayDot, state === 'kept' && styles.kept, state === 'open' && styles.open, state === 'missed' && styles.missed]}>
        {state === 'kept' && <Ionicons name="checkmark" size={14} color="#5B21B6" />}
        {state === 'missed' && <View style={styles.missedMark} />}
      </View>
    </View>
  );
}

/** Compact streak hero (it lives at the top of a one-screen Home): number, plant, the household's week, and the goal as one small pill. */
export function StreakCard({ streak, dates, days, today, goal, onShare, onPickGoal }: {
  streak: number; dates: string[]; days: DayState[]; today: string; goal: number | null; onShare: () => void; onPickGoal: () => void;
}) {
  const reached = goal !== null && streak >= goal;
  const kept = days.filter((d) => d === 'kept').length;
  return (
    <LinearGradient colors={['#8B5CF6', '#5B21B6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={styles.top}>
        <View style={styles.chip}><Text style={styles.chipText}>CLEAN STREAK</Text></View>
        {goal !== null && !reached ? (
          <View style={styles.pill} accessible accessibilityLabel={`${goal - streak} days to your ${goal}-day goal`}>
            <Text style={styles.pillText}>{streak}/{goal} goal</Text>
          </View>
        ) : (
          <Pressable accessibilityRole="button" onPress={onPickGoal} hitSlop={8} style={styles.pill}>
            <Text style={styles.pillText}>{reached ? `🏆 Goal reached · new goal` : '+ Set a goal'}</Text>
          </Pressable>
        )}
        <View style={{ flex: 1 }} />
        <Pressable accessibilityRole="button" accessibilityLabel="Share our week" hitSlop={14} onPress={onShare} style={({ pressed }) => pressed && { opacity: 0.5 }}>
          <Ionicons name="share-outline" size={22} color="#FFF" />
        </Pressable>
      </View>

      <View style={styles.hero}>
        <View accessible accessibilityLabel={`${streak} ${streak === 1 ? 'day' : 'days'} in a row`}>
          <Text style={styles.num}>{streak}</Text>
          <Text style={styles.unit}>{streak === 1 ? 'day in a row' : 'days in a row'}</Text>
        </View>
        <StreakPlant streak={streak} height={78} />
      </View>

      <View style={styles.week} accessible accessibilityLabel={`This week, ${kept} of 7 days kept`}>
        {days.map((d, i) => <Day key={dates[i]} state={d} letter={LETTERS[i]} today={dates[i] === today} />)}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 28, padding: 14, overflow: 'hidden' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chip: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 11, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 10, letterSpacing: 1.4, color: '#FFF', fontFamily: F.bold },
  pill: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 11, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 11, color: '#FFF', fontFamily: F.bold },
  hero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, marginBottom: 6 },
  num: { fontSize: 56, lineHeight: 62, color: '#FFF', fontFamily: F.display },
  unit: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontFamily: F.semibold, marginTop: -4 },
  week: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 8 },
  day: { alignItems: 'center', gap: 4, width: 34 },
  letter: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: F.semibold },
  letterToday: { color: '#FFF', fontFamily: F.bold },
  dayDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  kept: { backgroundColor: '#FFF' },
  open: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#FFF', borderStyle: 'dashed' },
  missed: { backgroundColor: 'rgba(255,255,255,0.10)' },
  missedMark: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' },
});
