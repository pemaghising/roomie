// The reminders primer (no frame; v2 sheet): why we ask, before the phone's own prompt. Also where a denied one gets fixed.
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useBack } from '@/lib/use-back';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { markPrimerSeen, previewPoolReminder, pushStatus, registerForPush, type PushStatus } from '@/lib/push';
import { useAppState } from '@/lib/state';
import { useToast } from '@/ui/toast';
import { color } from '@/ui/tokens';
import { Button, EmojiBadge, Sheet, Tap, Txt } from '@/ui/v2';

const REASONS = [
  { icon: '🔔', text: 'A 7 pm nudge on the days a chore is yours' },
  { icon: '🙌', text: 'When a chore slips into the shared pool' },
  { icon: '🛒', text: 'When something in the pantry runs low' },
];

export default function Reminders() {
  const router = useRouter();
  const back = useBack();
  const toast = useToast();
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { markPrimerSeen(); void pushStatus().then(setStatus); }, []);
  const style = useAppState().data?.profile.nudge_style ?? 'motivate';
  const close = () => back();

  const turnOn = async () => {
    setBusy(true);
    await registerForPush();
    const s = await pushStatus();
    setBusy(false);
    setStatus(s);
    if (s === 'granted') { toast.show('Reminders are on. We’ll keep them short.', { tick: true }); close(); }
  };
  const preview = async () => {
    const ok = await previewPoolReminder(style);
    toast.show(ok ? 'On its way. Lock your phone to see it.' : 'Couldn’t send the preview.');
  };

  return (
    <Sheet onClose={close} title="Never miss your turn" sub="A few gentle nudges, never more than a handful a day.">
      <View style={{ gap: 14 }}>
        {REASONS.map((r) => (
          <View key={r.text} style={styles.row}>
            <EmojiBadge value={r.icon} size={40} round tint={color.action.selectedTint} />
            <Txt v="Body/Default" style={{ flex: 1 }}>{r.text}</Txt>
          </View>
        ))}
      </View>
      {status === 'denied' && <Txt v="Meta" c={color.text.secondary}>Reminders are off in your phone settings.</Txt>}
      {status === 'unavailable' && <Txt v="Meta" c={color.text.secondary}>Reminders need a real phone.</Txt>}
      <View style={{ gap: 10 }}>
        {status === 'granted' ? <Button title="Send me a preview" kind="secondary" onPress={preview} />
          : status === 'denied' ? <Button title="Open phone settings" onPress={() => void Linking.openSettings()} />
          : <Button title="Turn on reminders" onPress={turnOn} loading={busy} disabled={status === 'unavailable'} />}
        <Tap onPress={close} style={{ alignSelf: 'center' }} hitSlop={10}><Txt v="Body/Label" c={color.text.secondary}>Not now</Txt></Tap>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
});
