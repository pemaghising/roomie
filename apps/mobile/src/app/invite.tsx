// R6 · Invite roommates: the QR and code, a share link, and a fresh code if the old one got around.
import { useState } from 'react';
import { View } from 'react-native';
import { shareInvite } from '@/lib/actions';
import { rpc, useMe, withHousehold } from '@/lib/state';
import { useSave } from '@/lib/use-save';
import { color } from '@/ui/tokens';
import { InviteCard } from '@/ui/invite-card';
import { Button, Heading, Page, Tap, Txt } from '@/ui/v2';

export default withHousehold(Invite);

function Invite() {
  const { state } = useMe();
  const home = state.household!;
  const [sure, setSure] = useState(false);
  const rotate = useSave(() => rpc('rotate_invite_code'), 'New code ready. The old one stops working.', { stay: true });
  return (
    <Page back footer={<Button title="Share invite link" onPress={() => void shareInvite(home.invite_code, home.name)} />}>
      <Heading title="Invite roommates" size="page" sub="Scan the code or share the link." />
      <InviteCard code={home.invite_code} home={home.name} label="Scan to join" />
      <View style={{ alignItems: 'center' }}>
        <Tap onPress={() => (sure ? void rotate.run().then(() => setSure(false)) : setSure(true))} hitSlop={10} accessibilityLabel={sure ? 'Tap again to make a new code' : 'Make a new code'}>
          <Txt v="Meta/Medium" c={sure ? color.text.danger : color.text.secondary}>{sure ? 'Tap again. The old code will stop working.' : 'Make a new code'}</Txt>
        </Tap>
      </View>
    </Page>
  );
}
