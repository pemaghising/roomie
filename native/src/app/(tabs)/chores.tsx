import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { effortLabel } from '@domain/copy.ts';
import { openRestocks } from '@domain/pantry.ts';
import { addDays, DAY_NAMES, weekdayOf, weekStartOf } from '@domain/time.ts';
import { F } from '@/constants/theme';
import { useChoreActions } from '@/lib/actions';
import { usePantryActions } from '@/lib/pantry';
import { scrollShrink } from '@/lib/tab-shrink';
import { weekStates } from '@/lib/recap';
import { choreMap, namesOf, pool } from '@/lib/selectors';
import { useAppState, useMe } from '@/lib/state';
import { Art } from '@/ui/art';
import { Celebration } from '@/ui/celebration';
import { MonthCalendar } from '@/ui/calendar';
import { C, usePull } from '@/ui/kit';
import { RestockRow } from '@/ui/restock-row';
import { AssigneeBadge, EFFORT, TaskRow } from '@/ui/task-row';
import { WeekStrip } from '@/ui/week-strip';
import { SwipeTask } from '@/ui/swipe-task';
import { tasksOn, type Who } from '@/ui/week-view';

const layout = LinearTransition.duration(240);
const ACCENT = '#7C3AED';

const monthStart = (month: string, delta: number) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 10);
};

