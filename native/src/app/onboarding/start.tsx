import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { F } from '@/constants/theme';
import { updateDraft } from '@/lib/draft';
import { takePendingInvite } from '@/lib/invite';
import { signOut } from '@/lib/auth';
import { Button, C, Screen, StepHeader, Sub, Title } from '@/ui/kit';

export default function Start() {
  const router = useRouter();
  // arrived through an invite link: skip the choice and go straight to joining with that code
  useEffect(() => {
    const code = takePendingInvite();
    if (code) { updateDraft({ mode: 'join', code }); router.replace('/onboarding/join'); }
  }, [router]);
  const go = (mode: 'create' | 'join') => {
    updateDraft({ mode });
    router.push(mode === 'create' ? '/onboarding/home-name' : '/onboarding/join');
  };
  return (
    <Screen footer={<Button title="Use a different account" variant="ghost" onPress={signOut} />}>
      <StepHeader step={2} total={6} back={false} />
      <Title>Your space.</Title>
      <Sub>Each peaceful home begins with clear intentions. Choose how you want to set up your shared world.</Sub>
      <View style={{ gap: 16, marginTop: 32 }}>
        <Card i={0} title="Create a new home" body="Establish a fresh shared sanctuary and invite your roommates to collaborate."
          bg={C.lavender} fg={C.lavenderText} onPress={() => go('create')} />
        <Card i={1} title="Join an existing home" body="Enter your household code to seamlessly step into an established shared community."
          bg={C.peach} fg={C.peachText} onPress={() => go('join')} />
      </View>
    </Screen>
  );
}

function Card({ i, title, body, bg, fg, onPress }: { i: number; title: string; body: string; bg: string; fg: string; onPress: () => void }) {
  return (
    <Animated.View entering={FadeInDown.delay(80 + i * 70).duration(240)}>
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, { backgroundColor: bg }, pressed && { transform: [{ scale: 0.98 }] }]}>
        <View style={styles.row}>
          <Text style={[styles.title, { color: fg }]}>{title}</Text>
          <View style={styles.arrow}><Text style={{ color: fg, fontSize: 16, fontFamily: F.bold }}>→</Text></View>
        </View>
        <Text style={[styles.body, { color: fg }]}>{body}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 28, padding: 24, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontFamily: F.display, flex: 1 },
  arrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
  body: { fontSize: 15, lineHeight: 22, fontFamily: F.regular, opacity: 0.85 },
});
