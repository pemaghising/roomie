// The streak milestone moment (3, 7, 14, 30, 50, 100 days): the plant at its new stage, a quick count-up, a soft burst.
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Modal, Share, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { plantFor } from '@/lib/plant';
import { Confetti } from './confetti';
import { haptic } from './haptics';
import { durations, enter, useReducedMotion } from './motion';
import { color, layout } from './tokens';
import { Button, MeshBackground, PLANT_ART, Txt } from './v2';

const COPY: Record<number, { title: string; body: string }> = {
  3: { title: 'A habit is starting.', body: 'Three days in a row. The plant has sprouted.' },
  7: { title: 'A full week, together.', body: 'Your plant is leafing out. Keep it growing.' },
  14: { title: 'Two weeks in bud.', body: 'This is becoming how your home runs.' },
  30: { title: 'A month in bloom.', body: 'Thirty days. Your plant is in full flower.' },
  50: { title: 'Fifty days.', body: 'Calm, shared, and still growing.' },
  100: { title: 'One hundred days.', body: 'A house that looks after itself.' },
};

function CountUp({ to, reduced }: { to: number; reduced: boolean }) {
  const [n, setN] = useState(reduced ? to : Math.max(0, to - 12));
  useEffect(() => {
    if (reduced) return;
    const start = Date.now(); const from = Math.max(0, to - 12);
    const id = setInterval(() => {
      const k = Math.min(1, (Date.now() - start) / durations.countUp);
      setN(Math.round(from + (to - from) * (1 - (1 - k) ** 3)));
      if (k >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [to, reduced]);
  return <Txt v="Numeral/Streak" c={color.text.numeral} style={{ fontVariant: ['tabular-nums'] }}>{n}</Txt>;
}

export function MilestoneCelebration({ days, onClose }: { days: number | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  useEffect(() => { if (days) haptic.allDone(); }, [days]);
  if (!days) return null;
  const c = COPY[days] ?? COPY[3];
  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}>
        <MeshBackground />
        <View style={styles.center} accessible accessibilityLabel={`${days} days strong. ${c.title} ${c.body}`}>
          <Animated.View entering={reduced ? FadeIn : ZoomIn.springify().damping(14).stiffness(380)}>
            <Image source={PLANT_ART[plantFor(days, false)]} style={styles.plant} contentFit="contain" />
          </Animated.View>
          <Animated.View entering={enter(1, reduced)} style={styles.count}>
            <CountUp to={days} reduced={reduced} />
            <Txt v="Body/Row" c={color.text.numeral}>{'days\nstrong'}</Txt>
          </Animated.View>
          <Animated.View entering={enter(2, reduced)} style={{ gap: 8, alignItems: 'center' }}>
            <Txt v="Title/Onboarding" style={{ textAlign: 'center' }} accessibilityRole="header">{c.title}</Txt>
            <Txt v="Body/Default" c={color.text.secondary} style={{ textAlign: 'center' }}>{c.body}</Txt>
          </Animated.View>
        </View>
        <Animated.View entering={enter(4, reduced)} style={{ gap: 18, paddingHorizontal: layout.margin }}>
          <Button title="Keep going" onPress={onClose} />
          <Txt v="Body/Label" c={color.text.link} style={{ textAlign: 'center' }} accessibilityRole="button"
            onPress={() => Share.share({ message: `Our house just hit ${days} days strong on Roomie 🌱` })}>Share the streak</Txt>
        </Animated.View>
        {!reduced && <Confetti count={days >= 30 ? 160 : 120} />}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: layout.margin },
  plant: { width: 220, height: 240 },
  count: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
