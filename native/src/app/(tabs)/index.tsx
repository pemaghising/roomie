import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import { useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DAY_NAMES, weekdayOf } from '@domain/time.ts';
import { F } from '@/constants/theme';
import { useChoreActions } from '@/lib/actions';
import { usePantryActions } from '@/lib/pantry';
import { choreMap, grabbable, incomingSwaps, myRestocks, myTasksOn, namesOf, nextUp, pendingDraft, roommates, unreadCount } from '@/lib/selectors';
import { useAppState, useMe } from '@/lib/state';
import { milestoneState } from '@/lib/plant';
import { primerSeen, pushStatus } from '@/lib/push';
import { scrollShrink } from '@/lib/tab-shrink';
import { houseWeek } from '@/lib/recap';
import { getMilestoneSeen, getStreakGoal, setMilestoneSeen, setStreakGoal } from '@/lib/streak-goal';
import { Banner } from '@/ui/banner';
import { Celebration } from '@/ui/celebration';
import { GrabCard } from '@/ui/grab-card';
import { C, usePull } from '@/ui/kit';
import { MilestoneCelebration } from '@/ui/milestone';
import { RestockTaskRow } from '@/ui/restock-row';
import { SwipeTask } from '@/ui/swipe-task';
import { RoommatesCard } from '@/ui/roommates-card';
import { StreakCard } from '@/ui/streak-card';
import { TaskRow } from '@/ui/task-row';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning ✨' : h < 17 ? 'Good afternoon ☀️' : 'Good evening 🌙';
};

