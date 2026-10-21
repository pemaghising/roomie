// R11 · Help & feedback: three short explainers, and ways to reach us.
import * as Linking from 'expo-linking';
import * as StoreReview from 'expo-store-review';
import { useState } from 'react';
import { View } from 'react-native';
import { useToast } from '@/ui/toast';
import { color } from '@/ui/tokens';
import { Button, Heading, Page, PlainRow, SettingsCard, Sheet, Txt } from '@/ui/v2';

const LEARN = {
  how: { title: 'How Roomie works', body: 'Every Sunday Roomie plans the week. Chores rotate, so nobody gets stuck with the same one. If a chore slips, it goes to the shared pool and anyone can claim it.' },
  fair: { title: 'How fairness works', body: 'Roomie balances effort, not the number of chores. Heavy chores count more than light ones. If you did extra this week, next week gets lighter.' },
  busy: { title: 'Busy days explained', body: 'Mark the days you’re stretched thin. Roomie keeps heavy chores off them and gives you lighter ones instead.' },
} as const;
type Topic = keyof typeof LEARN;

export default function Help() {
  const toast = useToast();
  const [topic, setTopic] = useState<Topic | null>(null);
  const mail = (subject: string) => Linking.openURL(`mailto:?subject=${encodeURIComponent(subject)}`).catch(() => toast.show('No mail app is set up on this phone.'));
  const rate = async () => {
    if (await StoreReview.isAvailableAsync()) await StoreReview.requestReview();
    else toast.show('Thanks. Rating opens once Roomie is in the store.');
  };
  return (
    <>
      <Page back>
        <Heading title="Help & feedback" size="page" sub="Quick answers, or talk to us." />
        <View style={{ gap: 10 }}>
          <Txt v="Meta/Medium" c={color.text.secondary}>Learn</Txt>
          <SettingsCard>
            <PlainRow title="How Roomie works" sub="Rotation, effort and the pool" onPress={() => setTopic('how')} />
            <PlainRow title="How fairness works" onPress={() => setTopic('fair')} />
            <PlainRow title="Busy days explained" onPress={() => setTopic('busy')} last />
          </SettingsCard>
        </View>
        <View style={{ gap: 10 }}>
          <Txt v="Meta/Medium" c={color.text.secondary}>Get in touch</Txt>
          <SettingsCard>
            <PlainRow title="Contact us" sub="We reply within a day" onPress={() => mail('Roomie help')} />
            <PlainRow title="Send feedback" onPress={() => mail('Roomie feedback')} />
            <PlainRow title="Rate Roomie" onPress={rate} last />
          </SettingsCard>
        </View>
      </Page>
      {topic && (
        <Sheet onClose={() => setTopic(null)} title={LEARN[topic].title}>
          <Txt v="Body/Default" c={color.text.secondary}>{LEARN[topic].body}</Txt>
          <Button title="Got it" onPress={() => setTopic(null)} />
        </Sheet>
      )}
    </>
  );
}
