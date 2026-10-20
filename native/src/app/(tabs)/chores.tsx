// Chores (frames C1 Mine · C1b Whole house · C1c Shared pool). Home's pool banner opens this with view=pool.
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarDays, Check as Tick, ChevronRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DAY_NAMES, weekdayOf } from '@domain/time.ts';
import { useChoreActions } from '@/lib/actions';
import { avatarUrl } from '@/lib/avatar';
import { choresView } from '@/lib/chores-view';
import { choreMap, pool } from '@/lib/selectors';
import { useAppState, useMe } from '@/lib/state';
import type { Assignment } from '@/lib/types';
import { Celebration } from '@/ui/celebration';
import { durations, enter, motion, useReducedMotion } from '@/ui/motion';
import { color, layout } from '@/ui/tokens';
import { Avatar, effortKind, IconButton, MeshBackground, PoolRow, SectionHeader, SegmentedControl, Tap, TaskRow, Txt, useTitleBar } from '@/ui/v2';

type View3 = 'me' | 'all' | 'pool';
const spring = LinearTransition.springify().damping(motion.tab.damping).stiffness(motion.tab.stiffness).mass(motion.tab.mass);
const short = (d: string) => DAY_NAMES[weekdayOf(d)].slice(0, 3);
const clock = (iso: string) => new Date(iso).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' }).replace(':00', '').toLowerCase();

