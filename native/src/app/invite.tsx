import { ActivityIndicator, View } from 'react-native';
import { useAppState } from '@/lib/state';
import { InviteCard } from '@/ui/invite-card';
import { C, Screen, Title } from '@/ui/kit';

export default function Invite() {
  const household = useAppState().data?.household;
  return (
    <Screen>
      <Title>Invite a roommate</Title>
      <View style={{ marginTop: 16 }}>
        {household ? <InviteCard code={household.invite_code} home={household.name} /> : <ActivityIndicator color={C.skyText} />}
      </View>
    </Screen>
  );
}
