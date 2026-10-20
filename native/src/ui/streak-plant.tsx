import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming, ZoomIn } from 'react-native-reanimated';
import { stageFor } from '@/lib/plant';

const STAGE_ART = [
  require('@/assets/images/streak/stage-1.webp'), require('@/assets/images/streak/stage-2.webp'),
  require('@/assets/images/streak/stage-3.webp'), require('@/assets/images/streak/stage-4.webp'),
  require('@/assets/images/streak/stage-5.webp'), require('@/assets/images/streak/stage-6.webp'),
  require('@/assets/images/streak/stage-7.webp'), require('@/assets/images/streak/stage-8.webp'),
];

const LIFT = 8;

/** The household streak as a growing plant that levitates over a soft ground shadow. Decorative: the streak number is the accessible value. */
export function StreakPlant({ streak, height = 132 }: { streak: number; height?: number }) {
  const stage = stageFor(streak);
  const reduce = useReducedMotion();
  // 0 = resting on the ground, 1 = fully floated; one reversing loop drives both the plant and its shadow
  const float = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    float.value = 0;
    float.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => cancelAnimation(float);
  }, [reduce, float]);
  const bob = useAnimatedStyle(() => ({ transform: [{ translateY: -LIFT * float.value }] }));
  // the higher it floats, the smaller and fainter its shadow
  const shadow = useAnimatedStyle(() => ({
    opacity: interpolate(float.value, [0, 1], [1, 0.5]),
    transform: [{ scaleX: interpolate(float.value, [0, 1], [1, 0.72]) }],
  }));
  const width = Math.round((height * 183) / 240);
  return (
    <Animated.View key={stage} entering={ZoomIn.duration(420)} style={styles.wrap} accessible={false} importantForAccessibility="no-hide-descendants">
      <Animated.View style={bob}>
        <Image source={STAGE_ART[stage - 1]} style={{ width, height }} contentFit="contain" />
      </Animated.View>
      <Animated.View style={[styles.shadowWrap, { width: width * 0.8 }, shadow]}>
        <View style={styles.shadowOuter} />
        <View style={styles.shadowInner} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  shadowWrap: { height: 14, marginTop: -2, alignItems: 'center', justifyContent: 'center' },
  shadowOuter: { position: 'absolute', width: '100%', height: 14, borderRadius: 7, backgroundColor: 'rgba(15,0,50,0.14)' },
  shadowInner: { width: '66%', height: 8, borderRadius: 4, backgroundColor: 'rgba(15,0,50,0.26)' },
});
