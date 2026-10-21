// Calendar (frames C2 Month · C3 Week): my chores by day, busy days shaded, Sunday first. Opened from Chores.
import { GestureDetector } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addDays, DAY_NAMES, weekdayOf, weekStartOf } from '@domain/time.ts';
import { useChoreActions } from '@/lib/actions';
import { monthGrid } from '@/lib/month-grid';
import { choreMap, myTasksOn } from '@/lib/selectors';
import { useMe } from '@/lib/state';
import { Celebration } from '@/ui/celebration';
import { durations, enter, motion, useReducedMotion, smooth } from '@/ui/motion';
import { color, layout } from '@/ui/tokens';
import { BackButton, DAY_LETTERS, effortKind, Glass, MeshBackground, SectionHeader, Tap, TaskRow, Txt, useSwipeTabs, ViewSwitch } from '@/ui/v2';

const spring = smooth;
const short = (d: string) => DAY_NAMES[weekdayOf(d)].slice(0, 3);
const monthName = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleString('en', { month: 'long', year: 'numeric', timeZone: 'UTC' });

function DayCell({ date, today, busy, dots, selected, tall, onPress }: {
  date: string; today: boolean; busy: boolean; dots: boolean; selected: boolean; tall?: boolean; onPress: () => void;
}) {
  const fill = today ? color.action.primary : busy ? 'rgba(135,107,222,0.14)' : 'transparent';
  const num = Number(date.slice(8));
  return (
    <Tap onPress={onPress} feel="select" style={styles.cell} accessibilityState={{ selected }}
      accessibilityLabel={`${DAY_NAMES[weekdayOf(date)]} ${num}${today ? ', today' : ''}${busy ? ', busy day' : ''}${dots ? ', has chores' : ''}`}>
      <View style={[tall ? styles.pillTall : styles.circle, { backgroundColor: fill }, selected && !today && styles.selected]}>
        {tall && <Txt v="Meta/Medium" c={today ? color.text.onAccent : color.text.secondary}>{DAY_LETTERS[weekdayOf(date)]}</Txt>}
        <Txt v="Body/Row" c={today ? color.text.onAccent : color.text.primary}>{String(num)}</Txt>
        {tall && <View style={[styles.dot, { backgroundColor: dots ? (today ? color.text.onAccent : color.action.primary) : 'transparent' }]} />}
      </View>
      {!tall && <View style={[styles.dot, { backgroundColor: dots ? color.action.primary : 'transparent' }]} />}
    </Tap>
  );
}