export default function Chores() {
  const router = useRouter();
  const { me, state } = useMe();
  const pull = usePull(useAppState().refetch);
  const { toggle, claim, celebration, closeCelebration } = useChoreActions();
  const pantry = usePantryActions();
  const chores = choreMap(state);
  const names = namesOf(state);
  const missed = pool(state, me);
  const requests = openRestocks(state.restocks);

  const [who, setWho] = useState<Who>('me');
  const [selected, setSelected] = useState(state.today);
  const [showMonth, setShowMonth] = useState(false);
  const month = selected.slice(0, 7);
  const ws = weekStartOf(selected);

  const states = weekStates(state, ws, (d) => tasksOn(state, me, who, d));
  const items = tasksOn(state, me, who, selected);
  const done = items.filter((a) => a.status === 'done').length;
  const person = (id: string) => (id === me ? 'You' : (names[id] ?? 'A roommate').split(' ')[0]);
  const member = (id: string) => state.members.find((m) => m.user_id === id);

  const dayName = DAY_NAMES[weekdayOf(selected)];
  const tag = selected === state.today ? 'Today' : selected === addDays(state.today, 1) ? 'Tomorrow' : selected === addDays(state.today, -1) ? 'Yesterday' : null;
  const others = Array.from({ length: 7 }, (_, i) => addDays(ws, i)).filter((d) => d !== selected)
    .map((d) => ({ d, list: tasksOn(state, me, who, d) })).filter((x) => x.list.length > 0);

  // a few dots per day, one per effort level present, so the month shows where the work is
  const marks: Record<string, string[]> = {};
  if (showMonth) {
    const [y, m] = month.split('-').map(Number);
    for (let d = 1; d <= new Date(Date.UTC(y, m, 0)).getUTCDate(); d++) {
      const date = `${month}-${String(d).padStart(2, '0')}`;
      const levels = [...new Set(tasksOn(state, me, who, date).map((a) => effortLabel(a.effort)))];
      if (levels.length) marks[date] = levels.map((l) => EFFORT[l].text);
    }
  }
  const goMonth = (delta: number) => {
    const first = monthStart(month, delta);
    setSelected(first.slice(0, 7) === state.today.slice(0, 7) ? state.today : first);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScrollView {...scrollShrink} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} refreshControl={<RefreshControl {...pull} />}>
        <View style={styles.header}>
          <Text style={styles.title}>Chores</Text>
          <View style={styles.actions}>
            {selected !== state.today && (
              <Animated.View entering={FadeIn} exiting={FadeOut}>
                <Pressable accessibilityRole="button" accessibilityLabel="Jump to today" onPress={() => { Haptics.selectionAsync(); setSelected(state.today); }} style={styles.todayChip}>
                  <Text style={styles.todayChipText}>Today</Text>
                </Pressable>
              </Animated.View>
            )}
            <Pressable accessibilityRole="button" accessibilityLabel="Week plan and swaps" onPress={() => { Haptics.selectionAsync(); router.push('/plan'); }} style={styles.iconBtn}>
              <Ionicons name="git-compare-outline" size={20} color={C.text} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={showMonth ? 'Hide month calendar' : 'Show month calendar'} accessibilityState={{ expanded: showMonth }}
              onPress={() => { Haptics.selectionAsync(); setShowMonth((v) => !v); }} style={[styles.iconBtn, showMonth && styles.iconBtnOn]}>
              <Ionicons name="calendar-outline" size={20} color={showMonth ? '#FFF' : C.text} />
            </Pressable>
          </View>
        </View>

        {(missed.length > 0 || requests.length > 0) && (
          <Animated.View layout={layout} entering={FadeIn} exiting={FadeOut} style={styles.grabsHead}>
            <View style={styles.grabsPill}><Text style={styles.grabsText}>🙌 Up for grabs</Text><View style={styles.grabsCount}><Text style={styles.grabsCountText}>{missed.length + requests.length}</Text></View></View>
          </Animated.View>
        )}
        {missed.map((a) => (
          <Animated.View key={a.id} layout={layout} entering={FadeIn} exiting={FadeOut.duration(150)}>
            <TaskRow a={a} chore={chores.get(a.chore_id)} showEffort onClaim={() => claim(a)}
              sub={`Missed by ${names[a.user_id] ?? 'a roommate'}`} />
          </Animated.View>
        ))}
        {requests.map((r) => (
          <Animated.View key={r.id} layout={layout} entering={FadeIn} exiting={FadeOut.duration(150)}>
            <RestockRow r={r} me={me} requester={names[r.requested_by] ?? 'a roommate'} claimerName={r.claimed_by ? names[r.claimed_by] : undefined}
              onClaim={() => pantry.claim(r, me)} onUnclaim={() => pantry.unclaim(r)} onDone={() => pantry.complete(r, me)} onCancel={() => pantry.cancel(r)} />
          </Animated.View>
        ))}
        {(missed.length > 0 || requests.length > 0) && <View style={{ height: 8 }} />}

        {showMonth && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={{ marginBottom: 14 }}>
            <MonthCalendar month={month} selected={selected} today={state.today} marks={marks}
              onSelect={setSelected} onMonth={goMonth} onToday={() => setSelected(state.today)} />
          </Animated.View>
        )}

        <WeekStrip weekStart={ws} selected={selected} today={state.today} states={states} onSelect={setSelected}
          onWeek={(delta) => setSelected(addDays(selected, delta * 7))} />

        <View style={styles.filters} accessibilityRole="radiogroup">
          {([['me', 'Just me'], ['all', 'Everyone']] as const).map(([v, label]) => (
            <Pressable key={v} accessibilityRole="radio" accessibilityState={{ selected: who === v }} onPress={() => { if (who !== v) { Haptics.selectionAsync(); setWho(v); } }}
              style={[styles.chip, who === v && styles.chipOn]}>
              <Text style={[styles.chipText, who === v && styles.chipTextOn]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.dayHead}>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.day}>{dayName}</Text>
            <Text style={styles.date}>{tag ? `${tag} · ` : ''}{Number(selected.slice(8))} {new Date(`${selected}T00:00:00Z`).toLocaleString('en', { month: 'long', timeZone: 'UTC' })}</Text>
          </View>
          {items.length > 0 && (
            <View style={[styles.count, done === items.length && styles.countDone]}>
              <Text style={[styles.countText, done === items.length && { color: '#15803D' }]}>{done === items.length ? 'All done' : `${done} of ${items.length}`}</Text>
            </View>
          )}
        </View>

        {items.length === 0 ? (
          <Animated.View entering={FadeIn} style={styles.empty}>
            <Art name="quiet" width={190} />
            <Text style={styles.emptyTitle}>Nothing planned.</Text>
            <Text style={styles.emptyBody}>Enjoy the quiet.</Text>
          </Animated.View>
        ) : items.map((a) => {
          const assignee = a.claimed_by ?? a.user_id;
          const canTick = assignee === me && selected <= state.today && a.status !== 'missed';
          const m = member(assignee);
          const sub = who === 'all'
            ? `${person(assignee)}${a.status === 'missed' ? ' · Missed' : a.claimed_by && a.claimed_by !== a.user_id ? ` · covering ${person(a.user_id)}` : ''}`
            : a.status === 'missed' ? 'Missed' : undefined;
          return (
            <Animated.View key={a.id} layout={layout} entering={FadeIn.duration(180)}>
              <SwipeTask enabled={canTick} done={a.status === 'done'} onToggle={() => toggle(a)}>
                <TaskRow a={a} chore={chores.get(a.chore_id)} showEffort sub={sub} readOnly={!canTick}
                  badge={who === 'all' && m ? <AssigneeBadge name={m.name} color={m.color} path={m.avatar_path} done={a.status === 'done'} /> : undefined}
                  onToggle={canTick ? () => toggle(a) : undefined} onInfo={() => router.push({ pathname: '/why', params: { id: a.id } })} />
              </SwipeTask>
            </Animated.View>
          );
        })}

        {others.length > 0 && (
          <View style={{ marginTop: 14 }}>
            <Text style={styles.section}>Also this week</Text>
            {others.map(({ d, list }) => (
              <Pressable key={d} accessibilityRole="button" accessibilityLabel={`${DAY_NAMES[weekdayOf(d)]}, ${list.length} chores`} onPress={() => { Haptics.selectionAsync(); setSelected(d); }}
                style={({ pressed }) => [styles.later, pressed && { opacity: 0.7 }]}>
                <View style={styles.laterDay}>
                  <Text style={styles.laterName}>{DAY_NAMES[weekdayOf(d)].slice(0, 3)}</Text>
                  <Text style={styles.laterNum}>{Number(d.slice(8))}</Text>
                </View>
                <View style={styles.laterIcons}>
                  {list.slice(0, 4).map((a) => <Text key={a.id} style={{ fontSize: 20 }}>{chores.get(a.chore_id)?.icon ?? '✨'}</Text>)}
                </View>
                <Text style={styles.laterCount}>{list.length} chore{list.length === 1 ? '' : 's'}</Text>
                <Ionicons name="chevron-forward" size={16} color={C.faint} />
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ height: 150 }} />
      </ScrollView>

      <Pressable accessibilityRole="button" accessibilityLabel="Add a chore" onPress={() => router.push('/add-chore')}
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.95 }] }]}>
        <Ionicons name="add" size={22} color="#FFF" />
        <Text style={styles.fabText}>Add chore</Text>
      </Pressable>
      <Celebration info={celebration} onClose={closeCelebration} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.page },
  scroll: { paddingHorizontal: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, paddingBottom: 18 },
  title: { fontSize: 32, color: C.text, fontFamily: F.display },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  todayChip: { height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  todayChipText: { fontSize: 13, color: '#5B21B6', fontFamily: F.bold },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.field, alignItems: 'center', justifyContent: 'center' },
  iconBtnOn: { backgroundColor: ACCENT },
  filters: { flexDirection: 'row', gap: 8, marginTop: 18, marginBottom: 20 },
  chip: { height: 36, paddingHorizontal: 16, borderRadius: 18, backgroundColor: '#FFF', borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: C.text, borderColor: C.text },
  chipText: { fontSize: 14, color: C.sub, fontFamily: F.semibold },
  chipTextOn: { color: '#FFF' },
  dayHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  day: { fontSize: 26, color: C.text, fontFamily: F.display },
  date: { fontSize: 14, color: C.sub, fontFamily: F.medium, marginTop: 2 },
  count: { backgroundColor: '#EDE9FE', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  countDone: { backgroundColor: '#DCFCE7' },
  countText: { fontSize: 13, color: '#5B21B6', fontFamily: F.bold },
  empty: { alignItems: 'center', paddingVertical: 24 },
  emptyTitle: { fontSize: 20, color: C.text, fontFamily: F.display, marginTop: 8 },
  emptyBody: { fontSize: 14, color: C.sub, fontFamily: F.regular, marginTop: 4 },
  section: { fontSize: 13, letterSpacing: 0.4, color: C.sub, fontFamily: F.bold, marginBottom: 10, textTransform: 'uppercase' },
  later: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: C.line, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8 },
  laterDay: { width: 40, alignItems: 'center' },
  laterName: { fontSize: 11, color: C.sub, fontFamily: F.semibold },
  laterNum: { fontSize: 18, color: C.text, fontFamily: F.bold },
  laterIcons: { flex: 1, flexDirection: 'row', gap: 6 },
  laterCount: { fontSize: 13, color: C.sub, fontFamily: F.medium },
  grabsHead: { marginBottom: 12, flexDirection: 'row' },
  grabsPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.peach, borderRadius: 16, paddingLeft: 14, paddingRight: 8, paddingVertical: 7 },
  grabsText: { fontSize: 14, color: C.peachText, fontFamily: F.bold },
  grabsCount: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  grabsCountText: { fontSize: 12, color: C.peachText, fontFamily: F.bold },
  fab: { position: 'absolute', bottom: 110, right: 24, height: 54, paddingHorizontal: 20, borderRadius: 27, backgroundColor: ACCENT, flexDirection: 'row', alignItems: 'center', gap: 6,
    shadowColor: ACCENT, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  fabText: { color: '#FFF', fontSize: 16, fontFamily: F.bold },
});
