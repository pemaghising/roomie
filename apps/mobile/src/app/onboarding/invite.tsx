// 12 · Invite roommates.
import { useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { shareInvite } from '@/lib/actions';
import { useAppState } from '@/lib/state';
import { InviteCard } from '@/ui/invite-card';
import { color } from '@/ui/tokens';
import { Button, Heading, Page, Txt } from '@/ui/v2';

export default function Invite() {
  const router = useRouter();
  const household = useAppState().data?.household;
  const next = () => router.replace('/onboarding/ready');
  return (
    <Page step={6} footer={
      <View style={{ gap: 18 }}>
        <Button title="Share invite link" onPress={() => household && shareInvite(household.invite_code, household.name)} disabled={!household} />
        <Txt v="Body/Label" c={color.text.link} style={{ textAlign: 'center' }} accessibilityRole="button" onPress={next}>Maybe later</Txt>
      </View>
    }>
      <Heading title="Invite your roommates" sub="Chores split better with more hands." />
      {household ? <InviteCard code={household.invite_code} home={household.name} /> : <ActivityIndicator color={color.action.primary} style={{ height: 240 }} />}
    </Page>
  );
}
