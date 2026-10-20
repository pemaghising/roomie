import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { plantFor, type PlantStage } from '@/lib/plant';
import { motion, useCountUp, useReducedMotion } from '../motion';
import { color, type } from '../tokens';
import { DAY_LETTERS } from './fields';
import { Glass, gradients, Txt } from './primitives';

export type DayState = 'done' | 'today' | 'missed' | 'future' | 'none';

export const PLANT_ART: Record<PlantStage, number> = {
  seed: require('../../../assets/plant/seed.png'),
  sprout: require('../../../assets/plant/sprout.png'),
  leafy: require('../../../assets/plant/leafy.png'),
  bud: require('../../../assets/plant/bud.png'),
  bloom: require('../../../assets/plant/bloom.png'),
  droop: require('../../../assets/plant/droop.png'),
};

function Pill({ state, letter }: { state: DayState; letter: string }) {
  if (state === 'today') {
    return (
      <LinearGradient colors={gradients.outline} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.pill, { padding: 1.5 }]}>
        <View style={[styles.pillInner, { backgroundColor: color.bg.surface }]}><Txt v="Tag" c={color.text.link}>{letter}</Txt></View>
      </LinearGradient>
    );
  }
  const bg = state === 'done' ? color.action.primary : state === 'missed' ? color.effort.mediumBg : color.bg.track;
  const fg = state === 'done' ? color.text.onAccent : state === 'missed' ? color.effort.mediumFg : color.text.secondary;
  return (
    <View style={[styles.pill, styles.pillInner, { backgroundColor: bg }, state === 'missed' && styles.missed]}>
      <Txt v="Tag" c={fg}>{letter}</Txt>
    </View>
  );
}

/** v2/Streak card: the house's day count, this week as Sunday-first pills, and the plant at its milestone stage. */
export function StreakCard({ days, week, drooped = false }: { days: number; week: DayState[]; drooped?: boolean }) {
  const reduced = useReducedMotion();
  const stage = plantFor(days, drooped);
  const words = days === 1 ? ['day', 'together'] : ['days', 'strong'];
  const shown = useCountUp(days);
  return (
    <Glass>
      <View style={styles.card} accessible accessibilityLabel={`House streak: ${days} ${words.join(' ')}${drooped ? '. A chore is waiting.' : ''}`}>
        <View style={styles.left}>
          <Txt v="Meta/Medium" c={color.text.numeral}>House streak</Txt>
          <View style={styles.count}>
            <Txt v="Numeral/Streak" c={color.text.numeral} style={{ fontVariant: ['tabular-nums'] }}>{shown}</Txt>
            <Txt v="Body/Row" c={color.text.numeral} style={{ marginBottom: 12 }}>{`${words[0]}\n${words[1]}`}</Txt>
          </View>
          <View style={styles.week}>{DAY_LETTERS.map((l, i) => (
            <Animated.View key={`${i}-${week[i]}`} entering={reduced || week[i] !== 'done' ? undefined : ZoomIn.springify().damping(motion.pop.damping).stiffness(motion.pop.stiffness)}>
              <Pill letter={l} state={week[i] ?? 'none'} />
            </Animated.View>
          ))}</View>
        </View>
        <Animated.View key={stage} entering={reduced ? FadeIn.duration(150) : ZoomIn.springify().damping(motion.pop.damping).stiffness(motion.pop.stiffness).mass(motion.pop.mass)} style={styles.art}>
          <Image source={PLANT_ART[stage]} style={styles.plant} contentFit="contain" accessibilityIgnoresInvertColors />
        </Animated.View>
      </View>
    </Glass>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', padding: 20, gap: 8, minHeight: 204 },
  left: { flex: 1, gap: 12, justifyContent: 'space-between' },
  count: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: type['Numeral/Streak'].lineHeight },
  week: { flexDirection: 'row', gap: 4 },
  pill: { width: 20, height: 30, borderRadius: 10 },
  pillInner: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  missed: { borderWidth: 1, borderColor: '#F1C27D' },
  art: { width: 132, alignItems: 'center', justifyContent: 'center' },
  plant: { width: 150, height: 162 },
});
