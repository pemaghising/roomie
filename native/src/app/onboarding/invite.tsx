import { useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAppState } from '@/lib/state';
import { InviteCard } from '@/ui/invite-card';
import { Button, C, Screen, StepHeader, Sub, Title } from '@/ui/kit';

export default function Invite() {
  const router = useRouter();
  const household = useAppState().data?.household;
  return (
    <Screen footer={<Button title="Continue" onPress={() => router.replace('/onboarding/ready')} />}>
      <StepHeader step={6} total={6} back={false} />
      <Title>Invite your roommates.</Title>
      <Sub>Scan the code, or send them the link.</Sub>
      <View style={{ marginTop: 20 }}>
        {household ? <InviteCard code={household.invite_code} home={household.name} /> : <ActivityIndicator color={C.skyText} style={{ height: 120 }} />}
      </View>
    </Screen>
  );
}
