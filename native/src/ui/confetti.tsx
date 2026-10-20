import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, type SharedValue, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const COLORS = ['#D8B4FE', '#FDE68A', '#A7F3D0', '#FBCFE8', '#BFDBFE', '#FED7AA', '#FFFFFF'];

interface Bit { dx: number; vy: number; g: number; spin: number; size: number; color: string; round: boolean }

function Piece({ b, t }: { b: Bit; t: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const k = t.value;
    return {
      opacity: k < 0.72 ? 1 : Math.max(0, (1 - k) / 0.28),
      transform: [
        { translateX: b.dx * (1 - (1 - k) * (1 - k)) }, // flies out quickly, then eases to a stop
        { translateY: -b.vy * k + b.g * k * k }, // up, then gravity pulls it down
        { rotate: `${b.spin * k}deg` },
      ],
    };
  });
  return <Animated.View style={[styles.bit, { width: b.size, height: b.round ? b.size : b.size * 0.55, borderRadius: b.round ? b.size / 2 : 2, backgroundColor: b.color }, style]} />;
}

/** A one-shot burst of pastel confetti from the middle of the screen. Plays once on mount; no springs. */
export function Confetti({ count = 40 }: { count?: number }) {
  const { width, height } = useWindowDimensions();
  const t = useSharedValue(0);
  const bits = useMemo<Bit[]>(() => Array.from({ length: count }, () => {
    const vy = 1000 + Math.random() * 400;
    return {
      dx: (Math.random() - 0.5) * width * 0.95,
      vy,
      g: vy + 600 + Math.random() * 700,
      spin: (Math.random() - 0.5) * 900,
      size: 7 + Math.random() * 7,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      round: Math.random() < 0.35,
    };
  }), [count, width]);
  useEffect(() => { t.value = withTiming(1, { duration: 2400, easing: Easing.linear }); }, [t]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={{ position: 'absolute', left: width / 2, top: height * 0.5 }}>{bits.map((b, i) => <Piece key={i} b={b} t={t} />)}</View>
    </View>
  );
}

const styles = StyleSheet.create({ bit: { position: 'absolute' } });
