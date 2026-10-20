import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from './kit';

/** A grey placeholder block that pulses gently (still when reduced motion is on). */
export function Bone({ w = '100%', h = 16, r = 10, style }: { w?: DimensionValue; h?: number; r?: number; style?: object }) {
  const reduce = useReducedMotion();
  const k = useSharedValue(1);
  useEffect(() => {
    if (!reduce) k.value = withRepeat(withTiming(0.45, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [reduce, k]);
  const pulse = useAnimatedStyle(() => ({ opacity: k.value }));
  return <Animated.View style={[{ width: w, height: h, borderRadius: r, backgroundColor: '#E5E7EB' }, pulse, style]} />;
}

/** What the home screen looks like while the household is still loading: the same shapes, in grey. */
export function HomeSkeleton() {
  return (
    <SafeAreaView edges={['top']} style={styles.root} accessible accessibilityLabel="Loading your home" accessibilityRole="progressbar">
      <View style={styles.page}>
        <View style={styles.header}>
          <View style={{ gap: 8 }}><Bone w={110} h={12} /><Bone w={170} h={24} r={12} /></View>
          <Bone w={40} h={40} r={20} />
        </View>
        <Bone h={190} r={28} />
        <Bone h={92} r={24} style={{ marginTop: 10 }} />
        <Bone w={150} h={20} r={10} style={{ marginTop: 20, marginBottom: 10 }} />
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.task}>
            <Bone w={46} h={46} r={23} />
            <View style={{ flex: 1, gap: 8 }}><Bone w="70%" h={14} /><Bone w="40%" h={10} /></View>
            <Bone w={28} h={28} r={14} />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.page },
  page: { flex: 1, paddingHorizontal: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 10 },
  task: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FFF', borderRadius: 22, borderWidth: 1, borderColor: C.line, padding: 16, marginBottom: 10 },
});