export default function Home() {
  const router = useRouter();
  const { me, state } = useMe();
  const pull = usePull(useAppState().refetch);
  const { toggle, claim, celebration, closeCelebration } = useChoreActions();
  const chores = choreMap(state);
  const tasks = myTasksOn(state, me, state.today);
  const people = roommates(state, state.today).sort((a, b) => Number(b.user_id === me) - Number(a.user_id === me));
  const next = nextUp(state, me, state.today);
  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const draft = pendingDraft(state);
  const pantry = usePantryActions();
  const names = namesOf(state);
  const grab = grabbable(state, me);
  const errands = myRestocks(state, me);
  const totalTasks = tasks.length + errands.length;
  const topChore = grab.chores[0];
  const topRestock = grab.restocks[0];
  const swaps = incomingSwaps(state, me);
  const streak = state.streak?.current ?? 0;
  const first = state.profile.name.split(' ')[0];
  const unread = unreadCount(state, me);
  const [goal, setGoal] = useState(getStreakGoal);
  const week = houseWeek(state);
  const pickGoal = () =>
    Alert.alert('Set a streak goal', 'Commit to keeping the house clean together for a stretch.', [
      ...[3, 5, 7].map((d) => ({ text: `${d} days`, onPress: () => { setStreakGoal(d); setGoal(d); } })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  const [milestone, setMilestone] = useState<number | null>(null);
  useEffect(() => {
    const seen = getMilestoneSeen();
    const m = milestoneState(streak, seen);
    if (m.seen !== seen) setMilestoneSeen(m.seen);
    setMilestone(m.celebrate);
  }, [streak]);
  // the first time someone lands on Home, explain reminders before the system asks
  useEffect(() => {
    if (primerSeen()) return;
    let live = true;
    void pushStatus().then((s) => { if (live && s === 'undetermined') setTimeout(() => live && router.push('/reminders'), 1200); });
    return () => { live = false; };
  }, [router]);
  const closeMilestone = () => {
    if (milestone) setMilestoneSeen(milestone);
    // a good moment to ask for a rating; the OS decides whether the prompt actually shows
    if (milestone && milestone >= 7) void StoreReview.isAvailableAsync().then((ok) => { if (ok) void StoreReview.requestReview(); }).catch(() => {});
    setMilestone(null);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <View style={styles.page}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.hello} numberOfLines={1}>Hello, {first}.</Text>
          </View>
          <Pressable accessibilityLabel={unread ? `Activity, ${unread} new` : 'Activity'} onPress={() => router.push('/activity')} hitSlop={8}
            style={({ pressed }) => [styles.gear, pressed && { opacity: 0.6 }]}>
            <Ionicons name="notifications-outline" size={20} color={C.text} />
            {unread > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text></View>}
          </Pressable>
        </View>

        {draft && !draft.approved_by.includes(me) && <Banner icon="calendar-outline" text="Next week's plan is ready. Take a look" onPress={() => router.push('/plan')} />}
        {swaps.length > 0 && (
          <Banner icon="swap-horizontal" onPress={() => router.push('/plan')}
            text={swaps.length === 1 ? `${namesOf(state)[swaps[0].from_user] ?? 'A roommate'} wants to swap. Take a look` : `${swaps.length} swap requests. Take a look`} />
        )}

        <StreakCard streak={streak} dates={week.dates} days={week.days} today={state.today} goal={goal} onShare={() => router.push('/recap')} onPickGoal={pickGoal} />
        {grab.count > 0 && (
          <View style={{ marginTop: 10 }}>
            <GrabCard count={grab.count} onOpen={() => router.push('/chores')}
              title={topChore ? (chores.get(topChore.chore_id)?.name ?? 'A chore') : `Buy ${topRestock.name}`}
              sub={topChore ? `Missed by ${names[topChore.user_id] ?? 'a roommate'}` : `Requested by ${names[topRestock.requested_by] ?? 'a roommate'}`}
              onClaim={topChore ? () => claim(topChore) : () => pantry.claim(topRestock, me)} />
          </View>
        )}
        <View style={{ height: 10 }} />
        <RoommatesCard people={people} me={me} canInvite={state.members.length < 8} onInvite={() => router.push('/invite')} onCheer={(to) => router.push({ pathname: '/kudos', params: { to } })} />

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Today's Tasks</Text>
          {totalTasks > 0 && <Text style={styles.sectionCount}>{doneCount === totalTasks ? 'All done 🎉' : `${doneCount} of ${totalTasks} done`}</Text>}
        </View>

        {/* everything above stays put; only the task list scrolls, so the whole home fits on one screen */}
        <ScrollView style={{ flex: 1 }} {...scrollShrink} showsVerticalScrollIndicator={false} contentContainerStyle={styles.tasks} refreshControl={<RefreshControl {...pull} />}>
          {totalTasks === 0 && <Text style={styles.empty}>No tasks today 🎉 Check back tomorrow.</Text>}
          {tasks.map((a) => (
            <Animated.View key={a.id} layout={LinearTransition.duration(240)} entering={FadeIn}>
              <SwipeTask done={a.status === 'done'} onToggle={() => toggle(a)}>
              <TaskRow a={a} chore={chores.get(a.chore_id)} sub={a.claimed_by === me && a.user_id !== me ? `Covering for ${(names[a.user_id] ?? 'a roommate').split(' ')[0]}` : undefined}
                onToggle={() => toggle(a)} onInfo={() => router.push({ pathname: '/why', params: { id: a.id } })} />
              </SwipeTask>
            </Animated.View>
          ))}
          {errands.map((r) => (
            <Animated.View key={r.id} layout={LinearTransition.duration(240)} entering={FadeIn}>
              <RestockTaskRow r={r} requester={(names[r.requested_by] ?? 'a roommate').split(' ')[0]} onDone={() => pantry.complete(r, me)} onUnclaim={() => pantry.unclaim(r)} />
            </Animated.View>
          ))}
          {next && (
            <Pressable accessibilityRole="button" accessibilityLabel={`Next up on ${DAY_NAMES[weekdayOf(next.day)]}: ${chores.get(next.chore_id)?.name ?? 'a chore'}`}
              onPress={() => router.push('/chores')} style={({ pressed }) => [styles.next, pressed && { opacity: 0.7 }]}>
              <View style={styles.date}>
                <Text style={styles.dateDay}>{DAY_NAMES[weekdayOf(next.day)].slice(0, 3).toUpperCase()}</Text>
                <Text style={styles.dateNum}>{Number(next.day.slice(8))}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextLabel}>COMING UP</Text>
                <Text style={styles.nextTitle} numberOfLines={1}>{chores.get(next.chore_id)?.icon ?? '✨'}  {chores.get(next.chore_id)?.name ?? 'A chore'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.faint} />
            </Pressable>
          )}
        </ScrollView>
      </View>
      <Celebration info={celebration} onClose={closeCelebration} />
      <MilestoneCelebration days={milestone} onClose={closeMilestone} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.page },
  page: { flex: 1, paddingHorizontal: 24 },
  tasks: { paddingBottom: 110 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingBottom: 10 },
  greeting: { fontSize: 13, color: C.sub, fontFamily: F.regular },
  hello: { fontSize: 26, color: C.text, fontFamily: F.display, marginTop: 1 },
  badge: { position: 'absolute', top: -2, right: -2, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, backgroundColor: '#8B5CF6', borderWidth: 2, borderColor: C.page, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 11, color: '#FFF', fontFamily: F.bold },
  gear: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.field, alignItems: 'center', justifyContent: 'center' },
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 14, marginBottom: 8 },
  sectionTitle: { fontSize: 20, color: C.text, fontFamily: F.display },
  sectionCount: { fontSize: 13, color: C.sub, fontFamily: F.semibold },
  empty: { fontSize: 15, color: C.sub, fontFamily: F.regular, paddingVertical: 12 },
  next: { backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: C.line, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  date: { width: 46, height: 50, borderRadius: 14, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  dateDay: { fontSize: 10, letterSpacing: 0.8, color: '#7C3AED', fontFamily: F.bold },
  dateNum: { fontSize: 20, lineHeight: 24, color: '#4C1D95', fontFamily: F.display },
  nextLabel: { fontSize: 10, letterSpacing: 1, color: C.sub, fontFamily: F.bold },
  nextTitle: { fontSize: 15, color: C.text, fontFamily: F.bold, marginTop: 2 },
});
