import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { F } from '@/constants/theme';
import { activityIcon, activityText, groupActivity } from '@/lib/activity-text';
import { isUnread, namesOf } from '@/lib/selectors';
import { rpc, STATE_KEY, useAppState, useMe } from '@/lib/state';
import type { ActivityItem } from '@/lib/types';
import { Art } from '@/ui/art';
import { Avatar } from '@/ui/avatar';
import { C, usePull } from '@/ui/kit';

const ACCENT = '#7C3AED';

function ago(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const h = Math.round(mins / 60);
  return h < 24 ? `${h}h` : `${Math.round(h / 24)}d`;
}

export default function Activity() {
  const router = useRouter();
  const qc = useQueryClient();
  const { me, state } = useMe();
  const pull = usePull(useAppState().refetch);
  const names = namesOf(state);
  const tz = state.household!.tz;
  // decided once on open so the New section stays for this visit even after mark-seen lands
  const unread = useRef(isUnread(state, me)).current;
  const wasUnread = useRef(new Set(state.activity.filter(unread).map((x) => x.id))).current;

  useEffect(() => {
    rpc('mark_activity_seen').then(() => qc.invalidateQueries({ queryKey: STATE_KEY })).catch(() => {});
  }, [qc]);

  const groups = groupActivity(state.activity, tz, state.today, (id) => wasUnread.has(id));
  const member = (id: string | null) => state.members.find((m) => m.user_id === id);

  const row = (item: ActivityItem, isNew: boolean, last: boolean) => {
    const who = member(item.actor);
    const icon = activityIcon(item);
    const canCheer = item.kind === 'completed' && who && who.user_id !== me;
    return (
      <View key={item.id} style={[styles.row, !last && styles.divider]}>
        <View>
          {who ? <Avatar name={who.name} color={who.color} path={who.avatar_path} size={42} />
            : <View style={[styles.sys, { backgroundColor: icon.bg }]}><Text style={{ fontSize: 20 }}>{icon.emoji}</Text></View>}
          {who && <View style={[styles.badge, { backgroundColor: icon.bg }]}><Text style={{ fontSize: 11 }}>{icon.emoji}</Text></View>}
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={styles.text}>{activityText(item, names, me)}</Text>
          {canCheer && (
            <Pressable accessibilityRole="button" accessibilityLabel={`Cheer ${who.name} on`} hitSlop={6} onPress={() => router.push({ pathname: '/kudos', params: { to: who.user_id } })}
              style={({ pressed }) => [styles.cheer, pressed && { opacity: 0.6 }]}>
              <Text style={styles.cheerText}>🙌  Cheer</Text>
            </Pressable>
          )}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Text style={styles.time}>{ago(item.created_at)}</Text>
          {isNew && <View style={styles.dot} />}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} refreshControl={<RefreshControl {...pull} />}>
        <Pressable accessibilityLabel="Back" onPress={() => router.back()} hitSlop={8} style={({ pressed }) => [styles.back, pressed && { opacity: 0.6 }]}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </Pressable>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Activity</Text>
          {wasUnread.size > 0 && <View style={styles.newChip}><Text style={styles.newChipText}>{wasUnread.size} new</Text></View>}
        </View>

        {state.activity.length === 0 && (
          <View style={styles.empty}>
            <Art name="quiet" width={210} />
            <Text style={styles.emptyTitle}>Quiet so far.</Text>
            <Text style={styles.emptyBody}>Finished, claimed and planned chores show up here.</Text>
          </View>
        )}

        {groups.map(({ label, items }) => (
          <Animated.View key={label} entering={FadeIn.duration(240)} style={{ marginBottom: 22 }}>
            <View style={styles.eyebrowRow}>
              {label === 'New' && <View style={styles.dot} />}
              <Text style={[styles.eyebrow, label === 'New' && { color: ACCENT }]}>{label.toUpperCase()}</Text>
            </View>
            <View style={styles.card}>{items.map((item, i) => row(item, label === 'New', i === items.length - 1))}</View>
          </Animated.View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.page },
  scroll: { paddingHorizontal: 24 },
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.field, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, marginBottom: 22 },
  title: { fontSize: 38, color: C.text, fontFamily: F.display },
  newChip: { backgroundColor: '#EDE9FE', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5, marginTop: 8 },
  newChipText: { fontSize: 13, color: '#5B21B6', fontFamily: F.bold },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  eyebrow: { fontSize: 12, letterSpacing: 0.8, color: C.sub, fontFamily: F.bold },
  card: { backgroundColor: '#FFF', borderRadius: 24, borderWidth: 1, borderColor: C.line, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  divider: { borderBottomWidth: 1, borderBottomColor: C.line },
  sys: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', right: -4, bottom: -4, width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 15, lineHeight: 21, color: C.text, fontFamily: F.medium },
  cheer: { alignSelf: 'flex-start', backgroundColor: '#FCE7F3', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5 },
  cheerText: { fontSize: 13, color: '#BE185D', fontFamily: F.bold },
  time: { fontSize: 12, color: C.faint, fontFamily: F.medium },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#8B5CF6' },
  empty: { alignItems: 'center', gap: 6, paddingVertical: 48 },
  emptyTitle: { fontSize: 22, color: C.text, fontFamily: F.display, marginTop: 8 },
  emptyBody: { fontSize: 15, color: C.sub, fontFamily: F.regular, textAlign: 'center' },
});
