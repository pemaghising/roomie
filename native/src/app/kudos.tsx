import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { F } from '@/constants/theme';
import { messageOf, rpc, STATE_KEY, useMe } from '@/lib/state';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@/ui/avatar';
import { C, Screen } from '@/ui/kit';
import { useToast } from '@/ui/toast';

/** The fixed set the server accepts (see `send_kudos`). */
const CHEERS = [
  { emoji: '🙌', label: 'High five' }, { emoji: '👏', label: 'Applause' }, { emoji: '🔥', label: 'On fire' },
  { emoji: '💪', label: 'Strong' }, { emoji: '❤️', label: 'Love' }, { emoji: '🎉', label: 'Party' },
] as const;

/** Send a roommate a small cheer. It shows in the house feed and sends them one push. */
export default function Kudos() {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const { to } = useLocalSearchParams<{ to: string }>();
  const { state } = useMe();
  const them = state.members.find((m) => m.user_id === to);
  const [busy, setBusy] = useState<string | null>(null);

  const send = async (emoji: string) => {
    if (busy || !them) return;
    setBusy(emoji);
    try {
      await rpc('send_kudos', { p_to: them.user_id, p_emoji: emoji });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await qc.invalidateQueries({ queryKey: STATE_KEY });
      toast.show(`Sent ${emoji} to ${them.name.split(' ')[0]}!`);
      router.back();
    } catch (e) {
      toast.show(messageOf(e));
      setBusy(null);
    }
  };

  if (!them) return <Screen><Text style={styles.gone}>That roommate is no longer in the home.</Text></Screen>;
  return (
    <Screen>
      <View style={styles.head}>
        <Avatar name={them.name} color={them.color} path={them.avatar_path} size={64} />
        <Text style={styles.title}>Cheer {them.name.split(' ')[0]} on</Text>
        <Text style={styles.sub}>A small thing that makes the house feel good.</Text>
      </View>
      <View style={styles.grid}>
        {CHEERS.map((c) => (
          <Pressable key={c.emoji} accessibilityRole="button" accessibilityLabel={`Send ${c.label}`} disabled={Boolean(busy)} onPress={() => send(c.emoji)}
            style={({ pressed }) => [styles.cell, busy === c.emoji && styles.cellOn, pressed && { transform: [{ scale: 0.94 }] }]}>
            <Text style={styles.emoji}>{c.emoji}</Text>
            <Text style={styles.label}>{c.label}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gone: { fontSize: 15, color: C.sub, fontFamily: F.regular, marginTop: 40, textAlign: 'center' },
  head: { alignItems: 'center', gap: 6, marginTop: 8 },
  title: { fontSize: 26, color: C.text, fontFamily: F.display, marginTop: 8 },
  sub: { fontSize: 14, color: C.sub, fontFamily: F.regular },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 26, justifyContent: 'center' },
  cell: { width: '30%', aspectRatio: 1, borderRadius: 24, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: C.line, alignItems: 'center', justifyContent: 'center', gap: 4 },
  cellOn: { borderColor: '#7C3AED', backgroundColor: '#F5F3FF' },
  emoji: { fontSize: 36 },
  label: { fontSize: 12, color: C.sub, fontFamily: F.semibold },
});
