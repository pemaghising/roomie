// R4 · Roommates: everyone's share this week, in words and a bar. The owner can remove someone from the menu.
import { useRouter } from 'expo-router';
import { UserMinus } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { avatarUrl } from '@/lib/avatar';
import { memberShares } from '@/lib/roommates';
import { rpc, useMe, withHousehold } from '@/lib/state';
import { useSave } from '@/lib/use-save';
import { color } from '@/ui/tokens';
import { AddRow, Avatar, ConfirmSheet, Glass, Heading, MoreMenu, Page, Txt } from '@/ui/v2';

export default withHousehold(Roommates);

function Roommates() {
  const router = useRouter();
  const { me, state } = useMe();
  const owner = state.members.find((m) => m.user_id === me)?.role === 'owner';
  const shares = new Map(memberShares(state).map((s) => [s.user_id, s]));
  const [removing, setRemoving] = useState<{ user_id: string; name: string } | null>(null);
  const remove = useSave(() => rpc('remove_member', { p_user: removing?.user_id }), `${removing?.name.split(' ')[0] ?? 'They'} left the home.`, { stay: true });
  const ordered = [...state.members].sort((a, b) => Number(b.user_id === me) - Number(a.user_id === me));
  return (
    <>
      <Page back>
        <Heading title="Roommates" size="page" sub="Everyone’s share this week." />
        <View style={{ gap: 12 }}>
          {ordered.map((m) => {
            const s = shares.get(m.user_id)!;
            const you = m.user_id === me;
            return (
              <Glass key={m.user_id} fill={0.9}>
                <View style={{ padding: 16, gap: 12 }} accessible accessibilityLabel={`${you ? 'You' : m.name}, ${s.label}`}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Avatar name={m.name} uri={m.avatar_path ? avatarUrl(m.avatar_path) : null} tint={m.color} size={40} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Txt v="Body/Row">{you ? 'You' : m.name.split(' ')[0]}</Txt>
                      <Txt v="Meta" c={color.text.secondary}>{[you ? m.name : null, m.role === 'owner' ? 'Started the home' : 'Roommate'].filter(Boolean).join(' · ')}</Txt>
                    </View>
                    <Txt v="Body/Label" c={color.text.link}>{s.label}</Txt>
                    {owner && !you && <MoreMenu plain label={`More for ${m.name}`} items={[{ label: 'Remove from home', danger: true, icon: UserMinus, onPress: () => setRemoving(m) }]} />}
                  </View>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(135,107,222,0.14)', overflow: 'hidden' }}>
                    <View style={{ width: `${Math.round(s.fill * 100)}%`, height: 6, borderRadius: 3, backgroundColor: color.action.primary }} />
                  </View>
                </View>
              </Glass>
            );
          })}
          {state.members.length < 8 && <AddRow label="Invite a roommate" onPress={() => router.push('/invite')} />}
        </View>
      </Page>
      {removing && <ConfirmSheet icon={UserMinus} tone="danger" title={`Remove ${removing.name.split(' ')[0]}?`} body="Their upcoming chores go to the shared pool so anyone can claim them."
        action="Remove" onConfirm={() => void remove.run().then(() => setRemoving(null))} onClose={() => setRemoving(null)} busy={remove.busy} />}
    </>
  );
}
