import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, layout } from './tokens';
import { MeshBackground } from './v2/page';

/** A grey placeholder block that pulses gently (still when reduced motion is on). */
export function Bone({ w = '100%', h = 16, r = 10, style }: { w?: DimensionValue; h?: number; r?: number; style?: object }) {
  const reduce = useReducedMotion();
  const k = useSharedValue(1);
  useEffect(() => {
    if (!reduce) k.value = withRepeat(withTiming(0.45, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [reduce, k]);
  const pulse = useAnimatedStyle(() => ({ opacity: k.value }));
  return <Animated.View style={[{ width: w, height: h, borderRadius: r, backgroundColor: 'rgba(135,107,222,0.12)' }, pulse, style]} />;
}

/** What the home screen looks like while the household is still loading: the same shapes, in grey. */
export function HomeSkeleton() {
  return (
    <SafeAreaView edges={['top']} style={styles.root} accessible accessibilityLabel="Loading your home" accessibilityRole="progressbar">
      <MeshBackground />
      <View style={styles.page}>
        <View style={styles.header}>
          <Bone w={52} h={52} r={26} />
          <View style={{ gap: 8, flex: 1 }}><Bone w={110} h={12} /><Bone w={170} h={22} r={11} /></View>
          <Bone w={44} h={44} r={22} />
        </View>
        <Bone h={176} r={28} />
        <Bone w={170} h={20} r={10} style={{ marginTop: 8 }} />
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.task}>
            <Bone w={44} h={44} r={13} />
            <View style={{ flex: 1, gap: 8 }}><Bone w="70%" h={14} /><Bone w="40%" h={10} /></View>
            <Bone w={28} h={28} r={14} />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg.canvas },
  page: { flex: 1, paddingHorizontal: layout.margin, paddingTop: 12, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  task: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(252,251,255,0.6)', borderRadius: 24, borderWidth: 1, borderColor: color.border.hairline, padding: 16 },
});
