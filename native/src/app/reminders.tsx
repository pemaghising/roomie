import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { F } from '@/constants/theme';
import { markPrimerSeen, previewPoolReminder, pushStatus, registerForPush, type PushStatus } from '@/lib/push';
import { useAppState } from '@/lib/state';
import { Art } from '@/ui/art';
import { Button, C, Screen } from '@/ui/kit';
import { useToast } from '@/ui/toast';

const REASONS = [
  { icon: 'sunny-outline', text: 'A short morning note with what is on your list' },
  { icon: 'hand-left-outline', text: 'When a chore is up for grabs and a roommate needs a hand' },
  { icon: 'calendar-outline', text: "When next week's plan is ready to look at" },
] as const;

/** The "why we ask" step before the system permission prompt, and the place to fix a denied one. */
export default function Reminders() {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [remote, setRemote] = useState<boolean | null>(null); // whether this phone is registered for pushes from the server
  useEffect(() => { markPrimerSeen(); void pushStatus().then(setStatus); }, []);

  const turnOn = async () => {
    setBusy(true);
    const r = await registerForPush();
    const s = await pushStatus(); // permission, even if the server token could not be registered
    setBusy(false);
    setStatus(s);
    setRemote(r === 'granted');
    if (r === 'granted') { toast.show("Reminders are on. We'll keep them short."); router.back(); }
  };

  const style = useAppState().data?.profile.nudge_style ?? 'motivate';
  const preview = async () => {
    const ok = await previewPoolReminder(style);
    toast.show(ok ? 'On its way. Lock your phone to see it, then tap it.' : "Couldn't schedule the preview.");
  };

  const note = status === 'denied' ? 'Reminders are off in your phone settings.'
    : status === 'unavailable' ? 'Push reminders need a real phone.'
    : status === 'granted' && remote === false ? 'Reminders are allowed, but pushes from the server need the installed app, not Expo Go. You can still preview one below.'
    : null;

  return (
    <Screen footer={
      <View style={{ gap: 4 }}>
        {status === 'granted' ? (
          <Button title="Reminders are on" disabled onPress={() => {}} />
        ) : status === 'denied' ? (
          <Button title="Open phone settings" onPress={() => Linking.openSettings()} />
        ) : (
          <Button title="Turn on reminders" loading={busy} disabled={status === 'unavailable'} onPress={turnOn} />
        )}
        <Button title="Not now" variant="ghost" onPress={() => router.back()} />
      </View>
    }>
      <View style={styles.art}><Art name="calendar" width={200} /></View>
      <Text style={styles.title}>Never miss your turn.</Text>
      <Text style={styles.sub}>A few gentle nudges, never more than a handful a day.</Text>
      <View style={{ gap: 14, marginTop: 22 }}>
        {REASONS.map((r) => (
          <View key={r.text} style={styles.row}>
            <View style={styles.icon}><Ionicons name={r.icon} size={20} color={C.lavenderText} /></View>
            <Text style={styles.reason}>{r.text}</Text>
          </View>
        ))}
      </View>
      {note ? <Text style={styles.note}>{note}</Text> : null}
      {status === 'granted' && (
        <Pressable accessibilityRole="button" onPress={preview} style={({ pressed }) => [styles.preview, pressed && { opacity: 0.7 }]}>
          <Ionicons name="notifications-outline" size={18} color={C.lavenderText} />
          <Text style={styles.previewText}>Preview an "up for grabs" reminder</Text>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  art: { alignItems: 'center', marginTop: 12 },
  title: { fontSize: 30, lineHeight: 36, color: C.text, fontFamily: F.display, marginTop: 8 },
  sub: { fontSize: 15, lineHeight: 22, color: C.sub, fontFamily: F.regular, marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.lavender, alignItems: 'center', justifyContent: 'center' },
  reason: { flex: 1, fontSize: 15, lineHeight: 21, color: C.text, fontFamily: F.medium },
  note: { fontSize: 13, lineHeight: 19, color: C.sub, fontFamily: F.regular, marginTop: 20 },
  preview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.lavender, borderRadius: 20, height: 48, marginTop: 22 },
  previewText: { fontSize: 14, color: C.lavenderText, fontFamily: F.bold },
});
