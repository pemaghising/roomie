// Weekly recap (no frame; v2 parts). Opens from the Sunday notification. The house's week, never a leaderboard.
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { avatarUrl } from '@/lib/avatar';
import { weekRecap } from '@/lib/recap';
import { memberShares } from '@/lib/roommates';
import { useMe, withHousehold } from '@/lib/state';
import { haptic } from '@/ui/haptics';
import { color } from '@/ui/tokens';
import { Avatar, Button, Glass, Heading, Page, PLANT_ART, Txt } from '@/ui/v2';
import { plantFor } from '@/lib/plant';
import { Image } from 'expo-image';

export default withHousehold(Recap);

function Recap() {
  const { state } = useMe();
  const r = weekRecap(state);
  const shares = new Map(memberShares(state).map((m) => [m.user_id, m.label]));
  const card = useRef<View>(null);
  const [busy, setBusy] = useState(false);

  const share = async () => {
    if (busy || !card.current) return;
    setBusy(true);
    try {
      const uri = await captureRef(card, { format: 'png', quality: 1 });
      haptic.select();
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share our week' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page back footer={<Button title="Share our week" onPress={share} loading={busy} />}>
      <Heading title="Your week" size="page" sub={`How ${state.household!.name} did, Sunday to Saturday.`} />
      <View ref={card} collapsable={false}>
        <Glass fill={0.9}>
          <View style={styles.card}>
            <View style={styles.top}>
              <View style={{ flex: 1, gap: 4 }}>
                <Txt v="Meta/Medium" c={color.text.numeral}>Done together</Txt>
                <Txt v="Numeral/Streak" c={color.text.numeral}>{String(r.done)}</Txt>
                <Txt v="Body/Default" c={color.text.secondary}>{`${r.pct}% of the week · ${r.streak}-day streak`}</Txt>
              </View>
              <Image source={PLANT_ART[plantFor(r.streak, false)]} style={{ width: 96, height: 110 }} contentFit="contain" />
            </View>
            <View style={styles.people}>
              {state.members.map((m) => (
                <View key={m.user_id} style={styles.person} accessible accessibilityLabel={`${m.name}, ${shares.get(m.user_id)}`}>
                  <Avatar name={m.name} uri={m.avatar_path ? avatarUrl(m.avatar_path) : null} tint={m.color} size={36} />
                  <Txt v="Body/Row" style={{ flex: 1 }}>{m.name.split(' ')[0]}</Txt>
                  <Txt v="Body/Label" c={color.text.link}>{shares.get(m.user_id)}</Txt>
                </View>
              ))}
            </View>
          </View>
        </Glass>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, gap: 18 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  people: { gap: 12, borderTopWidth: 1, borderTopColor: 'rgba(135,107,222,0.12)', paddingTop: 16 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
