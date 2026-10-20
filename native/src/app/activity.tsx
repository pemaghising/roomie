// Activity (no frame; built from the v2 parts): what happened in the house, newest first. Opened from Home's bell.
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { activityIcon, activityText, groupActivity } from '@/lib/activity-text';
import { avatarUrl } from '@/lib/avatar';
import { isUnread, namesOf } from '@/lib/selectors';
import { rpc, STATE_KEY, useMe, withHousehold } from '@/lib/state';
import type { ActivityItem } from '@/lib/types';
import { color } from '@/ui/tokens';
import { Avatar, Emoji, EmojiBadge, Glass, Heading, Page, SettingsCard, Tap, Txt } from '@/ui/v2';

function ago(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const h = Math.round(mins / 60);
  return h < 24 ? `${h}h` : `${Math.round(h / 24)}d`;
}

export default withHousehold(Activity);

function Activity() {
  const router = useRouter();
  const qc = useQueryClient();
  const { me, state } = useMe();
  const names = namesOf(state);
  // decided once on open so "New" stays for this visit even after mark-seen lands
  const unread = useRef(isUnread(state, me)).current;
  const wasUnread = useRef(new Set(state.activity.filter(unread).map((x) => x.id))).current;
  useEffect(() => { rpc('mark_activity_seen').then(() => qc.invalidateQueries({ queryKey: STATE_KEY })).catch(() => {}); }, [qc]);
  const groups = groupActivity(state.activity, state.household!.tz, state.today, (id) => wasUnread.has(id));
  const member = (id: string | null) => state.members.find((m) => m.user_id === id);

  const row = (item: ActivityItem, isNew: boolean, last: boolean) => {
    const who = member(item.actor);
    const icon = activityIcon(item).emoji;
    const cheer = item.kind === 'completed' && who && who.user_id !== me;
    return (
      <View key={item.id} style={[styles.row, !last && styles.divider]}>
        <View>
          {who ? <Avatar name={who.name} uri={who.avatar_path ? avatarUrl(who.avatar_path) : null} tint={who.color} size={40} />
            : <EmojiBadge value={icon} size={40} round tint={color.action.selectedTint} />}
          {who && <View style={styles.badge}><Emoji value={icon} size={14} /></View>}
        </View>
        <View style={{ flex: 1, gap: 8 }}>
          <Txt v="Body/Default">{activityText(item, names, me)}</Txt>
          {cheer && (
            <Tap onPress={() => router.push({ pathname: '/kudos', params: { to: who.user_id } })} feel="select" style={{ alignSelf: 'flex-start' }} accessibilityLabel={`Cheer ${who.name} on`}>
              <View style={styles.cheer}><Emoji value="🎉" size={14} /><Txt v="Tag" c={color.text.link}>Cheer</Txt></View>
            </Tap>
          )}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Txt v="Meta" c={color.text.secondary}>{ago(item.created_at)}</Txt>
          {isNew && <View style={styles.dot} />}
        </View>
      </View>
    );
  };

  return (
    <Page back>
      <View style={styles.title}>
        <Heading title="Activity" size="page" />
        {wasUnread.size > 0 && <View style={styles.count}><Txt v="Tag" c={color.text.link}>{`${wasUnread.size} new`}</Txt></View>}
      </View>
      {state.activity.length === 0 && (
        <Glass fill={0.62}>
          <View style={{ alignItems: 'center', gap: 6, padding: 24 }}>
            <Emoji value="🏠" size={34} />
            <Txt v="Body/Row">Quiet so far</Txt>
            <Txt v="Meta" c={color.text.secondary} style={{ textAlign: 'center' }}>Finished, claimed and restocked things show up here.</Txt>
          </View>
        </Glass>
      )}
      {groups.map(({ label, items }) => (
        <View key={label} style={{ gap: 10 }}>
          <Txt v="Meta/Medium" c={label === 'New' ? color.text.link : color.text.secondary}>{label}</Txt>
          <SettingsCard>{items.map((item, i) => row(item, label === 'New', i === items.length - 1))}</SettingsCard>
        </View>
      ))}
    </Page>
  );
}

const styles = StyleSheet.create({
  title: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  count: { paddingHorizontal: 10, height: 24, borderRadius: 12, backgroundColor: color.action.selectedTint, justifyContent: 'center', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14 },
  divider: { borderBottomWidth: 1, borderBottomColor: 'rgba(135,107,222,0.12)' },
  badge: { position: 'absolute', right: -4, bottom: -4, width: 22, height: 22, borderRadius: 11, backgroundColor: color.bg.surface, alignItems: 'center', justifyContent: 'center' },
  cheer: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 26, borderRadius: 13, backgroundColor: color.action.selectedTint },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: color.action.primary },
});
