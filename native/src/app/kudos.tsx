// Kudos (no frame; v2 sheet): send a roommate a small cheer. It shows in the house feed.
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { avatarUrl } from '@/lib/avatar';
import { messageOf, rpc, STATE_KEY, useAppState } from '@/lib/state';
import { haptic } from '@/ui/haptics';
import { useToast } from '@/ui/toast';
import { color } from '@/ui/tokens';
import { Avatar, Button, Emoji, Glass, Sheet, Tap, Txt } from '@/ui/v2';

/** The fixed set the server accepts (see `send_kudos`). */
const CHEERS = [
  { emoji: '🙌', label: 'High five' }, { emoji: '👏', label: 'Applause' }, { emoji: '🔥', label: 'On fire' },
  { emoji: '💪', label: 'Strong' }, { emoji: '❤️', label: 'Love' }, { emoji: '🎉', label: 'Party' },
] as const;

export default function Kudos() {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const { to } = useLocalSearchParams<{ to: string }>();
  const { data } = useAppState();
  const them = data?.members.find((m) => m.user_id === to);
  const [busy, setBusy] = useState<string | null>(null);
  const close = () => router.back();

  const send = async (emoji: string) => {
    if (busy || !them) return;
    setBusy(emoji);
    try {
      await rpc('send_kudos', { p_to: them.user_id, p_emoji: emoji });
      haptic.allDone();
      await qc.invalidateQueries({ queryKey: STATE_KEY });
      toast.show(`Cheer sent to ${them.name.split(' ')[0]}.`, { tick: true });
      close();
    } catch (e) {
      toast.show(messageOf(e));
      setBusy(null);
    }
  };

  if (!data) return null;
  if (!them) return <Sheet onClose={close} title="They’ve moved out" sub="That roommate is no longer in the home."><Button title="Close" onPress={close} /></Sheet>;
  return (
    <Sheet onClose={close}>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Avatar name={them.name} uri={them.avatar_path ? avatarUrl(them.avatar_path) : null} tint={them.color} size={64} />
        <Txt v="Heading/Section" accessibilityRole="header">{`Cheer ${them.name.split(' ')[0]} on`}</Txt>
        <Txt v="Body/Default" c={color.text.secondary}>A small thing that makes the house feel good.</Txt>
      </View>
      <View style={styles.grid}>
        {CHEERS.map((c) => (
          <Tap key={c.emoji} onPress={() => send(c.emoji)} disabled={Boolean(busy)} feel="select" style={styles.cell} accessibilityLabel={`Send ${c.label}`}>
            <Glass outline={busy === c.emoji} fill={0.9} r={22}>
              <View style={styles.cellIn}><Emoji value={c.emoji} size={40} /><Txt v="Meta/Medium" c={color.text.secondary}>{c.label}</Txt></View>
            </Glass>
          </Tap>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  cell: { width: '31%' },
  cellIn: { alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 16 },
});