export default function Chores() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const titleBar = useTitleBar('Chores');
  const reduced = useReducedMotion();
  const params = useLocalSearchParams<{ view?: string }>();
  const { me, state } = useMe();
  const { refetch, isRefetching } = useAppState();
  const { toggle, claim, celebration, closeCelebration } = useChoreActions();
  const [view, setView] = useState<View3>(params.view === 'pool' ? 'pool' : 'me');
  const [showDone, setShowDone] = useState(false);
  useEffect(() => { if (params.view === 'pool') setView('pool'); }, [params.view]);

  const chores = choreMap(state);
  const waiting = pool(state, me);
  const v = choresView(state, me, view === 'all' ? 'all' : 'me');
  const member = (id: string) => state.members.find((m) => m.user_id === id);

  const meta = (a: Assignment) => {
    if (a.status === 'missed') return `Missed ${short(a.day)}`;
    if (a.status === 'done' && a.done_at && view === 'all') return `Done ${clock(a.done_at)}`;
    if (a.claimed_by === me && a.user_id !== me) return `Covering for ${(member(a.user_id)?.name ?? 'a roommate').split(' ')[0]}`;
    return a.day === state.today ? 'Today' : short(a.day);
  };

  const row = (a: Assignment, i: number) => {
    const c = chores.get(a.chore_id);
    const who = a.claimed_by ?? a.user_id;
    const mine = who === me;
    const done = a.status === 'done';
    const canTick = mine && a.day <= state.today && a.status !== 'missed';
    const m = member(who);
    const badge = view === 'all' && !mine && m ? (
      <View accessibilityLabel={`${m.name}${done ? ', done' : ''}`}>
        <Avatar name={m.name} uri={m.avatar_path ? avatarUrl(m.avatar_path) : null} tint={m.color ?? undefined} size={32} />
        {done && <View style={styles.doneDot}><Tick size={8} color={color.text.onAccent} strokeWidth={3.5} /></View>}
      </View>
    ) : undefined;
    return (
      <Animated.View key={a.id} entering={reduced ? undefined : enter(i, reduced)} exiting={FadeOut.duration(durations.fade)} layout={spring}>
        <TaskRow icon={c?.icon} title={c?.name ?? 'A chore'} tag={a.status === 'missed' ? 'inPool' : effortKind(a.effort)}
          state={done ? 'done' : view === 'all' && mine ? 'mine' : 'todo'} meta={meta(a)} right={badge} plainCheck
          onToggle={canTick ? () => toggle(a) : undefined} onPress={() => router.push({ pathname: '/why', params: { id: a.id } })} />
      </Animated.View>
    );
  };

  const chevron = useAnimatedStyle(() => ({ transform: [{ rotate: withSpring(showDone ? '90deg' : '0deg', motion.pop) }] }));

  return (
    <View style={styles.root}>
      <MeshBackground />
      <Animated.ScrollView onScroll={titleBar.onScroll} scrollEventThrottle={16} contentContainerStyle={[styles.page, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 130 }]} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={color.action.primary} />}>
        <View style={styles.head}>
          <Txt v="Title/Page" accessibilityRole="header">Chores</Txt>
          <IconButton icon={CalendarDays} label="Calendar" onPress={() => router.push('/calendar')} />
        </View>

        <SegmentedControl<View3> value={view} onChange={(x) => { setView(x); setShowDone(false); }}
          options={[{ value: 'me', label: 'Mine' }, { value: 'all', label: 'Whole house' }, { value: 'pool', label: 'Shared pool', count: waiting.length }]} />

        {view === 'pool' ? (
          <Animated.View key="pool" entering={FadeIn.duration(durations.fade)} style={{ gap: layout.itemGap }}>
            {waiting.length === 0
              ? <Txt v="Meta" c={color.text.secondary} style={styles.foot}>Nothing slipped through. The pool is empty.</Txt>
              : waiting.map((a, i) => {
                const c = chores.get(a.chore_id);
                return (
                  <Animated.View key={a.id} entering={reduced ? undefined : enter(i, reduced)} exiting={FadeOut.duration(durations.fade)} layout={spring}>
                    <PoolRow icon={c?.icon} title={c?.name ?? 'A chore'} tag={effortKind(a.effort)} onClaim={() => claim(a)} />
                  </Animated.View>
                );
              })}
            {waiting.length > 0 && <Txt v="Meta" c={color.text.secondary} style={styles.foot}>Chores that slipped through. Claim one to help out.</Txt>}
          </Animated.View>
        ) : (
          <Animated.View key={view} entering={FadeIn.duration(durations.fade)} style={{ gap: 28 }}>
            <View style={{ gap: layout.itemGap }}>
              <SectionHeader title="Today" note={v.todayLeft ? `${v.todayLeft} to do` : 'All done'} />
              {v.today.length === 0
                ? <Txt v="Meta" c={color.text.secondary}>Nothing on your list today.</Txt>
                : v.today.map(row)}
            </View>
            {v.later.length > 0 && (
              <View style={{ gap: layout.itemGap }}>
                <SectionHeader title="Later this week" note={v.laterLeft ? `${v.laterLeft} to do` : undefined} />
                {v.later.map((a, i) => row(a, i + v.today.length))}
              </View>
            )}
            {v.done.length > 0 && (
              <View style={{ gap: layout.itemGap }}>
                <Tap onPress={() => setShowDone((x) => !x)} feel="select" style={{ alignSelf: 'flex-start' }}
                  accessibilityState={{ expanded: showDone }} accessibilityLabel={`Done, ${v.done.length}`}>
                  <View style={styles.doneChip}>
                    <Txt v="Tag" c={color.text.secondary}>{`Done · ${v.done.length}`}</Txt>
                    <Animated.View style={chevron}><ChevronRight size={14} color={color.text.secondary} strokeWidth={2.25} /></Animated.View>
                  </View>
                </Tap>
                {showDone && v.done.map(row)}
              </View>
            )}
          </Animated.View>
        )}
      </Animated.ScrollView>
      {titleBar.bar}
      <Celebration info={celebration} onClose={closeCelebration} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  page: { paddingHorizontal: layout.margin, gap: 20 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  foot: { textAlign: 'center', marginTop: 4 },
  doneChip: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 32, paddingHorizontal: 14, borderRadius: 16, backgroundColor: 'rgba(135,107,222,0.14)' },
  doneDot: { position: 'absolute', right: -2, bottom: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#3F9A4A', borderWidth: 1.5, borderColor: color.bg.surface, alignItems: 'center', justifyContent: 'center' },
});
