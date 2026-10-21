import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { plantFor, type PlantStage } from '@/lib/plant';
import { durations, useCountUp, useReducedMotion } from '../motion';
import { color } from '../tokens';
import { DAY_LETTERS } from './fields';
import { Glass, Txt } from './primitives';

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
  const today = state === 'today';
  const bg = state === 'done' ? color.action.primary : state === 'missed' ? color.effort.mediumBg : today ? 'rgba(252,251,255,0.7)' : color.bg.track;
  const fg = state === 'done' ? color.text.onAccent : state === 'missed' ? color.effort.mediumFg : today ? color.text.link : color.text.secondary;
  return (
    <View style={[styles.pill, { backgroundColor: bg }, today && styles.today, state === 'missed' && styles.missed]}>
      <Txt v="Tag" c={fg}>{letter}</Txt>
    </View>
  );
}

/** v2/Streak card (Final app v2 · 1014:19917): the house's day count, this week as Sunday-first pills, and the plant. */
export function StreakCard({ days, week, drooped = false }: { days: number; week: DayState[]; drooped?: boolean }) {
  const reduced = useReducedMotion();
  const stage = plantFor(days, drooped);
  const words = days === 1 ? ['day', 'together'] : ['days', 'strong'];
  const shown = useCountUp(days);
  const fade = reduced ? undefined : FadeIn.duration(durations.enter);
  return (
    <Glass>
      <View style={styles.card} accessible accessibilityLabel={`House streak: ${days} ${words.join(' ')}${drooped ? '. A chore is waiting.' : ''}`}>
        <View style={styles.left}>
          <View style={{ gap: 6 }}>
            <Txt v="Tag" c={color.text.numeral}>House streak</Txt>
            <View style={styles.numeral}>
              <Txt v="Numeral/Streak" c={color.text.numeral} style={{ fontVariant: ['tabular-nums'] }}>{shown}</Txt>
              <Txt v="Body/Button" c={color.text.numeral}>{`${words[0]}
${words[1]}`}</Txt>
            </View>
          </View>
          <View style={styles.week}>{DAY_LETTERS.map((l, i) => (
            <Animated.View key={`${i}-${week[i]}`} entering={week[i] === 'done' ? fade : undefined}>
              <Pill letter={l} state={week[i] ?? 'none'} />
            </Animated.View>
          ))}</View>
        </View>
        <View style={styles.art}>
          <Animated.View key={stage} entering={fade} style={styles.artImage}>
            <Image source={PLANT_ART[stage]} style={{ width: '100%', height: '100%' }} contentFit="contain" accessibilityIgnoresInvertColors />
          </Animated.View>
        </View>
      </View>
    </Glass>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 8 },
  left: { flex: 1, gap: 16, minWidth: 0 },
  numeral: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  pill: { width: 19, height: 30, borderRadius: 999, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  today: { borderWidth: 1.75, borderColor: '#A489ED' },
  missed: { borderWidth: 1, borderColor: '#F1C27D' },
  // our plant PNGs carry less transparent margin than the Figma image, so the box is sized to put the plant where
  // Figma has it: 16 pt in from the card's right edge, 20 pt from the top, 22 pt from the bottom (191 pt square)
  art: { width: 132, height: 162 },
  artImage: { position: 'absolute', top: -11, right: -36, bottom: -18, left: -23 },
});
