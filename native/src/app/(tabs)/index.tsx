// Home (frames H0–H8). Pool chores never appear here; the banner opens Chores → Shared pool.
import { useRouter } from 'expo-router';
import { House, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DAY_NAMES, weekdayOf } from '@domain/time.ts';
import { formatCode, useChoreActions } from '@/lib/actions';
import { avatarUrl } from '@/lib/avatar';
import { homeView } from '@/lib/home';
import { milestoneState } from '@/lib/plant';
import { primerSeen, pushStatus } from '@/lib/push';
import { choreMap, namesOf, unreadCount } from '@/lib/selectors';
import { useAppState, useMe } from '@/lib/state';
import { getMilestoneSeen, setMilestoneSeen } from '@/lib/streak-goal';
import { Celebration } from '@/ui/celebration';
import { MilestoneCelebration } from '@/ui/milestone';
import { enter, useReducedMotion, smooth } from '@/ui/motion';
import { color, layout } from '@/ui/tokens';
import { effortKind, Glass, GreetingHeader, MeshBackground, PoolBanner, SectionHeader, StreakCard, TaskRow, Txt, UpcomingCard, Emoji } from '@/ui/v2';

function Note({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <Glass fill={0.9}>
      <View style={styles.note}>
        <View style={styles.noteIcon}>{icon}</View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt v="Body/Label">{title}</Txt>
          <Txt v="Meta" c={color.text.secondary}>{sub}</Txt>
        </View>
      </View>
    </Glass>
  );
}

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { me, state } = useMe();
  const { refetch, isRefetching } = useAppState();
  const { toggle, celebration, closeCelebration } = useChoreActions();
  const v = homeView(state, me);
  const chores = choreMap(state);
  const names = namesOf(state);
  const [milestone, setMilestone] = useState<number | null>(null);

  useEffect(() => {
    const seen = getMilestoneSeen();
    const m = milestoneState(v.streakDays, seen);
    if (m.seen !== seen) setMilestoneSeen(m.seen);
    setMilestone(m.celebrate);
  }, [v.streakDays]);
  // the first time someone lands on Home, explain reminders before the system asks
  useEffect(() => {
    if (primerSeen()) return;
    let live = true;
    void pushStatus().then((s) => { if (live && s === 'undetermined') setTimeout(() => live && router.push('/reminders'), 1400); });
    return () => { live = false; };
  }, [router]);

  const next = v.upcoming[0];
  const nextLabel = next ? `${chores.get(next.chore_id)?.name ?? 'A chore'}, ${DAY_NAMES[weekdayOf(next.day)]}` : '';
  let i = 0;
  const E = () => (reduced ? undefined : enter(i++, reduced));

  return (
    <View style={styles.root}>
      <MeshBackground />
      <ScrollView contentContainerStyle={[styles.page, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 130 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={color.action.primary} />}>
        <Animated.View entering={E()}>
          <GreetingHeader name={v.firstName} uri={state.profile.avatar_path ? avatarUrl(state.profile.avatar_path) : null} dateLabel={v.dateLabel} hello={v.hello}
            unread={unreadCount(state, me) > 0} onBell={() => router.push('/activity')} onAvatar={() => router.navigate('/profile')} />
        </Animated.View>

        {v.state === 'allDone' && (
          <Animated.View entering={E()} exiting={FadeOut.duration(150)}>
            <Note icon={<House size={20} color={color.icon.default} strokeWidth={1.75} />} title="All done for today" sub={`That’s day ${v.streakDays} of the house streak.`} />
          </Animated.View>
        )}

        <Animated.View entering={E()} layout={smooth}>
          <StreakCard days={v.streakDays} week={v.week} drooped={v.drooped} />
        </Animated.View>

        {v.showPool && (
          <Animated.View entering={E()} exiting={FadeOut.duration(150)} layout={LinearTransition}>
            <PoolBanner count={v.poolCount} onPress={() => router.navigate({ pathname: '/chores', params: { view: 'pool' } })} />
          </Animated.View>
        )}

        {v.state === 'nothingDue' ? (
          <Animated.View entering={E()} style={{ gap: layout.headerToItems }}>
            <SectionHeader title="Today" />
            <Glass fill={0.62}>
              <View style={styles.quiet}>
                <Emoji value="🛋️" size={30} />
                <Txt v="Body/Label">Nothing on your plate today</Txt>
                <Txt v="Meta" c={color.text.secondary} style={{ textAlign: 'center' }}>{next ? `Enjoy the day off. Next up: ${nextLabel}.` : 'Enjoy the day off.'}</Txt>
              </View>
            </Glass>
          </Animated.View>
        ) : (
          <View style={{ gap: layout.itemGap }}>
            <Animated.View entering={E()}>
              <SectionHeader title="Your tasks today" link="Why these?" onLink={() => router.push('/why')} />
            </Animated.View>
            {v.tasks.map((a) => {
              const c = chores.get(a.chore_id);
              const covering = a.claimed_by === me && a.user_id !== me;
              return (
                <Animated.View key={a.id} entering={E()} layout={smooth}>
                  <TaskRow icon={c?.icon} title={c?.name ?? 'A chore'} tag={effortKind(a.effort)} state={a.status === 'done' ? 'done' : 'todo'}
                    meta={covering ? `Covering for ${(names[a.user_id] ?? 'a roommate').split(' ')[0]}` : undefined}
                    onToggle={() => toggle(a)} onPress={() => router.push({ pathname: '/why', params: { id: a.id } })} />
                </Animated.View>
              );
            })}
          </View>
        )}

        {v.alone && (
          <Animated.View entering={E()} exiting={FadeOut}>
            <Note icon={<Users size={20} color={color.icon.default} strokeWidth={1.75} />} title="No roommates here yet"
              sub={`Share your code ${formatCode(state.household!.invite_code)} to bring them in.`} />
          </Animated.View>
        )}

        {v.state !== 'todo' && v.upcoming.length > 0 && (
          <Animated.View entering={FadeIn.delay(160)} style={{ gap: layout.itemGap }}>
            <SectionHeader title="Coming up" />
            {v.upcoming.map((a) => {
              const c = chores.get(a.chore_id);
              return <UpcomingCard key={a.id} icon={c?.icon} title={c?.name ?? 'A chore'} sub={DAY_NAMES[weekdayOf(a.day)]} onPress={() => router.navigate('/chores')} />;
            })}
          </Animated.View>
        )}
      </ScrollView>
      <Celebration info={celebration} onClose={closeCelebration} />
      <MilestoneCelebration days={milestone} onClose={() => { if (milestone) setMilestoneSeen(milestone); setMilestone(null); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  page: { paddingHorizontal: layout.margin, gap: 16 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  noteIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(135,107,222,0.1)', alignItems: 'center', justifyContent: 'center' },
  quiet: { alignItems: 'center', gap: 6, paddingVertical: 22, paddingHorizontal: 20 },
});
