import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, ZoomIn, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { F } from '@/constants/theme';
import type { Celebration as Kind } from '@/lib/actions';
import { Art } from './art';
import { Confetti } from './confetti';
import { Button, C } from './kit';

const COPY = {
  all_done: { art: 'trophy', title: 'Wonderful job.', body: "That's everything for today. The house noticed.", confetti: 44 },
  covered: { art: 'highfive', title: 'Thanks for covering.', body: "You took one off a roommate's plate — it evens out next week.", confetti: 20 },
} as const;

/** A soft ring that swells out and fades behind the illustration, once. */
function Halo() {
  const k = useSharedValue(0);
  useEffect(() => { k.value = withDelay(260, withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) })); }, [k]);
  const style = useAnimatedStyle(() => ({ opacity: 0.55 * (1 - k.value), transform: [{ scale: 0.7 + 0.9 * k.value }] }));
  return <Animated.View pointerEvents="none" style={[styles.halo, style]} />;
}

/** The authored moment: clearing the day's list gets confetti, a glow and a short buzz. */
export function Celebration({ info, onClose }: { info: Kind; onClose: () => void }) {
  const kind = info?.kind;
  const c = kind ? COPY[kind] : null;

  useEffect(() => {
    if (kind !== 'all_done') return; // the tap itself already gave the success buzz
    const a = setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 200);
    const b = setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 380);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [kind]);

  return (
    <Modal visible={Boolean(c)} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {c && (
        <Animated.View entering={FadeIn.duration(180)} style={styles.scrim}>
          <Animated.View entering={FadeInDown.duration(260)} style={styles.card}>
            <View style={styles.art}>
              <Halo />
              <Animated.View entering={ZoomIn.delay(140).duration(420).easing(Easing.out(Easing.cubic))}>
                <Art name={c.art} width={230} />
              </Animated.View>
            </View>
            <Animated.Text entering={FadeInDown.delay(260).duration(300)} style={styles.title}>{c.title}</Animated.Text>
            <Animated.Text entering={FadeInDown.delay(340).duration(300)} style={styles.body}>{c.body}</Animated.Text>
            <Animated.View entering={FadeInDown.delay(400).duration(300)} style={styles.stats}>
              <View style={styles.stat}><Text style={styles.statNum}>{info?.streak}</Text><Text style={styles.statLabel}>day streak</Text></View>
              <View style={styles.stat}><Text style={styles.statNum}>{info?.doneToday}</Text><Text style={styles.statLabel}>done today</Text></View>
            </Animated.View>
            <View style={{ alignSelf: 'stretch', marginTop: 8 }}><Button title="Back to it" onPress={onClose} /></View>
          </Animated.View>
          <Confetti count={c.confetti} />
        </Animated.View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(17,24,39,0.45)', justifyContent: 'flex-end', padding: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 32, padding: 28, paddingBottom: 20, alignItems: 'center', gap: 10, marginBottom: 24 },
  art: { alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  halo: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: '#D8B4FE' },
  title: { fontSize: 28, color: C.text, fontFamily: F.display },
  stats: { flexDirection: 'row', gap: 32, marginTop: 6 },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 28, color: C.text, fontFamily: F.display },
  statLabel: { fontSize: 12, color: C.sub, fontFamily: F.regular },
  body: { fontSize: 15, lineHeight: 22, color: C.sub, fontFamily: F.regular, textAlign: 'center' },
});
