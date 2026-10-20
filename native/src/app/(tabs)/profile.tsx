// Profile (frame R1) with the confirm sheets R13 Leave home, R14 Log out and R15 Delete account.
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Bell, CalendarDays, CircleHelp, ClipboardList, DoorOpen, House, Link2, LogOut, Mail, MessageCircle, Pencil, ShieldCheck, Trash2, Users } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DAY_NAMES } from '@domain/time.ts';
import { deleteAccount } from '@/lib/account';
import { formatCode } from '@/lib/actions';
import { signOut, useAuth } from '@/lib/auth';
import { avatarUrl } from '@/lib/avatar';
import { messageOf, rpc, STATE_KEY, useMe } from '@/lib/state';
import { enter, useReducedMotion } from '@/ui/motion';
import { useToast } from '@/ui/toast';
import { color, layout } from '@/ui/tokens';
import { Avatar, ConfirmSheet, MeshBackground, SettingsCard, SettingsRow, Tap, Txt, useTitleBar } from '@/ui/v2';

type Ask = 'leave' | 'logout' | 'delete' | null;
const SUNDAY_FIRST = [0, 1, 2, 3, 4, 5, 6];

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const titleBar = useTitleBar('Profile');
  const reduced = useReducedMotion();
  const qc = useQueryClient();
  const toast = useToast();
  const { session } = useAuth();
  const { me, state } = useMe();
  const home = state.household!;
  const mine = state.members.find((m) => m.user_id === me);
  const [ask, setAsk] = useState<Ask>(null);
  const [busy, setBusy] = useState(false);
  const busyDays = SUNDAY_FIRST.filter((d) => mine?.busy_days.includes(d as never)).map((d) => DAY_NAMES[d].slice(0, 3)).join(', ') || 'None';
  const nudge = state.profile.nudge_style === 'facts' ? 'Just the facts' : 'Motivate me';
  const notifyOn = Object.values(state.profile.notify ?? { chores: true }).some(Boolean);
  const chores = state.chores.filter((c) => c.active).length;
  let i = 0;
  const E = () => (reduced ? undefined : enter(i++, reduced));
  const go = (path: Parameters<typeof router.push>[0]) => () => router.push(path);

  const act = async () => {
    setBusy(true);
    try {
      if (ask === 'leave') { await rpc('leave_household'); await qc.invalidateQueries({ queryKey: STATE_KEY }); }
      if (ask === 'logout') await signOut();
      if (ask === 'delete') await deleteAccount();
      setAsk(null);
    } catch (e) {
      toast.show(ask === 'delete' ? 'Couldn’t delete the account. Try again.' : messageOf(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <MeshBackground />
      <Animated.ScrollView onScroll={titleBar.onScroll} scrollEventThrottle={16} contentContainerStyle={[styles.page, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 130 }]} showsVerticalScrollIndicator={false}>
        <Animated.View entering={E()}><Txt v="Title/Page" accessibilityRole="header">Profile</Txt></Animated.View>
        <Animated.View entering={E()}>
          <Tap onPress={go('/edit-profile')} accessibilityLabel="Edit profile" style={styles.me}>
            <View>
              <Avatar name={state.profile.name} uri={state.profile.avatar_path ? avatarUrl(state.profile.avatar_path) : null} tint={state.profile.color} size={80} />
              <View style={styles.pencil}><Pencil size={11} color={color.text.link} strokeWidth={2.25} /></View>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt v="Heading/Section" style={{ fontSize: 26, lineHeight: 31 }} numberOfLines={1}>{state.profile.name}</Txt>
              <Txt v="Body/Default" c={color.text.secondary} numberOfLines={1}>{home.name}</Txt>
            </View>
          </Tap>
        </Animated.View>

        <Animated.View entering={E()} style={styles.group}>
          <Txt v="Heading/Section" accessibilityRole="header">Your home</Txt>
          <SettingsCard>
            <SettingsRow icon={House} label="Home name" value={home.name} onPress={go('/home-name')} />
            <SettingsRow icon={Users} label="Roommates" value={String(state.members.length)} onPress={go('/roommates')} />
            <SettingsRow icon={ClipboardList} label="House chores" value={String(chores)} onPress={go('/manage-chores')} />
            <SettingsRow icon={Link2} label="Invite roommates" chip={formatCode(home.invite_code)} onPress={go('/invite')} last />
          </SettingsCard>
        </Animated.View>

        <Animated.View entering={E()} style={styles.group}>
          <Txt v="Heading/Section" accessibilityRole="header">Preferences</Txt>
          <SettingsCard>
            <SettingsRow icon={CalendarDays} label="My busy days" value={busyDays} onPress={go('/busy-days')} />
            <SettingsRow icon={MessageCircle} label="Nudge style" value={nudge} onPress={go('/nudge-style')} />
            <SettingsRow icon={Bell} label="Notifications" value={notifyOn ? 'On' : 'Off'} onPress={go('/notifications')} last />
          </SettingsCard>
        </Animated.View>

        <Animated.View entering={E()} style={styles.group}>
          <Txt v="Heading/Section" accessibilityRole="header">Account</Txt>
          <SettingsCard>
            <SettingsRow icon={Mail} label="Email" value={session?.user.email ?? ''} onPress={go('/email')} />
            <SettingsRow icon={CircleHelp} label="Help & feedback" onPress={go('/help')} />
            <SettingsRow icon={ShieldCheck} label="Privacy & terms" onPress={go('/privacy')} />
            <SettingsRow icon={DoorOpen} label="Leave home" tone="danger" onPress={() => setAsk('leave')} />
            <SettingsRow icon={LogOut} label="Log out" tone="danger" onPress={() => setAsk('logout')} last />
          </SettingsCard>
        </Animated.View>

        <Animated.View entering={E()} style={styles.foot}>
          <Tap onPress={() => setAsk('delete')} accessibilityLabel="Delete account" hitSlop={10}><Txt v="Meta/Medium" c={color.text.secondary}>Delete account</Txt></Tap>
          <Txt v="Meta" c={color.text.secondary}>{` · Roomie ${Constants.expoConfig?.version ?? '1.0'}`}</Txt>
        </Animated.View>
      </Animated.ScrollView>
      {titleBar.bar}

      {ask === 'leave' && <ConfirmSheet icon={House} tone="danger" title={`Leave ${home.name}?`} body="Your chores go to the shared pool. You can rejoin anytime with a code."
        action="Leave home" onConfirm={act} onClose={() => setAsk(null)} busy={busy} />}
      {ask === 'logout' && <ConfirmSheet icon={LogOut} title="Log out of Roomie?" body="Your home and chores stay as they are. Log back in with the same email."
        action="Log out" onConfirm={act} onClose={() => setAsk(null)} busy={busy} />}
      {ask === 'delete' && <ConfirmSheet icon={Trash2} tone="danger" title="Delete your account?" body="This removes your chores and history. It can’t be undone."
        action="Delete account" onConfirm={act} onClose={() => setAsk(null)} busy={busy} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  page: { paddingHorizontal: layout.margin, gap: 24 },
  me: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: -6 },
  pencil: { position: 'absolute', right: 0, bottom: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: color.bg.surface, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#3B2470', shadowOpacity: 0.14, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  group: { gap: 12 },
  foot: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: -4 },
});
