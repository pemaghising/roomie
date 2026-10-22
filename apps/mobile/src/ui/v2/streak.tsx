import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import { grewInto, plantFor, streakWords, type PlantStage } from '@/lib/plant';
import { haptic } from '../haptics';
import { durations, useCountUp, useReducedMotion } from '../motion';
import { color } from '../tokens';
import { DAY_LETTERS } from './fields';
import { Glass, GradientPill, Txt } from './primitives';

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
    <View style={[styles.pill, { backgroundColor: bg }, state === 'missed' && styles.missed]}>
      {/* Figma: today is outlined with the lilac→peach gradient, 1.75 */}
      {today && <GradientPill width={19} height={30} />}
      <Txt v="Tag" c={fg}>{letter}</Txt>
    </View>
  );
}

const SPARKS = [
  { a: -150, c: '#A489ED' }, { a: -110, c: '#F2B548' }, { a: -70, c: '#FFB48A' },
  { a: -30, c: '#A489ED' }, { a: -190, c: '#6FBF5A' }, { a: 10, c: '#F2B548' },
];

function Spark({ p, angle, tint }: { p: SharedValue<number>; angle: number; tint: string }) {
  const rad = (angle * Math.PI) / 180;
  const style = useAnimatedStyle(() => ({
    opacity: p.value > 0 && p.value < 1 ? 1 - p.value : 0,
    transform: [{ translateX: Math.cos(rad) * 62 * p.value }, { translateY: Math.sin(rad) * 62 * p.value }, { scale: 1 - p.value * 0.5 }],
  }));
  return <Animated.View pointerEvents="none" style={[styles.spark, { backgroundColor: tint }, style]} />;
}

/**
 * The plant on the card. When the streak reaches a milestone it grows in place: the old stage squashes into its pot,
 * sparkles pop, and the new stage springs up. Droops and recoveries only cross-fade. Reduce Motion: a plain swap.
 */
function GrowingPlant({ stage, reduced }: { stage: PlantStage; reduced: boolean }) {
  const [shown, setShown] = useState(stage);
  const prev = useRef(stage);
  const squash = useSharedValue(1);
  const burst = useSharedValue(0);
  useEffect(() => {
    const from = prev.current; prev.current = stage;
    if (from === stage) return;
    if (reduced || !grewInto(from, stage)) { setShown(stage); return; }
    squash.value = withSequence(withTiming(0.78, { duration: 200, easing: Easing.in(Easing.quad) }), withSpring(1, { damping: 7, stiffness: 210, mass: 0.8 }));
    burst.value = 0;
    burst.value = withDelay(200, withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }));
    const t = setTimeout(() => { setShown(stage); haptic.allDone(); }, 200);
    return () => clearTimeout(t);
  }, [stage, reduced, squash, burst]);
  // scales from the pot's base so the plant grows up out of it rather than from its middle
  const grow = useAnimatedStyle(() => ({ transform: [{ scaleX: 1 + (1 - squash.value) * 0.55 }, { scaleY: squash.value }] }));
  return (
    <View style={styles.artImage}>
      <Animated.View style={[{ flex: 1, transformOrigin: 'bottom' }, grow]}>
        <Animated.View key={shown} entering={reduced ? undefined : FadeIn.duration(durations.enter)} style={{ flex: 1 }}>
          <Image source={PLANT_ART[shown]} style={{ width: '100%', height: '100%' }} contentFit="contain" accessibilityIgnoresInvertColors />
        </Animated.View>
      </Animated.View>
      <View pointerEvents="none" style={styles.sparks}>{SPARKS.map((k, i) => <Spark key={i} p={burst} angle={k.a} tint={k.c} />)}</View>
    </View>
  );
}

/** v2/Streak card (Final app v2 · 1014:19917): the house's day count, this week as Sunday-first pills, and the plant. */
export function StreakCard({ days, week, drooped = false }: { days: number; week: DayState[]; drooped?: boolean }) {
  const reduced = useReducedMotion();
  const stage = plantFor(days, drooped);
  const words = streakWords(days, drooped);
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
        <View style={[styles.art, drooped && styles.artDroop]}>
          <GrowingPlant stage={stage} reduced={reduced} />
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
  missed: { borderWidth: 1, borderColor: '#F1C27D' },
  // our plant PNGs carry less transparent margin than the Figma image, so the box is sized to put the plant where
  // Figma has it: 16 pt in from the card's right edge, 20 pt from the top, 22 pt from the bottom (191 pt square)
  art: { width: 132, height: 162 },
  artImage: { position: 'absolute', top: -11, right: -36, bottom: -18, left: -23 },
  sparks: { position: 'absolute', left: '50%', top: '42%' },
  spark: { position: 'absolute', width: 8, height: 8, borderRadius: 4, marginLeft: -4, marginTop: -4 },
  // drooped: the plant stays the same size as every other stage; its box is a little narrower so the
  // longer "water me" fits, which also pulls the water drop in off the card edge
  artDroop: { width: 114 },
});
