import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Modal, Share, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { F } from '@/constants/theme';
import { Confetti } from './confetti';
import { Button, C } from './kit';
import { StreakPlant } from './streak-plant';

const COPY: Record<number, { title: string; body: string }> = {
  3: { title: 'A habit is starting.', body: 'Three days in a row. The house is noticing.' },
  7: { title: 'A full week. Thriving.', body: 'Your plant is fully grown. Keep it thriving together.' },
  14: { title: 'Two weeks strong.', body: 'This is becoming how your home runs.' },
  30: { title: 'A month of clean.', body: 'Thirty days. Honestly, legends.' },
  50: { title: 'Fifty days.', body: 'Peaceful co-living, mastered.' },
  100: { title: 'One hundred days.', body: 'Hall of fame. Frame this one.' },
};

/** Full-screen takeover when the household streak reaches a milestone. */
export function MilestoneCelebration({ days, onClose }: { days: number | null; onClose: () => void }) {
  useEffect(() => {
    if (days) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [days]);
  if (!days) return null;
  const c = COPY[days] ?? COPY[3];
  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.Text entering={FadeIn.delay(100)} style={styles.kicker}>STREAK MILESTONE</Animated.Text>
        <View style={styles.plant}><StreakPlant streak={days} height={190} /></View>
        <Animated.View entering={FadeInDown.delay(250).duration(320)} style={{ alignItems: 'center' }} accessible accessibilityLabel={`${days} day streak. ${c.title} ${c.body}`}>
          <Text style={styles.num}>{days}</Text>
          <Text style={styles.days}>days in a row</Text>
          <Text style={styles.title}>{c.title}</Text>
          <Text style={styles.body}>{c.body}</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(400).duration(320)} style={styles.actions}>
          <Button title="Share the streak" onPress={() => Share.share({ message: `Our house just hit a ${days}-day clean streak on Roomie 🌱` })} />
          <Button title="Keep going" variant="ghost" onPress={onClose} />
        </Animated.View>
        <Confetti count={days >= 30 ? 70 : 46} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF1EA', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 6 },
  kicker: { fontSize: 12, letterSpacing: 1.8, color: '#7C3AED', fontFamily: F.bold },
  plant: { marginTop: 8, marginBottom: 4 },
  num: { fontSize: 96, lineHeight: 100, color: C.text, fontFamily: F.display },
  days: { fontSize: 17, color: C.sub, fontFamily: F.medium, marginTop: -4 },
  title: { fontSize: 26, color: C.text, fontFamily: F.display, textAlign: 'center', marginTop: 16 },
  body: { fontSize: 15, lineHeight: 22, color: C.sub, fontFamily: F.regular, textAlign: 'center', marginTop: 6, maxWidth: 280 },
  actions: { alignSelf: 'stretch', marginTop: 28, gap: 4 },
});
