import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { restockTotals } from '@domain/restock.ts';
import { DAY_NAMES, weekStartOf } from '@domain/time.ts';
import type { NudgeStyle } from '@domain/types.ts';
import { F } from '@/constants/theme';
import { achievements } from '@/lib/achievements';
import { deleteAccount } from '@/lib/account';
import { signOut } from '@/lib/auth';
import { usePlus } from '@/lib/entitlement';
import { scrollShrink } from '@/lib/tab-shrink';
import { useAction, useMe } from '@/lib/state';
import { Avatar } from '@/ui/avatar';
import { C } from '@/ui/kit';
import { Segmented } from '@/ui/segmented';
import { useToast } from '@/ui/toast';

const ACCENT = '#7C3AED';
const PRIVACY_URL = 'https://roomie-theta.vercel.app/privacy';
const NUDGES: { value: NudgeStyle; label: string; hint: string }[] = [
  { value: 'motivate', label: 'Cheer me on', hint: 'Warm, encouraging reminders' },
  { value: 'facts', label: 'Just the facts', hint: 'Short and to the point' },
];

export default function Profile() {
  const router = useRouter();
  const { me, state } = useMe();
  const household = state.household!;
  const myMember = state.members.find((m) => m.user_id === me);
  const weekStart = weekStartOf(state.today);
  const doneThisWeek = state.assignments.filter((a) => a.status === 'done' && a.day >= weekStart &&
    (a.claimed_by === me || (a.user_id === me && !a.claimed_by)));
  const restocksDone = state.restocks.filter((r) => r.status === 'done' && r.done_by === me && r.done_day !== null && r.done_day >= weekStart).length;
  const points = doneThisWeek.reduce((n, a) => n + a.effort, 0) + (restockTotals(state.restocks, weekStart)[me] ?? 0);
  const streak = state.streak?.current ?? 0;
  const plus = usePlus();
  const badges = achievements(state, me);
  const earned = badges.filter((b) => b.earned).length;

  const setNudge = useAction<{ p_nudge: NudgeStyle }>('update_profile', {
    optimistic: (s, { p_nudge }) => ({ ...s, profile: { ...s.profile, nudge_style: p_nudge } }),
  });

  const confirmSignOut = () => Alert.alert('Log out of Roomie?', 'You can sign back in with your email any time.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Log Out', style: 'destructive', onPress: () => { signOut(); } },
  ]);

  const toast = useToast();
  const confirmDelete = () => Alert.alert('Delete your account?', 'This permanently deletes your account and your personal data. Your household keeps its shared history.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Continue', style: 'destructive', onPress: () => Alert.alert('This cannot be undone', 'Your chores, pantry items and photo will be removed for good.', [
      { text: 'Keep my account', style: 'cancel' },
      { text: 'Delete forever', style: 'destructive', onPress: () => { void deleteAccount().catch(() => toast.show("Couldn't delete the account. Try again.")); } },
    ]) },
  ]);

  const busyText = myMember?.busy_days.length ? myMember.busy_days.map((d) => DAY_NAMES[d].slice(0, 3)).join(', ') : 'None set';
  const nudgeHint = NUDGES.find((n) => n.value === state.profile.nudge_style)?.hint;

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScrollView {...scrollShrink} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <LinearGradient colors={['#8B5CF6', '#5B21B6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <Pressable accessibilityRole="button" accessibilityLabel="Edit profile and photo" onPress={() => router.push('/edit-profile')}
            style={({ pressed }) => pressed && { opacity: 0.85 }}>
            <Avatar name={state.profile.name} color={state.profile.color} path={state.profile.avatar_path} size={96} ring />
            <View style={styles.cam}><Ionicons name="camera" size={15} color="#5B21B6" /></View>
          </Pressable>
          <Text style={styles.name}>{state.profile.name}</Text>
          <Text style={styles.home}>{household.name}{myMember?.role === 'owner' ? ' · Owner' : ''}</Text>

          <View style={styles.stats}>
            <Stat icon="flame" value={String(streak)} label="Day streak" />
            <Stat icon="checkmark-done" value={String(doneThisWeek.length + restocksDone)} label="Done this week" />
            <Stat icon="flash" value={String(points)} label="Points" />
          </View>

          <Pressable accessibilityRole="button" onPress={() => router.push('/recap')} style={({ pressed }) => [styles.share, pressed && { opacity: 0.7 }]}>
            <Ionicons name="share-outline" size={18} color="#FFF" />
            <Text style={styles.shareText}>Share our week</Text>
          </Pressable>
        </LinearGradient>

        <View style={styles.sectionRow}>
          <Text style={styles.section}>Achievements</Text>
          <Text style={styles.sectionCount}>{earned} of {badges.length}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badges} style={styles.bleed}>
          {badges.map((b) => (
            <View key={b.id} style={styles.badge} accessible accessibilityLabel={b.earned ? `${b.title}, earned` : `${b.title}, locked. ${b.hint}`}>
              <View style={[styles.emblem, b.earned ? styles.emblemOn : styles.emblemOff]}>
                <Text style={[styles.emblemEmoji, !b.earned && { opacity: 0.3 }]}>{b.emoji}</Text>
                {!b.earned && <View style={styles.lock}><Ionicons name="lock-closed" size={11} color="#FFF" /></View>}
              </View>
              <Text style={[styles.badgeTitle, !b.earned && { color: C.faint }]} numberOfLines={2}>{b.title}</Text>
              {!b.earned && <Text style={styles.badgeHint} numberOfLines={3}>{b.hint}</Text>}
            </View>
          ))}
        </ScrollView>

        <View style={styles.sectionRow}>
          <Text style={styles.section}>Roommates</Text>
          <Text style={styles.sectionCount}>{state.members.length} of 8</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mates} style={styles.bleed}>
          {state.members.map((m) => (
            <View key={m.user_id} style={styles.mate} accessible accessibilityLabel={`${m.user_id === me ? 'You' : m.name}${m.role === 'owner' ? ', owner' : ''}`}>
              <Avatar name={m.name} color={m.color} path={m.avatar_path} size={54} />
              <Text style={styles.mateName} numberOfLines={1}>{m.user_id === me ? 'You' : m.name.split(' ')[0]}</Text>
              {m.role === 'owner' && <Text style={styles.mateRole}>Owner</Text>}
            </View>
          ))}
          {state.members.length < 8 && (
            <Pressable accessibilityRole="button" accessibilityLabel="Invite a roommate" onPress={() => router.push('/invite')} style={({ pressed }) => [styles.mate, pressed && { opacity: 0.6 }]}>
              <View style={styles.invite}><Ionicons name="add" size={26} color={C.sub} /></View>
              <Text style={styles.mateName}>Invite</Text>
            </Pressable>
          )}
        </ScrollView>

        <Pressable accessibilityRole="button" onPress={() => router.push('/paywall')} style={({ pressed }) => [{ marginTop: 26 }, pressed && { transform: [{ scale: 0.98 }] }]}>
          <LinearGradient colors={['#1F2937', '#111827']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.plus}>
            <View style={styles.plusIcon}><Ionicons name="star" size={20} color="#FDE68A" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.plusTitle}>Roomie Plus</Text>
              <Text style={styles.plusSub}>{plus ? 'You have Plus' : 'Try free for 7 days. Cancel anytime.'}</Text>
            </View>
            {!plus && <View style={styles.plusBtn}><Text style={styles.plusBtnText}>Try</Text></View>}
          </LinearGradient>
        </Pressable>

        <Text style={[styles.section, { marginTop: 26 }]}>Settings</Text>
        <View style={styles.group}>
          <Row icon="person-outline" tint="#DBEAFE" fg="#1D4ED8" title="Edit profile" sub={`Photo, your name and ${household.name}`} onPress={() => router.push('/edit-profile')} />
          <Row icon="calendar-outline" tint="#F3E8FF" fg="#7E22CE" title="My busy days" sub={busyText} onPress={() => router.push('/busy-days')} divider />
          <Row icon="checkbox-outline" tint="#FEF3C7" fg="#B45309" title="Chores" sub="Add or remove what is in the rotation" onPress={() => router.push('/manage-chores')} divider />
          <Row icon="home-outline" tint="#FFEDD5" fg="#C2410C" title="Household" sub={`${household.name} · ${household.plan_mode === 'auto' ? 'Plan applies automatically' : 'Review plans first'}`} onPress={() => router.push('/household')} divider />
          <Row icon="notifications-outline" tint="#DCFCE7" fg="#15803D" title="Reminders" sub="Morning notes and nudges" onPress={() => router.push('/reminders')} divider />
        </View>

        <Text style={styles.subSection}>Notification style</Text>
        <Segmented options={NUDGES.map((n) => ({ value: n.value, label: n.label }))} value={state.profile.nudge_style}
          onChange={(v) => setNudge.mutate({ p_nudge: v })} />
        {nudgeHint ? <Text style={styles.hint}>{nudgeHint}</Text> : null}

        <Text style={styles.subSection}>About</Text>
        <View style={styles.group}>
          <Row icon="shield-checkmark-outline" tint="#DBEAFE" fg="#1D4ED8" title="Privacy policy" sub="How your data is used" onPress={() => { void WebBrowser.openBrowserAsync(PRIVACY_URL); }} />
          <View style={[styles.row, styles.divider]}>
            <View style={[styles.rowIcon, { backgroundColor: '#F3F4F6' }]}><Ionicons name="information-circle-outline" size={19} color={C.sub} /></View>
            <View style={{ flex: 1 }}><Text style={styles.rowTitle}>Version</Text><Text style={styles.rowSub}>{Constants.expoConfig?.version ?? '2.1.0'}</Text></View>
          </View>
          <View style={[styles.row, styles.divider]}>
            <View style={[styles.rowIcon, { backgroundColor: '#FCE7F3' }]}><Ionicons name="heart-outline" size={19} color="#BE185D" /></View>
            <View style={{ flex: 1 }}><Text style={styles.rowTitle}>Made by</Text><Text style={styles.rowSub}>pemaghising</Text></View>
          </View>
        </View>

        <Pressable accessibilityRole="button" onPress={confirmSignOut} style={({ pressed }) => [styles.logout, pressed && { opacity: 0.7 }]}>
          <Ionicons name="log-out-outline" size={18} color="#B91C1C" />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={confirmDelete} style={({ pressed }) => [styles.delete, pressed && { opacity: 0.6 }]}>
          <Text style={styles.deleteText}>Delete account</Text>
        </Pressable>
        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${value} ${label}`}>
      <Ionicons name={icon} size={18} color="#FDE68A" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Row({ icon, tint, fg, title, sub, onPress, divider }: {
  icon: keyof typeof Ionicons.glyphMap; tint: string; fg: string; title: string; sub: string; onPress: () => void; divider?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={() => { Haptics.selectionAsync(); onPress(); }} style={({ pressed }) => [styles.row, divider && styles.divider, pressed && { opacity: 0.6 }]}>
      <View style={[styles.rowIcon, { backgroundColor: tint }]}><Ionicons name={icon} size={19} color={fg} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub} numberOfLines={1}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={C.faint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.page },
  scroll: { paddingHorizontal: 24 },
  hero: { alignItems: 'center', borderRadius: 32, padding: 22, marginTop: 16, gap: 4 },
  cam: { position: 'absolute', right: -2, bottom: -2, width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 28, color: '#FFF', fontFamily: F.display, marginTop: 10 },
  home: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontFamily: F.medium },
  stats: { flexDirection: 'row', gap: 8, marginTop: 16, alignSelf: 'stretch' },
  stat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 20, paddingVertical: 12, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 24, color: '#FFF', fontFamily: F.display },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: F.semibold },
  share: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'stretch', height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)', marginTop: 14 },
  shareText: { color: '#FFF', fontSize: 15, fontFamily: F.bold },
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 26, marginBottom: 12 },
  section: { fontSize: 22, color: C.text, fontFamily: F.display },
  sectionCount: { fontSize: 13, color: C.sub, fontFamily: F.semibold },
  bleed: { marginHorizontal: -24 },
  badges: { paddingHorizontal: 24, gap: 14 },
  badge: { width: 92, alignItems: 'center', gap: 6 },
  emblem: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  emblemOn: { backgroundColor: '#EDE9FE', borderColor: ACCENT },
  emblemOff: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  emblemEmoji: { fontSize: 32 },
  lock: { position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: '#9CA3AF', borderWidth: 2, borderColor: C.page, alignItems: 'center', justifyContent: 'center' },
  badgeTitle: { fontSize: 13, color: C.text, fontFamily: F.bold, textAlign: 'center' },
  badgeHint: { fontSize: 11, lineHeight: 14, color: C.faint, fontFamily: F.regular, textAlign: 'center' },
  mates: { paddingHorizontal: 24, gap: 14 },
  mate: { alignItems: 'center', gap: 4, width: 64 },
  mateName: { fontSize: 13, color: C.text, fontFamily: F.bold },
  mateRole: { fontSize: 11, color: ACCENT, fontFamily: F.bold },
  invite: { width: 54, height: 54, borderRadius: 27, borderWidth: 2, borderStyle: 'dashed', borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  plus: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 26, padding: 16 },
  plusIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(253,230,138,0.15)', alignItems: 'center', justifyContent: 'center' },
  plusTitle: { fontSize: 17, color: '#FFF', fontFamily: F.bold },
  plusSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: F.regular, marginTop: 2 },
  plusBtn: { backgroundColor: '#FDE68A', borderRadius: 16, paddingHorizontal: 16, height: 34, alignItems: 'center', justifyContent: 'center' },
  plusBtnText: { fontSize: 14, color: '#92400E', fontFamily: F.bold },
  group: { backgroundColor: '#FFF', borderRadius: 24, borderWidth: 1, borderColor: C.line, marginTop: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  divider: { borderTopWidth: 1, borderTopColor: C.line },
  rowIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 16, color: C.text, fontFamily: F.semibold },
  rowSub: { fontSize: 13, color: C.sub, fontFamily: F.regular, marginTop: 2 },
  subSection: { fontSize: 13, color: C.sub, fontFamily: F.bold, marginTop: 22, marginBottom: 10 },
  hint: { fontSize: 13, color: C.sub, fontFamily: F.regular, marginTop: 8, marginLeft: 4 },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: '#FECACA', marginTop: 30 },
  delete: { alignSelf: 'center', paddingVertical: 14, marginTop: 6 },
  deleteText: { fontSize: 14, color: C.faint, fontFamily: F.semibold, textDecorationLine: 'underline' },
  logoutText: { color: '#B91C1C', fontSize: 16, fontFamily: F.semibold },
});