export default function Calendar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { me, state } = useMe();
  const { toggle, celebration, closeCelebration } = useChoreActions();
  const [mode, setMode] = useState<'week' | 'month'>('month');
  const swipe = useSwipeTabs(['week', 'month'] as const, mode, setMode);
  const [selected, setSelected] = useState(state.today);
  const chores = choreMap(state);
  const busy = new Set(state.members.find((m) => m.user_id === me)?.busy_days ?? []);
  const on = (d: string) => myTasksOn(state, me, d);
  const [y, m] = selected.split('-').map(Number);
  const ws = weekStartOf(selected);

  const label = (d: string) => (d === state.today ? `Today · ${short(d)} ${Number(d.slice(8))}`
    : d === addDays(state.today, 1) ? `Tomorrow · ${short(d)} ${Number(d.slice(8))}` : `${short(d)} ${Number(d.slice(8))}`);
  // the selected day, then the rest of its week that has something on it
  const days = [selected, ...Array.from({ length: 6 }, (_, i) => addDays(selected, i + 1)).filter((d) => d < addDays(ws, 7) && on(d).length)];
  let i = 0;

  const cell = (d: string, tall?: boolean) => (
    <DayCell key={d} date={d} tall={tall} today={d === state.today} busy={busy.has(weekdayOf(d))} dots={on(d).length > 0}
      selected={d === selected} onPress={() => setSelected(d)} />
  );

  return (
    <View style={styles.root}>
      <MeshBackground />
      <GestureDetector gesture={swipe.gesture}>
      <ScrollView contentContainerStyle={[styles.page, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 130 }]} showsVerticalScrollIndicator={false}>
        <View style={{ alignSelf: 'flex-start' }}><BackButton onPress={() => router.navigate('/chores')} /></View>
        <Txt v="Title/Page" accessibilityRole="header">Calendar</Txt>
        <View style={styles.monthRow}>
          <Txt v="Heading/Section">{monthName(selected)}</Txt>
          <ViewSwitch value={mode} onChange={swipe.select} options={[{ value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]} />
        </View>

        {mode === 'month' ? (
          <Animated.View key="month" entering={swipe.entering}>
            <Glass fill={0.62} pad={14}>
              <View style={styles.week}>{DAY_LETTERS.map((l, k) => <View key={k} style={styles.cell}><Txt v="Meta/Medium" c={color.text.secondary}>{l}</Txt></View>)}</View>
              {monthGrid(y, m).map((row, r) => (
                <View key={r} style={styles.week}>{row.map((d, k) => (d ? cell(d) : <View key={k} style={styles.cell} />))}</View>
              ))}
            </Glass>
          </Animated.View>
        ) : (
          <Animated.View key="week" entering={swipe.entering}>
            <Glass fill={0.62} pad={10}>
              <View style={styles.week}>{Array.from({ length: 7 }, (_, k) => cell(addDays(ws, k), true))}</View>
            </Glass>
          </Animated.View>
        )}

        <View style={styles.legend}>
          <View style={styles.key}><View style={[styles.keyDot, { backgroundColor: color.action.primary }]} /><Txt v="Meta" c={color.text.secondary}>Today</Txt></View>
          <View style={styles.key}><View style={[styles.keyDot, { backgroundColor: 'rgba(135,107,222,0.14)' }]} /><Txt v="Meta" c={color.text.secondary}>Busy day</Txt></View>
          <View style={styles.key}><View style={[styles.dot, { backgroundColor: color.action.primary }]} /><Txt v="Meta" c={color.text.secondary}>Has chores</Txt></View>
        </View>

        {days.map((d) => (
          <Animated.View key={d} layout={spring} style={{ gap: layout.itemGap }}>
            <SectionHeader title={label(d)} />
            {on(d).length === 0
              ? <Txt v="Meta" c={color.text.secondary}>Nothing on your list.</Txt>
              : on(d).map((a) => {
                const c = chores.get(a.chore_id);
                const canTick = d <= state.today && a.status !== 'missed';
                return (
                  <Animated.View key={a.id} entering={reduced ? undefined : enter(i++, reduced)} exiting={FadeOut.duration(durations.fade)} layout={spring}>
                    <TaskRow icon={c?.icon} title={c?.name ?? 'A chore'} tag={a.status === 'missed' ? 'inPool' : effortKind(a.effort)}
                      state={a.status === 'done' ? 'done' : 'todo'} meta={d === state.today ? 'Today' : short(d)} plainCheck
                      onToggle={canTick ? () => toggle(a) : undefined} onPress={() => router.push({ pathname: '/why', params: { id: a.id } })} />
                  </Animated.View>
                );
              })}
          </Animated.View>
        ))}
      </ScrollView>
      </GestureDetector>
      <Celebration info={celebration} onClose={closeCelebration} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  page: { paddingHorizontal: layout.margin, gap: 20 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -4 },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  cell: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 3 },
  circle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  pillTall: { width: '100%', maxWidth: 44, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', gap: 2 },
  selected: { borderWidth: 1.5, borderColor: color.action.primary },
  dot: { width: 4, height: 4, borderRadius: 2 },
  legend: { flexDirection: 'row', gap: 16, marginTop: -6 },
  key: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  keyDot: { width: 10, height: 10, borderRadius: 5 },
});
