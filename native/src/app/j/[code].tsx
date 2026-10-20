import { Redirect, useLocalSearchParams } from 'expo-router';
import { savePendingInvite } from '@/lib/invite';

/** An invite link (roomie://j/ABC123). The code is remembered, then the normal sign-in and onboarding gates take over. */
export default function InviteLink() {
  const { code } = useLocalSearchParams<{ code: string }>();
  savePendingInvite(String(code ?? ''));
  return <Redirect href="/" />;
}
